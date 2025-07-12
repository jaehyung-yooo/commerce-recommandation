from opensearchpy import OpenSearch
from typing import Optional, Dict, Any, List
import json
from app.core.config import settings
from loguru import logger

class OpenSearchClient:
    """OpenSearch 클라이언트 래퍼 클래스"""
    
    def __init__(self):
        self.client = None
        self.connect()
    
    def connect(self):
        """OpenSearch 서버에 연결"""
        try:
            self.client = OpenSearch(
                hosts=[{
                    'host': settings.OPENSEARCH_HOST,
                    'port': settings.OPENSEARCH_PORT
                }],
                http_auth=(settings.OPENSEARCH_USERNAME, settings.OPENSEARCH_PASSWORD),
                use_ssl=settings.OPENSEARCH_USE_SSL,
                verify_certs=settings.OPENSEARCH_VERIFY_CERTS,
                ssl_show_warn=False,
                timeout=30,
                max_retries=3,
                retry_on_timeout=True,
            )
            
            # 연결 테스트
            info = self.client.info()
            logger.info(f"OpenSearch connected successfully: {info['version']['number']}")
        except Exception as e:
            logger.error(f"Failed to connect to OpenSearch: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """OpenSearch 연결 상태 확인"""
        try:
            if self.client:
                self.client.info()
                return True
        except:
            pass
        return False
    
    def create_index(self, index_name: str, mapping: Dict[str, Any]) -> bool:
        """인덱스 생성"""
        try:
            if not self.client:
                return False
            
            if self.client.indices.exists(index=index_name):
                logger.info(f"Index {index_name} already exists")
                return True
            
            response = self.client.indices.create(
                index=index_name,
                body=mapping
            )
            logger.info(f"Index {index_name} created successfully")
            return response.get('acknowledged', False)
        except Exception as e:
            logger.error(f"Failed to create index {index_name}: {e}")
            return False
    
    def delete_index(self, index_name: str) -> bool:
        """인덱스 삭제"""
        try:
            if not self.client:
                return False
            
            if not self.client.indices.exists(index=index_name):
                logger.info(f"Index {index_name} does not exist")
                return True
            
            response = self.client.indices.delete(index=index_name)
            logger.info(f"Index {index_name} deleted successfully")
            return response.get('acknowledged', False)
        except Exception as e:
            logger.error(f"Failed to delete index {index_name}: {e}")
            return False
    
    def index_document(self, index_name: str, document: Dict[str, Any], doc_id: Optional[str] = None) -> Optional[str]:
        """문서 인덱싱"""
        try:
            if not self.client:
                return None
            
            response = self.client.index(
                index=index_name,
                body=document,
                id=doc_id,
                refresh=True
            )
            return response.get('_id')
        except Exception as e:
            logger.error(f"Failed to index document in {index_name}: {e}")
            return None
    
    def get_document(self, index_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """문서 조회"""
        try:
            if not self.client:
                return None
            
            response = self.client.get(index=index_name, id=doc_id)
            return response.get('_source')
        except Exception as e:
            logger.error(f"Failed to get document {doc_id} from {index_name}: {e}")
            return None
    
    def search(self, index_name: str, query: Dict[str, Any], size: int = 10) -> List[Dict[str, Any]]:
        """문서 검색"""
        try:
            if not self.client:
                return []
            
            response = self.client.search(
                index=index_name,
                body=query,
                size=size
            )
            
            results = []
            for hit in response.get('hits', {}).get('hits', []):
                doc = hit.get('_source', {})
                doc['_id'] = hit.get('_id')
                doc['_score'] = hit.get('_score')
                results.append(doc)
            
            return results
        except Exception as e:
            logger.error(f"Failed to search in {index_name}: {e}")
            return []
    
    def update_document(self, index_name: str, doc_id: str, document: Dict[str, Any]) -> bool:
        """문서 업데이트"""
        try:
            if not self.client:
                return False
            
            response = self.client.update(
                index=index_name,
                id=doc_id,
                body={"doc": document},
                refresh=True
            )
            return response.get('result') == 'updated'
        except Exception as e:
            logger.error(f"Failed to update document {doc_id} in {index_name}: {e}")
            return False
    
    def delete_document(self, index_name: str, doc_id: str) -> bool:
        """문서 삭제"""
        try:
            if not self.client:
                return False
            
            response = self.client.delete(
                index=index_name,
                id=doc_id,
                refresh=True
            )
            return response.get('result') == 'deleted'
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id} from {index_name}: {e}")
            return False
    
    def bulk_index(self, index_name: str, documents: List[Dict[str, Any]]) -> bool:
        """대량 문서 인덱싱"""
        try:
            if not self.client:
                return False
            
            actions = []
            for doc in documents:
                doc_id = doc.pop('_id', None)
                action = {
                    "_index": index_name,
                    "_source": doc
                }
                if doc_id:
                    action["_id"] = doc_id
                actions.append(action)
            
            response = self.client.bulk(body=actions, refresh=True)
            return not response.get('errors', False)
        except Exception as e:
            logger.error(f"Failed to bulk index documents in {index_name}: {e}")
            return False

# 전역 OpenSearch 클라이언트 인스턴스
opensearch_client = OpenSearchClient()

def get_opensearch_client() -> OpenSearchClient:
    """OpenSearch 클라이언트 인스턴스 반환"""
    return opensearch_client 