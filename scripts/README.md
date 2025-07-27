# 🚀 Commerce Recommendation System 실행 가이드

전체 시스템을 쉽게 실행하고 관리할 수 있는 스크립트 모음입니다.

## 📋 시스템 구성

- **Frontend**: React + Vite (포트 3001)
- **Backend**: FastAPI + Poetry + Uvicorn (포트 8000)  
- **Chatbot**: Streamlit (포트 8501) - 선택사항
- **Admin Dashboard**: `/admin` 경로에서 챗봇 포함

## 🚀 빠른 시작

### 1. 전체 시스템 실행
```bash
./scripts/start-all.sh
```

### 2. 접속 URL
- **메인 페이지**: http://localhost:3001
- **관리자 페이지**: http://localhost:3001/admin (챗봇 포함)
- **API 문서**: http://localhost:8000/docs
- **챗봇 (독립)**: http://localhost:8501

### 3. 전체 시스템 중지
```bash
./scripts/stop-all.sh
```

## 📊 로그 확인

### 실시간 로그 모니터링
```bash
# 백엔드 로그
tail -f logs/backend.log

# 프론트엔드 로그  
tail -f logs/frontend.log

# 챗봇 로그
tail -f logs/chatbot.log
```

### 로그 파일 위치
```
logs/
├── backend.log     # FastAPI 서버 로그
├── frontend.log    # React 개발 서버 로그
├── chatbot.log     # Streamlit 앱 로그
├── backend.pid     # 백엔드 프로세스 ID
├── frontend.pid    # 프론트엔드 프로세스 ID
└── chatbot.pid     # 챗봇 프로세스 ID
```

## 🔧 개별 서비스 실행

개발 중에는 개별 서비스만 실행할 수도 있습니다:

### Frontend만 실행
```bash
cd frontend
npm run dev
```

### Backend만 실행
```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
# 또는 Poetry shell 사용
poetry shell
uvicorn app.main:app --reload --port 8000
```

### Chatbot만 실행
```bash
cd streamlit-chatbot
poetry run streamlit run app.py --server.port=8501
# 또는 Poetry shell 사용
poetry shell
streamlit run app.py --server.port=8501
```

## ⚠️ 문제 해결

### Poetry 의존성 문제
```bash
# Poetry 재설치
cd backend
poetry install

# 캐시 정리 후 재설치
poetry cache clear PyPI --all
poetry install
```

### 포트 충돌 문제
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8000
lsof -i :3001
lsof -i :8501

# 프로세스 강제 종료
kill -9 <PID>
```

### 서비스가 시작되지 않을 때
```bash
# 로그 확인
cat logs/backend.log
cat logs/frontend.log

# 수동으로 의존성 재설치
cd backend && poetry install
cd frontend && npm install
```

## 🛠️ 개발 모드

### 개발 중 자동 재시작
- **Frontend**: Vite가 자동으로 파일 변경 감지
- **Backend**: `--reload` 옵션으로 자동 재시작
- **Chatbot**: Streamlit 자동 감지

### 코드 변경 시
- Frontend/Backend: 저장하면 자동 반영
- 새 패키지 설치 시: 서비스 재시작 필요

## 📝 스크립트 상세 기능

### start-all.sh
- ✅ Poetry 환경 확인
- ✅ Poetry 의존성 자동 설치
- ✅ 모든 서비스 백그라운드 실행
- ✅ 포트 상태 체크
- ✅ PID 파일 관리

### stop-all.sh  
- ✅ 모든 서비스 안전 종료
- ✅ 남은 프로세스 정리
- ✅ 포트 충돌 해결
- ✅ 로그 파일 관리 옵션

## 🎯 챗봇 기능

Admin 페이지의 챗봇에서 다음 질문들을 시도해보세요:

```
📊 "매출 현황 알려줘"
🎯 "CTR 분석해줘"
📈 "전환율은 어때?"
👥 "사용자 현황"
🤖 "도움말"
```

## 🔄 배포 환경

프로덕션 배포 시에는 다음 설정 변경 필요:
- 환경변수 설정 (`.env` 파일)
- 데이터베이스 연결 정보
- Redis/OpenSearch 설정
- SSL 인증서 (HTTPS)

---

문제가 발생하면 로그 파일을 확인하거나 GitHub Issues에 문의해주세요! 🚀 