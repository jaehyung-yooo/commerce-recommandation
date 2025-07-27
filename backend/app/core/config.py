from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional, List
import os

class Settings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # 정의되지 않은 환경변수 무시
    )
    # API 설정
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Commerce Recommendation API"
    
    # 데이터베이스 설정
    MYSQL_SERVER: str = os.getenv("MYSQL_SERVER", "localhost")
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "password")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "commerce_recommendation")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    
    # 환경 설정
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    @property
    def DATABASE_URL(self) -> str:
        if self.ENVIRONMENT == "development":
            # 개발 환경에서는 SQLite 사용
            return "sqlite:///./commerce_recommendation.db"
        else:
            # 운영 환경에서는 MySQL 사용
            return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
    
    # OpenSearch 설정
    OPENSEARCH_HOST: str = os.getenv("OPENSEARCH_HOST", "localhost")
    OPENSEARCH_PORT: int = int(os.getenv("OPENSEARCH_PORT", "9200"))
    OPENSEARCH_USERNAME: str = os.getenv("OPENSEARCH_USERNAME", "admin")
    OPENSEARCH_PASSWORD: str = os.getenv("OPENSEARCH_PASSWORD", "admin")
    OPENSEARCH_USE_SSL: bool = os.getenv("OPENSEARCH_USE_SSL", "false").lower() == "true"
    OPENSEARCH_VERIFY_CERTS: bool = os.getenv("OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"
    
    # Redis 설정
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    
    # JWT 설정
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 설정
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://localhost:8000",
        "http://localhost:5173",  # Vite 개발 서버
    ]
    
    # 추천 엔진 설정
    RECOMMENDATION_ENGINE_HOST: str = os.getenv("RECOMMENDATION_ENGINE_HOST", "localhost")
    RECOMMENDATION_ENGINE_PORT: int = int(os.getenv("RECOMMENDATION_ENGINE_PORT", "8001"))
    
    # 페이지네이션 설정
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # 로깅 설정
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings() 