from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MemberBase(BaseModel):
    """회원 기본 스키마"""
    member_id: str = Field(..., description="회원 ID")
    name: str = Field(..., description="회원명")
    email: Optional[str] = Field(None, description="이메일")


class Member(MemberBase):
    """회원 응답 스키마"""
    created_at: Optional[datetime] = Field(None, description="가입일시")
    updated_at: Optional[datetime] = Field(None, description="수정일시")
    
    class Config:
        from_attributes = True


class MemberCreate(MemberBase):
    """회원 생성 스키마"""
    pass


class MemberUpdate(BaseModel):
    """회원 업데이트 스키마"""
    name: Optional[str] = Field(None, description="회원명")
    email: Optional[str] = Field(None, description="이메일") 