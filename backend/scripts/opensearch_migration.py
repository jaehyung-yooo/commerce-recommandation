#!/usr/bin/env python3
"""
MySQL 데이터를 OpenSearch로 마이그레이션하는 스크립트
"""

import sys
import os
from pathlib import Path

# 백엔드 앱 모듈을 import하기 위해 경로 추가
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

import asyncio
import mysql.connector
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
from loguru import logger
from opensearchpy import OpenSearch
from app.core.config import settings
from app.core.opensearch_client import get_opensearch_client


class OpenSearchMigration:
    """OpenSearch 마이그레이션 클래스"""
    
    def __init__(self):
        self.opensearch_client = get_opensearch_client()
        self.mysql_config = {
            'host': settings.MYSQL_SERVER,
            'user': settings.MYSQL_USER,
            'password': settings.MYSQL_PASSWORD,
            'database': settings.MYSQL_DB,
            'port': int(settings.MYSQL_PORT),
            'charset': 'utf8mb4'
        }
        
    def get_products_index_mapping(self) -> Dict[str, Any]:
        """상품 인덱스 매핑 정의"""
        return {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "korean_analyzer": {
                            "type": "standard"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "product_no": {"type": "integer"},
                    "product_id": {"type": "keyword"},
                    "product_name": {
                        "type": "text",
                        "analyzer": "korean_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword"},
                            "ngram": {
                                "type": "text",
                                "analyzer": "standard"
                            }
                        }
                    },
                    "category": {
                        "type": "object",
                        "properties": {
                            "category_id": {"type": "integer"},
                            "category_name": {
                                "type": "text",
                                "analyzer": "korean_analyzer",
                                "fields": {"keyword": {"type": "keyword"}}
                            },
                            "category_code": {"type": "keyword"},
                            "parent_category_id": {"type": "integer"},
                            "depth": {"type": "integer"}
                        }
                    },
                    "brand": {
                        "type": "text",
                        "analyzer": "korean_analyzer",
                        "fields": {"keyword": {"type": "keyword"}}
                    },
                    "price": {"type": "double"},
                    "description": {
                        "type": "text",
                        "analyzer": "korean_analyzer"
                    },
                    "image_url": {"type": "keyword"},
                    "statistics": {
                        "type": "object",
                        "properties": {
                            "total_reviews": {"type": "integer"},
                            "average_rating": {"type": "float"},
                            "rating_distribution": {"type": "object"},
                            "last_review_date": {"type": "date"},
                            "review_velocity": {"type": "float"}
                        }
                    },
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"},
                    "suggest": {
                        "type": "completion",
                        "analyzer": "korean_analyzer"
                    }
                }
            }
        }
    
    def get_reviews_index_mapping(self) -> Dict[str, Any]:
        """리뷰 인덱스 매핑 정의"""
        return {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "korean_analyzer": {
                            "type": "standard"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "review_id": {"type": "integer"},
                    "product_no": {"type": "integer"},
                    "member_no": {"type": "integer"},
                    "product_name": {
                        "type": "text",
                        "analyzer": "korean_analyzer"
                    },
                    "rating": {"type": "integer"},
                    "review_text": {
                        "type": "text",
                        "analyzer": "korean_analyzer"
                    },
                    "review_date": {"type": "date"},
                    "helpful_count": {"type": "integer"},
                    "sentiment": {"type": "keyword"},  # positive, negative, neutral
                    "review_embedding": {  # Vertex AI text-multilingual-embedding-002 벡터
                        "type": "knn_vector",
                        "dimension": 768,
                        "method": {
                            "name": "hnsw",
                            "space_type": "cosinesimil",
                            "engine": "nmslib",
                            "parameters": {
                                "ef_construction": 512,
                                "m": 16
                            }
                        }
                    },
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
    
    def connect_mysql(self) -> mysql.connector.MySQLConnection:
        """MySQL 연결"""
        try:
            connection = mysql.connector.connect(**self.mysql_config)
            logger.info("MySQL 연결 성공")
            return connection
        except Exception as e:
            logger.error(f"MySQL 연결 실패: {e}")
            raise
    
    def fetch_products_with_category(self, connection: mysql.connector.MySQLConnection, 
                                   batch_size: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        """상품 데이터를 카테고리 정보와 함께 조회"""
        query = """
        SELECT 
            p.product_no,
            p.product_id,
            p.product_name,
            p.brand,
            p.price,
            p.description,
            p.image_url,
            p.created_at,
            p.updated_at,
            c.category_id,
            c.category_name,
            c.category_code,
            c.parent_category_id,
            c.depth,
            ps.total_reviews,
            ps.average_rating,
            ps.rating_distribution,
            ps.last_review_date,
            ps.review_velocity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN product_statistics ps ON p.product_no = ps.product_no
        ORDER BY p.product_no
        LIMIT %s OFFSET %s
        """
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, (batch_size, offset))
        results = cursor.fetchall()
        cursor.close()
        
        # 데이터 변환
        products = []
        for row in results:
            # rating_distribution JSON 파싱
            rating_distribution = None
            if row['rating_distribution']:
                try:
                    rating_distribution = json.loads(row['rating_distribution'])
                except:
                    rating_distribution = None
            
            product = {
                "product_no": row['product_no'],
                "product_id": row['product_id'],
                "product_name": row['product_name'],
                "brand": row['brand'],
                "price": float(row['price']) if row['price'] else 0.0,
                "description": row['description'] or "",
                "image_url": row['image_url'],
                "category": {
                    "category_id": row['category_id'],
                    "category_name": row['category_name'],
                    "category_code": row['category_code'],
                    "parent_category_id": row['parent_category_id'],
                    "depth": row['depth']
                } if row['category_id'] else None,
                "statistics": {
                    "total_reviews": row['total_reviews'] or 0,
                    "average_rating": float(row['average_rating']) if row['average_rating'] else 0.0,
                    "rating_distribution": rating_distribution,
                    "last_review_date": row['last_review_date'].isoformat() if row['last_review_date'] else None,
                    "review_velocity": float(row['review_velocity']) if row['review_velocity'] else 0.0
                },
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None,
                # 자동완성을 위한 suggest 필드
                "suggest": {
                    "input": [
                        row['product_name'],
                        row['brand'] if row['brand'] else "",
                        row['category_name'] if row['category_name'] else ""
                    ],
                    "weight": row['total_reviews'] or 1 if row['total_reviews'] else 1
                }
            }
            products.append(product)
        
        return products
    
    def fetch_reviews_with_product(self, connection: mysql.connector.MySQLConnection,
                                 batch_size: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        """리뷰 데이터를 상품 정보와 함께 조회"""
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
            p.product_name
        FROM reviews r
        JOIN products p ON r.product_no = p.product_no
        ORDER BY r.review_id
        LIMIT %s OFFSET %s
        """
        
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, (batch_size, offset))
        results = cursor.fetchall()
        cursor.close()
        
        # 데이터 변환
        reviews = []
        for row in results:
            # 간단한 감정 분석 (키워드 기반)
            sentiment = self.analyze_sentiment(row['review_text'])
            
            review = {
                "review_id": row['review_id'],
                "product_no": row['product_no'],
                "member_no": row['member_no'],
                "product_name": row['product_name'],
                "rating": row['rating'],
                "review_text": row['review_text'] or "",
                "review_date": row['review_date'].isoformat() if row['review_date'] else None,
                "helpful_count": row['helpful_count'] or 0,
                "sentiment": sentiment,
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "updated_at": row['updated_at'].isoformat() if row['updated_at'] else None
            }
            reviews.append(review)
        
        return reviews
    
    def analyze_sentiment(self, text: str) -> str:
        """간단한 감정 분석"""
        if not text:
            return "neutral"
        
        positive_words = ["좋", "만족", "추천", "훌륭", "완벽", "최고", "감사", "행복"]
        negative_words = ["나쁘", "실망", "불만", "별로", "아쉽", "후회", "최악", "짜증"]
        
        text = text.lower()
        positive_count = sum(1 for word in positive_words if word in text)
        negative_count = sum(1 for word in negative_words if word in text)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def get_total_count(self, connection: mysql.connector.MySQLConnection, table: str) -> int:
        """테이블의 총 레코드 수 조회"""
        cursor = connection.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        cursor.close()
        return count
    
    def migrate_products(self, batch_size: int = 1000) -> bool:
        """상품 데이터 마이그레이션"""
        logger.info("상품 데이터 마이그레이션 시작")
        
        # 인덱스 생성
        products_mapping = self.get_products_index_mapping()
        index_name = "products"
        
        if not self.opensearch_client.create_index(index_name, products_mapping):
            logger.error("상품 인덱스 생성 실패")
            return False
        
        # MySQL 연결
        connection = self.connect_mysql()
        
        try:
            # 총 레코드 수 확인
            total_products = self.get_total_count(connection, "products")
            logger.info(f"총 상품 수: {total_products:,}개")
            
            # 배치 처리
            offset = 0
            processed = 0
            
            while offset < total_products:
                # 데이터 조회
                products = self.fetch_products_with_category(connection, batch_size, offset)
                
                if not products:
                    break
                
                # OpenSearch에 bulk 인덱싱
                if self.opensearch_client.bulk_index(index_name, products):
                    processed += len(products)
                    logger.info(f"상품 데이터 처리: {processed:,}/{total_products:,} ({processed/total_products*100:.1f}%)")
                else:
                    logger.error(f"배치 처리 실패: offset {offset}")
                
                offset += batch_size
            
            logger.info(f"상품 마이그레이션 완료: {processed:,}개")
            return True
            
        except Exception as e:
            logger.error(f"상품 마이그레이션 실패: {e}")
            return False
        finally:
            connection.close()
    
    def migrate_reviews(self, batch_size: int = 1000) -> bool:
        """리뷰 데이터 마이그레이션"""
        logger.info("리뷰 데이터 마이그레이션 시작")
        
        # 인덱스 생성
        reviews_mapping = self.get_reviews_index_mapping()
        index_name = "reviews"
        
        if not self.opensearch_client.create_index(index_name, reviews_mapping):
            logger.error("리뷰 인덱스 생성 실패")
            return False
        
        # MySQL 연결
        connection = self.connect_mysql()
        
        try:
            # 총 레코드 수 확인
            total_reviews = self.get_total_count(connection, "reviews")
            logger.info(f"총 리뷰 수: {total_reviews:,}개")
            
            # 배치 처리
            offset = 0
            processed = 0
            
            while offset < total_reviews:
                # 데이터 조회
                reviews = self.fetch_reviews_with_product(connection, batch_size, offset)
                
                if not reviews:
                    break
                
                # OpenSearch에 bulk 인덱싱
                if self.opensearch_client.bulk_index(index_name, reviews):
                    processed += len(reviews)
                    logger.info(f"리뷰 데이터 처리: {processed:,}/{total_reviews:,} ({processed/total_reviews*100:.1f}%)")
                else:
                    logger.error(f"배치 처리 실패: offset {offset}")
                
                offset += batch_size
            
            logger.info(f"리뷰 마이그레이션 완료: {processed:,}개")
            return True
            
        except Exception as e:
            logger.error(f"리뷰 마이그레이션 실패: {e}")
            return False
        finally:
            connection.close()
    
    def test_search(self) -> bool:
        """검색 테스트"""
        logger.info("검색 테스트 시작")
        
        try:
            # 상품 검색 테스트
            search_query = {
                "query": {
                    "multi_match": {
                        "query": "삼성",
                        "fields": ["product_name", "brand", "description"]
                    }
                },
                "size": 5
            }
            
            results = self.opensearch_client.search("products", search_query)
            logger.info(f"상품 검색 결과: {len(results)}개")
            
            for result in results[:3]:
                logger.info(f"  - {result.get('product_name')} ({result.get('brand')})")
            
            # 리뷰 검색 테스트
            review_query = {
                "query": {
                    "match": {
                        "review_text": "좋아요"
                    }
                },
                "size": 3
            }
            
            review_results = self.opensearch_client.search("reviews", review_query)
            logger.info(f"리뷰 검색 결과: {len(review_results)}개")
            
            return True
            
        except Exception as e:
            logger.error(f"검색 테스트 실패: {e}")
            return False
    
    def run_migration(self, migrate_products: bool = True, migrate_reviews: bool = True, 
                     batch_size: int = 1000) -> bool:
        """전체 마이그레이션 실행"""
        logger.info("🚀 OpenSearch 마이그레이션 시작")
        
        # OpenSearch 연결 확인
        if not self.opensearch_client.is_connected():
            logger.error("OpenSearch 연결 실패")
            return False
        
        success = True
        
        # 상품 마이그레이션
        if migrate_products:
            if not self.migrate_products(batch_size):
                success = False
        
        # 리뷰 마이그레이션
        if migrate_reviews:
            if not self.migrate_reviews(batch_size):
                success = False
        
        # 검색 테스트
        if success:
            self.test_search()
        
        if success:
            logger.info("🎉 OpenSearch 마이그레이션 완료!")
        else:
            logger.error("❌ 마이그레이션 중 오류 발생")
        
        return success


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description="MySQL to OpenSearch 마이그레이션")
    parser.add_argument("--products-only", action="store_true", help="상품 데이터만 마이그레이션")
    parser.add_argument("--reviews-only", action="store_true", help="리뷰 데이터만 마이그레이션")
    parser.add_argument("--batch-size", type=int, default=1000, help="배치 크기 (기본값: 1000)")
    
    args = parser.parse_args()
    
    migration = OpenSearchMigration()
    
    migrate_products = not args.reviews_only
    migrate_reviews = not args.products_only
    
    success = migration.run_migration(
        migrate_products=migrate_products,
        migrate_reviews=migrate_reviews,
        batch_size=args.batch_size
    )
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main()) 