"""
Google Cloud Vertex AI 임베딩 클라이언트
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger
from google.cloud import aiplatform
from google.oauth2 import service_account
import json


class VertexAIEmbeddingClient:
    """Vertex AI를 사용한 텍스트 임베딩 클라이언트"""
    
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.model_name = os.getenv("VERTEX_EMBEDDING_MODEL", "text-multilingual-embedding-002")
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Vertex AI 클라이언트 초기화"""
        try:
            # 서비스 계정 키 파일 경로 또는 환경 변수로 인증
            credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            
            if credentials_path and os.path.exists(credentials_path):
                logger.info(f"Using service account credentials: {credentials_path}")
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_path
                )
                aiplatform.init(
                    project=self.project_id,
                    location=self.location,
                    credentials=credentials
                )
            else:
                logger.info("Using default credentials")
                aiplatform.init(
                    project=self.project_id,
                    location=self.location
                )
            
            self.client = aiplatform.gapic.PredictionServiceClient()
            logger.info(f"Vertex AI client initialized for project: {self.project_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI client: {e}")
            self.client = None
    
    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """텍스트 목록을 임베딩 벡터로 변환"""
        if not self.client:
            logger.error("Vertex AI client not initialized")
            return []
        
        try:
            # Vertex AI의 text embedding 모델 사용
            endpoint = f"projects/{self.project_id}/locations/{self.location}/publishers/google/models/{self.model_name}"
            
            embeddings = []
            
            # 배치 크기로 나누어 처리 (API 제한 고려)
            batch_size = 5
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                instances = []
                for text in batch_texts:
                    # 텍스트 전처리
                    cleaned_text = self._preprocess_text(text)
                    instances.append({
                        "content": cleaned_text,
                        "task_type": "RETRIEVAL_DOCUMENT"  # 검색용 문서 임베딩
                    })
                
                request = {
                    "endpoint": endpoint,
                    "instances": instances
                }
                
                # API 호출
                response = await self._call_prediction_api(request)
                
                if response and "predictions" in response:
                    for prediction in response["predictions"]:
                        if "embeddings" in prediction and "values" in prediction["embeddings"]:
                            embeddings.append(prediction["embeddings"]["values"])
                
                # API 제한을 위한 대기
                await asyncio.sleep(0.1)
            
            logger.info(f"Generated embeddings for {len(embeddings)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            return []
    
    async def get_query_embedding(self, query_text: str) -> Optional[List[float]]:
        """검색 쿼리를 임베딩 벡터로 변환"""
        if not self.client:
            logger.error("Vertex AI client not initialized")
            return None
        
        try:
            endpoint = f"projects/{self.project_id}/locations/{self.location}/publishers/google/models/{self.model_name}"
            
            cleaned_text = self._preprocess_text(query_text)
            
            instance = {
                "content": cleaned_text,
                "task_type": "RETRIEVAL_QUERY"  # 검색 쿼리 임베딩
            }
            
            request = {
                "endpoint": endpoint,
                "instances": [instance]
            }
            
            response = await self._call_prediction_api(request)
            
            if response and "predictions" in response and len(response["predictions"]) > 0:
                prediction = response["predictions"][0]
                if "embeddings" in prediction and "values" in prediction["embeddings"]:
                    return prediction["embeddings"]["values"]
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to generate query embedding: {e}")
            return None
    
    async def _call_prediction_api(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Vertex AI Prediction API 호출"""
        try:
            # 실제 API 호출 (여기서는 구현 예시)
            # 실제 환경에서는 aiplatform.gapic.PredictionServiceClient를 사용
            logger.info(f"Calling Vertex AI API with {len(request.get('instances', []))} instances")
            
            # 임시 더미 응답 (실제로는 Vertex AI API 응답)
            dummy_response = {
                "predictions": []
            }
            
            for instance in request.get("instances", []):
                # 768차원 더미 임베딩 (실제로는 Vertex AI에서 생성)
                dummy_embedding = [0.1] * 768
                dummy_response["predictions"].append({
                    "embeddings": {
                        "values": dummy_embedding,
                        "statistics": {
                            "truncated": False,
                            "token_count": len(instance.get("content", "").split())
                        }
                    }
                })
            
            return dummy_response
            
        except Exception as e:
            logger.error(f"API call failed: {e}")
            return None
    
    def _preprocess_text(self, text: str) -> str:
        """텍스트 전처리"""
        if not text:
            return ""
        
        # 기본 정리
        cleaned = text.strip()
        
        # 길이 제한 (Vertex AI 모델 제한 고려)
        max_length = 3000
        if len(cleaned) > max_length:
            cleaned = cleaned[:max_length] + "..."
        
        return cleaned
    
    def is_available(self) -> bool:
        """클라이언트 사용 가능 여부 확인"""
        return self.client is not None


# 싱글톤 인스턴스
_vertex_client: Optional[VertexAIEmbeddingClient] = None


def get_vertex_client() -> VertexAIEmbeddingClient:
    """Vertex AI 클라이언트 인스턴스 반환"""
    global _vertex_client
    if _vertex_client is None:
        _vertex_client = VertexAIEmbeddingClient()
    return _vertex_client 