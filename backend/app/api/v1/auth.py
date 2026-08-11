from datetime import timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.db.session import get_db
from app.models.user import User, OrganizationMember
from app.models.enums import RoleEnum
from app.core.config import settings
from app.core.security import verify_password, create_access_token, ALGORITHM
from pydantic import BaseModel

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str

class OrgResponse(BaseModel):
    id: int
    name: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    organizations: List[OrgResponse]

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def check_organization_access(db: Session, user_id: int, organization_id: int, allowed_roles: Optional[List[RoleEnum]] = None) -> OrganizationMember:
    member = db.query(OrganizationMember).filter(
        OrganizationMember.organization_id == organization_id,
        OrganizationMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    if allowed_roles and member.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return member

def verify_organization_access(
    organization_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
) -> OrganizationMember:
    return check_organization_access(db, current_user.id, organization_id)

def require_role(*allowed_roles: RoleEnum):
    def role_checker(member: OrganizationMember = Depends(verify_organization_access)):
        if member.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return member
    return role_checker

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Load user with memberships explicitly if not eager loaded
    user = db.query(User).filter(User.id == current_user.id).first()
    orgs = []
    for member in user.memberships:
        orgs.append(OrgResponse(id=member.organization.id, name=member.organization.name, role=member.role.name))
        
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        organizations=orgs
    )
