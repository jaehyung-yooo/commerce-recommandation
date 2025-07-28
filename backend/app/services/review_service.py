"""
리뷰 하이브리드 검색 서비스 (키워드 + 임베딩)
"""

import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from loguru import logger
from app.core.vertex_client import get_vertex_client
from app.schemas.product import ProductList
from decimal import Decimal


class ReviewHybridSearchService:
    """리뷰 기반 하이브리드 검색 서비스"""
    
    def __init__(self, db: Session, redis_client=None, opensearch_client=None):
        self.db = db
        self.redis_client = redis_client
        self.opensearch_client = opensearch_client
        self.vertex_client = get_vertex_client()
    
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
            
            return {
                "reviews": final_results,
                "total": len(final_results),
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