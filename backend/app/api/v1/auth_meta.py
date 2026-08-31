import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os

from app.db.session import get_db
from app.api.v1.auth import require_role
from app.models.enums import RoleEnum, PlatformEnum
from app.models.domain import SocialAccount
from app.models.enums import SocialAccountStatusEnum

router = APIRouter()

class MetaConnectRequest(BaseModel):
    access_token: str

@router.post("/organizations/{organization_id}/meta/connect")
def connect_meta_account(organization_id: int, req: MetaConnectRequest, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    """
    Receives a short-lived user access token from the frontend Meta Login SDK.
    Exchanges it for a long-lived token, fetches the user's Pages, and saves them.
    """
    user_access_token = req.access_token
    app_id = os.getenv("META_APP_ID")
    app_secret = os.getenv("META_APP_SECRET")
    
    # 1. Exchange for long-lived token (if secret is available)
    if app_id and app_secret:
        exchange_url = f"https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={user_access_token}"
        try:
            res = httpx.get(exchange_url)
            res.raise_for_status()
            user_access_token = res.json().get("access_token", user_access_token)
        except Exception as e:
            print(f"Token exchange failed: {e}")
            # Fall back to short-lived token if exchange fails

    # 2. Fetch Pages the user has access to
    pages_url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={user_access_token}"
    try:
        pages_res = httpx.get(pages_url)
        pages_res.raise_for_status()
        pages_data = pages_res.json().get("data", [])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch Meta pages: {str(e)}")

    if not pages_data:
        raise HTTPException(status_code=400, detail="No Facebook Pages found for this user.")

    connected_pages = []
    # 3. Save each Page as a SocialAccount
    for page in pages_data:
        page_id = page.get("id")
        page_name = page.get("name")
        page_access_token = page.get("access_token") # Long-lived page access token!
        
        # Check if already exists
        existing = db.query(SocialAccount).filter(
            SocialAccount.organization_id == organization_id,
            SocialAccount.platform == PlatformEnum.FACEBOOK,
            SocialAccount.external_account_id == page_id
        ).first()

        if existing:
            existing.access_token_encrypted = page_access_token
            existing.account_name = page_name
            existing.status = SocialAccountStatusEnum.CONNECTED
            connected_pages.append(existing)
        else:
            new_acc = SocialAccount(
                organization_id=organization_id,
                platform=PlatformEnum.FACEBOOK,
                external_account_id=page_id,
                account_name=page_name,
                access_token_encrypted=page_access_token,
                status=SocialAccountStatusEnum.CONNECTED
            )
            db.add(new_acc)
            connected_pages.append(new_acc)
            
    db.commit()
    
    return {"status": "success", "connected_pages": len(connected_pages)}

