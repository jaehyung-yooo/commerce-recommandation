"""
리뷰 하이브리드 검색 서비스 (키워드 + 임베딩)
"""

import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from loguru import logger
from app.core.vertex_client import get_vertex_client
from app.schemas.product import ProductList
from app.schemas.review import ReviewList, ReviewSearchParams, Review
from app.schemas.member import Member
from app.services.member_service import MemberService
from decimal import Decimal


class ReviewHybridSearchService:
    """리뷰 기반 하이브리드 검색 서비스"""
    
    def __init__(self, db: Session, redis_client=None, opensearch_client=None):
        self.db = db
        self.redis_client = redis_client
        self.opensearch_client = opensearch_client
        self.vertex_client = get_vertex_client()
        self.member_service = MemberService(db)
    
    async def search_reviews_hybrid(
        self, 
        query: str, 
        page: int = 1, 
        size: int = 20,
        hybrid_weight: float = 0.5
    ) -> Dict[str, Any]:
        """하이브리드 리뷰 검색 (키워드 + 임베딩)"""
        try:
            if not self.opensearch_client:
                logger.warning("OpenSearch client not available")
                return {"reviews": [], "total": 0, "page": page, "size": size}

            # 1. 키워드 검색 결과
            keyword_results = await self._keyword_search(query, page, size)
            
            # 2. 임베딩 검색 결과
            embedding_results = await self._embedding_search(query, page, size)
            
            # 3. 하이브리드 결과 병합
            hybrid_results = self._merge_results(
                keyword_results, 
                embedding_results, 
                hybrid_weight
            )
            
            # 4. 최종 결과 정렬 및 반환
            final_results = self._rank_final_results(hybrid_results, size)
            
            # member 정보 조회
            member_nos = []
            for result in final_results:
                member_no = result.get("member_no")
                if member_no:
                    member_nos.append(member_no)
            
            members_dict = {}
            if member_nos:
                members_dict = self.member_service.get_members_batch(member_nos)
            
            # Review 스키마로 변환
            reviews = []
            for result in final_results:
                try:
                    review = self._convert_to_review_schema(result, members_dict)
                    if review:
                        reviews.append(review)
                except Exception as e:
                    logger.warning(f"Failed to convert review result: {e}")
                    continue
            
            return {
                "reviews": reviews,
                "total": len(reviews),
                "page": page,
                "size": size,
                "search_method": "hybrid",
                "keyword_count": len(keyword_results),
                "embedding_count": len(embedding_results)
            }
            
        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            return {"reviews": [], "total": 0, "page": page, "size": size}
    
    async def _keyword_search(self, query: str, page: int, size: int) -> List[Dict[str, Any]]:
        """키워드 기반 리뷰 검색 (BM25)"""
        try:
            search_query = {
                "query": {
                    "bool": {
                        "should": [
                            {
                                "multi_match": {
                                    "query": query,
                                    "fields": [
                                        "review_text^3",  # 리뷰 내용에 가중치 3
                                        "product_name^2",  # 상품명에 가중치 2
                                        "product_brand"
                                    ],
                                    "type": "best_fields",
                                    "fuzziness": "AUTO"
                                }
                            },
                            {
                                "match_phrase": {
                                    "review_text": {
                                        "query": query,
                                        "boost": 2.0  # 구문 일치에 추가 가중치
                                    }
                                }
                            }
                        ]
                    }
                },
                "size": size * 2,  # 하이브리드를 위해 더 많이 검색
                "from": (page - 1) * size,
                "sort": [
                    {"_score": {"order": "desc"}},
                    {"rating": {"order": "desc"}},
                    {"helpful_count": {"order": "desc"}}
                ],
                "_source": True
            }
            
            logger.info(f"Keyword search query: {query}")
            results = self.opensearch_client.search("reviews", search_query)
            
            # 키워드 점수 추가
            for result in results:
                result["keyword_score"] = result.get("_score", 0)
                result["search_type"] = "keyword"
            
            logger.info(f"Keyword search found: {len(results)} reviews")
            return results
            
        except Exception as e:
            logger.error(f"Keyword search failed: {e}")
            return []
    
    async def _embedding_search(self, query: str, page: int, size: int) -> List[Dict[str, Any]]:
        """임베딩 기반 리뷰 검색 (의미론적 유사도)"""
        try:
            if not self.vertex_client.is_available():
                logger.warning("Vertex AI client not available")
                return []
            
            # 1. 쿼리를 임베딩으로 변환
            query_embedding = await self.vertex_client.get_query_embedding(query)
            if not query_embedding:
                logger.warning("Failed to generate query embedding")
                return []
            
            # 2. 벡터 유사도 검색
            vector_search_query = {
                "query": {
                    "script_score": {
                        "query": {"match_all": {}},
                        "script": {
                            "source": "cosineSimilarity(params.query_vector, 'review_embedding') + 1.0",
                            "params": {
                                "query_vector": query_embedding
                            }
                        }
                    }
                },
                "size": size * 2,
                "min_score": 1.1,  # 최소 유사도 임계값
                "_source": True
            }
            
            logger.info(f"Vector search with embedding dimension: {len(query_embedding)}")
            results = self.opensearch_client.search("reviews", vector_search_query)
            
            # 임베딩 점수 추가
            for result in results:
                result["embedding_score"] = result.get("_score", 0) - 1.0  # 정규화
                result["search_type"] = "embedding"
            
            logger.info(f"Embedding search found: {len(results)} reviews")
            return results
            
        except Exception as e:
            logger.error(f"Embedding search failed: {e}")
            return []
    
    def _merge_results(
        self, 
        keyword_results: List[Dict[str, Any]], 
        embedding_results: List[Dict[str, Any]], 
        hybrid_weight: float
    ) -> List[Dict[str, Any]]:
        """키워드와 임베딩 결과를 병합"""
        try:
            merged_results = {}
            
            # 키워드 결과 처리
            for result in keyword_results:
                review_id = result.get("review_id") or result.get("_id")
                if review_id:
                    merged_results[review_id] = result.copy()
                    merged_results[review_id]["final_score"] = (
                        result.get("keyword_score", 0) * (1 - hybrid_weight)
                    )
            
            # 임베딩 결과 병합
            for result in embedding_results:
                review_id = result.get("review_id") or result.get("_id")
                if review_id:
                    if review_id in merged_results:
                        # 기존 키워드 결과와 합산
                        merged_results[review_id]["final_score"] += (
                            result.get("embedding_score", 0) * hybrid_weight
                        )
                        merged_results[review_id]["search_type"] = "hybrid"
                        merged_results[review_id]["embedding_score"] = result.get("embedding_score", 0)
                    else:
                        # 임베딩만 있는 결과
                        merged_results[review_id] = result.copy()
                        merged_results[review_id]["final_score"] = (
                            result.get("embedding_score", 0) * hybrid_weight
                        )
                        merged_results[review_id]["keyword_score"] = 0
            
            return list(merged_results.values())
            
        except Exception as e:
            logger.error(f"Result merging failed: {e}")
            return keyword_results  # 실패 시 키워드 결과만 반환
    
    def _rank_final_results(self, results: List[Dict[str, Any]], size: int) -> List[Dict[str, Any]]:
        """최종 결과 순위 매기기"""
        try:
            # 최종 점수로 정렬
            sorted_results = sorted(
                results, 
                key=lambda x: (
                    x.get("final_score", 0),
                    x.get("rating", 0),
                    x.get("helpful_count", 0)
                ),
                reverse=True
            )
            
            # 결과 제한
            final_results = sorted_results[:size]
            
            # 순위 정보 추가
            for idx, result in enumerate(final_results):
                result["rank"] = idx + 1
                result["final_score"] = round(result.get("final_score", 0), 4)
            
            return final_results
            
        except Exception as e:
            logger.error(f"Ranking failed: {e}")
            return results[:size]
    
    async def search_products_by_reviews(
        self, 
        query: str, 
        page: int = 1, 
        size: int = 10,
        min_rating: float = 3.0
    ) -> ProductList:
        """리뷰 기반 상품 추천"""
        try:
            # 1. 하이브리드 리뷰 검색
            review_results = await self.search_reviews_hybrid(query, 1, 50)
            
            if not review_results.get("reviews"):
                return ProductList(items=[], total=0, page=page, size=size, total_pages=0)
            
            # 2. 리뷰에서 상품 추출 및 집계
            product_scores = {}
            for review in review_results["reviews"]:
                product_no = review.get("product_no")
                if not product_no:
                    continue
                
                score = review.get("final_score", 0)
                rating = review.get("rating", 0)
                
                if rating >= min_rating:
                    if product_no not in product_scores:
                        product_scores[product_no] = {
                            "total_score": 0,
                            "review_count": 0,
                            "avg_rating": 0,
                            "product_data": review
                        }
                    
                    product_scores[product_no]["total_score"] += score
                    product_scores[product_no]["review_count"] += 1
                    product_scores[product_no]["avg_rating"] = (
                        (product_scores[product_no]["avg_rating"] * 
                         (product_scores[product_no]["review_count"] - 1) + rating) / 
                        product_scores[product_no]["review_count"]
                    )
            
            # 3. 상품 점수로 정렬
            sorted_products = sorted(
                product_scores.items(),
                key=lambda x: (x[1]["total_score"], x[1]["avg_rating"]),
                reverse=True
            )
            
            # 4. 페이징 처리
            start_idx = (page - 1) * size
            end_idx = start_idx + size
            page_products = sorted_products[start_idx:end_idx]
            
            # 5. ProductList 형태로 변환
            products = []
            for product_no, data in page_products:
                # 실제 상품 정보 조회 (OpenSearch에서)
                product = await self._get_product_by_id(product_no)
                if product:
                    # 리뷰 기반 점수 추가
                    product["review_based_score"] = round(data["total_score"], 2)
                    product["matching_reviews"] = data["review_count"]
                    products.append(product)
            
            total_pages = (len(sorted_products) + size - 1) // size
            
            return ProductList(
                items=products,
                total=len(sorted_products),
                page=page,
                size=size,
                total_pages=total_pages
            )
            
        except Exception as e:
            logger.error(f"Review-based product search failed: {e}")
            return ProductList(items=[], total=0, page=page, size=size, total_pages=0)
    
    async def _get_product_by_id(self, product_no: str) -> Optional[Dict[str, Any]]:
        """상품 정보 조회"""
        try:
            if not self.opensearch_client:
                return None
            
            query = {
                "query": {
                    "term": {
                        "product_no": product_no
                    }
                },
                "size": 1
            }
            
            results = self.opensearch_client.search("products", query)
            return results[0] if results else None
            
        except Exception as e:
            logger.error(f"Product lookup failed: {e}")
            return None

    async def get_product_reviews(
        self, 
        product_no: str,
        page: int = 1, 
        size: int = 20
    ) -> ReviewList:
        """특정 상품의 리뷰 목록 조회 (생성일 내림차순)"""
        try:
            # product_no를 정수로 변환
            try:
                product_no_int = int(product_no)
            except ValueError:
                logger.error(f"Invalid product_no: {product_no}")
                return ReviewList(items=[], total=0, page=page, size=size, total_pages=0)
            
            logger.info(f"Searching reviews for product_no: {product_no_int}")
            
            # SQL 쿼리 구성
            base_query = text("""
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
                m.member_id as member_id
            FROM reviews r
            LEFT JOIN members m ON r.member_no = m.member_no
            WHERE r.product_no = :product_no
            ORDER BY r.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
            
            count_query = text("""
            SELECT COUNT(*) as total
            FROM reviews r
            WHERE r.product_no = :product_no
            """)
            
            # 전체 개수 조회
            cursor = self.db.execute(count_query, {"product_no": product_no_int})
            total_result = cursor.fetchone()
            total = total_result.total if total_result else 0
            
            logger.info(f"Total reviews found for product {product_no_int}: {total}")
            
            # 리뷰 데이터 조회
            offset = (page - 1) * size
            cursor = self.db.execute(base_query, {
                "product_no": product_no_int, 
                "limit": size, 
                "offset": offset
            })
            results = cursor.fetchall()
            
            logger.info(f"SQL query returned {len(results)} results")
            
            # Review 스키마로 변환
            reviews = []
            for result in results:
                try:
                    review = self._convert_sql_to_review_schema(result)
                    if review:
                        reviews.append(review)
                except Exception as e:
                    logger.warning(f"Failed to convert review result: {e}")
                    continue
            
            pages = (total + size - 1) // size if total > 0 else 0
            
            logger.info(f"Review search completed: {len(reviews)} reviews found, total: {total}")
            
            return ReviewList(
                items=reviews,
                total=total,
                page=page,
                size=size,
                total_pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error in review search: {e}")
            return ReviewList(items=[], total=0, page=page, size=size, total_pages=0)

    def _convert_sql_to_review_schema(self, sql_result) -> Optional[Review]:
        """SQL 결과를 Review 스키마로 변환"""
        try:
            # member 정보 생성
            member = None
            if sql_result.member_no:
                member = Member(
                    member_id=str(sql_result.member_id) if sql_result.member_id else str(sql_result.member_no),
                    name=sql_result.member_id or f"회원{sql_result.member_no}",
                    email=None  # members 테이블에 email 컬럼 없음
                )

            return Review(
                id=str(sql_result.review_id),
                content=sql_result.review_text or "",
                rating=float(sql_result.rating),
                product_no=str(sql_result.product_no),
                member_id=str(sql_result.member_no) if sql_result.member_no else None,
                member=member,
                created_at=sql_result.created_at.isoformat() if sql_result.created_at else "2025-01-01T00:00:00",
                updated_at=sql_result.updated_at.isoformat() if sql_result.updated_at else None,
                helpful_count=int(sql_result.helpful_count or 0),
                sentiment_score=None  # SQL에서는 감정 점수 없음
            )

        except Exception as e:
            logger.error(f"Error converting SQL result to Review: {e}")
            logger.error(f"Result data: {sql_result}")
            return None

    def _convert_to_review_schema(self, opensearch_result: Dict[str, Any], members_dict: Dict[int, Member] = None) -> Optional[Review]:
        """OpenSearch 결과를 Review 스키마로 변환"""
        try:
            source = opensearch_result
            
            # member_no 추출 (OpenSearch에는 member_no로 저장됨)
            member_no = source.get("member_no")
            
            # member 정보 조회
            member = None
            if member_no and members_dict and member_no in members_dict:
                member = members_dict[member_no]
            elif member_no:
                # 개별 조회 (fallback)
                member = self.member_service.get_member_by_no(member_no)

            return Review(
                id=str(source.get("review_id", "")),
                content=source.get("review_text", ""),
                rating=float(source.get("rating", 0)),
                product_no=str(source.get("product_no", "")),
                member_id=str(member_no) if member_no else None,
                member=member,
                created_at=source.get("created_at", "2025-01-01T00:00:00"),
                updated_at=source.get("updated_at"),
                helpful_count=int(source.get("helpful_count", 0)),
                sentiment_score=source.get("sentiment_score")
            )

        except Exception as e:
            logger.error(f"Error converting OpenSearch result to Review: {e}")
            logger.error(f"Result data: {opensearch_result}")
            return None

 