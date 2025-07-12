import redis
from typing import Optional, Any
import json
from app.core.config import settings
from loguru import logger

class RedisClient:
    """Redis 클라이언트 래퍼 클래스"""
    
    def __init__(self):
        self.client = None
        self.connect()
    
    def connect(self):
        """Redis 서버에 연결"""
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # 연결 테스트
            self.client.ping()
            logger.info(f"Redis connected successfully to {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """Redis 연결 상태 확인"""
        try:
            if self.client:
                self.client.ping()
                return True
        except:
            pass
        return False
    
    def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        """값을 Redis에 저장"""
        try:
            if not self.client:
                return False
            
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            
            return self.client.set(key, value, ex=ex)
        except Exception as e:
            logger.error(f"Failed to set key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Redis에서 값을 가져오기"""
        try:
            if not self.client:
                return None
            
            value = self.client.get(key)
            if value is None:
                return None
            
            # JSON 파싱 시도
            try:
                return json.loads(value)
            except:
                return value
        except Exception as e:
            logger.error(f"Failed to get key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Redis에서 키 삭제"""
        try:
            if not self.client:
                return False
            
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Failed to delete key {key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """키의 존재 여부 확인"""
        try:
            if not self.client:
                return False
            
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Failed to check key {key}: {e}")
            return False
    
    def expire(self, key: str, seconds: int) -> bool:
        """키의 만료 시간 설정"""
        try:
            if not self.client:
                return False
            
            return self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Failed to set expire for key {key}: {e}")
            return False
    
    def flushdb(self) -> bool:
        """현재 DB의 모든 키 삭제"""
        try:
            if not self.client:
                return False
            
            self.client.flushdb()
            return True
        except Exception as e:
            logger.error(f"Failed to flush db: {e}")
            return False

# 전역 Redis 클라이언트 인스턴스
redis_client = RedisClient()

def get_redis_client() -> RedisClient:
    """Redis 클라이언트 인스턴스 반환"""
    return redis_client 