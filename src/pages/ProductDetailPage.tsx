import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Truck, 
  Shield, 
  RotateCcw, 
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  rating: number
  images: string[]
  category: string
  description: string
  brand: string
  discount?: number
  reviewCount: number
  features: string[]
  specifications: Record<string, string>
  availability: 'in_stock' | 'out_of_stock' | 'limited'
}

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: string
  helpful: number
  images?: string[]
  verified: boolean
}

function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description')
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      // 실제 API 호출 시뮬레이션
      setTimeout(() => {
        const mockProduct: Product = {
          id: id,
          name: 'iPhone 15 Pro Max',
          price: 1200000,
          rating: 4.8,
          images: [
            'https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=iPhone+15+Pro+Max+Front',
            'https://via.placeholder.com/600x600/6B7280/FFFFFF?text=iPhone+15+Pro+Max+Back',
            'https://via.placeholder.com/600x600/8B5CF6/FFFFFF?text=iPhone+15+Pro+Max+Side',
            'https://via.placeholder.com/600x600/10B981/FFFFFF?text=iPhone+15+Pro+Max+Camera'
          ],
          category: 'electronics',
          description: `
            iPhone 15 Pro Max는 Apple의 가장 진보된 스마트폰입니다. 
            A17 Pro 칩, 향상된 카메라 시스템, 그리고 티타늄 디자인으로 
            최고의 성능과 품질을 제공합니다.
          `,
          brand: 'Apple',
          discount: 10,
          reviewCount: 1247,
          features: [
            '6.7인치 Super Retina XDR 디스플레이',
            'A17 Pro 칩',
            '48MP 메인 카메라',
            '5x 줌 테트라프리즘 카메라',
            'USB-C 커넥터',
            '티타늄 디자인'
          ],
          specifications: {
            '디스플레이': '6.7인치 Super Retina XDR',
            '칩': 'A17 Pro',
            '카메라': '48MP 메인, 12MP 초광각, 12MP 망원',
            '배터리': '최대 29시간 비디오 재생',
            '저장용량': '128GB, 256GB, 512GB, 1TB',
            '색상': '자연 티타늄, 블루 티타늄, 화이트 티타늄, 블랙 티타늄',
            '크기': '159.9 × 76.7 × 8.25mm',
            '무게': '221g'
          },
          availability: 'in_stock'
        }

        const mockReviews: Review[] = [
          {
            id: '1',
            userId: '1',
            userName: '김철수',
            rating: 5,
            comment: '정말 만족스러운 제품입니다. 카메라 성능이 특히 뛰어나고 배터리 지속시간도 좋습니다.',
            date: '2024-01-15',
            helpful: 23,
            verified: true
          },
          {
            id: '2',
            userId: '2',
            userName: '이영희',
            rating: 4,
            comment: '디자인이 세련되고 성능도 우수합니다. 다만 가격이 조금 비싸다는 점이 아쉽네요.',
            date: '2024-01-10',
            helpful: 18,
            verified: true
          },
          {
            id: '3',
            userId: '3',
            userName: '박민수',
            rating: 5,
            comment: '이전 모델과 비교해서 확실히 향상된 느낌입니다. 게임 성능도 매우 좋습니다.',
            date: '2024-01-05',
            helpful: 15,
            verified: false
          }
        ]

        setProduct(mockProduct)
        setReviews(mockReviews)
        setLoading(false)
      }, 1000)
    }
  }, [id])

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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">상품을 찾을 수 없습니다</h2>
        <p className="text-gray-600">요청하신 상품이 존재하지 않습니다.</p>
      </div>
    )
  }

  const discountedPrice = product.discount 
    ? product.price * (1 - product.discount / 100) 
    : product.price

  return (
    <div className="space-y-8">
      {/* Product Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.discount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium z-10">
                {product.discount}% OFF
              </div>
            )}
            <img 
              src={product.images[selectedImageIndex]} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDYwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMDAgMzAwTDMwMCAzMDBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
              }}
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full"
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(Math.min(product.images.length - 1, selectedImageIndex + 1))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 p-2 rounded-full"
                  disabled={selectedImageIndex === product.images.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEw0MCA0MFoiIHN0cm9rZT0iIzlDQTRBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg=='
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <span className="text-sm text-gray-500 font-medium">{product.brand}</span>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{product.name}</h1>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {product.rating} ({product.reviewCount} 리뷰)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-primary-600">
                ₩{discountedPrice.toLocaleString()}
              </span>
              {product.discount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ₩{product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-red-500 font-medium">
                    {product.discount}% 할인
                  </span>
                </>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {product.availability === 'in_stock' && '재고 있음'}
              {product.availability === 'out_of_stock' && '품절'}
              {product.availability === 'limited' && '수량 한정'}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">주요 특징</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-primary-600 rounded-full mr-3"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-900">수량:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button 
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center font-medium"
                disabled={product.availability === 'out_of_stock'}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                장바구니 담기
              </button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-3 rounded-lg border transition-colors ${
                  isWishlisted 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Truck className="h-4 w-4 mr-2" />
              <span>무료 배송 (주문금액 30,000원 이상)</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-2" />
              <span>정품 보증 및 A/S 지원</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <RotateCcw className="h-4 w-4 mr-2" />
              <span>7일 무료 반품/교환</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'description'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              상품 설명
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'specifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              제품 사양
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              리뷰 ({product.reviewCount})
            </button>
          </nav>
        </div>

        <div className="py-8">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-medium text-gray-900">{key}</span>
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
              
              {reviews.length === 0 && (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">아직 리뷰가 없습니다</h3>
                  <p className="text-gray-600">첫 번째 리뷰를 작성해보세요!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Review Card Component
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {review.userName.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{review.userName}</span>
              {review.verified && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  구매 확인
                </span>
              )}
            </div>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-500">{review.date}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 mb-4">{review.comment}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
            <ThumbsUp className="h-4 w-4" />
            <span>도움됨 ({review.helpful})</span>
          </button>
          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
            <ThumbsDown className="h-4 w-4" />
            <span>신고</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailPage 