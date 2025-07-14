import { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string) => void
}

function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      if (isSignup) {
        // 회원가입
        await authService.register({
          email,
          password,
          password_confirm: password
        })
        setIsSignup(false)
        setError('')
        // 회원가입 성공 후 로그인으로 전환
      } else {
        // 로그인
        await authService.login({ email, password })
        onLogin(email)
        onClose()
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (provider: 'google' | 'kakao' | 'naver') => {
    console.log(`${provider} 로그인 시도`)
    // 실제 소셜 로그인 구현
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isSignup ? '회원가입' : '로그인'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img 
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDhWMTJIMTVDMTQuNzUgMTMuMjUgMTMuNSAxNCAxMi4yNSAxNEMxMC44NzUgMTQgOS42MjUgMTIuNzUgOS42MjUgMTEuMjVDOS42MjUgOS43NSAxMC44NzUgOC41IDEyLjI1IDguNUMxMy4xMjUgOC41IDEzLjg3NSA4Ljg3NSAxNC4zNzUgOS41TDE3IDdDMTUuNSA1LjUgMTMuNjI1IDQuNzUgMTIuMjUgNC43NUM3LjUgNC43NSAzLjc1IDguNTI1IDMuNzUgMTIuMjVDMy43NSAxNiA3LjUgMTkuNzUgMTIuMjUgMTkuNzVDMTYuNzUgMTkuNzUgMjAuMjUgMTYuMjUgMjAuMjUgMTEuNzVWMTBIMTBaIiBmaWxsPSIjNEI5NEZGIi8+Cjwvc3ZnPgo="
                alt="Google"
                className="w-5 h-5 mr-3" 
              />
              <span className="text-sm font-medium text-gray-700">Google로 계속하기</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('kakao')}
              className="w-full flex items-center justify-center px-4 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-900">카카오로 계속하기</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('naver')}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">네이버로 계속하기</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            {!isSignup && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  비밀번호 찾기
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isSignup ? '회원가입' : '로그인'
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              {isSignup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
            </span>
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="ml-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {isSignup ? '로그인' : '회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal 