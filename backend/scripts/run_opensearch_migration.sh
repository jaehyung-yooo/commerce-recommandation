#!/bin/bash

# OpenSearch 마이그레이션 실행 스크립트

set -e  # 오류 발생 시 스크립트 중단

# 색상 코드 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
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
    echo "OpenSearch 마이그레이션 실행 스크립트"
    echo ""
    echo "사용법: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --setup-only        OpenSearch 환경 설정만 실행"
    echo "  --products-only     상품 데이터만 마이그레이션"
    echo "  --reviews-only      리뷰 데이터만 마이그레이션"
    echo "  --reset             기존 인덱스 삭제 후 재실행"
    echo "  --batch-size SIZE   배치 크기 설정 (기본값: 1000)"
    echo "  --skip-health       OpenSearch 상태 확인 생략"
    echo "  --help              이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0                           # 전체 마이그레이션 실행"
    echo "  $0 --products-only           # 상품 데이터만 마이그레이션"
    echo "  $0 --batch-size 500          # 배치 크기 500으로 실행"
    echo "  $0 --reset                   # 인덱스 초기화 후 재실행"
    echo ""
}

# OpenSearch 연결 확인
check_opensearch() {
    log_info "OpenSearch 연결 확인 중..."
    
    if curl -s "localhost:9200/_cluster/health" > /dev/null 2>&1; then
        log_success "OpenSearch 연결 성공"
        return 0
    else
        log_error "OpenSearch 연결 실패"
        log_error "OpenSearch가 실행 중인지 확인하세요: docker-compose up opensearch"
        return 1
    fi
}

# MySQL 연결 확인
check_mysql() {
    log_info "MySQL 연결 확인 중..."
    
    # 환경 변수 확인
    if [[ -z "$MYSQL_SERVER" ]]; then
        log_warning "MYSQL_SERVER 환경 변수가 설정되지 않았습니다. localhost를 사용합니다."
        export MYSQL_SERVER=localhost
    fi
    
    if [[ -z "$MYSQL_USER" ]]; then
        log_warning "MYSQL_USER 환경 변수가 설정되지 않았습니다. root를 사용합니다."
        export MYSQL_USER=root
    fi
    
    if [[ -z "$MYSQL_DB" ]]; then
        log_warning "MYSQL_DB 환경 변수가 설정되지 않았습니다. commerce_recommendation을 사용합니다."
        export MYSQL_DB=commerce_recommendation
    fi
    
    log_success "MySQL 설정 확인 완료"
}

# 패키지 설치 확인
check_dependencies() {
    log_info "Python 패키지 확인 중..."
    
    if ! python -c "import mysql.connector" 2>/dev/null; then
        log_warning "mysql-connector-python 패키지가 설치되지 않았습니다. 설치 중..."
        pip install mysql-connector-python==8.2.0
    fi
    
    if ! python -c "import opensearchpy" 2>/dev/null; then
        log_error "opensearch-py 패키지가 필요합니다."
        log_error "pip install -r requirements.txt를 실행하세요."
        return 1
    fi
    
    log_success "필요한 패키지가 모두 설치되어 있습니다."
}

# OpenSearch 환경 설정
setup_opensearch() {
    log_info "OpenSearch 환경 설정 실행 중..."
    
    if python opensearch_setup.py --setup; then
        log_success "OpenSearch 환경 설정 완료"
        return 0
    else
        log_error "OpenSearch 환경 설정 실패"
        return 1
    fi
}

# 인덱스 초기화
reset_indices() {
    log_warning "기존 인덱스를 삭제합니다..."
    
    if python opensearch_setup.py --reset; then
        log_success "인덱스 초기화 완료"
        return 0
    else
        log_error "인덱스 초기화 실패"
        return 1
    fi
}

