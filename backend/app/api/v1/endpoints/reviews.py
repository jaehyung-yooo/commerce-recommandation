"""
리뷰 하이브리드 검색 API 엔드포인트
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.core.opensearch_client import get_opensearch_client
from app.services.review_service import ReviewHybridSearchService
from app.schemas.product import ProductList
from app.schemas.review import ReviewList, ReviewSearchParams
from loguru import logger

router = APIRouter()


@router.get("/products/{product_no}/reviews", response_model=ReviewList)
async def get_product_reviews(
    product_no: str,
    page: int = Query(1, ge=1, description="페이지 번호"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """특정 상품의 리뷰 목록 조회 (생성일 내림차순)"""
    try:
        review_service = ReviewHybridSearchService(db, redis_client, opensearch_client)
        
        # 캐시 키 생성
        cache_key = f"reviews:product:{product_no}:page:{page}"
        
        # 캐시에서 조회
        cached_result = redis_client.get(cache_key)
        if cached_result:
            try:
                cached_data = json.loads(cached_result)
                return ReviewList(**cached_data)
            except Exception as e:
                logger.warning(f"Failed to parse cached result: {e}")
        
        # 리뷰 조회 (size는 20으로 고정)
        result = await review_service.get_product_reviews(
            product_no=product_no,
            page=page,
            size=20
        )
        
        # 캐시에 저장 (5분) - JSON으로 직렬화
        try:
            redis_client.set(cache_key, json.dumps(result.dict()), ex=300)
        except Exception as e:
            logger.warning(f"Failed to cache result: {e}")
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get reviews for product {product_no}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/search-hybrid", response_model=Dict[str, Any])
async def search_reviews_hybrid(
    query: str = Body(..., description="검색할 리뷰 내용"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    hybrid_weight: float = Query(0.5, ge=0.0, le=1.0, description="임베딩 가중치 (0=키워드만, 1=임베딩만)"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """하이브리드 리뷰 검색 (키워드 + Vertex AI 임베딩)"""
    try:
        review_service = ReviewHybridSearchService(db, redis_client, opensearch_client)
        
        # 하이브리드 검색 실행
        result = await review_service.search_reviews_hybrid(
            query=query,
            page=page,
            size=size,
            hybrid_weight=hybrid_weight
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to search reviews hybrid: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/search-products-by-reviews", response_model=ProductList)
async def search_products_by_reviews(
    query: str = Body(..., description="리뷰 내용 기반 상품 검색"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(10, ge=1, le=50, description="페이지 크기"),
    min_rating: float = Query(3.0, ge=1.0, le=5.0, description="최소 평점"),
    hybrid_weight: float = Query(0.6, ge=0.0, le=1.0, description="임베딩 가중치"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """리뷰 기반 상품 추천 (하이브리드 검색)"""
    try:
        review_service = ReviewHybridSearchService(db, redis_client, opensearch_client)
        
        # 리뷰 기반 상품 검색 실행
        result = await review_service.search_products_by_reviews(
            query=query,
            page=page,
            size=size,
            min_rating=min_rating
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to search products by reviews: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/analyze-sentiment", response_model=Dict[str, Any])
async def analyze_review_sentiment(
    query: str = Body(..., description="감정 분석할 리뷰 내용"),
    sentiment_threshold: float = Query(0.5, ge=0.0, le=1.0, description="감정 임계값"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """리뷰 감정 분석 기반 검색"""
    try:
        review_service = ReviewHybridSearchService(db, redis_client, opensearch_client)
        
        # 감정 분석 기반 검색 (향후 확장)
        result = {
            "query": query,
            "sentiment_analysis": "positive",  # 임시
            "confidence": 0.85,
            "message": "감정 분석 기능은 향후 구현 예정입니다."
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to analyze sentiment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats", response_model=Dict[str, Any])
async def get_review_stats(
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """리뷰 통계 정보"""
    try:
        # 기본 통계 (향후 확장)
        stats = {
            "total_reviews": 222750,
            "indexed_reviews": 0,  # OpenSearch에 인덱싱된 리뷰 수
            "embedding_coverage": 0.0,  # 임베딩 생성된 리뷰 비율
            "avg_rating": 4.2,
            "search_methods": {
                "keyword": "BM25 기반 키워드 검색",
                "embedding": "Vertex AI 임베딩 기반 의미론적 검색",
                "hybrid": "키워드 + 임베딩 하이브리드 검색"
            }
        }
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get review stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 


@router.get("/products/{product_no}/reviews/summary", response_model=Dict[str, Any])
async def get_product_reviews_summary(
    product_no: str,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """특정 상품의 리뷰 요약 정보 조회"""
    try:
        review_service = ReviewHybridSearchService(db, redis_client, opensearch_client)
        
        # 캐시 키 생성
        cache_key = f"reviews:summary:product:{product_no}"
        
        # 캐시에서 조회
        cached_result = redis_client.get(cache_key)
        if cached_result:
            try:
                return json.loads(cached_result)
            except Exception as e:
                logger.warning(f"Failed to parse cached summary: {e}")
        
        # 리뷰 요약 조회
        summary = await review_service.get_product_reviews_summary(product_no)
        
        # 캐시에 저장 (10분)
        try:
            redis_client.set(cache_key, json.dumps(summary), ex=600)
        except Exception as e:
            logger.warning(f"Failed to cache summary: {e}")
        
        return summary
        
    except Exception as e:
        logger.error(f"Failed to get reviews summary for product {product_no}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 