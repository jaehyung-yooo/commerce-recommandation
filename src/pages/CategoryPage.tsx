import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Filter, Grid, List, ChevronDown } from 'lucide-react'

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
  reviewCount?: number
  stock?: number
}

function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'price_low', label: '낮은 가격순' },
    { value: 'price_high', label: '높은 가격순' },
    { value: 'rating', label: '평점 높은순' },
    { value: 'latest', label: '최신순' },
  ]

  const brands = ['Apple', 'Samsung', 'LG', 'Sony', 'Nike', 'Adidas']

  useEffect(() => {
    // 실제 API 호출
    setTimeout(() => {
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'MacBook Pro 16"',
          price: 2500000,
          rating: 4.8,
          image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=MacBook+Pro+16',
          category: 'electronics',
          description: '프로급 성능의 맥북 프로',
          brand: 'Apple',
          discount: 5,
          reviewCount: 234,
          stock: 15
        },
        {
          id: '2',
          name: 'iPad Air',
          price: 750000,
          rating: 4.6,
          image: 'https://via.placeholder.com/300x300/6B7280/FFFFFF?text=iPad+Air',
          category: 'electronics',
          description: '가벼우면서도 강력한 태블릿',
          brand: 'Apple',
          reviewCount: 189,
          stock: 8
        },
        {
          id: '3',
          name: 'Samsung QLED TV',
          price: 1200000,
          rating: 4.7,
          image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Samsung+QLED+TV',
          category: 'electronics',
          description: '4K 고화질 스마트 TV',
          brand: 'Samsung',
          discount: 15,
          reviewCount: 324,
          stock: 5
        },
        {
          id: '4',
          name: 'AirPods Max',
          price: 650000,
          rating: 4.5,
          image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=AirPods+Max',
          category: 'electronics',
          description: '프리미엄 헤드폰',
          brand: 'Apple',
          reviewCount: 156,
          stock: 12
        }
      ]
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [category, sortBy])

  const filteredProducts = products.filter(product => {
    const inPriceRange = product.price >= priceRange[0] && product.price <= priceRange[1]
    const inSelectedBrands = selectedBrands.length === 0 || selectedBrands.includes(product.brand)
    return inPriceRange && inSelectedBrands
  })

  const categoryNames: Record<string, string> = {
    electronics: '전자기기',
    fashion: '패션',
    sports: '스포츠',
    home: '홈&리빙',
    books: '도서'
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {categoryNames[category || ''] || category}
          </h1>
          <p className="text-gray-600 mt-1">{filteredProducts.length}개의 상품</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="hidden lg:block w-64 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </h3>
            
            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">가격대</h4>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="50000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₩{priceRange[0].toLocaleString()}</span>
                  <span>₩{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">브랜드</h4>
              <div className="space-y-2">
                {brands.map(brand => (
                  <label key={brand} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBrands([...selectedBrands, brand])
                        } else {
                          setSelectedBrands(selectedBrands.filter(b => b !== brand))
                        }
                      }}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map(product => (
                <ProductListItem key={product.id} product={product} />
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">조건에 맞는 상품이 없습니다</h3>
              <p className="text-gray-600">필터 조건을 조정해보세요.</p>
            </div>
          )}
        </div>
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
        <div className="flex items-center justify-between">
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
            <span className="text-yellow-400">★</span>
            <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product List Item Component
function ProductListItem({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        <div className="w-48 h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium z-10">
              {product.discount}% OFF
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
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="mb-2">
                <span className="text-sm text-gray-500 font-medium">{product.brand}</span>
                <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
              </div>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex items-center mb-4">
                <span className="text-yellow-400">★</span>
                <span className="ml-1 text-sm text-gray-600">{product.rating}</span>
                <span className="ml-2 text-sm text-gray-500">(후기 {product.reviewCount || 0}개)</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {product.discount ? (
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        ₩{(product.price * (1 - product.discount / 100)).toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-400 line-through ml-2">
                        ₩{product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-red-500 ml-2">({product.discount}% 할인)</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-primary-600">
                      ₩{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  장바구니 담기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryPage 