import { useState, useEffect } from 'react'
import { Star, TrendingUp, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import { productService, Product as ApiProduct } from '../services/product'

interface Product {
  id: string
  product_no: string
  name: string
  price: number
  rating: number
  image: string
  category: string
  description: string
  review_count: number
  brand: string
}

function HomePage() {
  const [activeTab, setActiveTab] = useState('trending')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([])
  const [totalPages, setTotalPages] = useState(0)
  
  const itemsPerPage = 6
  
  const tabs = [
    { id: 'trending', label: '인기 상품', icon: TrendingUp },
    { id: 'personalized', label: '개인화 추천', icon: Star },
  ]

  // 인기 상품 가져오기 (리뷰 개수 순)
  const fetchTrendingProducts = async (page: number = 1) => {
    try {
      const result = await productService.searchProducts({
        sort_by: 'popularity',
        sort_order: 'desc'
      }, page, itemsPerPage)
      
      if (result) {
        // API 응답을 로컬 Product 인터페이스로 변환
        const convertedProducts: Product[] = result.items.map((apiProduct: ApiProduct) => ({
          id: apiProduct.id,
          product_no: apiProduct.product_no || apiProduct.id, // product_no가 없으면 id 사용
          name: apiProduct.name,
          price: apiProduct.price,
          rating: apiProduct.rating || 0,
          image: apiProduct.image_url || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj7snbTsl4jsl4jsl4jsl4jsl4jsl4g8L3RleHQ+PC9zdmc+`,
          category: apiProduct.category || '기타',
          description: apiProduct.description || '상품 설명이 없습니다.',
          review_count: apiProduct.review_count || 0,
          brand: apiProduct.brand || '브랜드 정보 없음'
        }))
        
        setTrendingProducts(convertedProducts)
        return result
      }
      return null
    } catch (error) {
      console.error('Failed to fetch trending products:', error)
      setTrendingProducts([])
      return null
    }
  }

  // 개인화 추천 상품 가져오기 (평점 순)
  const fetchPersonalizedProducts = async (page: number = 1) => {
    try {
      const result = await productService.searchProducts({
        sort_by: 'rating',
        sort_order: 'desc'
      }, page, itemsPerPage)
      
      if (result) {
        // API 응답을 로컬 Product 인터페이스로 변환
        const convertedProducts: Product[] = result.items.map((apiProduct: ApiProduct) => ({
          id: apiProduct.id,
          product_no: apiProduct.product_no || apiProduct.id,
          name: apiProduct.name,
          price: apiProduct.price,
          rating: apiProduct.rating || 0,
          image: apiProduct.image_url || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj7snbTsl4jsl4jsl4jsl4jsl4jsl4g8L3RleHQ+PC9zdmc+`,
          category: apiProduct.category || '기타',
          description: apiProduct.description || '상품 설명이 없습니다.',
          review_count: apiProduct.review_count || 0,
          brand: apiProduct.brand || '브랜드 정보 없음'
        }))
        
        setPersonalizedProducts(convertedProducts)
        return result
      }
      return null
    } catch (error) {
      console.error('Failed to fetch personalized products:', error)
      setPersonalizedProducts([])
      return null
    }
  }

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true)
      const [trendingResult, personalizedResult] = await Promise.all([
        fetchTrendingProducts(1),
        fetchPersonalizedProducts(1)
      ])
      
      // 첫 페이지의 총 페이지 수 설정
      if (trendingResult && personalizedResult) {
        setTotalPages(Math.max(trendingResult.total_pages, personalizedResult.total_pages))
      }
      
      setLoading(false)
    }
    
    fetchAllProducts()
  }, [])

  // 현재 탭의 상품 가져오기
  useEffect(() => {
    const fetchCurrentTabProducts = async () => {
      setLoading(true)
      if (activeTab === 'trending') {
        await fetchTrendingProducts(currentPage)
      } else {
        await fetchPersonalizedProducts(currentPage)
      }
      setLoading(false)
    }
    
    if (currentPage > 1) {
      fetchCurrentTabProducts()
    }
  }, [activeTab, currentPage])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setCurrentPage(1) // 탭 변경 시 첫 페이지로
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i)
        }
      }
    }
    
    return pages.filter(page => page > 0 && page <= totalPages)
  }

  // 현재 탭에 따른 상품 목록
  const currentProducts = activeTab === 'trending' ? trendingProducts : personalizedProducts
  const currentTabLabel = activeTab === 'trending' ? '인기 상품' : '개인화 추천'
  const currentTabDescription = activeTab === 'trending' ? '(리뷰 개수 순)' : '(평점 순)'

  const formatPrice = (price: number) => {
    return `₩${Math.floor(price).toLocaleString()}`
  }

  const ProductCard = ({ product }: { product: Product }) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <Link to={`/products/${product.product_no}`}>
          <div className="relative aspect-square overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
              <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                상품 보기
              </span>
            </div>
          </div>
        </Link>
        
        <div className="p-4 flex flex-col h-full">
          <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
          
          <div className="mb-3">
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="flex items-center mb-4">
            {product.rating > 0 ? (
              <>
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 text-sm text-gray-600">
                  {product.rating.toFixed(1)} ({product.review_count})
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">평점 없음</span>
            )}
          </div>
          
          <div className="flex space-x-2 mt-auto">
            <Link 
              to={`/products/${product.product_no}`}
              className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              상품 보기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
  return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">상품 추천 시스템</h1>
            <p className="text-lg text-gray-600">리뷰 기반 인기 상품을 확인해보세요</p>
        </div>

          {/* 탭 네비게이션 */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                  activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
              </button>
            )
          })}
        </div>
          </div>
        </div>
        </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상품 섹션 */}
        <div className="mb-12">
                    <div className="flex items-center mb-6">
            <div className="flex items-center">
              {activeTab === 'trending' ? (
                <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
              ) : (
                <Star className="h-6 w-6 text-yellow-500 mr-2" />
              )}
              <h2 className="text-2xl font-bold text-gray-900">{currentTabLabel}</h2>
              <span className="ml-2 text-sm text-gray-500">{currentTabDescription}</span>
              </div>
          </div>

                    {currentProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-5 gap-6">
                {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

              {/* 페이징 */}
              {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </button>
            
                  {getPageNumbers().map((page) => (
                <button
                  key={page}
                      onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
                  ))}
            
            <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">상품을 불러오는 중입니다...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePage 