# 리뷰 임베딩 배치 생성 가이드

## 🎯 개요

이 스크립트는 MySQL의 리뷰 데이터를 **Vertex AI text-multilingual-embedding-002** 모델을 사용하여 임베딩으로 변환하고, OpenSearch에 저장하는 배치 처리 도구입니다.

## 📋 주요 기능

- ✅ **배치 처리**: 대량 리뷰 데이터 효율적 처리
- ✅ **체크포인트**: 중단된 지점부터 재시작 가능
- ✅ **진행상황 모니터링**: 실시간 진행률 및 예상 완료 시간
- ✅ **오류 처리**: 실패한 임베딩 재시도 및 통계
- ✅ **로깅**: 상세한 실행 로그 및 디버깅 정보

## 🛠️ 사전 준비

### 1. **환경 변수 설정**

`config/development.env` 파일에 다음 설정이 필요합니다:

```env
# Google Cloud Vertex AI
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1  
VERTEX_EMBEDDING_MODEL=text-multilingual-embedding-002
GOOGLE_APPLICATION_CREDENTIALS=/app/config/vertex_key.json

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=commerce_db
```

### 2. **Vertex AI 키 파일**

`config/vertex_key.json` 파일이 있어야 합니다.

### 3. **필수 패키지**

```bash
pip install google-cloud-aiplatform google-auth opensearch-py mysql-connector-python loguru python-dotenv
```

## 🚀 실행 방법

### **방법 1: 쉘 스크립트 사용 (권장)**

```bash
# 스크립트 실행 권한 부여
chmod +x backend/scripts/run_review_embedding.sh

# 테스트 모드 (100개 리뷰)
./backend/scripts/run_review_embedding.sh --test

# 소규모 모드 (1,000개 리뷰)
./backend/scripts/run_review_embedding.sh --small

# 중간 모드 (10,000개 리뷰)
./backend/scripts/run_review_embedding.sh --medium

# 전체 모드 (모든 리뷰)
./backend/scripts/run_review_embedding.sh --full

# 체크포인트에서 재시작
./backend/scripts/run_review_embedding.sh --resume

# 커스텀 배치 사이즈
./backend/scripts/run_review_embedding.sh --small --batch-size 100 --embedding-batch 10
```

### **방법 2: Python 직접 실행**

```bash
cd backend/scripts

# 기본 실행
python3 review_embedding_batch.py

# 옵션 포함 실행
python3 review_embedding_batch.py \
  --max-reviews 1000 \
  --batch-size 50 \
  --embedding-batch-size 5 \
  --resume
```

## ⚙️ 주요 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--test` | 테스트 모드 (100개 리뷰) | - |
| `--small` | 소규모 (1,000개 리뷰) | - |
| `--medium` | 중간 (10,000개 리뷰) | - |
| `--full` | 전체 리뷰 처리 | - |
| `--resume` | 체크포인트에서 재시작 | false |
| `--max-reviews N` | 최대 처리할 리뷰 수 | 전체 |
| `--batch-size N` | MySQL 배치 사이즈 | 50 |
| `--embedding-batch-size N` | Vertex AI 배치 사이즈 | 5 |

## 📊 처리 흐름

```
MySQL 리뷰 데이터 조회
         ↓
텍스트 전처리 (상품명 + 리뷰 내용)
         ↓
Vertex AI 임베딩 생성 (768차원)
         ↓
OpenSearch 인덱스 업데이트
         ↓
진행상황 저장 (체크포인트)
```

## 🔍 모니터링

### **실시간 진행상황**

실행 중에 다음 정보가 표시됩니다:

```
📊 진행상황:
  전체 리뷰: 222,750
  처리 완료: 5,000 (2.2%)
  성공 임베딩: 4,950
  실패 임베딩: 50
  경과 시간: 1,234.5초
  마지막 처리 ID: 12345
  예상 완료 시간: 54,321.0초 후
```

### **로그 파일**

- **실행 로그**: `review_embedding_YYYYMMDD_HHMMSS.log`
- **시스템 로그**: `review_embedding_batch.log`
- **체크포인트**: `review_embedding_checkpoint.json`

## 💾 체크포인트 시스템

### **자동 저장**

