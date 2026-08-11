from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate

class OrganizationService:
    def get_organization(self, db: Session, org_id: int) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.id == org_id).first()

    def get_organizations(self, db: Session, skip: int = 0, limit: int = 100) -> List[Organization]:
        return db.query(Organization).offset(skip).limit(limit).all()

    def create_organization(self, db: Session, org_in: OrganizationCreate) -> Organization:
        db_org = Organization(**org_in.model_dump())
        db.add(db_org)
        try:
            db.commit()
            db.refresh(db_org)
            return db_org
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Organization slug already exists")

    def update_organization(self, db: Session, org_id: int, org_in: OrganizationUpdate) -> Organization:
        db_org = self.get_organization(db, org_id)
        if not db_org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        update_data = org_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_org, key, value)
            
        try:
            db.commit()
            db.refresh(db_org)
            return db_org
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Organization slug already exists")

organization_service = OrganizationService()
