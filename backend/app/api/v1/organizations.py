from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.services.organizations.organization_service import organization_service

router = APIRouter()

@router.get("/", response_model=List[OrganizationResponse])
def get_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return organization_service.get_organizations(db, skip=skip, limit=limit)

@router.post("/", response_model=OrganizationResponse, status_code=201)
def create_organization(org_in: OrganizationCreate, db: Session = Depends(get_db)):
    return organization_service.create_organization(db, org_in)

@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(organization_id: int, db: Session = Depends(get_db)):
    org = organization_service.get_organization(db, organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.patch("/{organization_id}", response_model=OrganizationResponse)
def update_organization(organization_id: int, org_in: OrganizationUpdate, db: Session = Depends(get_db)):
    return organization_service.update_organization(db, organization_id, org_in)