- 500개 리뷰마다 체크포인트 자동 저장
- 오류 발생 시 현재 상태 저장
- 프로그램 종료 시 최종 상태 저장

### **재시작**

```bash
# 체크포인트에서 재시작
./run_review_embedding.sh --resume
```

체크포인트 파일 예시:
```json
{
  "total_reviews": 222750,
  "processed_reviews": 5000,
  "successful_embeddings": 4950,
  "failed_embeddings": 50,
  "start_time": "2024-01-15T10:30:00",
  "last_processed_id": 12345
}
```

## 🔧 성능 튜닝

### **배치 사이즈 조정**

```bash
# 더 큰 배치 (빠르지만 메모리 사용량 증가)
--batch-size 100 --embedding-batch 10

# 더 작은 배치 (안정적이지만 느림)
--batch-size 25 --embedding-batch 3
```

### **API 제한 고려사항**

- **Vertex AI 할당량**: 분당 요청 수 제한
- **OpenSearch 성능**: 동시 업데이트 수 제한
- **MySQL 연결**: 장시간 연결 유지

## 📈 예상 처리 시간

| 리뷰 수 | 예상 시간 | 설명 |
|---------|-----------|------|
| 100개 | 2-3분 | 테스트 |
| 1,000개 | 20-30분 | 소규모 |
| 10,000개 | 3-5시간 | 중간 |
| 222,750개 | 24-48시간 | 전체 |

> **주의**: Vertex AI API 할당량과 네트워크 상태에 따라 시간이 달라질 수 있습니다.

## 🚨 오류 해결

### **일반적인 오류**

1. **Vertex AI 인증 실패**
   ```
   해결: config/vertex_key.json 파일 확인
   ```

2. **MySQL 연결 실패**
   ```
   해결: 데이터베이스 서비스 상태 확인
   ```

3. **OpenSearch 연결 실패**
   ```
   해결: OpenSearch 클러스터 상태 확인
   ```

4. **API 할당량 초과**
   ```
   해결: 배치 사이즈 줄이기 또는 대기 시간 증가
   ```

### **디버깅**

```bash
# 상세 로그 확인
tail -f review_embedding_batch.log

# 체크포인트 상태 확인
cat review_embedding_checkpoint.json

# OpenSearch 인덱스 확인
curl "localhost:9200/reviews/_search?q=review_embedding:*&size=0"
```

## 🎯 실행 예시

### **테스트 실행**

```bash
# 권한 부여
chmod +x backend/scripts/run_review_embedding.sh

# 테스트 실행
cd backend/scripts
./run_review_embedding.sh --test
```

예상 출력:
```
[INFO] 환경 변수 확인 중...
[SUCCESS] 환경 변수 확인 완료
[INFO] === 실행 설정 ===
[INFO] 모드: test
[INFO] 최대 리뷰 수: 100
[INFO] MySQL 배치 사이즈: 50
[INFO] Vertex AI 배치 사이즈: 5
[INFO] ==================
[INFO] 리뷰 임베딩 배치 생성을 시작합니다...
[INFO] 실행 명령: python3 review_embedding_batch.py --batch-size 50 --embedding-batch-size 5 --max-reviews 100
```

### **전체 실행**

```bash
# 전체 리뷰 처리 (주의: 매우 오래 걸림)
./run_review_embedding.sh --full

# 확인 메시지 후 실행
위 설정으로 임베딩 생성을 시작하시겠습니까? (y/N): y
```

## 🔄 데이터 검증

실행 완료 후 결과 검증:

```bash
# OpenSearch에서 임베딩 수 확인
curl -X GET "localhost:9200/reviews/_search" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"exists": {"field": "review_embedding"}}, "size": 0}'

# 임베딩 차원 확인 (768이어야 함)
curl -X GET "localhost:9200/reviews/_search" \
  -H 'Content-Type: application/json' \
  -d '{"query": {"exists": {"field": "review_embedding"}}, "size": 1, "_source": ["review_embedding"]}'
```

## 📞 지원

문제가 발생하면:

1. 로그 파일 확인: `review_embedding_batch.log`
2. 체크포인트 파일 확인: `review_embedding_checkpoint.json`
3. 환경 변수 재확인
4. `--test` 모드로 작은 배치 테스트 