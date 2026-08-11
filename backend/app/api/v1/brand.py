from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.brand import BrandProfileCreate, BrandProfileUpdate, BrandProfileResponse
from app.services.brand.brand_service import brand_service

router = APIRouter()

@router.get("/{organization_id}/brand", response_model=BrandProfileResponse)
def get_brand_profile(organization_id: int, db: Session = Depends(get_db)):
    brand = brand_service.get_brand_profile(db, organization_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found")
    return brand

@router.post("/{organization_id}/brand", response_model=BrandProfileResponse, status_code=201)
def create_brand_profile(organization_id: int, brand_in: BrandProfileCreate, db: Session = Depends(get_db)):
    return brand_service.create_brand_profile(db, organization_id, brand_in)

@router.patch("/{organization_id}/brand", response_model=BrandProfileResponse)
def update_brand_profile(organization_id: int, brand_in: BrandProfileUpdate, db: Session = Depends(get_db)):
    return brand_service.update_brand_profile(db, organization_id, brand_in)
