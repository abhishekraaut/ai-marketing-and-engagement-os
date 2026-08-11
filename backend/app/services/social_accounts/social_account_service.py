from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.domain import SocialAccount
from app.models.user import Organization
from app.schemas.social_account import SocialAccountCreate, SocialAccountUpdate
from app.models.enums import SocialAccountStatusEnum
from app.services.connectors.mock.mock_connector import mock_connector

class SocialAccountService:
    def get_social_accounts(self, db: Session, organization_id: int) -> List[SocialAccount]:
        return db.query(SocialAccount).filter(SocialAccount.organization_id == organization_id).all()

    def get_social_account(self, db: Session, account_id: int) -> Optional[SocialAccount]:
        return db.query(SocialAccount).filter(SocialAccount.id == account_id).first()

    def create_social_account(self, db: Session, organization_id: int, account_in: SocialAccountCreate) -> SocialAccount:
        # Validate org exists
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # In a real app we'd initiate OAuth here. We just use the mock connector for now.
        mock_data = mock_connector.connect_account()
        
        db_account = SocialAccount(
            organization_id=organization_id,
            platform=account_in.platform,
            external_account_id=account_in.external_account_id or mock_data["account_id"],
            account_name=account_in.account_name or mock_data["account_name"],
            access_token_encrypted=account_in.access_token or mock_data["access_token"],
            refresh_token_encrypted=account_in.refresh_token or mock_data["refresh_token"],
            status=SocialAccountStatusEnum.CONNECTED
        )
        db.add(db_account)
        try:
            db.commit()
            db.refresh(db_account)
            return db_account
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Social account already connected for this platform")

    def update_social_account(self, db: Session, account_id: int, account_in: SocialAccountUpdate) -> SocialAccount:
        db_account = self.get_social_account(db, account_id)
        if not db_account:
            raise HTTPException(status_code=404, detail="Social account not found")
            
        update_data = account_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_account, key, value)
            
        db.commit()
        db.refresh(db_account)
        return db_account

    def delete_social_account(self, db: Session, account_id: int):
        db_account = self.get_social_account(db, account_id)
        if not db_account:
            raise HTTPException(status_code=404, detail="Social account not found")
        
        db.delete(db_account)
        db.commit()

social_account_service = SocialAccountService()
