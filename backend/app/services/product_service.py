from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.schemas.product import ProductCreate, ProductUpdate, ProductSearch, Product, ProductList, ProductStats
from loguru import logger
from decimal import Decimal


class ProductService:
    def __init__(self, db: Session, redis_client=None, opensearch_client=None):
        self.db = db
        self.redis_client = redis_client
        self.opensearch_client = opensearch_client

    async def get_products(
        self,
        page: int = 1,
        size: int = 20,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> ProductList:
        """상품 목록 조회"""
        # 기본 구현: 빈 목록 반환
        return ProductList(
            items=[],
            total=0,
            page=page,
            size=size,
            total_pages=0
        )

    async def get_product_by_id(self, product_no: str) -> Optional[Product]:
        """상품 상세 조회"""
        # 기본 구현: None 반환
        logger.info(f"Getting product by product_no: {product_no}")
        return None

    async def create_product(self, product: ProductCreate) -> Product:
        """상품 생성"""
        # 기본 구현: 더미 데이터 반환
        logger.info(f"Creating product: {product.name}")
        return Product(
            product_no="dummy-product-no",
            name=product.name,
            description=product.description or "",
            price=product.price,
            category=product.category,
            brand=product.brand or "",
            image_url=product.image_url or "",
            stock=product.stock or 0,
            status="active",
            view_count=0,
            rating=0.0,
            review_count=0
        )

    async def update_product(self, product_no: str, product: ProductUpdate) -> Optional[Product]:
        """상품 수정"""
        logger.info(f"Updating product: {product_no}")
        return None

    async def delete_product(self, product_no: str) -> bool:
        """상품 삭제"""
        logger.info(f"Deleting product: {product_no}")
        return True

    async def search_products(self, search_params: ProductSearch, page: int, size: int) -> ProductList:
        """OpenSearch를 사용한 상품 검색"""
        try:
            if not self.opensearch_client:
                logger.warning("OpenSearch client not available, returning empty results")
                return ProductList(items=[], total=0, page=page, size=size, total_pages=0)

            # OpenSearch 쿼리 구성
            search_query = self._build_search_query(search_params, page, size)
            
            logger.info(f"OpenSearch query: {search_query}")
            
            # OpenSearch에서 검색 실행
            search_results = self.opensearch_client.search("products", search_query)
            
            # 결과를 Product 스키마로 변환
            products = []
            for result in search_results:
                try:
                    product = self._convert_to_product_schema(result)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.warning(f"Failed to convert search result to product schema: {e}")
                    continue
            
            # 전체 결과 수 조회
            total = self._get_total_count(search_params)
            pages = (total + size - 1) // size if total > 0 else 0
            
            logger.info(f"Search completed: {len(products)} products found, total: {total}")
            
            return ProductList(
                items=products,
                total=total,
                page=page,
                size=size,
                total_pages=pages
            )
            
        except Exception as e:
            logger.error(f"Error in product search: {e}")
            return ProductList(items=[], total=0, page=page, size=size, total_pages=0)

    def _build_search_query(self, search_params: ProductSearch, page: int, size: int) -> Dict[str, Any]:
        """OpenSearch 검색 쿼리 생성"""
        # 기본 쿼리 구조
        query = {
            "from": (page - 1) * size,
            "size": size,
            "query": {
                "bool": {
                    "must": [],
                    "filter": []
                }
            },
            "sort": []
        }
        
        # 검색어 처리
        if search_params.query and search_params.query.strip():
            query["query"]["bool"]["must"].append({
                "multi_match": {
                    "query": search_params.query.strip(),
                    "fields": [
                        "product_name^3",      # 상품명에 가중치 3
                        "brand^2",             # 브랜드에 가중치 2
                        "description",         # 설명
                        "category.category_name^2"  # 카테고리명에 가중치 2
                    ],
                    "type": "best_fields",
                    "fuzziness": "AUTO"    # 오타 허용
                }
            })
        else:
            # 검색어가 없으면 모든 문서 매칭
            query["query"]["bool"]["must"].append({"match_all": {}})
        
        # 필터 조건들
        filters = []
        
        # 카테고리 필터
        if search_params.category_id:
            filters.append({
                "term": {
                    "category.category_id": search_params.category_id
                }
            })
        elif search_params.category:
            filters.append({
                "term": {
                    "category.category_name.keyword": search_params.category
                }
            })
        
        # 브랜드 필터
        if search_params.brand:
            filters.append({
                "term": {
                    "brand.keyword": search_params.brand
                }
            })
        
        # 가격 필터
        if search_params.min_price is not None or search_params.max_price is not None:
            price_filter = {"range": {"price": {}}}
            if search_params.min_price is not None:
                price_filter["range"]["price"]["gte"] = float(search_params.min_price)
            if search_params.max_price is not None:
                price_filter["range"]["price"]["lte"] = float(search_params.max_price)
            filters.append(price_filter)
        
        # 최소 평점 필터
        if search_params.min_rating is not None:
            filters.append({
                "range": {
                    "average_rating": {
                        "gte": search_params.min_rating
                    }
                }
            })
        
        # 태그 필터 (있는 경우)
        if search_params.tags:
            for tag in search_params.tags:
                filters.append({
                    "term": {
                        "tags.keyword": tag
                    }
                })
        
        # 필터 추가
        if filters:
            query["query"]["bool"]["filter"] = filters
        
        # 정렬 처리
        sort_field = search_params.sort_by or "created_at"
        sort_order = search_params.sort_order or "desc"
        
        # 정렬 필드 매핑
        sort_mapping = {
            "created_at": "created_at",
            "price": "price",
            "rating": "statistics.average_rating",
            "popularity": "statistics.total_reviews",
            "name": "product_name.keyword"
        }
        
        opensearch_sort_field = sort_mapping.get(sort_field, "created_at")
        
        query["sort"] = [
            {opensearch_sort_field: {"order": sort_order}},
            {"_score": {"order": "desc"}}  # 검색 점수도 고려
        ]
        
        return query

    def _convert_to_product_schema(self, opensearch_result: Dict[str, Any]) -> Optional[Product]:
        """OpenSearch 결과를 Product 스키마로 변환"""
        try:
            source = opensearch_result
            
            # 카테고리 정보 처리
            category_info = source.get("category", {})
            if isinstance(category_info, dict):
                category = category_info.get("category_name", "")
            else:
                category = str(category_info) if category_info else ""
            
            # 가격 처리
            price = source.get("price", 0)
            if isinstance(price, str):
                try:
                    price = float(price.replace(",", ""))
                except:
                    price = 0.0
            
            # 통계 정보 처리
            statistics = source.get("statistics", {})
            average_rating = statistics.get("average_rating", 0.0) if statistics else 0.0
            total_reviews = statistics.get("total_reviews", 0) if statistics else 0
            
            return Product(
                product_no=str(source.get("product_no", "")),
                name=source.get("product_name", ""),
                description=source.get("description", ""),
                price=Decimal(str(price)),
                category=category,
                brand=source.get("brand", ""),
                image_url=source.get("image_url", ""),
                stock=int(source.get("stock", 0)),
                status=source.get("status", "active"),
                view_count=int(source.get("view_count", 0)),
                rating=float(average_rating),
                review_count=int(total_reviews),
                created_at=source.get("created_at", "2025-01-01T00:00:00"),
                updated_at=source.get("updated_at", "2025-01-01T00:00:00")
            )
            
        except Exception as e:
            logger.error(f"Error converting OpenSearch result to Product: {e}")
            logger.error(f"Result data: {opensearch_result}")
            return None

    def _get_total_count(self, search_params: ProductSearch) -> int:
        """검색 결과 총 개수 조회"""
        try:
            if not self.opensearch_client:
                return 0
                
            # count 쿼리 생성 (페이징 제외)
            count_query = self._build_search_query(search_params, 1, 1)
            count_query.pop("from", None)
            count_query.pop("size", None)
            count_query.pop("sort", None)
            
            # OpenSearch count API 사용
            result = self.opensearch_client.client.count(
                index="products",
                body=count_query
            )
            
            return result.get("count", 0)
            
        except Exception as e:
            logger.error(f"Error getting total count: {e}")
            return 0

    async def get_product_stats(self) -> ProductStats:
        """상품 통계 조회"""
        return ProductStats(
            total_products=0,
            total_categories=0,
            total_brands=0,
            total_views=0,
            average_rating=0.0
        )

    async def increment_view_count(self, product_no: str) -> None:
        """조회수 증가"""
        logger.info(f"Incrementing view count for product: {product_no}")
        pass 

    async def find_similar_products(self, product_no: str, size: int = 10) -> ProductList:
        """콘텐츠 기반 유사 상품 검색"""
        try:
            if not self.opensearch_client:
                logger.warning("OpenSearch client not available")
                return ProductList(items=[], total=0, page=1, size=size, total_pages=0)

            # 기준 상품 정보 조회
            base_product_query = {
                "query": {
                    "term": {
                        "product_no": product_no
                    }
                },
                "size": 1
            }
            
            base_results = self.opensearch_client.search("products", base_product_query)
            if not base_results:
                logger.warning(f"Base product not found: {product_no}")
                return ProductList(items=[], total=0, page=1, size=size, total_pages=0)
                
            base_product = base_results[0]
            
            # More Like This 쿼리 구성
            mlt_query = {
                "query": {
                    "more_like_this": {
                        "fields": ["product_name", "description", "brand", "category.category_name"],
                        "like": [
                            {
                                "_index": "products",
                                "_id": base_product.get("_id")
                            }
                        ],
                        "min_term_freq": 1,
                        "max_query_terms": 25,
                        "min_doc_freq": 1,
                        "minimum_should_match": "20%"
                    }
                },
                "size": size,
                "_source": True
            }
            
            # 기준 상품 제외 필터 추가
            mlt_query["query"] = {
                "bool": {
                    "must": [mlt_query["query"]],
                    "must_not": [
                        {
                            "term": {
                                "product_no": product_no
                            }
                        }
                    ]
                }
            }
            
            logger.info(f"More Like This query for product {product_no}: {mlt_query}")
            
            # 검색 실행
            similar_results = self.opensearch_client.search("products", mlt_query)
            
            # 결과를 Product 스키마로 변환
            products = []
            for result in similar_results:
                try:
                    product = self._convert_to_product_schema(result)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.warning(f"Failed to convert similar product: {e}")
                    continue
            
            logger.info(f"Found {len(products)} similar products for {product_no}")
            
            return ProductList(
                items=products,
                total=len(products),
                page=1,
                size=size,
                total_pages=1
            )
            
        except Exception as e:
            logger.error(f"Error finding similar products for {product_no}: {e}")
            return ProductList(items=[], total=0, page=1, size=size, total_pages=0)

    async def search_by_content(self, content: str, size: int = 10) -> ProductList:
        """콘텐츠 기반 검색 (텍스트 입력으로 유사 상품 찾기)"""
        try:
            if not self.opensearch_client:
                logger.warning("OpenSearch client not available")
                return ProductList(items=[], total=0, page=1, size=size, total_pages=0)

            # More Like This 쿼리 (텍스트 기반)
            mlt_query = {
                "query": {
                    "more_like_this": {
                        "fields": ["product_name^3", "description^2", "brand", "category.category_name"],
                        "like": content,
                        "min_term_freq": 1,
                        "max_query_terms": 20,
                        "min_doc_freq": 1,
                        "minimum_should_match": "20%",
                        "boost_terms": 2.0,
                        "include": True
                    }
                },
                "size": size,
                "_source": True,
                "sort": [
                    {"_score": {"order": "desc"}},
                    {"statistics.average_rating": {"order": "desc"}}
                ]
            }
            
            logger.info(f"Content-based search query: {mlt_query}")
            
            # 검색 실행
            search_results = self.opensearch_client.search("products", mlt_query)
            
            # 결과를 Product 스키마로 변환
            products = []
            for result in search_results:
                try:
                    product = self._convert_to_product_schema(result)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.warning(f"Failed to convert search result: {e}")
                    continue
            
            logger.info(f"Content-based search found {len(products)} products")
            
            return ProductList(
                items=products,
                total=len(products),
                page=1,
                size=size,
                total_pages=1
            )
            
        except Exception as e:
            logger.error(f"Error in content-based search: {e}")
            return ProductList(items=[], total=0, page=1, size=size, total_pages=0) 