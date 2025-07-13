import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, CreditCard, Heart, ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Camera, Smartphone, Battery } from 'lucide-react'

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
  specifications: Record<string, string>
  reviews: Array<{
    id: string
    author: string
    rating: number
    comment: string
    date: string
  }>
}

interface ReviewCluster {
  id: string
  title: string
  summary: string
  icon: React.ReactNode
  reviewCount: number
  averageRating: number
  keywords: string[]
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const reviewsPerPage = 5

  useEffect(() => {
    // 실제로는 API에서 상품 상세 정보를 가져옴
    setTimeout(() => {
      // Mock data - 실제로는 API에서 가져올 데이터
      const mockProduct: Product = {
        id: id || '1',
        name: 'iPhone 15 Pro',
        price: 1200000,
        rating: 4.8,
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5pUGhvbmUgMTUgUHJvPC90ZXh0Pjx0ZXh0IHg9IjI1MCIgeT0iMjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj7mnaHsnY0g7J2066+c66e4PC90ZXh0Pjwvc3ZnPg==',
        category: 'electronics',
        description: '최신 A17 Pro 칩셋이 탑재된 프리미엄 스마트폰으로, 혁신적인 성능과 프로급 카메라 시스템을 제공합니다.',
        brand: 'Apple',
        discount: 10,
        reviewCount: 324,
        specifications: {
          '화면': '6.1인치 Super Retina XDR',
          '칩셋': 'A17 Pro',
          '저장용량': '128GB',
          '카메라': '48MP 메인 + 12MP 울트라와이드',
          '배터리': '비디오 재생 최대 23시간',
          '무게': '187g'
        },
        reviews: [
          {
            id: '1',
            author: '김민수',
            rating: 5,
            comment: '정말 만족스러운 제품입니다. 카메라 성능이 특히 뛰어나네요!',
            date: '2024-01-15'
          },
          {
            id: '2',
            author: '이영희',
            rating: 4,
            comment: '성능은 좋지만 가격이 좀 비싸네요. 그래도 추천합니다.',
            date: '2024-01-10'
          },
          {
            id: '3',
            author: '박철수',
            rating: 5,
            comment: '디자인이 정말 예쁘고 화질도 선명합니다. 추천해요!',
            date: '2024-01-08'
          },
          {
            id: '4',
            author: '정미나',
            rating: 4,
            comment: '배터리 수명이 정말 좋네요. 하루 종일 사용해도 충분합니다.',
            date: '2024-01-05'
          },
          {
            id: '5',
            author: '최동욱',
            rating: 5,
            comment: '프로 모델답게 모든 기능이 완벽합니다. 만족도 100%!',
            date: '2024-01-03'
          },
          {
            id: '6',
            author: '한소영',
            rating: 4,
            comment: '카메라 화질이 정말 좋아요. 야간 촬영도 깨끗하게 나와요.',
            date: '2024-01-02'
          },
          {
            id: '7',
            author: '오준혁',
            rating: 5,
            comment: '게임할 때 발열도 적고 성능도 끝내줍니다!',
            date: '2023-12-30'
          },
          {
            id: '8',
            author: '배수진',
            rating: 4,
            comment: '디자인과 성능 모두 만족스럽습니다. 추천해요.',
            date: '2023-12-28'
          },
          {
            id: '9',
            author: '임현우',
            rating: 5,
            comment: '프리미엄 스마트폰의 모든 것을 갖춘 완벽한 제품입니다.',
            date: '2023-12-25'
          },
          {
            id: '10',
            author: '서지혜',
            rating: 4,
            comment: '가격은 비싸지만 그만한 가치가 있는 제품이네요.',
            date: '2023-12-22'
          },
          {
            id: '11',
            author: '윤태민',
            rating: 5,
            comment: 'iOS 시스템이 정말 안정적이고 빠릅니다. 최고예요!',
            date: '2023-12-20'
          },
          {
            id: '12',
            author: '강민정',
            rating: 4,
            comment: '화면이 정말 선명하고 색감도 자연스럽습니다.',
            date: '2023-12-18'
          }
        ]
      }
      setProduct(mockProduct)
      setLoading(false)
    }, 1000)
  }, [id])

