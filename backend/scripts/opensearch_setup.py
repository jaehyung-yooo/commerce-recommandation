#!/usr/bin/env python3
"""
OpenSearch 환경 설정 및 인덱스 관리 스크립트
"""

import sys
import os
from pathlib import Path

# 백엔드 앱 모듈을 import하기 위해 경로 추가
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from typing import Dict, Any
from loguru import logger
from app.core.opensearch_client import get_opensearch_client


class OpenSearchSetup:
    """OpenSearch 설정 관리 클래스"""
    
    def __init__(self):
        self.opensearch_client = get_opensearch_client()
    
    def create_index_template(self) -> Dict[str, Any]:
        """공통 인덱스 템플릿 정의"""
        return {
            "index_patterns": ["commerce-*"],
            "template": {
                "settings": {
                    "number_of_shards": 1,
                    "number_of_replicas": 0,
                    "index": {
                        "analysis": {
                            "analyzer": {
                                "korean_analyzer": {
                                    "type": "custom",
                                    "tokenizer": "nori_tokenizer",
                                    "filter": [
                                        "lowercase",
                                        "nori_part_of_speech",
                                        "nori_readingform"
                                    ]
                                },
                                "korean_search_analyzer": {
                                    "type": "custom",
                                    "tokenizer": "nori_tokenizer",
                                    "filter": [
                                        "lowercase",
                                        "nori_part_of_speech"
                                    ]
                                }
                            },
                            "tokenizer": {
                                "nori_tokenizer": {
                                    "type": "nori_tokenizer",
                                    "decompound_mode": "mixed"
                                }
                            }
                        }
                    }
                }
            }
        }
    
    def setup_index_templates(self) -> bool:
        """인덱스 템플릿 설정"""
        logger.info("인덱스 템플릿 설정 시작")
        
        try:
            template = self.create_index_template()
            
            # 기존 템플릿 삭제 (있다면)
            template_name = "commerce-template"
            
            # 템플릿 생성/업데이트
            response = self.opensearch_client.client.indices.put_index_template(
                name=template_name,
                body=template
            )
            
            if response.get('acknowledged'):
                logger.info(f"인덱스 템플릿 '{template_name}' 설정 완료")
                return True
            else:
                logger.error("인덱스 템플릿 설정 실패")
                return False
                
        except Exception as e:
            logger.error(f"인덱스 템플릿 설정 중 오류: {e}")
            return False
    
    def create_aliases(self) -> bool:
        """인덱스 별칭 생성"""
        logger.info("인덱스 별칭 생성 시작")
        
        try:
            aliases = {
                "actions": [
                    {
                        "add": {
                            "index": "products",
                            "alias": "commerce-products"
                        }
                    },
                    {
                        "add": {
                            "index": "reviews",
                            "alias": "commerce-reviews"
                        }
                    }
                ]
            }
            
            response = self.opensearch_client.client.indices.update_aliases(body=aliases)
            
            if response.get('acknowledged'):
                logger.info("인덱스 별칭 생성 완료")
                return True
            else:
                logger.error("인덱스 별칭 생성 실패")
                return False
                
        except Exception as e:
            logger.error(f"인덱스 별칭 생성 중 오류: {e}")
            return False
    
    def check_cluster_health(self) -> bool:
        """클러스터 상태 확인"""
        logger.info("OpenSearch 클러스터 상태 확인")
        
        try:
            health = self.opensearch_client.client.cluster.health()
            
            logger.info(f"클러스터 이름: {health.get('cluster_name')}")
            logger.info(f"상태: {health.get('status')}")
            logger.info(f"노드 수: {health.get('number_of_nodes')}")
            logger.info(f"데이터 노드 수: {health.get('number_of_data_nodes')}")
            logger.info(f"활성 샤드: {health.get('active_shards')}")
            logger.info(f"미할당 샤드: {health.get('unassigned_shards')}")
            
            return health.get('status') in ['green', 'yellow']
            
        except Exception as e:
            logger.error(f"클러스터 상태 확인 실패: {e}")
            return False
    
    def list_indices(self) -> bool:
        """인덱스 목록 조회"""
        logger.info("인덱스 목록 조회")
        
        try:
            indices = self.opensearch_client.client.indices.get_alias()
            
            logger.info("현재 인덱스 목록:")
            for index_name, details in indices.items():
                if not index_name.startswith('.'):  # 시스템 인덱스 제외
                    aliases = list(details.get('aliases', {}).keys())
                    alias_str = f" (별칭: {', '.join(aliases)})" if aliases else ""
                    logger.info(f"  - {index_name}{alias_str}")
            
            return True
            
        except Exception as e:
            logger.error(f"인덱스 목록 조회 실패: {e}")
            return False
    
    def delete_indices(self, pattern: str) -> bool:
        """인덱스 삭제 (패턴 매칭)"""
        logger.info(f"인덱스 삭제: {pattern}")
        
        try:
            # 기존 인덱스 확인
            if self.opensearch_client.client.indices.exists(index=pattern):
                response = self.opensearch_client.client.indices.delete(index=pattern)
                if response.get('acknowledged'):
                    logger.info(f"인덱스 '{pattern}' 삭제 완료")
                    return True
                else:
                    logger.error(f"인덱스 '{pattern}' 삭제 실패")
                    return False
            else:
                logger.info(f"인덱스 '{pattern}'가 존재하지 않습니다")
                return True
                
        except Exception as e:
            logger.error(f"인덱스 삭제 중 오류: {e}")
            return False
    
    def setup_opensearch(self) -> bool:
        """OpenSearch 전체 설정"""
        logger.info("🚀 OpenSearch 환경 설정 시작")
        
        # 연결 확인
        if not self.opensearch_client.is_connected():
            logger.error("OpenSearch 연결 실패")
            return False
        
        # 클러스터 상태 확인
        if not self.check_cluster_health():
            logger.error("클러스터 상태 불안정")
            return False
        
        # 인덱스 템플릿 설정
        if not self.setup_index_templates():
            logger.error("인덱스 템플릿 설정 실패")
            return False
        
        logger.info("🎉 OpenSearch 환경 설정 완료!")
        return True
    
    def reset_indices(self) -> bool:
        """모든 commerce 관련 인덱스 초기화"""
        logger.info("🔄 인덱스 초기화 시작")
        
        indices_to_delete = ["products", "reviews", "commerce-*"]
        
        for index_pattern in indices_to_delete:
            self.delete_indices(index_pattern)
        
        logger.info("🎉 인덱스 초기화 완료!")
        return True


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(description="OpenSearch 환경 설정 및 관리")
    parser.add_argument("--setup", action="store_true", help="OpenSearch 환경 설정")
    parser.add_argument("--reset", action="store_true", help="인덱스 초기화")
    parser.add_argument("--list", action="store_true", help="인덱스 목록 조회")
    parser.add_argument("--health", action="store_true", help="클러스터 상태 확인")
    parser.add_argument("--delete", type=str, help="특정 인덱스 삭제")
    
    args = parser.parse_args()
    
    setup = OpenSearchSetup()
    
    if args.setup:
        success = setup.setup_opensearch()
    elif args.reset:
        success = setup.reset_indices()
    elif args.list:
        success = setup.list_indices()
    elif args.health:
        success = setup.check_cluster_health()
    elif args.delete:
        success = setup.delete_indices(args.delete)
    else:
        parser.print_help()
        return 0
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main()) 