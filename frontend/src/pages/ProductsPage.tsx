import { useState, useEffect } from 'react'
import { Heart, Star, Eye, Filter, ChevronLeft, ChevronRight, Search, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import { productService, Product as ApiProduct, ProductSearchParams, Category } from '../services/product'

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

type TabType = 'keyword' | 'review'

function ProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('keyword')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])

  // 카테고리 데이터 가져오기
  const fetchCategories = async () => {
    try {
      const result = await productService.getCategories()
      // 상품이 있는 카테고리들만 필터링 (depth > 0인 것들)
      const productCategories = result.items.filter(cat => cat.depth > 0)
      console.log('Fetched categories:', productCategories.map(cat => ({ name: cat.category_name, depth: cat.depth })))
      setCategories(productCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // 기본 카테고리 설정
      setCategories([
        { category_id: 0, category_name: '전체', depth: 0 }
      ])
    }
  }

  // API에서 상품 데이터 가져오기
  const fetchProducts = async (tab: TabType, query: string = '', page: number = 1) => {
    try {
      setLoading(true)
      let result
      
      if (tab === 'keyword') {
        // 정렬 파라미터 매핑
        let sortByParam = 'created_at'
        let sortOrder = 'desc'
        
        switch (sortBy) {
          case 'name':
            sortByParam = 'name'
            sortOrder = 'asc'
            break
          case 'price-low':
            sortByParam = 'price'
            sortOrder = 'asc'
            break
          case 'price-high':
            sortByParam = 'price'
            sortOrder = 'desc'
            break
          case 'rating':
            sortByParam = 'rating'
            sortOrder = 'desc'
            break

          default:
            sortByParam = 'created_at'
            sortOrder = 'desc'
        }
        
        // 선택된 카테고리의 ID 찾기
        const searchParams: ProductSearchParams = {
          query: query || undefined,
          category_id: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
          sort_by: sortByParam,
          sort_order: sortOrder
        }
        result = await productService.searchProducts(searchParams, page, itemsPerPage)
      } else if (tab === 'review') {
        result = await productService.searchProductsByReviews(query || '상품 추천', page, itemsPerPage)
      }
      
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
        
        setFilteredProducts(convertedProducts)
        setTotalProducts(result.total)
        setTotalPages(result.total_pages)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setFilteredProducts([])
      setTotalProducts(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts(activeTab, searchQuery, currentPage)
  }, [activeTab, searchQuery, selectedCategory, sortBy, currentPage])

  // 초기 로딩
  useEffect(() => {
    fetchProducts('keyword', '', 1)
  }, [])



  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // 검색 시 첫 페이지로 이동
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1) // 필터 변경 시 첫 페이지로 이동
  }

  const handleSort = (sortType: string) => {
    setSortBy(sortType)
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSelectedCategory('all')
  }

  // API에서 이미 페이지네이션된 데이터를 받으므로 filteredProducts가 현재 페이지의 상품들
  const currentProducts = filteredProducts

  // 페이지 번호 배열 생성
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

  const categoryOptions = [
    { value: 'all', label: '전체 카테고리' },
    ...categories
      .filter(cat => {
        // 점퍼 카테고리는 category_id가 21인 것만 사용
        if (cat.category_name === '점퍼') {
          return cat.category_id === 21
        }
        return true
      })
      .map(cat => ({
        value: cat.category_id.toString(),
        label: cat.category_name,
        category_id: cat.category_id
      }))
  ]

  const sortOptions = [
    { value: 'name', label: '이름순' },
    { value: 'price-low', label: '낮은 가격순' },
    { value: 'price-high', label: '높은 가격순' },
    { value: 'rating', label: '평점순' }
  ]

  const tabs = [
    { id: 'keyword' as TabType, label: '키워드 검색', icon: Search, description: '입력한 키워드와 가장 유사한 상품' },
    { id: 'review' as TabType, label: '리뷰 기반 검색', icon: MessageSquare, description: '사용자 리뷰를 분석한 추천 상품' }
  ]

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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">상품 검색 결과</h1>
            <p className="text-lg text-gray-600">다양한 검색 방식으로 최적의 상품을 찾아보세요</p>
          </div>
          
          {/* 검색바 */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar 
              value={searchQuery} 
              onSearch={handleSearch} 
              placeholder="상품명, 브랜드, 카테고리로 검색하세요..." 
            />
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
                    <div className="text-left">
                      <div className="text-sm font-semibold">{tab.label}</div>
                      <div className="text-xs opacity-80">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex flex-col gap-4">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categoryOptions.map(category => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryFilter(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 상품 그리드 */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{totalProducts}</span>개의 상품이 있습니다
          </p>
          <p className="text-sm text-gray-500">
            {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalProducts)} / {totalProducts}
          </p>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {currentProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <Link to={`/products/${product.product_no}`} className="block">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      클릭해서 상세보기
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
                    ₩{Math.floor(product.price).toLocaleString()}
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
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm text-center flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    상세보기
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 정렬 옵션 - 우측 하단 */}
        <div className="flex justify-end mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center items-center mt-12 gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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

            {/* 페이지 번호들 */}
            {getPageNumbers().map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === pageNumber
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage >= totalPages || totalPages === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Filter className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">다른 검색어나 필터를 사용해보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage 