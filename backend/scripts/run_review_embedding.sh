#!/bin/bash

# 리뷰 임베딩 배치 생성 스크립트 실행기
# Usage: ./run_review_embedding.sh [options]

set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 도움말 표시
show_help() {
    echo "리뷰 임베딩 배치 생성 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  --test              테스트 모드 (100개 리뷰만 처리)"
    echo "  --small             소규모 모드 (1000개 리뷰만 처리)"
    echo "  --medium            중간 모드 (10000개 리뷰만 처리)"
    echo "  --full              전체 모드 (모든 리뷰 처리)"
    echo "  --resume            체크포인트에서 재시작"
    echo "  --batch-size N      MySQL 배치 사이즈 (기본: 50)"
    echo "  --embedding-batch N Vertex AI 배치 사이즈 (기본: 5)"
    echo "  --help              이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 --test                    # 테스트 실행"
    echo "  $0 --small --resume          # 소규모 모드로 재시작"
    echo "  $0 --full --batch-size 100   # 전체 모드, 큰 배치 사이즈"
}

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

# 기본 설정
MAX_REVIEWS=""
RESUME_FLAG=""
BATCH_SIZE="50"
EMBEDDING_BATCH_SIZE="5"
MODE=""

# 인자 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        --test)
            MAX_REVIEWS="100"
            MODE="test"
            shift
            ;;
        --small)
            MAX_REVIEWS="1000"
            MODE="small"
            shift
            ;;
        --medium)
            MAX_REVIEWS="10000"
            MODE="medium"
            shift
            ;;
        --full)
            MAX_REVIEWS=""
            MODE="full"
            shift
            ;;
        --resume)
            RESUME_FLAG="--resume"
            shift
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --embedding-batch)
            EMBEDDING_BATCH_SIZE="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "알 수 없는 옵션: $1"
            show_help
            exit 1
            ;;
    esac
done

# 기본 모드 설정
if [ -z "$MODE" ]; then
    MODE="test"
    MAX_REVIEWS="100"
    log_warning "모드가 지정되지 않았습니다. 테스트 모드로 실행합니다."
fi

# 환경 변수 확인
log_info "환경 변수 확인 중..."

ENV_FILE="../../config/development.env"
if [ ! -f "$ENV_FILE" ]; then
    log_error "환경 파일을 찾을 수 없습니다: $ENV_FILE"
    exit 1
fi

# 필수 환경 변수 확인
source "$ENV_FILE"

if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    log_error "GOOGLE_CLOUD_PROJECT_ID가 설정되지 않았습니다."
    exit 1
fi

if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    log_error "GOOGLE_APPLICATION_CREDENTIALS가 설정되지 않았습니다."
    exit 1
fi

# 키 파일 존재 확인
KEY_FILE="../../config/vertex_key.json"
if [ ! -f "$KEY_FILE" ]; then
    log_error "Vertex AI 키 파일을 찾을 수 없습니다: $KEY_FILE"
    log_error "config/vertex_key.json 파일이 존재하는지 확인하세요."
    exit 1
fi

log_success "환경 변수 확인 완료"

# 실행 설정 출력
log_info "=== 실행 설정 ==="
log_info "모드: $MODE"
if [ -n "$MAX_REVIEWS" ]; then
    log_info "최대 리뷰 수: $MAX_REVIEWS"
else
    log_info "최대 리뷰 수: 전체"
fi
log_info "MySQL 배치 사이즈: $BATCH_SIZE"
log_info "Vertex AI 배치 사이즈: $EMBEDDING_BATCH_SIZE"
if [ -n "$RESUME_FLAG" ]; then
    log_info "재시작 모드: 활성화"
fi
log_info "==================="

# 확인 요청 (테스트 모드가 아닌 경우)
if [ "$MODE" != "test" ]; then
    echo ""
    read -p "위 설정으로 임베딩 생성을 시작하시겠습니까? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "실행이 취소되었습니다."
        exit 0
    fi
fi

# Python 스크립트 실행
log_info "리뷰 임베딩 배치 생성을 시작합니다..."

PYTHON_CMD="python3 review_embedding_batch.py"
PYTHON_CMD="$PYTHON_CMD --batch-size $BATCH_SIZE"
PYTHON_CMD="$PYTHON_CMD --embedding-batch-size $EMBEDDING_BATCH_SIZE"

if [ -n "$MAX_REVIEWS" ]; then
    PYTHON_CMD="$PYTHON_CMD --max-reviews $MAX_REVIEWS"
fi

if [ -n "$RESUME_FLAG" ]; then
    PYTHON_CMD="$PYTHON_CMD $RESUME_FLAG"
fi

# 로그 파일명 생성
LOG_FILE="review_embedding_$(date +%Y%m%d_%H%M%S).log"

log_info "실행 명령: $PYTHON_CMD"
log_info "로그 파일: $LOG_FILE"

# 실행
if $PYTHON_CMD 2>&1 | tee "$LOG_FILE"; then
    log_success "🎉 리뷰 임베딩 생성이 완료되었습니다!"
    log_info "로그 파일: $LOG_FILE"
    
    # 체크포인트 파일 확인
    if [ -f "review_embedding_checkpoint.json" ]; then
        log_info "체크포인트 파일이 생성되었습니다: review_embedding_checkpoint.json"
    fi
    
else
    log_error "❌ 리뷰 임베딩 생성 중 오류가 발생했습니다."
    log_error "로그 파일을 확인하세요: $LOG_FILE"
    exit 1
fi 