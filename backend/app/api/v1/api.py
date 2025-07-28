from fastapi import APIRouter

from app.api.v1.endpoints import products, auth, reviews
# from app.api.v1.endpoints import langchain_rag  # 임시 비활성화

api_router = APIRouter()

# 각 엔드포인트 라우터를 메인 API 라우터에 등록
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
# api_router.include_router(langchain_rag.router, prefix="/rag", tags=["langchain-rag"])  # 임시 비활성화 