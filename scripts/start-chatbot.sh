#!/bin/bash

echo "🤖 Starting Admin Chatbot..."

# streamlit-chatbot 디렉토리로 이동
cd streamlit-chatbot

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 가상환경 활성화
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# 의존성 설치
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Streamlit 앱 실행
echo "🚀 Starting Streamlit app on http://localhost:8501"
streamlit run app.py --server.port=8501 --server.address=localhost --server.headless=true 