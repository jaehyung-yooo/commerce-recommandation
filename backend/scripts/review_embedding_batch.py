#!/usr/bin/env python3
"""
리뷰 데이터 배치 임베딩 생성 스크립트

Vertex AI text-multilingual-embedding-002 모델을 사용하여
리뷰 텍스트의 임베딩을 생성하고 OpenSearch에 저장합니다.
"""

import os
import sys
import json
import time
import asyncio
import argparse
from typing import List, Dict, Any, Optional
from datetime import datetime

# 현재 스크립트 경로를 기준으로 백엔드 앱 경로 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

import mysql.connector
from loguru import logger
from google.cloud import aiplatform
from google.oauth2 import service_account
from opensearchpy import OpenSearch, RequestsHttpConnection


class ReviewEmbeddingBatch:
    """리뷰 임베딩 배치 생성기"""
    
    def __init__(self):
        # MySQL 설정
        self.mysql_config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'port': int(os.getenv('MYSQL_PORT', 3306)),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', 'password'),
            'database': os.getenv('MYSQL_DATABASE', 'commerce_db'),
            'charset': 'utf8mb4'
        }
        
        # OpenSearch 설정
        self.opensearch_config = {
            'hosts': [{'host': os.getenv('OPENSEARCH_HOST', 'localhost'), 'port': int(os.getenv('OPENSEARCH_PORT', 9200))}],
            'http_auth': (os.getenv('OPENSEARCH_USERNAME', 'admin'), os.getenv('OPENSEARCH_PASSWORD', 'admin')),
            'use_ssl': os.getenv('OPENSEARCH_USE_SSL', 'false').lower() == 'true',
            'verify_certs': os.getenv('OPENSEARCH_VERIFY_CERTS', 'false').lower() == 'true',
            'ssl_assert_hostname': False,
            'ssl_show_warn': False,
            'connection_class': RequestsHttpConnection
        }
        
        # Vertex AI 설정
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.model_name = os.getenv("VERTEX_EMBEDDING_MODEL", "text-multilingual-embedding-002")
        
        # 배치 설정
        self.batch_size = 50  # MySQL 배치 사이즈
        self.embedding_batch_size = 5  # Vertex AI API 배치 사이즈
        self.max_retries = 3
        self.retry_delay = 2.0
        
        # 진행상황 저장
        self.checkpoint_file = "review_embedding_checkpoint.json"
        self.stats = {
            'total_reviews': 0,
            'processed_reviews': 0,
            'successful_embeddings': 0,
            'failed_embeddings': 0,
            'start_time': None,
            'last_processed_id': 0
        }
        
        # 클라이언트 초기화
        self.mysql_conn = None
        self.opensearch_client = None
        self.vertex_client = None
        
        # 로깅 설정
        logger.add("review_embedding_batch.log", rotation="10 MB", level="INFO")
    
    def initialize_clients(self):
        """모든 클라이언트 초기화"""
        try:
            # MySQL 연결
            self.mysql_conn = mysql.connector.connect(**self.mysql_config)
            logger.info("MySQL 연결 성공")
            
            # OpenSearch 연결
            self.opensearch_client = OpenSearch(**self.opensearch_config)
            logger.info("OpenSearch 연결 성공")
            
            # Vertex AI 초기화
            credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if credentials_path and os.path.exists(credentials_path):
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                aiplatform.init(
                    project=self.project_id,
                    location=self.location,
                    credentials=credentials
                )
            else:
                aiplatform.init(project=self.project_id, location=self.location)
            
            # Prediction 클라이언트
            self.vertex_client = aiplatform.gapic.PredictionServiceClient()
            logger.info("Vertex AI 클라이언트 초기화 성공")
            
        except Exception as e:
            logger.error(f"클라이언트 초기화 실패: {e}")
            raise
    
    def load_checkpoint(self) -> Optional[Dict]:
        """체크포인트 로드"""
        try:
            if os.path.exists(self.checkpoint_file):
                with open(self.checkpoint_file, 'r', encoding='utf-8') as f:
                    checkpoint = json.load(f)
                logger.info(f"체크포인트 로드: {checkpoint}")
                return checkpoint
        except Exception as e:
            logger.warning(f"체크포인트 로드 실패: {e}")
        return None
    
    def save_checkpoint(self):
        """체크포인트 저장"""
        try:
            with open(self.checkpoint_file, 'w', encoding='utf-8') as f:
                json.dump(self.stats, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            logger.error(f"체크포인트 저장 실패: {e}")
    
    def get_total_review_count(self) -> int:
        """전체 리뷰 수 조회"""
        try:
            cursor = self.mysql_conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM reviews")
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        except Exception as e:
            logger.error(f"리뷰 수 조회 실패: {e}")
            return 0
    
    def fetch_reviews_batch(self, offset: int, limit: int) -> List[Dict[str, Any]]:
        """리뷰 배치 조회"""
        try:
            query = """
            SELECT 
                r.review_id,
                r.product_no,
                r.member_no,
                r.rating,
                r.review_text,
                r.review_date,
                r.helpful_count,
                r.created_at,
                r.updated_at,
                p.product_name,
                p.brand as product_brand
            FROM reviews r
            LEFT JOIN products p ON r.product_no = p.product_no
            WHERE r.review_id > %s
            ORDER BY r.review_id
            LIMIT %s
            """
            
            cursor = self.mysql_conn.cursor(dictionary=True)
            cursor.execute(query, (offset, limit))
            reviews = cursor.fetchall()
            cursor.close()
            
            return reviews
            
        except Exception as e:
            logger.error(f"리뷰 배치 조회 실패: {e}")
            return []
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """텍스트 배치를 임베딩으로 변환"""
        try:
            if not self.vertex_client:
                raise Exception("Vertex AI 클라이언트가 초기화되지 않았습니다.")
            
            endpoint = f"projects/{self.project_id}/locations/{self.location}/publishers/google/models/{self.model_name}"
            embeddings = []
            
            # API 제한을 고려한 작은 배치로 분할
            for i in range(0, len(texts), self.embedding_batch_size):
                batch_texts = texts[i:i + self.embedding_batch_size]
                
                instances = []
                for text in batch_texts:
                    # 텍스트 전처리
                    cleaned_text = self.preprocess_text(text)
                    instances.append({
                        "content": cleaned_text,
                        "task_type": "RETRIEVAL_DOCUMENT"
                    })
                
                # API 호출 (최신 방식)
                try:
                    # 최신 Vertex AI SDK 사용
                    import vertexai
                    from vertexai.language_models import TextEmbeddingModel
                    
                    # Vertex AI 초기화
                    vertexai.init(project=self.project_id, location=self.location)
                    
                    # 모델 로드
                    model = TextEmbeddingModel.from_pretrained(self.model_name)
                    
                    # 배치 임베딩 생성
                    processed_texts = [self.preprocess_text(text) for text in batch_texts]
                    embeddings_response = model.get_embeddings(processed_texts)
                    
                    # 임베딩 추출
                    for embedding_obj in embeddings_response:
                        embeddings.append(embedding_obj.values)
                    
                    # API 제한을 위한 대기
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    logger.error(f"Vertex AI API 호출 실패: {e}")
                    # 실패한 경우 빈 임베딩 추가
                    for _ in batch_texts:
                        embeddings.append([])
            
            return embeddings
            
        except Exception as e:
            logger.error(f"임베딩 생성 실패: {e}")
            return []
    
    def preprocess_text(self, text: str) -> str:
        """텍스트 전처리"""
        if not text:
            return ""
        
        # 기본 정리
        cleaned = str(text).strip()
        
        # 길이 제한 (Vertex AI 모델 제한 고려)
        max_length = 3000
        if len(cleaned) > max_length:
            cleaned = cleaned[:max_length] + "..."
        
        return cleaned
    
    def update_opensearch_reviews(self, reviews_with_embeddings: List[Dict[str, Any]]) -> int:
        """OpenSearch에 임베딩 정보 업데이트"""
        try:
            successful_updates = 0
            
            for review_data in reviews_with_embeddings:
                try:
                    review_id = review_data['review_id']
                    embedding = review_data.get('embedding', [])
                    
                    if not embedding:
                        continue
                    
                    # OpenSearch 문서 업데이트 (review_id로 검색)
                    doc_body = {
                        "doc": {
                            "review_embedding": embedding,
                            "embedding_model": self.model_name,
                            "embedding_updated_at": datetime.now().isoformat()
                        }
                    }
                    
                    # review_id로 문서 검색 후 업데이트
                    search_query = {
                        "query": {
                            "term": {
                                "review_id": review_id
                            }
                        }
                    }
                    
                    search_response = self.opensearch_client.search(
                        index="reviews",
                        body=search_query,
                        size=1
                    )
                    
                    if search_response['hits']['total']['value'] > 0:
                        doc_id = search_response['hits']['hits'][0]['_id']
                        response = self.opensearch_client.update(
                            index="reviews",
                            id=doc_id,
                            body=doc_body,
                            retry_on_conflict=3
                        )
                    else:
                        logger.warning(f"review_id {review_id}에 해당하는 문서를 찾을 수 없습니다.")
                        continue
                    
                    if response.get('result') in ['updated', 'noop']:
                        successful_updates += 1
                    
                except Exception as e:
                    logger.warning(f"리뷰 {review_data.get('review_id')} 업데이트 실패: {e}")
                    continue
            
            return successful_updates
            
        except Exception as e:
            logger.error(f"OpenSearch 업데이트 실패: {e}")
            return 0
    
    async def process_reviews_batch(self, reviews: List[Dict[str, Any]]) -> int:
        """리뷰 배치 처리"""
        if not reviews:
            return 0
        
        try:
            # 리뷰 텍스트 추출 (상품명 + 리뷰 내용)
            texts = []
            for review in reviews:
                product_name = review.get('product_name', '')
                review_text = review.get('review_text', '')
                combined_text = f"{product_name} {review_text}".strip()
                texts.append(combined_text)
            
            # 임베딩 생성
            logger.info(f"{len(texts)}개 리뷰 임베딩 생성 시작...")
            print(f"🔄 Vertex AI 임베딩 생성 중... ({len(texts)}개 텍스트)")
            embeddings = await self.generate_embeddings_batch(texts)
            print(f"✅ 임베딩 생성 완료! ({len(embeddings)}개 생성됨)")
            
            # 리뷰와 임베딩 결합
            reviews_with_embeddings = []
            for i, review in enumerate(reviews):
                embedding = embeddings[i] if i < len(embeddings) else []
                review_data = review.copy()
                review_data['embedding'] = embedding
                reviews_with_embeddings.append(review_data)
            
            # OpenSearch 업데이트
            print(f"💾 OpenSearch에 임베딩 저장 중... ({len(reviews_with_embeddings)}개)")
            successful_updates = self.update_opensearch_reviews(reviews_with_embeddings)
            print(f"💾 저장 완료! ({successful_updates}/{len(reviews_with_embeddings)}개 성공)")
            
            # 통계 업데이트
            self.stats['processed_reviews'] += len(reviews)
            self.stats['successful_embeddings'] += successful_updates
            self.stats['failed_embeddings'] += (len(reviews) - successful_updates)
            
            if reviews:
                self.stats['last_processed_id'] = max(review['review_id'] for review in reviews)
            
            logger.info(f"배치 처리 완료: {successful_updates}/{len(reviews)} 성공")
            return successful_updates
            
        except Exception as e:
            logger.error(f"배치 처리 실패: {e}")
            return 0
    
    def print_progress(self):
        """진행상황 출력"""
        if self.stats['total_reviews'] > 0:
            progress = (self.stats['processed_reviews'] / self.stats['total_reviews']) * 100
        else:
            progress = 0
        
        elapsed_time = time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
        
        # 진행률 바 생성
        bar_length = 30
        filled_length = int(bar_length * progress / 100)
        bar = '█' * filled_length + '░' * (bar_length - filled_length)
        
        print(f"\n{'='*60}")
        print(f"🚀 리뷰 임베딩 진행 상황")
        print(f"{'='*60}")
        print(f"📊 전체 진행률: [{bar}] {progress:.1f}%")
        print(f"📈 통계:")
        print(f"   • 전체 리뷰: {self.stats['total_reviews']:,}개")
        print(f"   • 처리 완료: {self.stats['processed_reviews']:,}개")
        print(f"   • 성공 임베딩: {self.stats['successful_embeddings']:,}개 ✅")
        print(f"   • 실패 임베딩: {self.stats['failed_embeddings']:,}개 ❌")
        print(f"   • 마지막 처리 ID: {self.stats['last_processed_id']}")
        
        if self.stats['processed_reviews'] > 0:
            avg_time = elapsed_time / self.stats['processed_reviews']
            remaining = self.stats['total_reviews'] - self.stats['processed_reviews']
            eta = remaining * avg_time
            
            # 시간 포맷팅
            elapsed_str = self._format_time(elapsed_time)
            eta_str = self._format_time(eta)
            
            print(f"⏱️  시간 정보:")
            print(f"   • 경과 시간: {elapsed_str}")
            print(f"   • 평균 처리 시간: {avg_time:.2f}초/개")
            print(f"   • 예상 완료 시간: {eta_str} 후")
            
            # 처리 속도 계산
            if elapsed_time > 0:
                rate = self.stats['processed_reviews'] / elapsed_time
                print(f"   • 처리 속도: {rate:.1f}개/초")
        
        print(f"{'='*60}")
    
    def _format_time(self, seconds: float) -> str:
        """초를 읽기 쉬운 시간 형식으로 변환"""
        if seconds < 60:
            return f"{seconds:.1f}초"
        elif seconds < 3600:
            minutes = seconds / 60
            return f"{minutes:.1f}분"
        else:
            hours = seconds / 3600
            return f"{hours:.1f}시간"
    
    async def run(self, resume: bool = False, max_reviews: Optional[int] = None):
        """배치 임베딩 생성 실행"""
        try:
            # 클라이언트 초기화
            logger.info("클라이언트 초기화 중...")
            self.initialize_clients()
            
            # 체크포인트 로드
            if resume:
                checkpoint = self.load_checkpoint()
                if checkpoint:
                    self.stats.update(checkpoint)
                    logger.info(f"체크포인트에서 재시작: ID {self.stats['last_processed_id']}부터")
            
            # 전체 리뷰 수 조회
            if self.stats['total_reviews'] == 0:
                self.stats['total_reviews'] = self.get_total_review_count()
                if max_reviews:
                    self.stats['total_reviews'] = min(self.stats['total_reviews'], max_reviews)
            
            logger.info(f"총 {self.stats['total_reviews']:,}개 리뷰 처리 시작")
            
            # 시작 시간 기록
            if not self.stats['start_time']:
                self.stats['start_time'] = time.time()
            
            # 배치 처리
            offset = self.stats['last_processed_id']
            processed_count = 0
            
            while processed_count < self.stats['total_reviews']:
                # 리뷰 배치 조회
                reviews = self.fetch_reviews_batch(offset, self.batch_size)
                
                if not reviews:
                    logger.info("더 이상 처리할 리뷰가 없습니다.")
                    break
                
                # 최대 처리 수 제한
                if max_reviews and self.stats['processed_reviews'] >= max_reviews:
                    logger.info(f"최대 처리 수 {max_reviews}에 도달했습니다.")
                    break
                
                # 배치 처리
                success_count = await self.process_reviews_batch(reviews)
                
                # 진행상황 출력 (더 자주 업데이트)
                if self.stats['processed_reviews'] % (self.batch_size * 2) == 0:
                    self.print_progress()
                    self.save_checkpoint()
                
                # 다음 배치를 위한 offset 업데이트
                if reviews:
                    offset = max(review['review_id'] for review in reviews)
                
                processed_count += len(reviews)
                
                # API 제한을 위한 대기
                await asyncio.sleep(0.5)
            
            # 최종 결과
            self.print_progress()
            self.save_checkpoint()
            
            logger.info("🎉 배치 임베딩 생성 완료!")
            
        except Exception as e:
            logger.error(f"배치 처리 중 오류 발생: {e}")
            self.save_checkpoint()
            raise
        
        finally:
            # 연결 정리
            if self.mysql_conn:
                self.mysql_conn.close()


async def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="리뷰 데이터 배치 임베딩 생성")
    parser.add_argument("--resume", action="store_true", help="체크포인트에서 재시작")
    parser.add_argument("--max-reviews", type=int, help="최대 처리할 리뷰 수")
    parser.add_argument("--batch-size", type=int, default=50, help="MySQL 배치 사이즈")
    parser.add_argument("--embedding-batch-size", type=int, default=5, help="Vertex AI 배치 사이즈")
    
    args = parser.parse_args()
    
    # 배치 처리기 생성
    batch_processor = ReviewEmbeddingBatch()
    
    # 설정 업데이트
    if args.batch_size:
        batch_processor.batch_size = args.batch_size
    if args.embedding_batch_size:
        batch_processor.embedding_batch_size = args.embedding_batch_size
    
    # 실행
    await batch_processor.run(resume=args.resume, max_reviews=args.max_reviews)


if __name__ == "__main__":
    # 환경 변수 로드
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'development.env'))
    
    # 실행
    asyncio.run(main()) 