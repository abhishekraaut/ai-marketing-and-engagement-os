from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.domain import BrandProfile
from app.models.user import Organization
from app.schemas.brand import BrandProfileCreate, BrandProfileUpdate

class BrandService:
    def get_brand_profile(self, db: Session, organization_id: int) -> Optional[BrandProfile]:
        # Validate org exists
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        return db.query(BrandProfile).filter(BrandProfile.organization_id == organization_id).first()

    def create_brand_profile(self, db: Session, organization_id: int, brand_in: BrandProfileCreate) -> BrandProfile:
        existing = self.get_brand_profile(db, organization_id)
        if existing:
            raise HTTPException(status_code=409, detail="Brand profile already exists for this organization")
            
        db_brand = BrandProfile(**brand_in.model_dump(), organization_id=organization_id)
        db.add(db_brand)
        db.commit()
        db.refresh(db_brand)
        return db_brand

    def update_brand_profile(self, db: Session, organization_id: int, brand_in: BrandProfileUpdate) -> BrandProfile:
        db_brand = self.get_brand_profile(db, organization_id)
        if not db_brand:
            raise HTTPException(status_code=404, detail="Brand profile not found")
            
        update_data = brand_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_brand, key, value)
            
        db.commit()
        db.refresh(db_brand)
        return db_brand

brand_service = BrandService()
