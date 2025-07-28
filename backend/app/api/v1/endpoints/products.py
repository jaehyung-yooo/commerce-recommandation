from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.core.opensearch_client import get_opensearch_client
from app.schemas.product import (
    Product, ProductCreate, ProductUpdate, ProductList, 
    ProductSearch, ProductStats, Category, CategoryList
)
from app.services.product_service import ProductService
from loguru import logger

router = APIRouter()

@router.get("/", response_model=ProductList)
async def get_products(
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    brand: Optional[str] = Query(None, description="브랜드 필터"),
    min_price: Optional[float] = Query(None, ge=0, description="최소 가격"),
    max_price: Optional[float] = Query(None, ge=0, description="최대 가격"),
    sort_by: str = Query("created_at", description="정렬 기준"),
    sort_order: str = Query("desc", description="정렬 순서"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 목록 조회"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 캐시 키 생성
        cache_key = f"products:page:{page}:size:{size}:category:{category}:brand:{brand}:min_price:{min_price}:max_price:{max_price}:sort_by:{sort_by}:sort_order:{sort_order}"
        
        # 캐시에서 조회
        cached_result = redis_client.get(cache_key)
        if cached_result:
            return cached_result
        
        # 상품 목록 조회
        result = await product_service.get_products(
            page=page,
            size=size,
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # 캐시에 저장 (5분)
        redis_client.set(cache_key, result, ex=300)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get products: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/search", response_model=ProductList)
async def search_products_get(
    query: Optional[str] = Query(None, description="검색어"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    category_id: Optional[int] = Query(None, description="카테고리 ID 필터"),
    brand: Optional[str] = Query(None, description="브랜드 필터"),
    min_price: Optional[float] = Query(None, ge=0, description="최소 가격"),
    max_price: Optional[float] = Query(None, ge=0, description="최대 가격"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="최소 평점"),
    tags: Optional[str] = Query(None, description="태그 (쉼표로 구분)"),
    sort_by: str = Query("created_at", description="정렬 기준"),
    sort_order: str = Query("desc", description="정렬 순서"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 검색 (GET 방식)"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # ProductSearch 객체 생성
        search_params = ProductSearch(
            query=query,
            category=category,
            category_id=category_id,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            tags=tags.split(',') if tags else None,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # 검색 실행
        result = await product_service.search_products(search_params, page, size)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to search products: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/categories", response_model=CategoryList)
async def get_categories(
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client)
):
    """카테고리 목록 조회"""
    try:
        # 캐시 키 생성
        cache_key = "categories:list"
        
        # 캐시에서 조회
        cached_result = redis_client.get(cache_key)
        if cached_result:
            return cached_result
        
        # 데이터베이스에서 카테고리 조회
        query = text("""
            SELECT 
                category_id,
                category_name,
                category_code,
                parent_category_id,
                depth,
                created_at,
                updated_at
            FROM categories 
            ORDER BY depth, category_name
        """)
        
        result = db.execute(query)
        categories = []
        
        for row in result:
            categories.append(Category(
                category_id=row.category_id,
                category_name=row.category_name,
                category_code=row.category_code,
                parent_category_id=row.parent_category_id,
                depth=row.depth,
                created_at=row.created_at,
                updated_at=row.updated_at
            ))
        
        response = CategoryList(items=categories, total=len(categories))
        
        # 캐시에 저장 (10분)
        redis_client.set(cache_key, response, ex=600)
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 상세 조회"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 캐시에서 조회
        cache_key = f"product:{product_id}"
        cached_product = redis_client.get(cache_key)
        if cached_product:
            return cached_product
        
        # 상품 조회
        product = await product_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # 조회수 증가
        await product_service.increment_view_count(product_id)
        
        # 캐시에 저장 (10분)
        redis_client.set(cache_key, product, ex=600)
        
        return product
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/search", response_model=ProductList)
async def search_products(
    search_params: ProductSearch,
    page: int = Query(1, ge=1, description="페이지 번호"),
    size: int = Query(20, ge=1, le=100, description="페이지 크기"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 검색"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 검색 실행
        result = await product_service.search_products(search_params, page, size)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to search products: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/similar/{product_id}", response_model=ProductList)
async def get_similar_products(
    product_id: str,
    size: int = Query(10, ge=1, le=50, description="추천 상품 수"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """특정 상품과 유사한 상품 추천 (콘텐츠 기반 필터링)"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 유사 상품 검색 실행
        result = await product_service.find_similar_products(product_id, size)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get similar products for {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/recommend", response_model=ProductList)
async def recommend_by_content(
    content: str = Body(..., description="추천받고 싶은 상품의 특성을 자유롭게 설명해주세요"),
    size: int = Query(10, ge=1, le=50, description="추천 상품 수"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """텍스트 설명 기반 상품 추천 (콘텐츠 기반 필터링)"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 콘텐츠 기반 검색 실행
        result = await product_service.search_by_content(content, size)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to recommend by content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/recommend-advanced", response_model=ProductList)
async def recommend_by_advanced_content(
    request: dict = Body(..., example={
        "description": "가벼우면서도 따뜻한 겨울 아우터",
        "style": "캐주얼",
        "occasion": "일상",
        "color_preference": "다크톤",
        "size": 10
    }),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """고급 콘텐츠 기반 상품 추천"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 요청에서 파라미터 추출
        description = request.get("description", "")
        style = request.get("style", "")
        occasion = request.get("occasion", "")
        color_preference = request.get("color_preference", "")
        size = request.get("size", 10)
        
        # 고급 콘텐츠 생성
        enhanced_content = f"{description} {style} {occasion} {color_preference}".strip()
        
        # 콘텐츠 기반 검색 실행
        result = await product_service.search_by_content(enhanced_content, size)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to recommend by advanced content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")