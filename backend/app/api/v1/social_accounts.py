from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.social_account import SocialAccountCreate, SocialAccountUpdate, SocialAccountResponse
from app.services.social_accounts.social_account_service import social_account_service

router = APIRouter()

@router.get("/organizations/{organization_id}/social-accounts", response_model=List[SocialAccountResponse])
def get_social_accounts(organization_id: int, db: Session = Depends(get_db)):
    return social_account_service.get_social_accounts(db, organization_id)

@router.post("/organizations/{organization_id}/social-accounts", response_model=SocialAccountResponse, status_code=201)
def create_social_account(organization_id: int, account_in: SocialAccountCreate, db: Session = Depends(get_db)):
    return social_account_service.create_social_account(db, organization_id, account_in)

@router.patch("/social-accounts/{social_account_id}", response_model=SocialAccountResponse)
def update_social_account(social_account_id: int, account_in: SocialAccountUpdate, db: Session = Depends(get_db)):
    return social_account_service.update_social_account(db, social_account_id, account_in)

@router.delete("/social-accounts/{social_account_id}", status_code=204)
def delete_social_account(social_account_id: int, db: Session = Depends(get_db)):
    social_account_service.delete_social_account(db, social_account_id)
