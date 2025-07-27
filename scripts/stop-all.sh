#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 Commerce Recommendation System 전체 서비스 중지${NC}"
echo "=================================================="

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

# PID 파일에서 프로세스 중지
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}🔄 $service_name (PID: $pid) 중지 중...${NC}"
            kill $pid
            sleep 2
            
            # 강제 종료가 필요한 경우
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}⚠️  $service_name 강제 종료 중...${NC}"
                kill -9 $pid
            fi
            
            echo -e "${GREEN}✅ $service_name 중지 완료${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name 프로세스가 이미 종료됨${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  $service_name PID 파일을 찾을 수 없음${NC}"
    fi
}

# 각 서비스 중지
stop_service "backend"
stop_service "frontend"
stop_service "recommendation"
stop_service "chatbot"

# Docker 인프라 서비스 중지
echo -e "\n${BLUE}🐳 Docker 인프라 서비스 중지 중...${NC}"
if command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🔄 MySQL, OpenSearch, Redis 중지 중...${NC}"
    docker-compose stop mysql opensearch redis opensearch-dashboards 2>/dev/null || true
    echo -e "${GREEN}✅ Docker 인프라 서비스 중지 완료${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose를 찾을 수 없음 - 수동으로 Docker 컨테이너를 확인하세요${NC}"
fi

# 포트 기반으로 남은 프로세스 정리
echo -e "\n${BLUE}🧹 포트 기반 프로세스 정리 중...${NC}"

cleanup_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}🔄 포트 $port ($service_name) 프로세스 정리 중...${NC}"
        kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
        echo -e "${GREEN}✅ 포트 $port 정리 완료${NC}"
    fi
}

# 주요 포트 정리
cleanup_port 8000 "Backend"
cleanup_port 3000 "Frontend"
cleanup_port 3001 "Frontend"
cleanup_port 8001 "Recommendation Engine"
cleanup_port 8501 "Chatbot"

# Node.js 관련 프로세스 정리
echo -e "\n${BLUE}🧹 Node.js 관련 프로세스 정리 중...${NC}"
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✅ Vite 프로세스 정리 완료${NC}" || true
pkill -f "npm run dev" 2>/dev/null && echo -e "${GREEN}✅ npm 프로세스 정리 완료${NC}" || true

# Streamlit 관련 프로세스 정리
echo -e "\n${BLUE}🧹 Streamlit 관련 프로세스 정리 중...${NC}"
pkill -f "streamlit" 2>/dev/null && echo -e "${GREEN}✅ Streamlit 프로세스 정리 완료${NC}" || true

# FastAPI/Uvicorn 관련 프로세스 정리
echo -e "\n${BLUE}🧹 FastAPI 관련 프로세스 정리 중...${NC}"
pkill -f "uvicorn" 2>/dev/null && echo -e "${GREEN}✅ Uvicorn 프로세스 정리 완료${NC}" || true

# 로그 파일 확인
echo -e "\n${BLUE}📋 서비스 상태 확인${NC}"
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}❌ $service (포트 $port) - 아직 실행 중${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $service (포트 $port) - 중지됨${NC}"
        return 0
    fi
}

echo "애플리케이션 서비스 상태:"
check_port 8000 "Backend API"
check_port 3001 "Frontend"
check_port 8001 "Recommendation Engine"
check_port 8501 "Chatbot"

echo -e "\n인프라 서비스 상태:"
check_port 3306 "MySQL"
check_port 9200 "OpenSearch"
check_port 6379 "Redis"

# 로그 파일 정리 옵션
echo -e "\n${BLUE}📊 로그 파일 관리${NC}"
if [ -d "logs" ] && [ "$(ls -A logs/)" ]; then
    echo -e "${YELLOW}로그 파일들:${NC}"
    ls -la logs/
    echo
    read -p "로그 파일을 삭제하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f logs/*.log
        rm -f logs/*.pid
        echo -e "${GREEN}✅ 로그 파일 삭제 완료${NC}"
    else
        echo -e "${BLUE}로그 파일 유지${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 모든 서비스가 중지되었습니다!${NC}"
echo "=================================================="
echo -e "${BLUE}🚀 서비스 재시작:${NC}"
echo "  ./scripts/start-all.sh" 