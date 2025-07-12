from fastapi import APIRouter

from app.api.v1.endpoints import products, recommendations, users, search

api_router = APIRouter()

# 각 엔드포인트 라우터를 메인 API 라우터에 등록
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(search.router, prefix="/search", tags=["search"]) 