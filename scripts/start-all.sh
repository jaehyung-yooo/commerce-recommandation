#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Commerce Recommendation System 전체 실행 시작${NC}"
echo "=================================================="

# 에러 발생 시 스크립트 중단
set -e

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

# Docker 확인
echo -e "${YELLOW}🐳 Docker 환경 확인 중...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다. Docker를 먼저 설치해주세요.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose가 설치되어 있지 않습니다. Docker Compose를 먼저 설치해주세요.${NC}"
    exit 1
fi

# 0. 인프라 서비스만 실행 (Docker Compose)
echo -e "\n${BLUE}🏗️  인프라 서비스 실행 중 (MySQL, OpenSearch, Redis)...${NC}"
docker-compose up -d mysql opensearch redis opensearch-dashboards

# 인프라 서비스 시작 대기
echo -e "${YELLOW}⏳ 인프라 서비스 시작 대기 중...${NC}"
sleep 10

# 서비스 헬스체크
echo -e "${YELLOW}🔍 인프라 서비스 헬스체크...${NC}"
for i in {1..30}; do
    if docker-compose ps mysql | grep -q "healthy\|Up" && \
       docker-compose ps opensearch | grep -q "healthy\|Up" && \
       docker-compose ps redis | grep -q "healthy\|Up"; then
        echo -e "${GREEN}✅ 모든 인프라 서비스가 정상 실행되었습니다!${NC}"
        break
    fi
    echo "대기 중... ($i/30)"
    sleep 2
done

# Python 버전 확인 및 의존성 문제 해결
echo -e "${YELLOW}🐍 Python 환경 확인 중...${NC}"
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "Python 버전: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" == "3.13" ]]; then
    echo -e "${YELLOW}⚠️  Python 3.13 감지 - setuptools 업그레이드 필요${NC}"
fi

# 1. Backend 설정 및 실행 (Poetry)
echo -e "\n${BLUE}📊 Backend (FastAPI) 설정 중...${NC}"
cd backend

# Poetry 설치 확인
if ! command -v poetry &> /dev/null; then
    echo -e "${RED}❌ Poetry가 설치되어 있지 않습니다. Poetry를 먼저 설치해주세요.${NC}"
    echo "설치: curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

# Poetry 의존성 설치
echo "Poetry로 의존성 설치 중..."
poetry install || {
    echo -e "${YELLOW}⚠️  일부 패키지 설치 실패 - 계속 진행${NC}"
}

# Backend 서버 백그라운드 실행 (Poetry 환경)
echo -e "${GREEN}🚀 Backend 서버 시작 (포트 8000)${NC}"
nohup poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 2. Frontend 설정 및 실행
echo -e "\n${BLUE}💻 Frontend (React) 설정 중...${NC}"
cd ../frontend

# Node.js 의존성 설치 (없는 경우만)
if [ ! -d "node_modules" ]; then
    echo "Node.js 의존성 설치 중..."
    npm install
fi

# Frontend 서버 백그라운드 실행
echo -e "${GREEN}🚀 Frontend 서버 시작 (포트 3001)${NC}"
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# 3. 추천 엔진 실행 (선택사항)
echo -e "\n${BLUE}🤖 추천 엔진 설정 중...${NC}"
cd ../

if [ -d "recommendation-engine" ]; then
    cd recommendation-engine
    
    # 추천 엔진 의존성 설치
    if [ -f "requirements.txt" ]; then
        echo "추천 엔진 의존성 설치 중..."
        pip install -r requirements.txt || {
            echo -e "${YELLOW}⚠️  추천 엔진 패키지 설치 실패 - 계속 진행${NC}"
        }
    fi
    
    # 추천 엔진 백그라운드 실행
    echo -e "${GREEN}🚀 추천 엔진 시작 (포트 8001)${NC}"
    nohup python -m uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload > ../logs/recommendation.log 2>&1 &
    RECOMMENDATION_PID=$!
    echo "Recommendation Engine PID: $RECOMMENDATION_PID"
    
    cd ..
fi

