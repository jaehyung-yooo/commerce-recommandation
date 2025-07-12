from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class RecommendationBase(BaseModel):
    """추천 기본 스키마"""
    user_id: str = Field(..., description="사용자 ID")
    product_id: str = Field(..., description="상품 ID")
    recommendation_type: str = Field(..., description="추천 유형")
    score: float = Field(..., ge=0, le=1, description="추천 점수")
    reason: Optional[str] = Field(None, description="추천 이유")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="추가 메타데이터")

class RecommendationCreate(RecommendationBase):
    """추천 생성 스키마"""
    pass

class RecommendationInDB(RecommendationBase):
    """추천 DB 스키마"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(..., description="추천 ID")
    created_at: datetime = Field(..., description="생성일시")

class Recommendation(RecommendationInDB):
    """추천 응답 스키마"""
    pass

class RecommendedProduct(BaseModel):
    """추천 상품 스키마"""
    product_id: str = Field(..., description="상품 ID")
    name: str = Field(..., description="상품명")
    description: str = Field(..., description="상품 설명")
    price: Decimal = Field(..., description="상품 가격")
    category: str = Field(..., description="상품 카테고리")
    brand: Optional[str] = Field(None, description="브랜드")
    image_url: Optional[str] = Field(None, description="상품 이미지 URL")
    rating: Optional[float] = Field(None, description="평점")
    review_count: int = Field(0, description="리뷰 수")
    
    # 추천 관련 정보
    recommendation_score: float = Field(..., ge=0, le=1, description="추천 점수")
    recommendation_reason: Optional[str] = Field(None, description="추천 이유")
    recommendation_type: str = Field(..., description="추천 유형")
    confidence: float = Field(..., ge=0, le=1, description="추천 신뢰도")

class RecommendationRequest(BaseModel):
    """추천 요청 스키마"""
    user_id: str = Field(..., description="사용자 ID")
    recommendation_type: str = Field("collaborative", description="추천 유형")
    limit: int = Field(10, ge=1, le=100, description="추천 개수")
    exclude_purchased: bool = Field(True, description="구매한 상품 제외")
    category_filter: Optional[str] = Field(None, description="카테고리 필터")
    price_range: Optional[Dict[str, Decimal]] = Field(None, description="가격 범위")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "recommendation_type": "collaborative",
                "limit": 10,
                "exclude_purchased": True,
                "category_filter": "electronics",
                "price_range": {"min": 0, "max": 1000000}
            }
        }

class RecommendationResponse(BaseModel):
    """추천 응답 스키마"""
    user_id: str = Field(..., description="사용자 ID")
    recommendation_type: str = Field(..., description="추천 유형")
    products: List[RecommendedProduct] = Field(..., description="추천 상품 목록")
    generated_at: datetime = Field(..., description="생성일시")
    algorithm_info: Dict[str, Any] = Field(..., description="알고리즘 정보")

class PersonalizedRecommendationRequest(BaseModel):
    """개인화 추천 요청 스키마"""
    user_id: str = Field(..., description="사용자 ID")
    limit: int = Field(10, ge=1, le=100, description="추천 개수")
    include_trending: bool = Field(True, description="트렌딩 상품 포함")
    diversity_factor: float = Field(0.5, ge=0, le=1, description="다양성 팩터")

class SimilarProductsRequest(BaseModel):
    """유사 상품 추천 요청 스키마"""
    product_id: str = Field(..., description="기준 상품 ID")
    limit: int = Field(10, ge=1, le=50, description="추천 개수")
    similarity_threshold: float = Field(0.5, ge=0, le=1, description="유사도 임계값")

class TrendingProductsRequest(BaseModel):
    """인기 상품 추천 요청 스키마"""
    category: Optional[str] = Field(None, description="카테고리 필터")
    time_window: str = Field("7d", description="시간 윈도우 (1d, 7d, 30d)")
    limit: int = Field(10, ge=1, le=100, description="추천 개수")

class RecommendationFeedback(BaseModel):
    """추천 피드백 스키마"""
    user_id: str = Field(..., description="사용자 ID")
    product_id: str = Field(..., description="상품 ID")
    recommendation_id: str = Field(..., description="추천 ID")
    feedback_type: str = Field(..., description="피드백 유형")  # like, dislike, click, purchase
    rating: Optional[float] = Field(None, ge=1, le=5, description="평점")
    comment: Optional[str] = Field(None, description="코멘트")

class RecommendationStats(BaseModel):
    """추천 통계 스키마"""
    total_recommendations: int
    click_through_rate: float
    conversion_rate: float
    average_rating: float
    user_engagement: Dict[str, Any]
    algorithm_performance: Dict[str, Any] 