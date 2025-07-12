import { useState, useEffect } from 'react'
import { Search, ShoppingCart, Star } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  rating: number
  image: string
  category: string
  description: string
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
          name: '스마트폰 Pro Max',
          price: 1200000,
          rating: 4.8,
          image: '/api/placeholder/200/200',
          category: 'electronics',
          description: '최신 스마트폰 기술을 집약한 프리미엄 제품'
        },
        {
          id: '2',
          name: '노트북 Ultra',
          price: 1500000,
          rating: 4.6,
          image: '/api/placeholder/200/200',
          category: 'electronics',
          description: '고성능 프로세서와 긴 배터리 수명'
        },
        {
          id: '3',
          name: '러닝화 Sport',
          price: 150000,
          rating: 4.5,
          image: '/api/placeholder/200/200',
          category: 'sports',
          description: '편안하고 가벼운 러닝 전용 신발'
        },
        // 더 많은 제품들...
      ])
      setLoading(false)
    }, 1000)
  }, [])

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
          <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo='
                }}
              />
            </div>
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
              <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </button>
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