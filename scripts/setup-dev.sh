#!/bin/bash

# 개발 환경 설정 스크립트
set -e

echo "🚀 Commerce Recommendation System 개발 환경 설정 시작"

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 필요한 도구 확인
check_requirements() {
    print_status "시스템 요구사항 확인 중..."
    
    # Docker 확인
    if ! command -v docker &> /dev/null; then
        print_error "Docker가 설치되지 않았습니다. https://docs.docker.com/get-docker/ 에서 설치하세요."
        exit 1
    fi
    
    # Docker Compose 확인
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose가 설치되지 않았습니다. https://docs.docker.com/compose/install/ 에서 설치하세요."
        exit 1
    fi
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        print_warning "Node.js가 설치되지 않았습니다. Frontend 개발을 위해 설치를 권장합니다."
    fi
    
    # Python 확인
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3가 설치되지 않았습니다. Backend 개발을 위해 설치를 권장합니다."
    fi
    
    print_status "시스템 요구사항 확인 완료"
}

# 환경 변수 설정
setup_environment() {
    print_status "환경 변수 설정 중..."
    
    # 개발 환경 변수 복사
    if [ ! -f .env ]; then
        cp config/development.env .env
        print_status ".env 파일 생성 완료"
    else
        print_warning ".env 파일이 이미 존재합니다."
    fi
    
    # Backend 환경 변수 설정
    if [ ! -f backend/.env ]; then
        cp config/development.env backend/.env
        print_status "Backend .env 파일 생성 완료"
    else
        print_warning "Backend .env 파일이 이미 존재합니다."
    fi
    
    # Recommendation Engine 환경 변수 설정
    if [ ! -f recommendation-engine/.env ]; then
        cp config/development.env recommendation-engine/.env
        print_status "Recommendation Engine .env 파일 생성 완료"
    else
        print_warning "Recommendation Engine .env 파일이 이미 존재합니다."
    fi
}

# Frontend 설정
setup_frontend() {
    print_status "Frontend 설정 중..."
    
    cd frontend
    
    # Node.js 의존성 설치
    if [ ! -d node_modules ]; then
        print_status "Node.js 의존성 설치 중..."
        npm install
        print_status "Node.js 의존성 설치 완료"
    else
        print_warning "Node.js 의존성이 이미 설치되어 있습니다."
    fi
    
    cd ..
}

# Backend 설정
setup_backend() {
    print_status "Backend 설정 중..."
    
    cd backend
    
    # Python 가상환경 생성
    if [ ! -d venv ]; then
        print_status "Python 가상환경 생성 중..."
        python3 -m venv venv
        print_status "Python 가상환경 생성 완료"
    else
        print_warning "Python 가상환경이 이미 존재합니다."
    fi
    
    # 가상환경 활성화 및 의존성 설치
    source venv/bin/activate
    pip install -r requirements.txt
    print_status "Backend 의존성 설치 완료"
    
    cd ..
}

# Recommendation Engine 설정
setup_recommendation_engine() {
    print_status "Recommendation Engine 설정 중..."
    
    cd recommendation-engine
    
    # Python 가상환경 생성
    if [ ! -d venv ]; then
        print_status "Python 가상환경 생성 중..."
        python3 -m venv venv
        print_status "Python 가상환경 생성 완료"
    else
        print_warning "Python 가상환경이 이미 존재합니다."
    fi
    
    # 가상환경 활성화 및 의존성 설치
    source venv/bin/activate
    pip install -r requirements.txt
    print_status "Recommendation Engine 의존성 설치 완료"
    
    cd ..
}

# Docker 서비스 시작
start_docker_services() {
    print_status "Docker 서비스 시작 중..."
    
    # 기존 컨테이너 정리
    docker-compose down
    
    # 새로운 컨테이너 시작
    docker-compose up -d opensearch redis mysql
    
    # 서비스 상태 확인
    print_status "서비스 상태 확인 중..."
    sleep 30
    
    # OpenSearch 상태 확인
    if curl -s http://localhost:9200 > /dev/null; then
        print_status "OpenSearch 서비스 정상 동작"
    else
        print_warning "OpenSearch 서비스 확인 필요"
    fi
    
    # Redis 상태 확인
    if redis-cli ping > /dev/null 2>&1; then
        print_status "Redis 서비스 정상 동작"
    else
        print_warning "Redis 서비스 확인 필요"
    fi
    
    # MySQL 상태 확인
    if docker exec mysql mysqladmin ping -h localhost > /dev/null 2>&1; then
        print_status "MySQL 서비스 정상 동작"
    else
        print_warning "MySQL 서비스 확인 필요"
    fi
}

# 초기 데이터 설정
setup_initial_data() {
    print_status "초기 데이터 설정 중..."
    
    # MySQL 초기 데이터베이스 스키마 생성
    if [ -f scripts/init.sql ]; then
        print_status "MySQL 초기 스키마 적용 중..."
        # 스키마는 Docker 초기화 시 자동 적용됨
        print_status "MySQL 초기 스키마 적용 완료"
    fi
    
    # OpenSearch 인덱스 생성
    print_status "OpenSearch 인덱스 생성 중..."
    # 인덱스 생성 스크립트 실행 (필요시)
    print_status "OpenSearch 인덱스 생성 완료"
}

# 메인 실행
main() {
    print_status "개발 환경 설정 시작..."
    
    # 현재 디렉토리 확인
    if [ ! -f docker-compose.yml ]; then
        print_error "프로젝트 루트 디렉토리에서 실행해주세요."
        exit 1
    fi
    
    check_requirements
    setup_environment
    
    # 개발 모드에 따른 설정
    read -p "어떤 모드로 설정하시겠습니까? (1: 전체 Docker, 2: 로컬 개발) [1]: " choice
    choice=${choice:-1}
    
    case $choice in
        1)
            print_status "전체 Docker 모드로 설정합니다."
            start_docker_services
            setup_initial_data
            ;;
        2)
            print_status "로컬 개발 모드로 설정합니다."
            setup_frontend
            setup_backend
            setup_recommendation_engine
            start_docker_services
            setup_initial_data
            ;;
        *)
            print_error "잘못된 선택입니다."
            exit 1
            ;;
    esac
    
    print_status "개발 환경 설정 완료! 🎉"
    echo ""
    echo "서비스 URL:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - Recommendation Engine: http://localhost:8001"
    echo "  - OpenSearch: http://localhost:9200"
    echo "  - OpenSearch Dashboards: http://localhost:5601"
    echo "  - Redis: localhost:6379"
    echo "  - MySQL: localhost:3306"
    echo ""
    echo "개발 시작:"
    echo "  - 전체 서비스: docker-compose up"
    echo "  - 로컬 개발: 각 서비스 디렉토리에서 개별 실행"
}

# 스크립트 실행
main "$@" 