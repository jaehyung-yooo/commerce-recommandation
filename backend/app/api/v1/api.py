from fastapi import APIRouter

from app.api.v1.endpoints import products, auth

api_router = APIRouter()

# 각 엔드포인트 라우터를 메인 API 라우터에 등록
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"]) 