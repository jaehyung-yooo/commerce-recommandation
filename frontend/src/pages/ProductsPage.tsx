import { useState, useEffect } from 'react'
import { Search, Heart, Star, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Product {
  id: string
  name: string
  price: number
  rating: number
  image: string
  category: string
  description: string
  likes: number
  isLiked: boolean
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  // Mock data - 실제로는 API에서 가져올 데이터
  useEffect(() => {
    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          name: 'iPhone 15 Pro',
          price: 1200000,
          rating: 4.8,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5pUGhvbmUgMTUgUHJvPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj7ijKnkjKjmm7zlkIjmi4HqprQ8L3RleHQ+PC9zdmc+',
          category: 'electronics',
          description: '최신 A17 Pro 칩셋이 탑재된 프리미엄 스마트폰',
          likes: 324,
          isLiked: false
        },
        {
          id: '2',
          name: 'MacBook Air M3',
          price: 1500000,
          rating: 4.7,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNkI3MjgwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5NYWNCb29rIEFpcjwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+TTMg7LmpPC90ZXh0Pjwvc3ZnPg==',
          category: 'electronics',
          description: '13인치 MacBook Air with M3 칩',
          likes: 156,
          isLiked: true
        },
        {
          id: '3',
          name: 'AirPods Pro 2',
          price: 350000,
          rating: 4.6,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI1Q0Y2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BaXJQb2RzIFBybzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+MuqzvDwvdGV4dD48L3N2Zz4=',
          category: 'electronics',
          description: '적응형 투명도 모드가 있는 무선 이어폰',
          likes: 89,
          isLiked: false
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleLikeToggle = (productId: string) => {
    setProducts(prev => prev.map(product => {
      if (product.id === productId) {
        const newIsLiked = !product.isLiked
        return {
          ...product,
          isLiked: newIsLiked,
          likes: newIsLiked ? product.likes + 1 : product.likes - 1
        }
      }
      return product
    }))
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'sports', label: 'Sports' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'home', label: 'Home & Garden' },
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
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
            <Link to={`/products/${product.id}`} className="block group">
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
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
              <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{product.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary-600">
                  ₩{product.price.toLocaleString()}
                </span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                </div>
              </div>

              {/* 좋아요 정보 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Heart className="h-4 w-4 text-red-400 mr-1" />
                  <span>{product.likes}명이 좋아합니다</span>
                </div>
              </div>
              
              {/* 버튼들 */}
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
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default ProductsPage 