import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, TrendingUp, Users, ShoppingCart, ArrowRight } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import CategoryTabs from '../components/CategoryTabs'
import LoginModal from '../components/LoginModal'

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
}

interface User {
  email: string
  name: string
}

function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 실제로는 API에서 사용자 정보와 추천 상품을 가져옴
    setTimeout(() => {
      // 추천 상품 데이터
      const mockRecommended: Product[] = [
        {
          id: '1',
          name: 'iPhone 15 Pro',
          price: 1200000,
          rating: 4.8,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5pUGhvbmUgMTUgUHJvPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj7ijKnkjKjmm7zlkIjmi4HqprQ8L3RleHQ+PC9zdmc+',
          category: 'electronics',
          description: '최신 A17 Pro 칩셋이 탑재된 프리미엄 스마트폰',
          brand: 'Apple',
          discount: 10,
          reviewCount: 324
        },
        {
          id: '2',
          name: 'MacBook Air M3',
          price: 1500000,
          rating: 4.7,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNkI3MjgwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5NYWNCb29rIEFpcjwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+TTMg7LmpPC90ZXh0Pjwvc3ZnPg==',
          category: 'electronics',
          description: '13인치 MacBook Air with M3 칩',
          brand: 'Apple',
          reviewCount: 156
        },
        {
          id: '3',
          name: 'AirPods Pro 2',
          price: 350000,
          rating: 4.6,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI1Q0Y2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BaXJQb2RzIFBybzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+MuqzvDwvdGV4dD48L3N2Zz4=',
          category: 'electronics',
          description: '무선 이어폰',
          brand: 'Apple',
          reviewCount: 89
        },
        {
          id: '4',
          name: 'Galaxy S24 Ultra',
          price: 1300000,
          rating: 4.6,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMTBCOTgxIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5HYWxheHkgUzI0PC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj5VbHRyYTwvdGV4dD48L3N2Zz4=',
          category: 'electronics',
          description: 'AI 기반 스마트폰의 새로운 표준',
          brand: 'Samsung',
          discount: 15,
          reviewCount: 203
        },
      ]

      // 인기 상품 데이터
      const mockTrending: Product[] = [
        {
          id: '5',
          name: 'Nike Air Max 90',
          price: 150000,
          rating: 4.5,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRUY0NDQ0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5OaWtlIEFpcjwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+TWF4IDkwPC90ZXh0Pjwvc3ZnPg==',
          category: 'sports',
          description: '클래식한 디자인의 러닝화',
          brand: 'Nike',
          reviewCount: 445
        },
        {
          id: '6',
          name: 'Adidas Stan Smith',
          price: 120000,
          rating: 4.4,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjU5RTBCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BZGlkYXM8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPlN0YW4gU21pdGg8L3RleHQ+PC9zdmc+',
          category: 'sports',
          description: '시대를 초월한 스니커즈',
          brand: 'Adidas',
          discount: 20,
          reviewCount: 667
        },
        {
          id: '7',
          name: 'Sony WH-1000XM5',
          price: 400000,
          rating: 4.9,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI1Q0Y2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Tb255IFdIPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj4xMDAwWE01PC90ZXh0Pjwvc3ZnPg==',
          category: 'electronics',
          description: '업계 최고의 노이즈 캔슬링 헤드폰',
          brand: 'Sony',
          reviewCount: 234
        },
        {
          id: '8',
          name: 'Uniqlo 울 니트',
          price: 45000,
          rating: 4.3,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRUM0ODk5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5VbmlxbG88L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPuyauCDri4jtirgJL3RleHQ+PC9zdmc+',
          category: 'fashion',
          description: '부드럽고 따뜻한 울 소재 니트',
          brand: 'Uniqlo',
          discount: 25,
          reviewCount: 156
        },
      ]

      setRecommendedProducts(mockRecommended)
      setTrendingProducts(mockTrending)
      setLoading(false)
    }, 1000)
  }, [])

  const handleLogin = (email: string, password: string) => {
    // 실제 로그인 로직
    console.log('Login:', email, password)
    setUser({
      email,
      name: email.split('@')[0]
    })
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <div className="space-y-8">
      {/* 테스트 링크 추가 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 라우팅 테스트</h3>
        <div className="flex flex-col space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-2">✅ 올바른 경로들:</p>
            <div className="flex space-x-4">
              <Link 
                to="/product/1" 
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                /product/1
              </Link>
              <Link 
                to="/product/2" 
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                /product/2
              </Link>
              <Link 
                to="/category/electronics" 
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                /category/electronics
              </Link>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-gray-600 mb-2">❌ 잘못된 경로 (404 테스트):</p>
            <div className="flex space-x-4">
              <Link 
                to="/products/1" 
                className="text-red-600 hover:text-red-800 underline text-sm"
              >
                /products/1 (잘못된 경로)
              </Link>
              <Link 
                to="/nonexistent" 
                className="text-red-600 hover:text-red-800 underline text-sm"
              >
                /nonexistent
              </Link>
            </div>
          </div>
          
          <div>
            <p className="text-xs text-gray-600 mb-2">🔘 버튼 테스트:</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  console.log('Button clicked - navigating to /product/1')
                  window.location.href = '/product/1'
                }}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                버튼으로 /product/1 이동
              </button>
              <button 
                onClick={() => {
                  console.log('Alert button clicked!')
                  alert('클릭이 작동합니다! 현재 URL: ' + window.location.href)
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                클릭 테스트 + URL 확인
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Welcome Message */}
          <div className="mb-6">
            {user ? (
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                안녕하세요, <span className="text-primary-600">{user.name}</span>님! 👋
              </h1>
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                AI가 추천하는 맞춤 쇼핑을 경험해보세요
              </h1>
            )}
            <p className="text-lg text-gray-600 mb-8">
              개인화된 상품 추천으로 원하는 제품을 쉽고 빠르게 찾아보세요
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchBar placeholder="어떤 상품을 찾고 계신가요?" />
          </div>

          {/* Login/Logout Button */}
          <div className="flex justify-center">
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
              >
                로그인하고 더 많은 혜택 받기
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs />

      {/* Personalized Recommendations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2 fill-current" />
              {user ? `${user.name}님을 위한 추천` : '인기 추천 상품'}
            </h2>
            <p className="text-gray-600 mt-1">
              {user 
                ? '구매 이력과 관심사를 바탕으로 선별한 상품들입니다' 
                : '많은 고객들이 선택한 인기 상품들을 만나보세요'
              }
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            더보기
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 aspect-square rounded-lg mb-4"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-6">
            {recommendedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              지금 인기 상품
            </h2>
            <p className="text-gray-600 mt-1">
              실시간으로 많이 찾고 있는 트렌드 상품들
            </p>
          </div>
          <Link
            to="/category/trending"
            className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            더보기
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {trendingProducts.map(product => (
            <ProductCard key={product.id} product={product} showTrendingBadge />
          ))}
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          신뢰받는 쇼핑 플랫폼
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">10,000+</div>
            <div className="text-gray-600">상품</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">50,000+</div>
            <div className="text-gray-600">사용자</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">95%</div>
            <div className="text-gray-600">추천 정확도</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-gray-600">고객 지원</div>
          </div>
        </div>
      </section>

      {/* Special Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI 개인화 추천
          </h3>
          <p className="text-gray-600 text-sm">
            머신러닝 알고리즘으로 당신의 취향에 맞는 상품을 정확하게 추천합니다.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            실시간 트렌드
          </h3>
          <p className="text-gray-600 text-sm">
            지금 가장 인기있는 상품들을 실시간으로 확인하고 놓치지 마세요.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            협업 필터링
          </h3>
          <p className="text-gray-600 text-sm">
            비슷한 취향의 고객들이 좋아한 상품을 추천받아보세요.
          </p>
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  )
}

// Product Card Component
function ProductCard({ 
  product, 
  showTrendingBadge = false 
}: { 
  product: Product
  showTrendingBadge?: boolean 
}) {
  const handleClick = (e: React.MouseEvent) => {
    console.log('ProductCard clicked!', product.id, product.name)
  }

  const handleDetailClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('상세보기 버튼 클릭!', product.id, product.name)
    window.location.href = `/products/${product.id}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      <Link 
        to={`/products/${product.id}`} 
        className="block group"
        onClick={handleClick}
      >
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
              {product.discount}% OFF
            </div>
          )}
          {showTrendingBadge && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
              인기
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
          {/* 호버시 상세보기 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              클릭해서 상세보기
            </span>
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500 font-medium">{product.brand}</span>
          <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
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
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mb-3">
          리뷰 {product.reviewCount}개
        </div>

        {/* 명확한 상세보기 버튼 */}
        <div className="flex space-x-2">
          <button
            onClick={handleDetailClick}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            📱 상세보기
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('장바구니 추가:', product.name)
              alert(`${product.name}을(를) 장바구니에 추가했습니다!`)
            }}
            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage 