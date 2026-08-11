from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.social_account import SocialAccountCreate, SocialAccountUpdate, SocialAccountResponse
from app.services.social_accounts.social_account_service import social_account_service
from app.api.v1.auth import verify_organization_access, require_role, get_current_user, check_organization_access
from app.models.enums import RoleEnum
from app.models.user import User
from app.models.domain import SocialAccount

router = APIRouter()

@router.get("/organizations/{organization_id}/social-accounts", response_model=List[SocialAccountResponse])
def get_social_accounts(organization_id: int, db: Session = Depends(get_db), _ = Depends(verify_organization_access)):
    return social_account_service.get_social_accounts(db, organization_id)

@router.post("/organizations/{organization_id}/social-accounts", response_model=SocialAccountResponse, status_code=201)
def create_social_account(organization_id: int, account_in: SocialAccountCreate, db: Session = Depends(get_db), _ = Depends(require_role(RoleEnum.OWNER, RoleEnum.ADMIN))):
    return social_account_service.create_social_account(db, organization_id, account_in)

@router.patch("/social-accounts/{social_account_id}", response_model=SocialAccountResponse)
def update_social_account(social_account_id: int, account_in: SocialAccountUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    acc = db.query(SocialAccount).filter(SocialAccount.id == social_account_id).first()
    if not acc: raise HTTPException(status_code=404, detail="Not found")
    check_organization_access(db, current_user.id, acc.organization_id, [RoleEnum.OWNER, RoleEnum.ADMIN])
    return social_account_service.update_social_account(db, social_account_id, account_in)

@router.delete("/social-accounts/{social_account_id}", status_code=204)
def delete_social_account(social_account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    acc = db.query(SocialAccount).filter(SocialAccount.id == social_account_id).first()
    if not acc: raise HTTPException(status_code=404, detail="Not found")
    check_organization_access(db, current_user.id, acc.organization_id, [RoleEnum.OWNER, RoleEnum.ADMIN])
    social_account_service.delete_social_account(db, social_account_id)
