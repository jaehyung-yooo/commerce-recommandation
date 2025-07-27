#!/bin/bash

# MySQL 데이터베이스 설정 및 데이터 적재 스크립트

set -e  # 에러 발생시 스크립트 중단

echo "🚀 이커머스 추천 시스템 MySQL 데이터베이스 설정 시작"

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경변수 설정 (기본값)
export MYSQL_HOST=${MYSQL_HOST:-localhost}
export MYSQL_PORT=${MYSQL_PORT:-3306}
export MYSQL_USER=${MYSQL_USER:-root}
export MYSQL_DATABASE=${MYSQL_DATABASE:-commerce_recommendation}

# MySQL 비밀번호 확인
if [ -z "$MYSQL_PASSWORD" ]; then
    echo -e "${YELLOW}MySQL 비밀번호를 입력하세요:${NC}"
    read -s MYSQL_PASSWORD
    export MYSQL_PASSWORD
fi

echo -e "${BLUE}📋 설정 정보:${NC}"
echo "  - MySQL 호스트: $MYSQL_HOST"
echo "  - MySQL 포트: $MYSQL_PORT"
echo "  - MySQL 사용자: $MYSQL_USER"
echo "  - 데이터베이스: $MYSQL_DATABASE"

# MySQL 연결 테스트
echo -e "${BLUE}🔌 MySQL 연결 테스트...${NC}"
mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MySQL 연결 성공!${NC}"
else
    echo -e "${RED}❌ MySQL 연결 실패. 연결 정보를 확인하세요.${NC}"
    exit 1
fi

# 데이터베이스 스키마 생성
echo -e "${BLUE}🗄️  데이터베이스 스키마 생성...${NC}"
if [ -f "../backend/scripts/create_mysql_schema.sql" ]; then
    mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" < ../backend/scripts/create_mysql_schema.sql
    echo -e "${GREEN}✅ 스키마 생성 완료!${NC}"
else
    echo -e "${RED}❌ 스키마 파일을 찾을 수 없습니다: ../backend/scripts/create_mysql_schema.sql${NC}"
    exit 1
fi

# Python 가상환경 활성화 (있는 경우)
if [ -f "../backend/.venv/bin/activate" ]; then
    echo -e "${BLUE}🐍 Python 가상환경 활성화...${NC}"
    source ../backend/.venv/bin/activate
fi

# 필요한 Python 패키지 설치
echo -e "${BLUE}📦 Python 패키지 설치...${NC}"
pip install -q mysql-connector-python pandas numpy

# 데이터 파일 존재 확인
echo -e "${BLUE}📁 데이터 파일 확인...${NC}"
data_files=(
    "../crawler/categories.csv"
    "../crawler/products_detail.csv"
    "../crawler/reviews.csv"
)

for file in "${data_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file 존재${NC}"
    else
        echo -e "${RED}❌ $file 파일이 없습니다${NC}"
        exit 1
    fi
done

# 데이터 적재 실행
echo -e "${BLUE}🔄 데이터 적재 시작...${NC}"
cd ../backend/scripts/
python load_data_to_mysql.py

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 데이터 적재 완료!${NC}"
    
    # 적재 결과 확인
    echo -e "${BLUE}📊 적재 결과 확인:${NC}"
    mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -D"$MYSQL_DATABASE" -e "
    SELECT 
        'categories' as table_name, COUNT(*) as row_count FROM categories
    UNION ALL
    SELECT 
        'members' as table_name, COUNT(*) as row_count FROM members
    UNION ALL
    SELECT 
        'products' as table_name, COUNT(*) as row_count FROM products
    UNION ALL
    SELECT 
        'reviews' as table_name, COUNT(*) as row_count FROM reviews
    UNION ALL
    SELECT 
        'orders' as table_name, COUNT(*) as row_count FROM orders;
    "
    
    echo -e "${GREEN}✅ MySQL 데이터베이스 설정 및 데이터 적재 완료!${NC}"
    echo -e "${BLUE}📝 다음 단계:${NC}"
    echo "  1. 데이터베이스 연결 정보를 백엔드 설정에 추가"
    echo "  2. 추천 시스템 모델 학습 실행"
    echo "  3. API 서버 시작"
    
else
    echo -e "${RED}❌ 데이터 적재 실패${NC}"
    exit 1
fi 