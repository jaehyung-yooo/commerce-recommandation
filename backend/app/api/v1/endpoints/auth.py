from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import timedelta
from sqlalchemy.orm import Session

from app.core.auth import (
    authenticate_user,
    create_access_token,
    create_user,
    get_current_user,
    update_last_login
)
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister, UserResponse, Token

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """사용자 로그인"""
    user = authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 마지막 로그인 시간 업데이트
    update_last_login(db, user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserResponse)
async def register(user_register: UserRegister, db: Session = Depends(get_db)):
    """사용자 회원가입"""
    # 비밀번호 확인
    if user_register.password != user_register.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # 사용자 생성
    user = create_user(db, user_register.email, user_register.password)
    return UserResponse(email=user.email)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """현재 사용자 정보 조회"""
    return UserResponse(email=current_user.email)

@router.post("/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"message": "Successfully logged out"}

@router.get("/init-admin")
async def init_admin_user(db: Session = Depends(get_db)):
    """관리자 사용자 초기 생성 (개발용)"""
    try:
        admin_user = create_user(
            db=db,
            email="admin@example.com",
            password="admin123",
            full_name="Administrator"
        )
        return {"message": f"Admin user created: {admin_user.email}"}
    except HTTPException as e:
        if "already registered" in str(e.detail):
            return {"message": "Admin user already exists"}
        raise e 