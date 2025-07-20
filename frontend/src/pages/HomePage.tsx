import { useState, useEffect } from 'react'
import { Star, TrendingUp, Users, Eye, ArrowRight, Heart, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'

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
  likes: number
  isLiked: boolean
}

function HomePage() {
  const [activeTab, setActiveTab] = useState('personalized')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [allProducts, setAllProducts] = useState<{ [key: string]: Product[] }>({})
  
  const itemsPerPage = 6
  const tabs = [
    { id: 'personalized', label: '개인화 추천', icon: Sparkles },
    { id: 'trending', label: '인기 상품', icon: TrendingUp },
    { id: 'similar', label: '유사 고객 선호', icon: Heart },
  ]

  useEffect(() => {
    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      const personalizedProducts: Product[] = [
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
          reviewCount: 324,
          likes: 120,
          isLiked: false
        },
        {
          id: '2',
          name: 'MacBook Air M3',
          price: 1500000,
          rating: 4.7,
          image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=MacBook+Air+M3',
          category: 'electronics',
          description: '13인치 MacBook Air with M3 칩',
          brand: 'Apple',
          reviewCount: 156,
          likes: 80,
          isLiked: false
        },
        {
          id: '3',
          name: 'AirPods Pro 2',
          price: 350000,
          rating: 4.6,
          image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=AirPods+Pro+2',
          category: 'electronics',
          description: '능동형 소음 차단 기능이 있는 무선 이어폰',
          brand: 'Apple',
          reviewCount: 89,
          likes: 50,
          isLiked: false
        },
        {
          id: '4',
          name: 'iPad Pro 12.9"',
          price: 1400000,
          rating: 4.7,
          image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=iPad+Pro+12.9',
          category: 'electronics',
          description: '프로페셔널을 위한 최고의 태블릿',
          brand: 'Apple',
          reviewCount: 276,
          likes: 180,
          isLiked: false
        },
        {
          id: '5',
          name: 'Apple Watch Series 9',
          price: 500000,
          rating: 4.5,
          image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Apple+Watch+Series+9',
          category: 'electronics',
          description: '건강과 피트니스의 완벽한 파트너',
          brand: 'Apple',
          reviewCount: 189,
          likes: 100,
          isLiked: false
        },
        {
          id: '6',
          name: 'AirPods Max',
          price: 650000,
          rating: 4.6,
          image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=AirPods+Max',
          category: 'electronics',
          description: '최고급 오버이어 헤드폰',
          brand: 'Apple',
          reviewCount: 134,
          likes: 70,
          isLiked: false
        },
        {
          id: '7',
          name: 'Mac Studio',
          price: 2500000,
          rating: 4.8,
          image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Mac+Studio',
          category: 'electronics',
          description: '전문가를 위한 데스크톱 컴퓨터',
          brand: 'Apple',
          reviewCount: 87,
          likes: 90,
          isLiked: false
        },
        {
          id: '8',
          name: 'Studio Display',
          price: 1800000,
          rating: 4.6,
          image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Studio+Display',
          category: 'electronics',
          description: '27인치 5K 레티나 디스플레이',
          brand: 'Apple',
          reviewCount: 156,
          likes: 110,
          isLiked: false
        }
      ]

             const trendingProducts: Product[] = [
         {
           id: '9',
           name: 'Galaxy S24 Ultra',
           price: 1300000,
           rating: 4.6,
           image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Galaxy+S24+Ultra',
           category: 'electronics',
           description: 'AI 기반 스마트폰의 새로운 표준',
           brand: 'Samsung',
           discount: 15,
           reviewCount: 1203,
           likes: 200,
           isLiked: false
         },
         {
           id: '10',
           name: 'Sony WH-1000XM5',
           price: 400000,
           rating: 4.9,
           image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Sony+WH-1000XM5',
           category: 'electronics',
           description: '업계 최고의 노이즈 캔슬링 헤드폰',
           brand: 'Sony',
           reviewCount: 2234,
           likes: 150,
           isLiked: false
         },
         {
           id: '11',
           name: 'Nintendo Switch OLED',
           price: 420000,
           rating: 4.5,
           image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Nintendo+Switch',
           category: 'gaming',
           description: '7인치 OLED 스크린의 휴대용 게임 콘솔',
           brand: 'Nintendo',
           reviewCount: 1445,
           likes: 100,
           isLiked: false
         },
         {
           id: '12',
           name: 'LG 55" OLED TV',
           price: 1800000,
           rating: 4.7,
           image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=LG+55+OLED+TV',
           category: 'electronics',
           description: '완벽한 블랙과 무한 명암비',
           brand: 'LG',
           discount: 20,
           reviewCount: 876,
           likes: 120,
           isLiked: false
         },
         {
           id: '13',
           name: 'DJI Mini 4 Pro',
           price: 900000,
           rating: 4.8,
           image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=DJI+Mini+4+Pro',
           category: 'electronics',
           description: '프로페셔널 드론 촬영',
           brand: 'DJI',
           reviewCount: 567,
           likes: 80,
           isLiked: false
         },
         {
           id: '14',
           name: 'Dyson V15 Detect',
           price: 800000,
           rating: 4.6,
           image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Dyson+V15+Detect',
           category: 'home',
           description: '레이저로 먼지를 감지하는 무선 청소기',
           brand: 'Dyson',
           reviewCount: 1234,
           likes: 110,
           isLiked: false
         },
         {
           id: '21',
           name: 'PlayStation 5',
           price: 650000,
           rating: 4.8,
           image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=PlayStation+5',
           category: 'gaming',
           description: '차세대 게임 콘솔',
           brand: 'Sony',
           reviewCount: 2567,
           likes: 200,
           isLiked: false
         },
         {
           id: '22',
           name: 'Xbox Series X',
           price: 600000,
           rating: 4.7,
           image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Xbox+Series+X',
           category: 'gaming',
           description: '4K 게이밍의 완성',
           brand: 'Microsoft',
           reviewCount: 1890,
           likes: 150,
           isLiked: false
         },
         {
           id: '23',
           name: 'Apple TV 4K',
           price: 200000,
           rating: 4.5,
           image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Apple+TV+4K',
           category: 'electronics',
           description: '최고의 스트리밍 경험',
           brand: 'Apple',
           reviewCount: 756,
           likes: 100,
           isLiked: false
         },
         {
           id: '24',
           name: 'Samsung Galaxy Buds Pro',
           price: 250000,
           rating: 4.4,
           image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Galaxy+Buds+Pro',
           category: 'electronics',
           description: '프리미엄 무선 이어폰',
           brand: 'Samsung',
           discount: 10,
           reviewCount: 1456,
           likes: 120,
           isLiked: false
         },
         {
           id: '25',
           name: 'Google Pixel 8 Pro',
           price: 1100000,
           rating: 4.6,
           image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Google+Pixel+8+Pro',
           category: 'electronics',
           description: 'AI 사진 촬영의 새로운 기준',
           brand: 'Google',
           reviewCount: 987,
           likes: 90,
           isLiked: false
         },
         {
           id: '26',
           name: 'Meta Quest 3',
           price: 700000,
           rating: 4.5,
           image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=Meta+Quest+3',
           category: 'electronics',
           description: '차세대 VR 헤드셋',
           brand: 'Meta',
           reviewCount: 834,
           likes: 110,
           isLiked: false
         }
       ]

             const similarProducts: Product[] = [
         {
           id: '15',
           name: 'Bose QuietComfort 45',
           price: 350000,
           rating: 4.5,
           image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Bose+QuietComfort+45',
           category: 'electronics',
           description: '편안한 착용감의 노이즈 캔슬링 헤드폰',
           brand: 'Bose',
           reviewCount: 889,
           likes: 80,
           isLiked: false
         },
         {
           id: '16',
           name: 'Microsoft Surface Pro 9',
           price: 1200000,
           rating: 4.4,
           image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=Microsoft+Surface+Pro+9',
           category: 'electronics',
           description: '2-in-1 노트북과 태블릿',
           brand: 'Microsoft',
           reviewCount: 456,
           likes: 60,
           isLiked: false
         },
         {
           id: '17',
           name: 'Canon EOS R5',
           price: 4500000,
           rating: 4.8,
           image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Canon+EOS+R5',
           category: 'electronics',
           description: '전문가용 미러리스 카메라',
           brand: 'Canon',
           reviewCount: 234,
           likes: 70,
           isLiked: false
         },
         {
           id: '18',
           name: 'Tesla Model Y',
           price: 65000000,
           rating: 4.7,
           image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Tesla+Model+Y',
           category: 'automotive',
           description: '전기차의 새로운 표준',
           brand: 'Tesla',
           reviewCount: 1567,
           likes: 200,
           isLiked: false
         },
         {
           id: '19',
           name: 'Rolex Submariner',
           price: 12000000,
           rating: 4.9,
           image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Rolex+Submariner',
           category: 'luxury',
           description: '시계의 전설, 영원한 클래식',
           brand: 'Rolex',
           reviewCount: 89,
           likes: 90,
           isLiked: false
         },
         {
           id: '20',
           name: 'Herman Miller Aeron',
           price: 1500000,
           rating: 4.6,
           image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Herman+Miller+Aeron',
           category: 'furniture',
           description: '인체공학적 프리미엄 오피스 체어',
           brand: 'Herman Miller',
           reviewCount: 445,
           likes: 100,
           isLiked: false
         },
         {
           id: '27',
           name: 'Bang & Olufsen Beoplay H95',
           price: 900000,
           rating: 4.7,
           image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Bang+Olufsen+H95',
           category: 'electronics',
           description: '럭셔리 노이즈 캔슬링 헤드폰',
           brand: 'Bang & Olufsen',
           reviewCount: 167,
           likes: 80,
           isLiked: false
         },
         {
           id: '28',
           name: 'Leica Q2',
           price: 6500000,
           rating: 4.9,
           image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Leica+Q2',
           category: 'electronics',
           description: '독일 명품 컴팩트 카메라',
           brand: 'Leica',
           reviewCount: 123,
           likes: 70,
           isLiked: false
         },
         {
           id: '29',
           name: 'Porsche Taycan',
           price: 120000000,
           rating: 4.8,
           image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Porsche+Taycan',
           category: 'automotive',
           description: '스포츠카의 전기차 혁명',
           brand: 'Porsche',
           reviewCount: 456,
           likes: 150,
           isLiked: false
         },
         {
           id: '30',
           name: 'Patek Philippe Aquanaut',
           price: 35000000,
           rating: 4.9,
           image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Patek+Philippe+Aquanaut',
           category: 'luxury',
           description: '최고급 스위스 시계',
           brand: 'Patek Philippe',
           reviewCount: 34,
           likes: 100,
           isLiked: false
         },
         {
           id: '31',
           name: 'Eames Lounge Chair',
           price: 8000000,
           rating: 4.8,
           image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=Eames+Lounge+Chair',
           category: 'furniture',
           description: '20세기 디자인의 걸작',
           brand: 'Herman Miller',
           reviewCount: 234,
           likes: 90,
           isLiked: false
         },
         {
           id: '32',
           name: 'Hermès Birkin Bag',
           price: 25000000,
           rating: 4.9,
           image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=Hermes+Birkin+Bag',
           category: 'luxury',
           description: '명품 가방의 최고봉',
           brand: 'Hermès',
           reviewCount: 78,
           likes: 110,
           isLiked: false
         },
         {
           id: '33',
           name: 'Sonos Arc',
           price: 900000,
           rating: 4.6,
           image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Sonos+Arc',
           category: 'electronics',
           description: '프리미엄 사운드바',
           brand: 'Sonos',
           reviewCount: 1234,
           likes: 100,
           isLiked: false
         },
         {
           id: '34',
           name: 'Dyson Airwrap',
           price: 650000,
           rating: 4.5,
           image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Dyson+Airwrap',
           category: 'beauty',
           description: '혁신적인 헤어 스타일링 도구',
           brand: 'Dyson',
           reviewCount: 2345,
           likes: 120,
           isLiked: false
         }
       ]
      
      setAllProducts({
        personalized: personalizedProducts,
        trending: trendingProducts,
        similar: similarProducts
      })
      setLoading(false)
    }, 1000)
  }, [])

  // 현재 탭의 상품들
  const currentProducts = allProducts[activeTab] || []
  
  // 페이징 계산
  const totalPages = Math.ceil(currentProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageProducts = currentProducts.slice(startIndex, endIndex)

  // 탭 변경 시 페이지 리셋
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setCurrentPage(1)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price)
  }

  const handleLikeToggle = (productId: string) => {
    setAllProducts(prevProducts => {
      const updatedProducts = { ...prevProducts }
      Object.keys(updatedProducts).forEach(key => {
        updatedProducts[key] = updatedProducts[key].map(product => 
          product.id === productId 
            ? { ...product, isLiked: !product.isLiked, likes: product.isLiked ? product.likes - 1 : product.likes + 1 }
            : product
        )
      })
      return updatedProducts
    })
  }

  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <Link to={`/products/${product.id}`} className="block">
          <div className="relative overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium text-gray-600">
              {product.brand}
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
              <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                클릭해서 상세보기
              </span>
            </div>
          </div>
        </Link>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-primary-600">
              ₩{product.price.toLocaleString()}
            </span>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Heart className="h-4 w-4 text-red-400 mr-1" />
              <span>{product.likes}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Link 
              to={`/products/${product.id}`}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm text-center flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              상세보기
            </Link>
            <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLikeToggle(product.id)
              }}
              className={`p-2 rounded-lg transition-colors ${
                product.isLiked 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={product.isLiked ? '좋아요 취소' : '좋아요'}
            >
              <Heart className={`h-4 w-4 ${product.isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Commerce Recommendation
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover personalized product recommendations powered by advanced machine learning algorithms.
          Find exactly what you're looking for with our intelligent recommendation system.
        </p>
        <div className="max-w-2xl mx-auto">
          <SearchBar 
            placeholder="상품, 브랜드를 검색해보세요"
            className="mb-4"
          />
          <p className="text-sm text-gray-500">
            AI가 분석한 맞춤형 상품 추천을 확인하거나 원하는 상품을 직접 검색해보세요
          </p>
        </div>
      </div>

      {/* Recommended Products Section */}
      <section className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <Star className="h-8 w-8 text-yellow-500 mr-3 fill-current" />
              당신을 위한 추천 상품
            </h2>
            <p className="text-gray-600 mt-2">
              AI가 분석한 맞춤형 상품을 만나보세요
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow-sm p-4">
                <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-300 h-4 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-300 h-6 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {currentPageProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage 