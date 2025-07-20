# Admin Dashboard AI Chatbot

관리자 대시보드용 AI 어시스턴트 챗봇입니다.

## 🚀 실행 방법

### 1. 자동 실행 (권장)
```bash
# 프로젝트 루트에서 실행
./scripts/start-chatbot.sh
```

### 2. 수동 실행
```bash
# 챗봇 디렉토리로 이동
cd streamlit-chatbot

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 실행
streamlit run app.py --server.port=8501
```

## 📝 기능

### 지원하는 질문 유형:

1. **매출 분석**
   - "매출 현황 알려줘"
   - "수익 분석해줘"

2. **CTR 분석** 
   - "CTR 분석해줘"
   - "클릭률 현황은?"

3. **추천 시스템**
   - "추천 알고리즘 성능은?"
   - "추천 시스템 분석"

4. **사용자 분석**
   - "사용자 활동 현황"
   - "고객 데이터 분석"

5. **도움말**
   - "도움말"
   - "사용 가능한 기능"

## 🔧 커스터마이징

### AI 모델 연동
`app.py`의 `get_bot_response()` 함수를 수정하여 실제 AI 모델을 연동할 수 있습니다:

```python
import openai

def get_bot_response(user_input: str) -> str:
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "당신은 이커머스 관리자 대시보드 전문 AI입니다."},
            {"role": "user", "content": user_input}
        ]
    )
    return response.choices[0].message.content
```

### 실시간 데이터 연동
API 호출을 통해 실시간 대시보드 데이터를 가져올 수 있습니다:

```python
import requests

def get_dashboard_data():
    response = requests.get("http://localhost:8000/api/v1/admin/metrics")
    return response.json()
```

## 🎨 스타일링

CSS를 수정하여 대시보드 테마에 맞게 스타일링할 수 있습니다.

## 📱 React 통합

React 앱에서는 `StreamlitChatbot` 컴포넌트를 통해 iframe으로 임베드됩니다:

```tsx
<StreamlitChatbot streamlitUrl="http://localhost:8501" />
```

## ⚠️ 주의사항

1. Streamlit 앱이 먼저 실행되어야 합니다
2. 포트 8501이 사용 가능해야 합니다
3. CORS 설정이 필요할 수 있습니다 