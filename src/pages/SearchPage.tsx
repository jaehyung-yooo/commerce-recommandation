import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, Star, TrendingUp, MessageCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  rating: number
  image: string
  category: string
  description: string
  brand: string
  discount?: number
  reviewCount: number
  confidence?: number // Added for new mock data
  reviewInsight?: string // Added for new mock data
}

interface Recommendation {
  id: string
  product: Product
  reason: string
  confidence: number
  type: 'similar' | 'trending' | 'review_based'
}

function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reviewBasedRecommendations, setReviewBasedRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'results' | 'recommendations' | 'reviews'>('results')

  useEffect(() => {
    if (query) {
      setLoading(true)
      // 실제 API 호출 시뮬레이션
      setTimeout(() => {
        // 검색 결과
        const mockSearchResults: Product[] = [
          {
            id: '1',
            name: 'iPhone 15 Pro',
            price: 1200000,
            rating: 4.8,
            image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=iPhone+15+Pro',
            category: 'electronics',
            description: '최신 A17 Pro 칩셋이 탑재된 프리미엄 스마트폰',
            brand: 'Apple',
            discount: 10,
            reviewCount: 324
          },
          {
            id: '2',
            name: 'iPhone 14',
            price: 950000,
            rating: 4.6,
            image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=iPhone+14',
            category: 'electronics',
            description: '검증된 성능의 스마트폰',
            brand: 'Apple',
            reviewCount: 189
          }
        ]

        // 추천 상품
        const mockRecommendations: Recommendation[] = [
          {
            id: '3',
            product: {
              id: '3',
              name: 'AirPods Pro 2',
              price: 350000,
              rating: 4.7,
              image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=AirPods+Pro+2',
              category: 'electronics',
              description: '적응형 투명도 모드가 있는 무선 이어폰',
              brand: 'Apple',
              reviewCount: 156,
              confidence: 95
            },
            reason: `"${query}" 검색 고객들이 함께 본 상품`,
            confidence: 0.92,
            type: 'similar'
          },
          {
            id: '4',
            product: {
              id: '4',
              name: 'MacBook Air M3',
              price: 1500000,
              rating: 4.8,
              image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=MacBook+Air+M3',
              category: 'electronics',
              description: '13인치 MacBook Air with M3 칩',
              brand: 'Apple',
              reviewCount: 234,
              confidence: 88
            },
            reason: '현재 인기 급상승 중인 제품',
            confidence: 0.88,
            type: 'trending'
          }
        ]

        // 리뷰 기반 추천
        const mockReviewRecommendations: Recommendation[] = [
          {
            id: '5',
            product: {
              id: '5',
              name: 'iPad Pro',
              price: 1100000,
              rating: 4.9,
              image: 'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=iPad+Pro',
              category: 'electronics',
              description: 'M2 칩이 탑재된 프로급 태블릿',
              brand: 'Apple',
              reviewCount: 445,
              reviewInsight: '사진 편집과 디자인 작업에 탁월함'
            },
            reason: '리뷰에서 "성능이 좋다"는 평가가 많은 제품',
            confidence: 0.85,
            type: 'review_based'
          }
        ]

        setSearchResults(mockSearchResults)
        setRecommendations(mockRecommendations)
        setReviewBasedRecommendations(mockReviewRecommendations)
        setLoading(false)
      }, 1000)
    }
  }, [query])

  if (!query) {
    return (
      <div className="text-center py-12">
        <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">검색어를 입력해주세요</h2>
        <p className="text-gray-600">원하는 상품을 검색해보세요.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          "<span className="text-primary-600">{query}</span>" 검색 결과
        </h1>
        <p className="text-gray-600">
          총 {searchResults.length + recommendations.length + reviewBasedRecommendations.length}개의 결과
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('results')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'results'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            검색 결과 ({searchResults.length})
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-1" />
            추천 상품 ({recommendations.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-1" />
            리뷰 기반 추천 ({reviewBasedRecommendations.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'results' && (
          <div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-600">다른 검색어를 시도해보세요.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  "{query}" 검색 고객들이 관심있어 하는 상품들입니다.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  실제 구매 고객들의 리뷰를 분석한 추천 상품입니다.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reviewBasedRecommendations.map(rec => (
                <RecommendationCard key={rec.id} recommendation={rec} showReviewBadge />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
            {product.discount}% OFF
          </div>
        )}
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTUwTDE1MCAxNTBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
          }}
        />
      </div>
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500 font-medium">{product.brand}</span>
          <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-2">
          <div>
            {product.discount ? (
              <div>
                <span className="text-lg font-bold text-primary-600">
                  ₩{(product.price * (1 - product.discount / 100)).toLocaleString()}
                </span>
                <span className="text-sm text-gray-400 line-through ml-2">
                  ₩{product.price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary-600">
                ₩{product.price.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          리뷰 {product.reviewCount}개
        </div>
      </div>
    </div>
  )
}

// Recommendation Card Component
function RecommendationCard({ 
  recommendation, 
  showReviewBadge = false 
}: { 
  recommendation: Recommendation
  showReviewBadge?: boolean 
}) {
  const { product, reason, confidence } = recommendation

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-32 h-32 bg-gray-100 relative overflow-hidden flex-shrink-0">
          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
              {product.discount}% OFF
            </div>
          )}
          {showReviewBadge && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
              리뷰 추천
            </div>
          )}
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTUwTDE1MCAxNTBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
            }}
          />
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs text-gray-500 font-medium">{product.brand}</span>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
            </div>
            <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
              <span className="text-green-800 text-xs font-medium">
                {Math.round(confidence * 100)}% 매치
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{product.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              {product.discount ? (
                <div>
                  <span className="text-lg font-bold text-primary-600">
                    ₩{(product.price * (1 - product.discount / 100)).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400 line-through ml-2">
                    ₩{product.price.toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-primary-600">
                  ₩{product.price.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
              <span className="ml-1 text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg mb-3">
            <div className="flex items-start">
              <TrendingUp className="h-4 w-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{reason}</p>
            </div>
          </div>
          
          <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm">
            장바구니 담기
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchPage 