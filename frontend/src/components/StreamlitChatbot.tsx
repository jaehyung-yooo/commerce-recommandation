import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface StreamlitChatbotProps {
  streamlitUrl: string
  className?: string
}

function StreamlitChatbot({ 
  streamlitUrl = "http://localhost:8501", 
  className = "" 
}: StreamlitChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 챗봇 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-50 ${className}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* 챗봇 패널 */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[576px] h-[900px] bg-white rounded-lg shadow-xl border border-gray-200 z-40">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI 어시스턴트</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <iframe
            src={streamlitUrl}
            className="w-full h-[calc(100%-64px)] border-0"
            title="Streamlit Chatbot"
            allow="microphone; camera"
          />
        </div>
      )}
    </>
  )
}

export default StreamlitChatbot 