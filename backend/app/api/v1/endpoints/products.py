from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.core.opensearch_client import get_opensearch_client
from app.schemas.product import (
    Product, ProductCreate, ProductUpdate, ProductList, 
    ProductSearch, ProductStats
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

@router.post("/", response_model=Product)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 생성"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 상품 생성
        new_product = await product_service.create_product(product)
        
        # 캐시 무효화
        redis_client.delete(f"product:{new_product.id}")
        
        return new_product
        
    except Exception as e:
        logger.error(f"Failed to create product: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 업데이트"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 상품 업데이트
        updated_product = await product_service.update_product(product_id, product)
        if not updated_product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # 캐시 무효화
        redis_client.delete(f"product:{product_id}")
        
        return updated_product
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 삭제"""
    try:
        product_service = ProductService(db, redis_client, opensearch_client)
        
        # 상품 삭제
        success = await product_service.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # 캐시 무효화
        redis_client.delete(f"product:{product_id}")
        
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete product {product_id}: {e}")
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

@router.get("/stats/overview", response_model=ProductStats)
async def get_product_stats(
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client)
):
    """상품 통계 조회"""
    try:
        product_service = ProductService(db, redis_client, None)
        
        # 캐시에서 조회
        cache_key = "product_stats"
        cached_stats = redis_client.get(cache_key)
        if cached_stats:
            return cached_stats
        
        # 통계 조회
        stats = await product_service.get_product_stats()
        
        # 캐시에 저장 (1시간)
        redis_client.set(cache_key, stats, ex=3600)
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get product stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/categories/list")
async def get_categories(
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client)
):
    """카테고리 목록 조회"""
    try:
        product_service = ProductService(db, redis_client, None)
        
        # 캐시에서 조회
        cache_key = "product_categories"
        cached_categories = redis_client.get(cache_key)
        if cached_categories:
            return cached_categories
        
        # 카테고리 목록 조회
        categories = await product_service.get_categories()
        
        # 캐시에 저장 (1시간)
        redis_client.set(cache_key, categories, ex=3600)
        
        return categories
        
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/brands/list")
async def get_brands(
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client)
):
    """브랜드 목록 조회"""
    try:
        product_service = ProductService(db, redis_client, None)
        
        # 캐시에서 조회
        cache_key = "product_brands"
        cached_brands = redis_client.get(cache_key)
        if cached_brands:
            return cached_brands
        
        # 브랜드 목록 조회
        brands = await product_service.get_brands()
        
        # 캐시에 저장 (1시간)
        redis_client.set(cache_key, brands, ex=3600)
        
        return brands
        
    except Exception as e:
        logger.error(f"Failed to get brands: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 