from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class ProductBase(BaseModel):
    """Product 기본 스키마"""
    name: str = Field(..., description="상품명")
    description: str = Field(..., description="상품 설명")
    price: Decimal = Field(..., gt=0, description="상품 가격")
    category: str = Field(..., description="상품 카테고리")
    brand: Optional[str] = Field(None, description="브랜드")
    image_url: Optional[str] = Field(None, description="상품 이미지 URL")
    tags: Optional[List[str]] = Field(default=[], description="상품 태그")
    attributes: Optional[Dict[str, Any]] = Field(default={}, description="상품 속성")
    is_active: bool = Field(True, description="상품 활성화 여부")

class ProductCreate(ProductBase):
    """Product 생성 스키마"""
    pass

class ProductUpdate(BaseModel):
    """Product 업데이트 스키마"""
    name: Optional[str] = Field(None, description="상품명")
    description: Optional[str] = Field(None, description="상품 설명")
    price: Optional[Decimal] = Field(None, gt=0, description="상품 가격")
    category: Optional[str] = Field(None, description="상품 카테고리")
    brand: Optional[str] = Field(None, description="브랜드")
    image_url: Optional[str] = Field(None, description="상품 이미지 URL")
    tags: Optional[List[str]] = Field(None, description="상품 태그")
    attributes: Optional[Dict[str, Any]] = Field(None, description="상품 속성")
    is_active: Optional[bool] = Field(None, description="상품 활성화 여부")

class ProductInDB(ProductBase):
    """Product DB 스키마"""
    model_config = ConfigDict(from_attributes=True)
    
    product_no: str = Field(..., description="상품 번호 (Primary Key)")
    created_at: datetime = Field(..., description="생성일시")
    updated_at: datetime = Field(..., description="수정일시")
    rating: Optional[float] = Field(None, ge=0, le=5, description="평점")
    review_count: int = Field(0, description="리뷰 수")
    view_count: int = Field(0, description="조회수")
    sales_count: int = Field(0, description="판매량")
    status: str = Field("active", description="상품 상태")

class Product(ProductInDB):
    """Product 응답 스키마"""
    pass

class ProductList(BaseModel):
    """Product 목록 응답 스키마"""
    items: List[Product]
    total: int
    page: int
    size: int
    total_pages: int

class ProductSearch(BaseModel):
    """Product 검색 요청 스키마"""
    query: Optional[str] = Field(None, description="검색어")
    category: Optional[str] = Field(None, description="카테고리 필터")
    category_id: Optional[int] = Field(None, description="카테고리 ID 필터")
    brand: Optional[str] = Field(None, description="브랜드 필터")
    min_price: Optional[Decimal] = Field(None, ge=0, description="최소 가격")
    max_price: Optional[Decimal] = Field(None, ge=0, description="최대 가격")
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="최소 평점")
    tags: Optional[List[str]] = Field(None, description="태그 필터")
    sort_by: Optional[str] = Field("created_at", description="정렬 기준")
    sort_order: Optional[str] = Field("desc", description="정렬 순서")

class ProductStats(BaseModel):
    """Product 통계 스키마"""
    total_products: int
    total_categories: int
    total_brands: int
    average_price: Decimal
    average_rating: float
    total_reviews: int
    total_sales: int

class ProductStatistics(BaseModel):
    """상품별 통계 스키마"""
    product_no: int = Field(..., description="상품 번호")
    total_reviews: int = Field(0, description="총 리뷰 수")
    average_rating: float = Field(0.0, ge=0, le=5, description="평균 평점")
    rating_distribution: str = Field("{}", description="평점 분포 (JSON)")
    last_review_date: str = Field("", description="마지막 리뷰 날짜")
    review_velocity: float = Field(0.0, description="월평균 리뷰 수")

class Category(BaseModel):
    """카테고리 스키마"""
    category_id: int = Field(..., description="카테고리 ID")
    category_name: str = Field(..., description="카테고리명")
    category_code: Optional[str] = Field(None, description="카테고리 코드")
    parent_category_id: Optional[int] = Field(None, description="상위 카테고리 ID")
    depth: int = Field(0, description="카테고리 깊이")
    created_at: Optional[datetime] = Field(None, description="생성일시")
    updated_at: Optional[datetime] = Field(None, description="수정일시")

class CategoryList(BaseModel):
    """카테고리 목록 응답 스키마"""
    items: List[Category]
    total: int 