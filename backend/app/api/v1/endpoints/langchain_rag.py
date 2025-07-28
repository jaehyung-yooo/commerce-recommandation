"""
LangChain RAG API 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.redis_client import get_redis_client
from app.core.opensearch_client import get_opensearch_client
from app.services.langchain_service import LangChainRAGService, LangChainAgentService
from loguru import logger

router = APIRouter()


class ProductQuestionRequest(BaseModel):
    question: str
    product_id: Optional[str] = None


class ConversationRequest(BaseModel):
    conversation: str


class AgentRequest(BaseModel):
    user_input: str


@router.post("/ask", response_model=Dict[str, Any])
async def ask_product_question(
    request: ProductQuestionRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품에 대한 질문-답변 (RAG 기반)
    
    예시:
    - "이 노트북의 배터리 수명은 어떤가요?"
    - "게이밍용으로 적합한 제품인가요?"
    - "가격 대비 성능이 좋은 편인가요?"
    """
    try:
        rag_service = LangChainRAGService(db, redis_client, opensearch_client)
        
        result = await rag_service.ask_about_product(
            question=request.question,
            product_id=request.product_id
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to process question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/summary/{product_id}", response_model=Dict[str, Any])
async def get_product_summary(
    product_id: str,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """상품 리뷰 기반 AI 요약 생성
    
    리뷰 데이터를 분석하여 다음 정보를 제공:
    - 전체적인 평가
    - 주요 장점/단점
    - 추천 대상
    - 구매 시 주의사항
    """
    try:
        rag_service = LangChainRAGService(db, redis_client, opensearch_client)
        
        result = await rag_service.generate_product_summary(product_id)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to generate summary for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/recommend-by-conversation", response_model=Dict[str, Any])
async def recommend_by_conversation(
    request: ConversationRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """대화 기반 상품 추천
    
    사용자의 자연어 대화를 분석하여 맞춤형 상품을 추천합니다.
    
    예시:
    - "대학생이고 예산이 100만원 정도인데 노트북 추천해주세요"
    - "재택근무용 의자를 찾고 있어요. 허리가 안 좋아서 편한 걸로요"
    """
    try:
        rag_service = LangChainRAGService(db, redis_client, opensearch_client)
        
        result = await rag_service.recommend_products_by_conversation(
            conversation=request.conversation
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to generate conversation-based recommendation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/smart-search", response_model=Dict[str, Any])
async def smart_search_agent(
    request: AgentRequest,
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """지능형 검색 에이전트
    
    사용자 입력을 분석하여 최적의 검색 전략을 자동으로 결정합니다.
    
    기능:
    - 의도 분석 (검색, 추천, 비교, 질문 등)
    - 검색 전략 결정
    - 맞춤형 결과 제공
    """
    try:
        rag_service = LangChainRAGService(db, redis_client, opensearch_client)
        agent_service = LangChainAgentService(rag_service)
        
        result = await agent_service.smart_search_agent(request.user_input)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to execute smart search agent: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/capabilities", response_model=Dict[str, Any])
async def get_rag_capabilities():
    """RAG 시스템 기능 소개"""
    return {
        "features": {
            "product_qa": {
                "description": "상품에 대한 자연어 질문-답변",
                "example": "이 노트북의 게이밍 성능은 어떤가요?",
                "endpoint": "/api/v1/rag/ask"
            },
            "product_summary": {
                "description": "리뷰 기반 상품 요약 생성",
                "example": "상품의 장단점과 추천 대상을 종합 분석",
                "endpoint": "/api/v1/rag/summary/{product_id}"
            },
            "conversation_recommendation": {
                "description": "대화형 상품 추천",
                "example": "대학생용 노트북 추천해주세요",
                "endpoint": "/api/v1/rag/recommend-by-conversation"
            },
            "smart_search": {
                "description": "지능형 검색 에이전트",
                "example": "의도 분석 및 최적 검색 전략 실행",
                "endpoint": "/api/v1/rag/smart-search"
            }
        },
        "technologies": {
            "llm": "Google Vertex AI Gemini Pro",
            "embeddings": "Vertex AI Text Multilingual Embedding 002",
            "vector_store": "OpenSearch",
            "framework": "LangChain",
            "search_method": "Hybrid (keyword + semantic)"
        },
        "advantages": [
            "리뷰 데이터 기반 객관적 답변",
            "자연어 처리를 통한 직관적 인터페이스",
            "맥락을 이해하는 대화형 추천",
            "의도 분석 기반 지능형 검색",
            "실시간 상품 정보 반영"
        ]
    }


@router.post("/batch-analysis", response_model=Dict[str, Any])
async def batch_product_analysis(
    product_ids: list[str] = Body(..., description="분석할 상품 ID 목록"),
    analysis_type: str = Query("summary", description="분석 유형: summary, comparison"),
    db: Session = Depends(get_db),
    redis_client = Depends(get_redis_client),
    opensearch_client = Depends(get_opensearch_client)
):
    """여러 상품 일괄 분석"""
    try:
        rag_service = LangChainRAGService(db, redis_client, opensearch_client)
        
        results = {}
        
        if analysis_type == "summary":
            # 각 상품별 요약 생성
            for product_id in product_ids[:5]:  # 최대 5개 제한
                result = await rag_service.generate_product_summary(product_id)
                results[product_id] = result
        
        elif analysis_type == "comparison":
            # 상품 비교 분석 (향후 구현)
            comparison_prompt = f"""
다음 상품들을 비교 분석해주세요:
상품 ID: {', '.join(product_ids[:3])}

비교 기준:
1. 가격 대비 성능
2. 사용자 만족도 (리뷰 기반)
3. 주요 장단점
4. 추천 순위

비교 결과:
"""
            
            results = {
                "comparison": "상품 비교 기능은 향후 구현 예정입니다.",
                "products": product_ids,
                "analysis_type": analysis_type
            }
        
        return {
            "analysis_type": analysis_type,
            "product_count": len(product_ids),
            "results": results,
            "method": "langchain_batch"
        }
        
    except Exception as e:
        logger.error(f"Failed to perform batch analysis: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 