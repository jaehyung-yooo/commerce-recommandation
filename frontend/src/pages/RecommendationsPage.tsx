import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Heart, Star, ShoppingCart } from 'lucide-react'

interface RecommendedProduct {
  id: string
  name: string
  price: number
  rating: number
  image: string
  category: string
  description: string
  reason: string
  confidence: number
}

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [recommendationType, setRecommendationType] = useState('personalized')

  // Mock data - 실제로는 추천 API에서 가져올 데이터
  useEffect(() => {
    // 실제 추천 API 호출 시뮬레이션
    setTimeout(() => {
      setRecommendations([
        {
          id: '1',
          name: '무선 이어폰 Pro',
          price: 250000,
          rating: 4.7,
          image: '/api/placeholder/200/200',
          category: 'electronics',
          description: '노이즈 캔슬링 기능이 탑재된 프리미엄 무선 이어폰',
          reason: '최근 스마트폰을 구매한 고객들이 함께 구매하는 제품',
          confidence: 0.92
        },
        {
          id: '2',
          name: '스마트워치 Series X',
          price: 450000,
          rating: 4.6,
          image: '/api/placeholder/200/200',
          category: 'electronics',
          description: '건강 관리와 피트니스 트래킹을 위한 스마트워치',
          reason: '유사한 취향의 고객들이 선호하는 제품',
          confidence: 0.88
        },
        {
          id: '3',
          name: '휴대용 충전기',
          price: 80000,
          rating: 4.8,
          image: '/api/placeholder/200/200',
          category: 'electronics',
          description: '고속 충전 지원 대용량 휴대용 배터리',
          reason: '전자기기 구매 고객들의 필수 아이템',
          confidence: 0.95
        },
        {
          id: '4',
          name: '블루투스 스피커',
          price: 180000,
          rating: 4.5,
          image: '/api/placeholder/200/200',
          category: 'electronics',
          description: '방수 기능이 있는 포터블 블루투스 스피커',
          reason: '음악 애호가들에게 인기가 높은 제품',
          confidence: 0.85
        },
      ])
      setLoading(false)
    }, 1000)
  }, [recommendationType])

  const recommendationTypes = [
    { value: 'personalized', label: '개인화 추천', icon: Sparkles },
    { value: 'trending', label: '인기 상품', icon: TrendingUp },
    { value: 'similar', label: '유사 고객 선호', icon: Heart },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Recommendations</h1>
        
        <div className="flex gap-2">
          {recommendationTypes.map(type => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                onClick={() => setRecommendationType(type.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  recommendationType === type.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-blue-800 font-medium">
            개인화된 추천 결과입니다. 구매 이력과 선호도를 기반으로 선별했습니다.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recommendations.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center flex-shrink-0">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
                  }}
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                    <span className="text-green-800 text-xs font-medium">
                      {Math.round(product.confidence * 100)}% 매치
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-primary-600">
                    ₩{product.price.toLocaleString()}
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <div className="flex items-start">
                    <Sparkles className="h-4 w-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{product.reason}</p>
                  </div>
                </div>
                
                <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Sparkles className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
          <p className="text-gray-600">Browse some products to get personalized recommendations.</p>
        </div>
      )}
    </div>
  )
}

export default RecommendationsPage 