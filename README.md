# Commerce Recommendation System

> 🛍️ OpenSearch 기반 E-commerce 추천 시스템

## 📋 프로젝트 개요

이 프로젝트는 현대적인 기술 스택을 사용하여 구축된 전문적인 전자상거래 추천 시스템입니다. 
머신러닝 알고리즘과 OpenSearch를 활용하여 개인화된 상품 추천을 제공합니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │ Recommendation  │
│   React + TS    │◄──►│   FastAPI       │◄──►│   Engine        │
│   Tailwind CSS  │    │   Pydantic      │    │   ML Models     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
         ┌─────────────┐                 ┌─────────────┐
         │  OpenSearch │                 │    Redis    │
         │   Search &  │                 │   Caching   │
         │  Analytics  │                 │             │
         └─────────────┘                 └─────────────┘
                                                │
                                       ┌─────────────┐
                                       │   MySQL     │
                                       │  Database   │
                                       └─────────────┘
```

## 🛠️ 기술 스택

### Frontend
- **React 18** - 모던 UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Vite** - 빠른 개발 환경
- **React Router** - 라우팅

### Backend
- **FastAPI** - 고성능 웹 프레임워크
- **Pydantic** - 데이터 검증 및 직렬화
- **OpenSearch** - 검색 및 분석 엔진
- **Redis** - 캐싱 및 세션 관리
- **MySQL** - 관계형 데이터베이스
- **SQLAlchemy** - ORM

### ML Engine
- **Python** - 머신러닝 언어
- **Scikit-learn** - 전통적인 ML 알고리즘
- **TensorFlow** - 딥러닝 모델
- **OpenSearch** - 벡터 검색 및 유사도 계산

### Infrastructure
- **Docker** - 컨테이너화
- **Docker Compose** - 멀티 컨테이너 관리
- **Nginx** - 리버스 프록시

## 📁 프로젝트 구조

```
commerce-recommendation/
├── 📱 frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── pages/                 # 페이지 컴포넌트
│   │   ├── hooks/                 # 커스텀 훅
│   │   ├── services/              # API 서비스
│   │   └── types/                 # TypeScript 타입
│   └── package.json
├── 🚀 backend/                     # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/endpoints/      # API 엔드포인트
│   │   ├── core/                  # 핵심 설정
│   │   ├── models/                # 데이터 모델
│   │   ├── schemas/               # Pydantic 스키마
│   │   └── services/              # 비즈니스 로직
│   └── requirements.txt
├── 🤖 recommendation-engine/       # ML 추천 엔진
│   ├── src/
│   │   ├── models/                # 머신러닝 모델
│   │   ├── opensearch/            # OpenSearch 연동
│   │   ├── training/              # 모델 학습
│   │   └── serving/               # 모델 서빙
│   └── requirements.txt
├── 🐳 docker-compose.yml          # 컨테이너 설정
├── 📋 scripts/setup-dev.sh        # 개발 환경 설정
├── ⚙️ config/development.env      # 환경 설정
└── 📖 README.md                   # 프로젝트 문서
```

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd commerce-recommendation
```

### 2. 개발 환경 설정

```bash
# 설정 스크립트 실행 권한 부여
chmod +x scripts/setup-dev.sh

# 개발 환경 자동 설정
./scripts/setup-dev.sh
```

### 3. 서비스 실행

#### 옵션 1: Docker Compose (권장)
```bash
# 전체 서비스 시작
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 특정 서비스만 시작
docker-compose up opensearch redis mysql
```

#### 옵션 2: 로컬 개발
```bash
# 인프라 서비스 시작
docker-compose up -d opensearch redis mysql

# Frontend 개발 서버
cd frontend
npm run dev

# Backend 개발 서버
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Recommendation Engine 개발 서버
cd recommendation-engine
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload
```

## 🌐 서비스 URL

| 서비스 | URL | 설명 |
|--------|-----|------|
| Frontend | http://localhost:3000 | 사용자 인터페이스 |
| Backend API | http://localhost:8000 | REST API 서버 |
| Recommendation Engine | http://localhost:8001 | ML 추천 엔진 |
| OpenSearch | http://localhost:9200 | 검색 엔진 |
| OpenSearch Dashboards | http://localhost:5601 | 검색 대시보드 |
| Redis | localhost:6379 | 캐시 서버 |
| MySQL | localhost:3306 | 데이터베이스 |

