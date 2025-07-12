from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from loguru import logger
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.api.v1.api import api_router

load_dotenv()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Commerce Recommendation API",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """Root endpoint redirects to docs"""
    return RedirectResponse(url="/docs")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "commerce-recommendation-api"}

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("Starting Commerce Recommendation API...")
    
    # 여기에 OpenSearch, Redis 연결 초기화 코드를 추가할 수 있습니다
    # await init_opensearch()
    # await init_redis()
    
    logger.info("Commerce Recommendation API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("Shutting down Commerce Recommendation API...")
    
    # 여기에 연결 종료 코드를 추가할 수 있습니다
    # await close_opensearch()
    # await close_redis()
    
    logger.info("Commerce Recommendation API shut down successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 