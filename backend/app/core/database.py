from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import settings

# Base 클래스 생성 (다른 모델에서 사용)
Base = declarative_base()

# SQLite용 특별 설정
if settings.ENVIRONMENT == "development":
    # SQLite 설정
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLite용 설정
        poolclass=StaticPool,
        echo=settings.ENVIRONMENT == "development",
    )
else:
    # MySQL 설정
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=20,
        max_overflow=0,
        echo=settings.ENVIRONMENT == "development",
    )

# 세션 로컬 클래스 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 데이터베이스 세션 의존성
def get_db():
    """데이터베이스 세션을 생성하고 반환하는 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 데이터베이스 초기화 함수
def init_db():
    """데이터베이스 테이블을 생성하는 함수"""
    # 모든 모델을 import해야 테이블이 생성됨
    from app.models import User
    Base.metadata.create_all(bind=engine)
    print(f"Database URL: {settings.DATABASE_URL}")
    print("Database tables created successfully!") 