## 🔧 개발 가이드

### API 문서
- Backend API: http://localhost:8000/docs
- Recommendation Engine API: http://localhost:8001/docs

### 데이터베이스 관리
```bash
# 데이터베이스 마이그레이션
cd backend
alembic upgrade head

# 새로운 마이그레이션 생성
alembic revision --autogenerate -m "Add new table"
```

### 추천 모델 학습
```bash
# 협업 필터링 모델 학습
curl -X POST "http://localhost:8001/train" \
  -H "Content-Type: application/json" \
  -d '{"model_type": "collaborative_filtering"}'

# 컨텐츠 기반 모델 학습
curl -X POST "http://localhost:8001/train" \
  -H "Content-Type: application/json" \
  -d '{"model_type": "content_based"}'
```

## 📊 추천 알고리즘

### 1. 협업 필터링 (Collaborative Filtering)
- 사용자의 과거 행동 패턴 분석
- 유사한 사용자의 선호도 기반 추천
- Matrix Factorization 기법 활용

### 2. 컨텐츠 기반 필터링 (Content-Based Filtering)
- 상품의 속성과 특성 분석
- 사용자가 선호한 상품과 유사한 상품 추천
- TF-IDF 및 코사인 유사도 활용

### 3. 하이브리드 추천 (Hybrid Recommendation)
- 협업 필터링과 컨텐츠 기반 필터링 결합
- 각 방법의 장점을 활용한 정확도 향상
- 가중치 기반 점수 계산

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pytest tests/

# 커버리지 포함 테스트
pytest --cov=app tests/
```

### Frontend 테스트
```bash
cd frontend
npm test

# 통합 테스트
npm run test:e2e
```

## 📈 모니터링 및 성능

### 메트릭 수집
- API 응답 시간
- 추천 정확도
- 사용자 참여도
- 시스템 리소스 사용량

### 성능 최적화
- Redis 캐싱 전략
- OpenSearch 인덱스 최적화
- 데이터베이스 쿼리 최적화
- 프론트엔드 코드 분할

## 🔐 보안

### 인증 및 권한
- JWT 토큰 기반 인증
- Role-based Access Control
- API 요청 제한

### 데이터 보안
- 개인정보 암호화
- SQL Injection 방지
- XSS 공격 방어

## 📝 API 사용 예시

### 상품 조회
```bash
curl -X GET "http://localhost:8000/api/v1/products?page=1&size=10"
```

### 개인화 추천
```bash
curl -X POST "http://localhost:8001/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "num_recommendations": 10,
    "recommendation_type": "hybrid"
  }'
```

### 유사 상품 추천
```bash
curl -X POST "http://localhost:8001/recommend/similar-products" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product456",
    "num_recommendations": 5
  }'
```

## 🚨 문제 해결

### 일반적인 문제

1. **서비스 시작 실패**
   ```bash
   # 포트 충돌 확인
   lsof -i :8000
   
   # 컨테이너 상태 확인
   docker-compose ps
   
   # 로그 확인
   docker-compose logs [서비스명]
   ```

2. **데이터베이스 연결 실패**
   ```bash
   # MySQL 컨테이너 재시작
   docker-compose restart mysql
   
   # 연결 테스트
   docker exec -it mysql mysql -u root -p
   ```

3. **OpenSearch 연결 실패**
   ```bash
   # OpenSearch 상태 확인
   curl http://localhost:9200/_cluster/health
   
   # 인덱스 확인
   curl http://localhost:9200/_cat/indices
   ```

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 팀

- **Backend Developer** - FastAPI, OpenSearch, ML
- **Frontend Developer** - React, TypeScript, UI/UX
- **Data Scientist** - 추천 알고리즘, 모델 최적화
- **DevOps Engineer** - Docker, 배포, 모니터링

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들에 기반하여 개발되었습니다:
- [OpenSearch](https://opensearch.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [TensorFlow](https://tensorflow.org/)
- [Docker](https://docker.com/)

---

📧 문의사항이 있으시면 언제든지 연락주세요! 