# 4. 챗봇 서버 실행 (Streamlit + Poetry) - 선택사항
echo -e "\n${BLUE}🤖 챗봇 서버 설정 중...${NC}"

if [ -d "streamlit-chatbot" ]; then
    cd streamlit-chatbot
    
    # Poetry 의존성 설치
    echo "Poetry로 챗봇 의존성 설치 중..."
    poetry install || {
        echo -e "${YELLOW}⚠️  챗봇 패키지 설치 실패 - 계속 진행${NC}"
    }
    
    # Streamlit 앱 백그라운드 실행 (Poetry 환경)
    echo -e "${GREEN}🚀 챗봇 서버 시작 (포트 8501)${NC}"
    nohup poetry run streamlit run app.py --server.port=8501 --server.headless=true > ../logs/chatbot.log 2>&1 &
    CHATBOT_PID=$!
    echo "Chatbot PID: $CHATBOT_PID"
    
    cd ..
fi

# 5. 로그 디렉토리 생성
mkdir -p logs

# 6. 서비스 상태 확인
echo -e "\n${BLUE}📋 서비스 상태 확인 중...${NC}"
sleep 5

# 포트 확인 함수
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ $service (포트 $port) - 실행 중${NC}"
        return 0
    else
        echo -e "${RED}❌ $service (포트 $port) - 실행 실패${NC}"
        return 1
    fi
}

# 서비스 상태 체크
echo "서비스 상태:"
echo -e "${BLUE}인프라 서비스:${NC}"
check_port 3306 "MySQL"
check_port 9200 "OpenSearch"
check_port 6379 "Redis"

echo -e "${BLUE}애플리케이션 서비스:${NC}"
check_port 8000 "Backend API"
check_port 3001 "Frontend" || check_port 3000 "Frontend"
if [ -d "recommendation-engine" ]; then
    check_port 8001 "Recommendation Engine"
fi
if [ -d "streamlit-chatbot" ]; then
    check_port 8501 "Chatbot"
fi

# 7. 실행 정보 출력
echo -e "\n${GREEN}🎉 서비스 실행 완료!${NC}"
echo "=================================================="
echo -e "${BLUE}📱 접속 URL:${NC}"
echo "  • Frontend:     http://localhost:3001"
echo "  • Admin:        http://localhost:3001/admin"
echo "  • Backend API:  http://localhost:8000"
echo "  • API Docs:     http://localhost:8000/docs"
if [ -d "recommendation-engine" ]; then
    echo "  • Recommendation: http://localhost:8001"
fi
if [ -d "streamlit-chatbot" ]; then
    echo "  • Chatbot:      http://localhost:8501"
fi

echo -e "\n${BLUE}🗄️  인프라 서비스:${NC}"
echo "  • MySQL:        localhost:3306"
echo "  • OpenSearch:   http://localhost:9200"
echo "  • Redis:        localhost:6379"
echo "  • OpenSearch Dashboards: http://localhost:5601"

echo -e "\n${BLUE}📊 로그 파일:${NC}"
echo "  • Backend:      logs/backend.log"
echo "  • Frontend:     logs/frontend.log"
if [ -d "recommendation-engine" ]; then
    echo "  • Recommendation: logs/recommendation.log"
fi
if [ -d "streamlit-chatbot" ]; then
    echo "  • Chatbot:      logs/chatbot.log"
fi

echo -e "\n${BLUE}🛑 서비스 중지:${NC}"
echo "  ./scripts/stop-all.sh"

echo -e "\n${BLUE}📝 실시간 로그 확인:${NC}"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"

# PID 파일 저장
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid
if [ ! -z "$RECOMMENDATION_PID" ]; then
    echo $RECOMMENDATION_PID > logs/recommendation.pid
fi
if [ ! -z "$CHATBOT_PID" ]; then
    echo $CHATBOT_PID > logs/chatbot.pid
fi

echo -e "\n${GREEN}🚀 모든 서비스가 실행되었습니다!${NC}"
echo "브라우저에서 http://localhost:3001 을 열어보세요." 