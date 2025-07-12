from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
from loguru import logger
import asyncio
import uvicorn

from src.models.collaborative_filtering import CollaborativeFiltering
from src.models.content_based import ContentBasedFiltering
from src.models.hybrid_model import HybridRecommendation
from src.opensearch.client import OpenSearchClient
from src.serving.model_server import ModelServer

load_dotenv()

app = FastAPI(
    title="Commerce Recommendation Engine",
    description="ML-powered recommendation engine for e-commerce",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전역 변수로 모델 서버 인스턴스 관리
model_server = None

class RecommendationRequest(BaseModel):
    user_id: str
    num_recommendations: int = 10
    recommendation_type: str = "hybrid"  # collaborative, content_based, hybrid
    filters: Optional[Dict[str, Any]] = None

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[Dict[str, Any]]
    recommendation_type: str
    confidence_scores: List[float]
    generated_at: str

class TrainingRequest(BaseModel):
    model_type: str
    parameters: Optional[Dict[str, Any]] = None

@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 모델 서버 초기화"""
    global model_server
    logger.info("Starting Recommendation Engine...")
    
    try:
        # OpenSearch 클라이언트 초기화
        opensearch_client = OpenSearchClient()
        
        # 모델 서버 초기화
        model_server = ModelServer(opensearch_client)
        
        # 모델 로드
        await model_server.load_models()
        
        logger.info("Recommendation Engine started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start Recommendation Engine: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 리소스 정리"""
    logger.info("Shutting down Recommendation Engine...")
    
    if model_server:
        await model_server.cleanup()
    
    logger.info("Recommendation Engine shut down successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Commerce Recommendation Engine", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "recommendation-engine",
        "models_loaded": model_server.models_loaded if model_server else False
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """추천 생성 엔드포인트"""
    try:
        if not model_server:
            raise HTTPException(status_code=500, detail="Model server not initialized")
        
        # 추천 생성
        recommendations = await model_server.get_recommendations(
            user_id=request.user_id,
            num_recommendations=request.num_recommendations,
            recommendation_type=request.recommendation_type,
            filters=request.filters
        )
        
        return recommendations
        
    except Exception as e:
        logger.error(f"Failed to generate recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/similar-products")
async def get_similar_products(product_id: str, num_recommendations: int = 10):
    """유사 상품 추천"""
    try:
        if not model_server:
            raise HTTPException(status_code=500, detail="Model server not initialized")
        
        similar_products = await model_server.get_similar_products(
            product_id=product_id,
            num_recommendations=num_recommendations
        )
        
        return similar_products
        
    except Exception as e:
        logger.error(f"Failed to get similar products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/trending")
async def get_trending_products(
    category: Optional[str] = None,
    time_window: str = "7d",
    num_recommendations: int = 10
):
    """인기 상품 추천"""
    try:
        if not model_server:
            raise HTTPException(status_code=500, detail="Model server not initialized")
        
        trending_products = await model_server.get_trending_products(
            category=category,
            time_window=time_window,
            num_recommendations=num_recommendations
        )
        
        return trending_products
        
    except Exception as e:
        logger.error(f"Failed to get trending products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(request: TrainingRequest):
    """모델 학습 요청"""
    try:
        if not model_server:
            raise HTTPException(status_code=500, detail="Model server not initialized")
        
        # 비동기 모델 학습 시작
        training_task = asyncio.create_task(
            model_server.train_model(
                model_type=request.model_type,
                parameters=request.parameters
            )
        )
        
        return {
            "message": "Model training started",
            "model_type": request.model_type,
            "task_id": str(id(training_task))
        }
        
    except Exception as e:
        logger.error(f"Failed to start model training: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/status")
async def get_model_status():
    """모델 상태 조회"""
    try:
        if not model_server:
            raise HTTPException(status_code=500, detail="Model server not initialized")
        
        status = await model_server.get_model_status()
        return status
        
    except Exception as e:
        logger.error(f"Failed to get model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def submit_feedback(
    user_id: str,
    product_id: str,
    feedback_type: str,
    rating: Optional[float] = None
):
    """추천 피드백 제출"""
    try:
        if not model_server:
            raise HTTPException(status_code=500, detail="Model server not initialized")
        
        await model_server.submit_feedback(
            user_id=user_id,
            product_id=product_id,
            feedback_type=feedback_type,
            rating=rating
        )
        
        return {"message": "Feedback submitted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 