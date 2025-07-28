# LangChain RAG 시스템 설정 가이드

## 🚀 개요

이 시스템은 **LangChain + Vertex AI + OpenSearch**를 활용한 고급 RAG(Retrieval-Augmented Generation) 기능을 제공합니다.

## 📋 주요 기능

### 1. **상품 질문-답변 (Product Q&A)**
- 리뷰 데이터를 기반으로 한 자연어 질문 처리
- 맥락을 이해하는 지능형 답변 생성
- 특정 상품 또는 일반적인 질문 모두 지원

### 2. **AI 상품 요약 (Product Summary)**
- 리뷰 데이터 분석을 통한 종합 요약
- 장점/단점, 추천 대상, 주의사항 자동 생성
- 구조화된 요약 형식 제공

### 3. **대화형 상품 추천 (Conversational Recommendation)**
- 자연어 대화를 통한 개인화 추천
- 사용자 니즈 자동 분석
- 맥락을 고려한 맞춤형 제안

### 4. **지능형 검색 에이전트 (Smart Search Agent)**
- 사용자 의도 자동 분석
- 최적 검색 전략 결정
- 다중 액션 실행

## ⚙️ 환경 설정

### 1. **Google Cloud 설정**

```bash
# 1. Google Cloud 프로젝트 생성
# 2. Vertex AI API 활성화
# 3. 서비스 계정 생성 및 키 다운로드
```

### 2. **환경 변수 설정**

`config/development.env`에 다음 변수들을 추가:

```env
# Vertex AI 설정
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
VERTEX_EMBEDDING_MODEL=text-multilingual-embedding-002
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# LangChain 설정
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-key  # 선택사항
```

### 3. **서비스 계정 키 설정**

```bash
# Docker 컨테이너에서 접근 가능한 위치에 키 파일 배치
cp your-service-account-key.json ./config/vertex_key.json

# 환경 변수 업데이트
GOOGLE_APPLICATION_CREDENTIALS=/app/config/vertex_key.json
```

## 🔧 패키지 설치

필요한 패키지들이 `requirements.txt`에 추가되었습니다:

```
langchain>=0.1.0
langchain-google-vertexai>=0.1.0
langchain-community>=0.0.10
langchain-core>=0.1.0
google-cloud-aiplatform>=1.38.0
google-auth>=2.25.0
```

## 🚀 시스템 시작

```bash
# 백엔드 재빌드 및 시작
docker-compose build backend
docker-compose up -d backend

# 상태 확인
curl http://localhost:8000/api/v1/rag/capabilities
```

## 📡 API 엔드포인트

### 1. **상품 질문-답변**

```bash
curl -X POST "http://localhost:8000/api/v1/rag/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "이 노트북의 게이밍 성능은 어떤가요?",
    "product_id": "12345"
  }'
```

### 2. **상품 요약 생성**

```bash
curl "http://localhost:8000/api/v1/rag/summary/12345"
```

### 3. **대화형 추천**

```bash
curl -X POST "http://localhost:8000/api/v1/rag/recommend-by-conversation" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": "대학생이고 예산이 100만원 정도인데 노트북 추천해주세요"
  }'
```

### 4. **지능형 검색**

```bash
curl -X POST "http://localhost:8000/api/v1/rag/smart-search" \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "게이밍용 의자 비교해서 추천해주세요"
  }'
```

### 5. **일괄 상품 분석**

```bash
curl -X POST "http://localhost:8000/api/v1/rag/batch-analysis" \
  -H "Content-Type: application/json" \
  -d '["12345", "67890", "11111"]'
```

## 🏗️ 아키텍처

```
사용자 입력
    ↓
LangChain RAG Service
    ↓
┌─────────────────┬─────────────────┐
│  Vertex AI      │  OpenSearch     │
│  - Gemini Pro   │  - Vector Store │
│  - Embeddings   │  - Keyword Search│
└─────────────────┴─────────────────┘
    ↓
프롬프트 엔지니어링 + 체인 실행
    ↓
구조화된 응답 생성
```

## 🎯 사용 예시

### 상품 질문 예시

**질문**: "이 노트북의 배터리 수명이 어떤가요?"

**응답**:
```json
{
  "question": "이 노트북의 배터리 수명이 어떤가요?",
  "answer": "리뷰 분석 결과, 이 노트북의 배터리 수명은 평균 6-8시간 정도입니다. 대부분의 사용자들이 일반적인 업무용도로는 만족스럽다고 평가했으나, 게이밍이나 동영상 편집 등 고사양 작업 시에는 3-4시간 정도로 단축된다는 의견이 많았습니다...",
  "method": "langchain_rag",
  "product_id": "12345"
}
```

### 대화형 추천 예시

**대화**: "재택근무용 의자를 찾고 있어요. 허리가 안 좋아서 편한 걸로요"

**응답**:
```json
{
  "conversation": "재택근무용 의자를 찾고 있어요...",
  "recommendation": "허리 건강을 고려하신다면 다음 제품들을 추천드립니다:\n\n1순위: 허먼밀러 에어론 체어\n- 이유: 요추 지지력이 뛰어나고 장시간 앉아도 피로감이 적음\n- 리뷰: '허리 디스크 환자도 만족' 등의 긍정적 평가\n\n2순위: 시디즈 T50...",
  "method": "langchain_conversation"
}
```

## 🔄 워크플로우

1. **데이터 수집**: MySQL → OpenSearch 마이그레이션
2. **임베딩 생성**: Vertex AI로 리뷰 텍스트 벡터화
3. **하이브리드 검색**: 키워드 + 의미론적 검색 결합
4. **RAG 실행**: LangChain 체인으로 컨텍스트 + 생성
5. **응답 반환**: 구조화된 JSON 형태로 결과 제공

## 🛠️ 문제 해결

### 1. **Vertex AI 인증 오류**
```bash
# 서비스 계정 권한 확인
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/aiplatform.user"
```

### 2. **OpenSearch 연결 오류**
```bash
# OpenSearch 상태 확인
curl http://localhost:9200/_cluster/health
```

### 3. **임베딩 생성 실패**
- Vertex AI API 사용 한도 확인
- 모델명 정확성 검증
- 네트워크 연결 상태 점검

## 🚀 확장 계획

1. **멀티모달 지원**: 이미지 + 텍스트 분석
2. **개인화 강화**: 사용자 프로필 기반 추천
3. **실시간 학습**: 피드백 기반 모델 개선
4. **다국어 지원**: 다양한 언어 처리
5. **음성 인터페이스**: 음성 질문-답변 지원

## 📊 성능 모니터링

- LangSmith를 통한 체인 실행 추적
- Vertex AI 사용량 모니터링
- OpenSearch 검색 성능 측정
- 사용자 만족도 피드백 수집 