# 데이터 마이그레이션 실행
run_migration() {
    local migration_args="$1"
    
    log_info "데이터 마이그레이션 시작..."
    log_info "실행 명령: python opensearch_migration.py $migration_args"
    
    if python opensearch_migration.py $migration_args; then
        log_success "데이터 마이그레이션 완료!"
        return 0
    else
        log_error "데이터 마이그레이션 실패"
        return 1
    fi
}

# 마이그레이션 결과 확인
verify_migration() {
    log_info "마이그레이션 결과 확인 중..."
    
    python opensearch_setup.py --list
    
    # 인덱스 카운트 확인
    if curl -s "localhost:9200/products/_count" > /dev/null 2>&1; then
        products_count=$(curl -s "localhost:9200/products/_count" | python -c "import sys, json; print(json.load(sys.stdin)['count'])")
        log_info "상품 인덱스: $products_count 개 문서"
    fi
    
    if curl -s "localhost:9200/reviews/_count" > /dev/null 2>&1; then
        reviews_count=$(curl -s "localhost:9200/reviews/_count" | python -c "import sys, json; print(json.load(sys.stdin)['count'])")
        log_info "리뷰 인덱스: $reviews_count 개 문서"
    fi
}

# 메인 함수
main() {
    # 기본 설정
    SETUP_ONLY=false
    PRODUCTS_ONLY=false
    REVIEWS_ONLY=false
    RESET_INDICES=false
    BATCH_SIZE=1000
    SKIP_HEALTH=false
    
    # 명령행 인수 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            --setup-only)
                SETUP_ONLY=true
                shift
                ;;
            --products-only)
                PRODUCTS_ONLY=true
                shift
                ;;
            --reviews-only)
                REVIEWS_ONLY=true
                shift
                ;;
            --reset)
                RESET_INDICES=true
                shift
                ;;
            --batch-size)
                BATCH_SIZE="$2"
                shift 2
                ;;
            --skip-health)
                SKIP_HEALTH=true
                shift
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
    
    # 스크립트 디렉토리로 이동
    cd "$(dirname "$0")"
    
    log_info "🚀 OpenSearch 마이그레이션 시작"
    
    # 의존성 확인
    if ! check_dependencies; then
        exit 1
    fi
    
    # 연결 확인
    if [[ "$SKIP_HEALTH" != true ]]; then
        if ! check_opensearch; then
            exit 1
        fi
        check_mysql
    fi
    
    # 인덱스 초기화 (필요한 경우)
    if [[ "$RESET_INDICES" == true ]]; then
        if ! reset_indices; then
            exit 1
        fi
    fi
    
    # OpenSearch 환경 설정
    if ! setup_opensearch; then
        exit 1
    fi
    
    # 설정만 실행하는 경우
    if [[ "$SETUP_ONLY" == true ]]; then
        log_success "OpenSearch 환경 설정이 완료되었습니다."
        exit 0
    fi
    
    # 마이그레이션 인수 구성
    migration_args=""
    
    if [[ "$PRODUCTS_ONLY" == true ]]; then
        migration_args="--products-only"
    elif [[ "$REVIEWS_ONLY" == true ]]; then
        migration_args="--reviews-only"
    fi
    
    migration_args="$migration_args --batch-size $BATCH_SIZE"
    
    # 데이터 마이그레이션 실행
    if ! run_migration "$migration_args"; then
        exit 1
    fi
    
    # 결과 확인
    verify_migration
    
    log_success "🎉 모든 작업이 완료되었습니다!"
    
    # 사용 가능한 검색 예시 출력
    echo ""
    log_info "검색 테스트 예시:"
    echo "curl -X POST \"localhost:9200/products/_search\" -H 'Content-Type: application/json' -d'{\"query\":{\"match\":{\"product_name\":\"삼성\"}},\"size\":5}'"
    echo "curl -X POST \"localhost:9200/reviews/_search\" -H 'Content-Type: application/json' -d'{\"query\":{\"match\":{\"review_text\":\"좋아요\"}},\"size\":5}'"
}

# 스크립트 실행
main "$@" 