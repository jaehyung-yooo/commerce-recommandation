from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from .member import Member


class ReviewBase(BaseModel):
    """리뷰 기본 스키마"""
    content: str = Field(..., description="리뷰 내용")
    rating: float = Field(..., ge=1, le=5, description="평점 (1-5)")
    product_no: str = Field(..., description="상품 번호")


class ReviewCreate(ReviewBase):
    """리뷰 생성 스키마"""
    pass


class ReviewUpdate(BaseModel):
    """리뷰 업데이트 스키마"""
    content: Optional[str] = Field(None, description="리뷰 내용")
    rating: Optional[float] = Field(None, ge=1, le=5, description="평점 (1-5)")


class Review(ReviewBase):
    """리뷰 응답 스키마"""
    id: str = Field(..., description="리뷰 ID")
    member_id: Optional[str] = Field(None, description="회원 ID")
    member: Optional[Member] = Field(None, description="회원 정보")
    created_at: datetime = Field(..., description="작성일시")
    updated_at: Optional[datetime] = Field(None, description="수정일시")
    helpful_count: int = Field(0, description="도움됨 수")
    sentiment_score: Optional[float] = Field(None, description="감정 점수")
    
    class Config:
        from_attributes = True


class ReviewList(BaseModel):
    """리뷰 목록 응답 스키마"""
    items: List[Review]
    total: int
    page: int
    size: int
    total_pages: int


class ReviewSearchParams(BaseModel):
    """리뷰 검색 요청 스키마"""
    query: Optional[str] = Field(None, description="검색어")
    product_no: Optional[str] = Field(None, description="상품 번호")
    min_rating: Optional[float] = Field(None, ge=1, le=5, description="최소 평점")
    max_rating: Optional[float] = Field(None, ge=1, le=5, description="최대 평점")
    sort_by: Optional[str] = Field("created_at", description="정렬 기준")
    sort_order: Optional[str] = Field("desc", description="정렬 순서")


class ReviewStats(BaseModel):
    """리뷰 통계 스키마"""
    total_reviews: int
    average_rating: float
    rating_distribution: dict
    recent_reviews_count: int
    helpful_reviews_count: int


class ReviewCluster(BaseModel):
    """리뷰 클러스터 스키마"""
    id: str
    title: str
    summary: str
    review_count: int
    average_rating: float
    keywords: List[str]
    sentiment: str 