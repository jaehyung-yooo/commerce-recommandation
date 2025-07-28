# OpenSearch 마이그레이션 가이드

이 가이드는 MySQL 데이터베이스에 있는 데이터를 OpenSearch로 마이그레이션하는 방법을 설명합니다.

## 사전 준비사항

### 1. 환경 변수 설정

환경 변수가 올바르게 설정되어 있는지 확인하세요:

```bash
# MySQL 설정
export MYSQL_SERVER=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DB=commerce_recommendation
export MYSQL_PORT=3306

# OpenSearch 설정
export OPENSEARCH_HOST=localhost
export OPENSEARCH_PORT=9200
export OPENSEARCH_USERNAME=admin
export OPENSEARCH_PASSWORD=admin
export OPENSEARCH_USE_SSL=false
export OPENSEARCH_VERIFY_CERTS=false
```

또는 `config/development.env` 파일에 설정할 수 있습니다.

### 2. 필요한 패키지 설치

```bash
cd backend
pip install mysql-connector-python
```

### 3. OpenSearch 실행 확인

OpenSearch가 실행 중인지 확인하세요:

```bash
curl -X GET "localhost:9200/_cluster/health?pretty"
```

## 마이그레이션 실행

### 1단계: OpenSearch 환경 설정

먼저 OpenSearch 환경을 설정합니다:

```bash
cd backend/scripts

# 클러스터 상태 확인
python opensearch_setup.py --health

# OpenSearch 환경 설정 (인덱스 템플릿 등)
python opensearch_setup.py --setup
```

### 2단계: 데이터 마이그레이션

MySQL 데이터를 OpenSearch로 마이그레이션합니다:

```bash
# 전체 데이터 마이그레이션 (상품 + 리뷰)
python opensearch_migration.py

# 상품 데이터만 마이그레이션
python opensearch_migration.py --products-only

# 리뷰 데이터만 마이그레이션
python opensearch_migration.py --reviews-only

# 배치 사이즈 조정 (기본값: 1000)
python opensearch_migration.py --batch-size 500
```

### 3단계: 마이그레이션 확인

인덱스가 올바르게 생성되었는지 확인합니다:

```bash
# 인덱스 목록 확인
python opensearch_setup.py --list

# OpenSearch에서 직접 확인
curl -X GET "localhost:9200/_cat/indices?v"
curl -X GET "localhost:9200/products/_count"
curl -X GET "localhost:9200/reviews/_count"
```

## 생성되는 인덱스

### products 인덱스
- 상품 정보 (이름, 설명, 가격, 브랜드 등)
- 카테고리 정보 (계층 구조 포함)
- 상품 통계 (리뷰 수, 평점 등)
- 자동완성 기능을 위한 suggest 필드

### reviews 인덱스
- 리뷰 정보 (텍스트, 평점, 날짜 등)
- 감정 분석 결과 (positive/negative/neutral)
- 상품명 정보 (검색 최적화)

## 검색 테스트

마이그레이션 후 검색이 정상적으로 작동하는지 테스트해보세요:

```bash
# 상품 검색
curl -X POST "localhost:9200/products/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "multi_match": {
      "query": "삼성",
      "fields": ["product_name", "brand", "description"]
    }
  },
  "size": 5
}'

# 리뷰 검색
curl -X POST "localhost:9200/reviews/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "review_text": "좋아요"
    }
  },
  "size": 5
}'

# 카테고리 필터링
curl -X POST "localhost:9200/products/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        {"match": {"product_name": "스마트폰"}},
        {"term": {"category.category_name.keyword": "휴대폰"}}
      ]
    }
  }
}'
```

## 문제 해결

### 1. 연결 오류

OpenSearch나 MySQL 연결에 문제가 있는 경우:

```bash
# OpenSearch 연결 확인
python opensearch_setup.py --health

# 환경 변수 확인
echo $OPENSEARCH_HOST
echo $MYSQL_SERVER
```

### 2. 인덱스 초기화

마이그레이션을 다시 실행하려면 인덱스를 초기화하세요:

```bash
# 모든 commerce 관련 인덱스 삭제
python opensearch_setup.py --reset

# 특정 인덱스만 삭제
python opensearch_setup.py --delete products
python opensearch_setup.py --delete reviews
```

### 3. 메모리 부족

대용량 데이터 마이그레이션 시 메모리 부족이 발생하면:

```bash
# 배치 사이즈를 줄여서 실행
python opensearch_migration.py --batch-size 100
```

### 4. 인덱싱 속도 향상

마이그레이션 속도를 높이려면:

1. OpenSearch 설정에서 `refresh_interval`을 늘리기
2. `number_of_replicas`를 0으로 설정 (이미 적용됨)
3. 더 작은 배치 사이즈 사용

## 모니터링

마이그레이션 진행 상황은 로그를 통해 확인할 수 있습니다:

```bash
# 실시간 로그 확인
tail -f logs/migration.log

# OpenSearch 클러스터 통계
curl -X GET "localhost:9200/_cluster/stats?pretty"

# 인덱스별 통계
curl -X GET "localhost:9200/_stats?pretty"
```

## 성능 최적화

### 검색 성능 향상

1. **적절한 필드 타입 사용**: 키워드 검색은 `keyword` 타입, 전문 검색은 `text` 타입
2. **한국어 분석기 활용**: `korean_analyzer`를 사용하여 한국어 토큰화
3. **인덱스 별칭 사용**: 무중단 재인덱싱을 위한 별칭 활용

### 저장 공간 최적화

1. **불필요한 필드 제외**: 검색에 사용하지 않는 필드는 `"index": false` 설정
2. **압축 활용**: OpenSearch 내장 압축 기능 사용
3. **적절한 샤드 수**: 데이터 크기에 맞는 샤드 수 설정

이 가이드를 따라하면 MySQL 데이터를 성공적으로 OpenSearch로 마이그레이션할 수 있습니다. 