import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface NativeChatbotProps {
  className?: string
}

function NativeChatbot({ className = "" }: NativeChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 관리자 대시보드 AI 어시스턴트입니다. 어떤 도움이 필요하신가요?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 봇 응답 로직 (Streamlit과 동일)
  const getBotResponse = (userInput: string): string => {
    const userInputLower = userInput.toLowerCase()
    
    if (userInputLower.includes('매출') || userInputLower.includes('revenue') || userInputLower.includes('sales')) {
      return `📈 **매출 관련 정보**

현재 추천 시스템 기여 매출: ₩45.2M (전월 대비 +18.7%)

주요 성과:
- 상위 5개 상품 매출: ₩914.5M
- 평균 전환율: 23.1%
- 추천 CTR: 8.4%

더 자세한 정보가 필요하시면 말씀해 주세요!`
    }
    
    if (userInputLower.includes('ctr') || userInputLower.includes('클릭률') || userInputLower.includes('클릭')) {
      return `🎯 **CTR (클릭률) 분석**

현재 평균 CTR: 8.4% (전주 대비 +12.5%)

일별 CTR 추이:
- 월: 7.2% | 화: 8.1% | 수: 7.8%
- 목: 9.2% | 금: 8.9% | 토: 6.4% | 일: 8.4%

개선 제안:
- 목요일 패턴 분석 필요
- 주말 추천 알고리즘 최적화 검토`
    }
    
    if (userInputLower.includes('추천') || userInputLower.includes('알고리즘') || userInputLower.includes('recommendation')) {
      return `🔧 **추천 알고리즘 성능**

알고리즘별 기여도:
- 키워드 검색: 42%
- 콘텐츠 기반: 35%  
- 리뷰 기반: 23%

추천 정확도: 87.2%

최적화 포인트:
- 콘텐츠 기반 필터링 강화
- 사용자 행동 패턴 분석 개선`
    }
    
    if (userInputLower.includes('사용자') || userInputLower.includes('user') || userInputLower.includes('고객')) {
      return `👥 **사용자 활동 현황**

- 활성 사용자: 12,847명
- 평균 세션 시간: 4분 32초
- 일일 활성 사용자: +8.9%

사용자 행동 패턴:
- 모바일: 68%
- 데스크톱: 32%
- 평균 페이지뷰: 3.4페이지`
    }
    
    if (userInputLower.includes('도움') || userInputLower.includes('help') || userInputLower.includes('기능')) {
      return `🤖 **사용 가능한 기능**

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
- "성능 향상 팁"`
    }
    
    return `죄송합니다. '${userInput}'에 대한 구체적인 정보가 없습니다.

다음과 같은 키워드로 질문해보세요:
- 매출, 수익
- CTR, 클릭률
- 추천 알고리즘
- 사용자 현황
- 도움말

더 구체적으로 질문해주시면 더 정확한 답변을 드릴 수 있습니다!`
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // 타이핑 효과를 위한 지연
    setTimeout(() => {
      const botResponse = getBotResponse(inputValue)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: botResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: '안녕하세요! 관리자 대시보드 AI 어시스턴트입니다. 어떤 도움이 필요하신가요?',
        timestamp: new Date()
      }
    ])
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className={line.trim() === '' ? 'h-2' : ''}>
        {line}
      </div>
    ))
  }

  return (
    <>
      {/* 챗봇 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 ${className}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* 챗봇 패널 */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[576px] h-[900px] bg-white rounded-lg shadow-xl border border-gray-200 z-40 flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center">
              <Bot className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">AI 어시스턴트</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                초기화
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                    {message.role === 'user' ? (
                      <User className="h-6 w-6 text-gray-600" />
                    ) : (
                      <Bot className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {formatContent(message.content)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex mr-2">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NativeChatbot 