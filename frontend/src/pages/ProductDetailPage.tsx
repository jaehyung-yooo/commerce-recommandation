import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, CreditCard, Heart, ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, Camera, Smartphone, Battery } from 'lucide-react'
import { productService, Product } from '../services/product'
import { reviewService, Review } from '../services/review'

interface ReviewSummary {
  category: string;
  title: string;
  description: string;
  count: number;
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const reviewsPerPage = 20

  // 리뷰 요약 모킹 데이터
  const reviewSummary: ReviewSummary[] = [
    {
      category: "품질",
      title: "품질이 좋아요",
      description: "상품의 품질에 대한 긍정적인 리뷰",
      count: 45
    },
    {
      category: "가격",
      title: "가격 대비 만족",
      description: "가격 대비 만족도가 높은 리뷰",
      count: 32
    },
    {
      category: "배송",
      title: "빠른 배송",
      description: "배송 속도와 서비스에 대한 긍정적 평가",
      count: 28
    },
    {
      category: "디자인",
      title: "디자인이 예뻐요",
      description: "상품의 디자인과 외관에 대한 호평",
      count: 25
    }
  ]

  // URL 파라미터의 id를 product_no로 사용
  const productNo = id

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productNo) return
      
      try {
        setLoading(true)
        setError(null)
        
        // API에서 상품 상세 정보 가져오기
        const productData = await productService.getProductById(productNo)
        setProduct(productData)
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setError('상품 정보를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productNo])

  // 리뷰 데이터 가져오기
  const fetchReviews = async (page: number = 1) => {
    if (!productNo) return
    
    try {
      setReviewsLoading(true)
      const reviewData = await reviewService.getProductReviews(productNo, page)
      setReviews(reviewData.items)
      setTotalPages(reviewData.total_pages)
      setTotalReviews(reviewData.total)
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
      setReviews([])
      setTotalPages(0)
      setTotalReviews(0)
    } finally {
      setReviewsLoading(false)
    }
  }

  // 상품 정보 로드 후 리뷰 가져오기
  useEffect(() => {
    if (product && productNo) {
      fetchReviews(currentPage)
    }
  }, [product, productNo, currentPage])

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

  // 현재 페이지의 리뷰들
  const currentReviews = reviews



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

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/products" className="text-primary-600 hover:text-primary-700">
          상품 목록으로 돌아가기
        </Link>
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
              src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjI1MCIgeT0iMjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIj7snbTsl4jsoJXsnYw8L3RleHQ+PC9zdmc+'} 
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
                <span className="ml-1 text-lg text-gray-900">{product.rating || 0}</span>
                <span className="ml-2 text-gray-600">({product.review_count || 0}개 리뷰)</span>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                ₩{Math.floor(Number(product.price)).toLocaleString()}
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



      {/* 고객 리뷰 */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">고객 리뷰</h2>
        
        {/* 리뷰 요약 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">리뷰 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviewSummary.map((summary, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {summary.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {summary.count}명
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {summary.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {summary.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 개별 리뷰 */}
        <div className="space-y-4">
          {reviewsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : currentReviews.length > 0 ? (
            currentReviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {review.member?.name || `회원${review.member_id || '익명'}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      (ID: {review.member_id || 'N/A'})
                    </span>
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
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600">{review.content}</p>
                {review.helpful_count > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    도움됨 {review.helpful_count}명
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              아직 리뷰가 없습니다.
            </div>
          )}
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

            {/* 페이지 번호들 (최대 5개씩) */}
            {(() => {
              const pages = []
              const maxVisiblePages = 5
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
              
              // 시작 페이지 조정
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1)
              }
              
              // 첫 페이지가 1이 아니면 "..." 표시
              if (startPage > 1) {
                pages.push(
                  <button
                    key="first"
                    onClick={() => goToPage(1)}
                    className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    1
                  </button>
                )
                if (startPage > 2) {
                  pages.push(
                    <span key="dots1" className="px-2 text-gray-500">
                      ...
                    </span>
                  )
                }
              }
              
              // 페이지 번호들
              for (let page = startPage; page <= endPage; page++) {
                pages.push(
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
              }
              
              // 마지막 페이지가 totalPages가 아니면 "..." 표시
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="dots2" className="px-2 text-gray-500">
                      ...
                    </span>
                  )
                }
                pages.push(
                  <button
                    key="last"
                    onClick={() => goToPage(totalPages)}
                    className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                )
              }
              
              return pages
            })()}

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