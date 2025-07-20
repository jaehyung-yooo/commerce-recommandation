import streamlit as st
import time
import json
from datetime import datetime

# 페이지 설정
st.set_page_config(
    page_title="Admin AI Assistant",
    page_icon="🤖",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# CSS로 스타일링
st.markdown("""
<style>
    .stApp {
        max-width: 100%;
        padding: 0;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }
    .user-message {
        background-color: #f0f0f0;
        margin-left: 1rem;
    }
    .bot-message {
        background-color: #e3f2fd;
        margin-right: 1rem;
    }
    .stTextInput > div > div > input {
        border-radius: 20px;
    }
</style>
""", unsafe_allow_html=True)

# 세션 상태 초기화
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "안녕하세요! 관리자 대시보드 AI 어시스턴트입니다. 어떤 도움이 필요하신가요?"}
    ]

# 챗봇 응답 생성 함수
def get_bot_response(user_input: str) -> str:
    """실제로는 LLM API를 호출하거나 더 복잡한 로직을 구현"""
    
    user_input_lower = user_input.lower()
    
    # 간단한 규칙 기반 응답
    if any(word in user_input_lower for word in ["매출", "revenue", "sales"]):
        return """
📈 **매출 관련 정보**

현재 추천 시스템 기여 매출: ₩45.2M (전월 대비 +18.7%)

주요 성과:
- 상위 5개 상품 매출: ₩914.5M
- 평균 전환율: 23.1%
- 추천 CTR: 8.4%

더 자세한 정보가 필요하시면 말씀해 주세요!
        """
    
    elif any(word in user_input_lower for word in ["ctr", "클릭률", "클릭"]):
        return """
🎯 **CTR (클릭률) 분석**

현재 평균 CTR: 8.4% (전주 대비 +12.5%)

일별 CTR 추이:
- 월: 7.2% | 화: 8.1% | 수: 7.8%
- 목: 9.2% | 금: 8.9% | 토: 6.4% | 일: 8.4%

개선 제안:
- 목요일 패턴 분석 필요
- 주말 추천 알고리즘 최적화 검토
        """
    
    elif any(word in user_input_lower for word in ["추천", "알고리즘", "recommendation"]):
        return """
🔧 **추천 알고리즘 성능**

알고리즘별 기여도:
- 키워드 검색: 42%
- 콘텐츠 기반: 35%  
- 리뷰 기반: 23%

추천 정확도: 87.2%

최적화 포인트:
- 콘텐츠 기반 필터링 강화
- 사용자 행동 패턴 분석 개선
        """
    
    elif any(word in user_input_lower for word in ["사용자", "user", "고객"]):
        return """
👥 **사용자 활동 현황**

- 활성 사용자: 12,847명
- 평균 세션 시간: 4분 32초
- 일일 활성 사용자: +8.9%

사용자 행동 패턴:
- 모바일: 68%
- 데스크톱: 32%
- 평균 페이지뷰: 3.4페이지
        """
    
    elif any(word in user_input_lower for word in ["도움", "help", "기능"]):
        return """
🤖 **사용 가능한 기능**

다음과 같은 질문을 할 수 있습니다:

📊 **분석 요청:**
- "매출 현황 알려줘"
- "CTR 분석해줘"
- "추천 알고리즘 성능은?"

📈 **데이터 조회:**
- "사용자 활동 현황"
- "상품별 성과"
- "전환율 분석"

🔧 **최적화 제안:**
- "개선 방안 추천"
- "성능 향상 팁"
        """
    
    else:
        return f"""
죄송합니다. '{user_input}'에 대한 구체적인 정보가 없습니다.

다음과 같은 키워드로 질문해보세요:
- 매출, 수익
- CTR, 클릭률
- 추천 알고리즘
- 사용자 현황
- 도움말

더 구체적으로 질문해주시면 더 정확한 답변을 드릴 수 있습니다!
        """

# 채팅 히스토리 표시
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 사용자 입력
if prompt := st.chat_input("무엇을 도와드릴까요?"):
    # 사용자 메시지 추가
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # 봇 응답 생성
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        
        # 타이핑 효과
        response = get_bot_response(prompt)
        full_response = ""
        
        for chunk in response.split():
            full_response += chunk + " "
            time.sleep(0.05)
            message_placeholder.markdown(full_response + "▌")
        
        message_placeholder.markdown(full_response)
    
    # 봇 응답을 히스토리에 추가
    st.session_state.messages.append({"role": "assistant", "content": response})

# 하단에 클리어 버튼
if st.button("대화 내용 지우기", type="secondary"):
    st.session_state.messages = [
        {"role": "assistant", "content": "안녕하세요! 관리자 대시보드 AI 어시스턴트입니다. 어떤 도움이 필요하신가요?"}
    ]
    st.rerun() 