  const handlePurchase = async () => {
    if (!product) return
    
    try {
      // 구매 성공 알림
      alert(`${product.name} 구매가 완료되었습니다!\n총 가격: ₩${product.price.toLocaleString()}`)
      
      // TODO: 실제 구매 API 호출
      // await purchaseProduct(product.id)
      
      // 메인 화면으로 리다이렉트
      navigate('/')
    } catch (error) {
      console.error('구매 중 오류가 발생했습니다:', error)
      alert('구매 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // 페이징 계산
  const totalPages = Math.ceil((product?.reviews.length || 0) / reviewsPerPage)
  const startIndex = (currentPage - 1) * reviewsPerPage
  const endIndex = startIndex + reviewsPerPage
  const currentReviews = product?.reviews.slice(startIndex, endIndex) || []

  // 리뷰 클러스터링 요약 (실제로는 ML/NLP로 분석)
  const reviewClusters: ReviewCluster[] = [
    {
      id: 'performance',
      title: '성능 및 처리속도',
      summary: '대부분의 사용자가 A17 Pro 칩셋의 뛰어난 성능과 빠른 처리속도에 만족하고 있습니다. 게임과 멀티태스킹에서 특히 우수한 평가를 받고 있습니다.',
      icon: <TrendingUp className="h-5 w-5" />,
      reviewCount: 4,
      averageRating: 4.8,
      keywords: ['성능', '빠름', '게임', '처리속도']
    },
    {
      id: 'camera',
      title: '카메라 품질',
      summary: '카메라 성능에 대한 만족도가 매우 높습니다. 특히 야간 촬영과 화질의 선명도에서 우수한 평가를 받고 있으며, 프로급 촬영이 가능하다는 의견이 많습니다.',
      icon: <Camera className="h-5 w-5" />,
      reviewCount: 3,
      averageRating: 4.7,
      keywords: ['카메라', '화질', '야간촬영', '선명']
    },
    {
      id: 'design',
      title: '디자인 및 외관',
      summary: '세련된 디자인과 프리미엄한 외관에 대한 긍정적인 반응이 많습니다. 화면의 색감과 디스플레이 품질도 높은 평가를 받고 있습니다.',
      icon: <Smartphone className="h-5 w-5" />,
      reviewCount: 3,
      averageRating: 4.3,
      keywords: ['디자인', '외관', '화면', '색감']
    },
    {
      id: 'battery',
      title: '배터리 및 사용성',
      summary: '배터리 지속시간과 전반적인 사용성에 대해 만족스러운 평가를 받고 있습니다. 하루 종일 사용해도 충분한 배터리 성능을 제공합니다.',
      icon: <Battery className="h-5 w-5" />,
      reviewCount: 2,
      averageRating: 4.5,
      keywords: ['배터리', '지속시간', '사용성']
    }
  ]

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h2>
        <Link to="/products" className="text-primary-600 hover:text-primary-700">
          상품 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 뒤로가기 */}
      <Link 
        to="/products" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        상품 목록으로 돌아가기
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 제품 이미지 */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 제품 정보 */}
        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">{product.brand}</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span className="ml-1 text-lg text-gray-900">{product.rating}</span>
                <span className="ml-2 text-gray-600">({product.reviewCount}개 리뷰)</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                ₩{product.price.toLocaleString()}
              </span>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {product.description}
            </p>
          </div>

          {/* 구매 버튼들 */}
          <div className="flex space-x-4">
            <button 
              onClick={handlePurchase}
              className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              바로 구매하기
            </button>
            <button className="bg-gray-100 text-gray-700 p-3 rounded-lg hover:bg-gray-200 transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 상품 사양 */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">상품 사양</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="font-medium text-gray-900">{key}</dt>
                <dd className="text-gray-600">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* 고객 리뷰 */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">고객 리뷰</h2>
        
        {/* 리뷰 요약 클러스터 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">리뷰 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewClusters.map((cluster) => (
              <div key={cluster.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                 <div className="flex items-center mb-3">
                   <div className="text-primary-600 mr-2">
                     {cluster.icon}
                   </div>
                   <h4 className="font-medium text-gray-900">{cluster.title}</h4>
                 </div>
                <p className="text-sm text-gray-600 mb-3">{cluster.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords.map((keyword, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{cluster.reviewCount}개 리뷰</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 개별 리뷰 */}
        <div className="space-y-4">
          {currentReviews.map((review) => (
            <div key={review.id} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{review.author}</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">{review.date}</span>
              </div>
              <p className="text-gray-600">{review.comment}</p>
            </div>
          ))}
        </div>

        {/* 페이징 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetailPage 