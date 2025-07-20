import { useState, useEffect } from 'react'
import { Heart, Star, Eye, Filter, ChevronLeft, ChevronRight, Search, Layers, MessageSquare } from 'lucide-react'
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
  likes: number
  isLiked: boolean
  brand: string
}

type TabType = 'keyword' | 'content' | 'review'

function ProductsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('keyword')
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  // 각 탭별 상품 데이터
  const keywordProducts: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: 1200000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0I4MkY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5pUGhvbmUgMTUgUHJvPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj7ijIjmm7zlrqzqprQ8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '최신 A17 Pro 칩셋이 탑재된 프리미엄 스마트폰',
      likes: 324,
      isLiked: false,
      brand: 'Apple'
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
      isLiked: true,
      brand: 'Apple'
    },
    {
      id: '3',
      name: 'Galaxy S24 Ultra',
      price: 1400000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMTBCOTgxIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5HYWxheHkgUzI0PC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj5VbHRyYTwvdGV4dD48L3N2Zz4=',
      category: 'electronics',
      description: '최고의 카메라 성능을 자랑하는 프리미엄 안드로이드 폰',
      likes: 234,
      isLiked: false,
      brand: 'Samsung'
    },
    {
      id: '4',
      name: 'Sony WH-1000XM5',
      price: 450000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkY2OTM0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Tb255IFdILTE8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPjEwMDBYTTU8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '업계 최고 노이즈 캔슬링 헤드폰',
      likes: 167,
      isLiked: true,
      brand: 'Sony'
    },
    {
      id: '5',
      name: 'Nintendo Switch OLED',
      price: 420000,
      rating: 4.5,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRTE0RDJBIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5OaW50ZW5kbyBTdzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+T0xFRDwvdGV4dD48L3N2Zz4=',
      category: 'electronics',
      description: '7인치 OLED 스크린과 향상된 오디오',
      likes: 198,
      isLiked: false,
      brand: 'Nintendo'
    },
    {
      id: '6',
      name: 'PlayStation 5',
      price: 700000,
      rating: 4.6,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMDA2NkZGIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5QbGF5U3RhdGlvbjwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+NTwvdGV4dD48L3N2Zz4=',
      category: 'electronics',
      description: '차세대 게임 콘솔로 몰입감 넘치는 게임 경험',
      likes: 456,
      isLiked: true,
      brand: 'Sony'
    },
    {
      id: '7',
      name: 'AirPods Pro 2',
      price: 350000,
      rating: 4.6,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI1Q0Y2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BaXJQb2RzIFBybzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+MuqzvDwvdGV4dD48L3N2Zz4=',
      category: 'electronics',
      description: '적응형 투명도 모드가 있는 무선 이어폰',
      likes: 89,
      isLiked: false,
      brand: 'Apple'
    },
    {
      id: '8',
      name: 'Xbox Series X',
      price: 650000,
      rating: 4.5,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMEY3QjBGIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5YYm94IFNlcmllczwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+WDwvdGV4dD48L3N2Zz4=',
      category: 'electronics',
      description: '4K 게임을 위한 강력한 콘솔',
      likes: 298,
      isLiked: false,
      brand: 'Microsoft'
    },
    {
      id: '9',
      name: 'Apple Watch Series 9',
      price: 500000,
      rating: 4.5,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRUM0ODk5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BcHBsZSBXYXRjaDwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+U2VyaWVzIDk8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '건강과 피트니스의 완벽한 파트너',
      likes: 189,
      isLiked: false,
      brand: 'Apple'
    },
    {
      id: '10',
      name: 'AirPods Max',
      price: 650000,
      rating: 4.6,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMTBCOTgxIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BaXJQb2RzIE1heDwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+7ZSE66mU7JuA66GcPC90ZXh0Pjwvc3ZnPg==',
      category: 'electronics',
      description: '최고급 오버이어 헤드폰',
      likes: 134,
      isLiked: false,
      brand: 'Apple'
    }
  ]

  const contentBasedProducts: Product[] = [
    {
      id: '9',
      name: 'Dell XPS 13',
      price: 1800000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjU2M0VCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5EZWxsIFhQUzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+MTM8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '프리미엄 초경량 노트북으로 생산성 극대화',
      likes: 245,
      isLiked: false,
      brand: 'Dell'
    },
    {
      id: '10',
      name: 'Surface Pro 9',
      price: 1300000,
      rating: 4.5,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMDk3OEQ0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5TdXJmYWNlIFBybzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+OTwvdGV4dD48L3N2Zz4=',
      category: 'electronics',
      description: '노트북과 태블릿의 완벽한 조합',
      likes: 189,
      isLiked: true,
      brand: 'Microsoft'
    },
    {
      id: '11',
      name: 'Canon EOS R6 Mark II',
      price: 3200000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMTkxOTE5Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5DYW5vbiBFT1M8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPlI2IE1hcmsgSUk8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '프로페셔널을 위한 최고급 미러리스 카메라',
      likes: 123,
      isLiked: false,
      brand: 'Canon'
    },
    {
      id: '12',
      name: 'Bose QuietComfort 45',
      price: 380000,
      rating: 4.6,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNEE1NTY4Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Cb3NlIFFDNDU8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPumhnOydtOunkCDskaztlrQ8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '뛰어난 노이즈 캔슬링과 편안한 착용감',
      likes: 156,
      isLiked: true,
      brand: 'Bose'
    },
    {
      id: '13',
      name: 'Logitech MX Master 3',
      price: 120000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNkM3MjdCIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5NWCBNYXN0ZXI8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPjM8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '정밀한 제어가 가능한 프로용 마우스',
      likes: 89,
      isLiked: false,
      brand: 'Logitech'
    },
    {
      id: '14',
      name: 'Samsung Monitor 32인치',
      price: 450000,
      rating: 4.4,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5TYW1zdW5nPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj7rqqjri4jthLA8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '4K UHD 해상도의 대형 모니터',
      likes: 234,
      isLiked: false,
      brand: 'Samsung'
    },
    {
      id: '15',
      name: 'iPad Pro 12.9인치',
      price: 1600000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEIzNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5pUGFkIFBybzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+MTIuOWluPC90ZXh0Pjwvc3ZnPg==',
      category: 'electronics',
      description: 'M2 칩과 Liquid Retina XDR 디스플레이',
      likes: 298,
      isLiked: true,
      brand: 'Apple'
    },
    {
      id: '16',
      name: 'ASUS ROG Gaming 키보드',
      price: 180000,
      rating: 4.5,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkYwMDMzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5BU1VTIFJPRzwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+R2FtaW5nPC90ZXh0Pjwvc3ZnPg==',
      category: 'electronics',
      description: '기계식 스위치로 게이밍에 최적화된 키보드',
      likes: 156,
      isLiked: false,
      brand: 'ASUS'
    },
    {
      id: '17',
      name: 'Tesla Model 3',
      price: 45000000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRUY0NDQ0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5UZXNsYSBNb2RlbDwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+MzwvdGV4dD48L3N2Zz4=',
      category: 'automotive',
      description: '전기차의 새로운 표준',
      likes: 1567,
      isLiked: false,
      brand: 'Tesla'
    },
    {
      id: '18',
      name: 'LG OLED C3 55"',
      price: 1800000,
      rating: 4.6,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNkI3MjgwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5MRyBPTEVEPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj5DMyA1NSI8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '완벽한 블랙과 무한 명암비의 OLED TV',
      likes: 876,
      isLiked: false,
      brand: 'LG'
    }
  ]

  const reviewBasedProducts: Product[] = [
    {
      id: '31',
      name: 'Dyson V15 Detect',
      price: 850000,
      rating: 4.9,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNzc4OEE1Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5EeXNvbiBWMTU8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPkRldGVjdDwvdGV4dD48L3N2Zz4=',
      category: 'home',
      description: '레이저 기술로 미세한 먼지까지 감지하는 무선 청소기',
      likes: 412,
      isLiked: true,
      brand: 'Dyson'
    },
    {
      id: '32',
      name: 'Instant Pot Duo 7-in-1',
      price: 220000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRUYzNDMyIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5JbnN0YW50IFBvdDwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+RHVvIDctaW4tMTwvdGV4dD48L3N2Zz4=',
      category: 'home',
      description: '다기능 전기압력솥으로 요리시간 단축',
      likes: 389,
      isLiked: false,
      brand: 'Instant Pot'
    },
    {
      id: '33',
      name: 'Vitamix Ascent A3500',
      price: 680000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMEY3QjBGIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5WaXRhbWl4PC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj5Bc2NlbnQgQTM1MDA8L3RleHQ+PC9zdmc+',
      category: 'home',
      description: '프로페셔널급 고성능 블렌더',
      likes: 267,
      isLiked: true,
      brand: 'Vitamix'
    },
    {
      id: '34',
      name: 'Nest Learning Thermostat',
      price: 320000,
      rating: 4.6,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzRBODUzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5OZXN0IExlYXJuPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIj5UaGVybW9zdGF0PC90ZXh0Pjwvc3ZnPg==',
      category: 'home',
      description: '학습형 스마트 온도조절기',
      likes: 198,
      isLiked: false,
      brand: 'Google'
    },
    {
      id: '35',
      name: 'Philips Hue 스마트 전구',
      price: 85000,
      rating: 4.5,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRkJCRjI0Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5QaGlsaXBzIEh1ZTwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iYmxhY2siIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+7Iqk66eI7Yq8IOyghOq1rDwvdGV4dD48L3N2Zz4=',
      category: 'home',
      description: '1600만 색상의 스마트 LED 전구',
      likes: 145,
      isLiked: true,
      brand: 'Philips'
    },
    {
      id: '36',
      name: 'Roomba i7+',
      price: 1200000,
      rating: 4.4,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzY0MTUzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Sb29tYmE8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPmk3KzwvdGV4dD48L3N2Zz4=',
      category: 'home',
      description: '자동 쓰레기 배출 기능이 있는 로봇청소기',
      likes: 324,
      isLiked: false,
      brand: 'iRobot'
    },
    {
      id: '37',
      name: 'Breville Barista Express',
      price: 750000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI0NTEzIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5CcmV2aWxsZTwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+QmFyaXN0YSBFeHA8L3RleHQ+PC9zdmc+',
      category: 'home',
      description: '홈 바리스타를 위한 에스프레소 머신',
      likes: 287,
      isLiked: true,
      brand: 'Breville'
    },
    {
      id: '38',
      name: 'Herman Miller Aeron 의자',
      price: 1800000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjNTc1NzU3Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5IZXJ3YW4gTWlsbDwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjE3MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJBcmlhbCI+QWVyb24g7J2Y7J6QPC90ZXh0Pjwvc3ZnPg==',
      category: 'home',
      description: '인체공학적 프리미엄 오피스 체어',
      likes: 156,
      isLiked: false,
      brand: 'Herman Miller'
    },
    {
      id: '39',
      name: 'Sonos Arc 사운드바',
      price: 1000000,
      rating: 4.7,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5Tb25vcyBBcmM8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPu2SgOumrOuvuCDsgJzsmrTrk5zrsJQ8L3RleHQ+PC9zdmc+',
      category: 'electronics',
      description: '프리미엄 홈시어터 사운드바',
      likes: 298,
      isLiked: false,
      brand: 'Sonos'
    },
    {
      id: '40',
      name: 'DJI Mini 4 Pro',
      price: 900000,
      rating: 4.8,
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOEI1Q0Y2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIj5ESkkgTWluaWM8L3RleHQ+PHRleHQgeD0iMTUwIiB5PSIxNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjE2IiBmb250LWZhbWlseT0iQXJpYWwiPjQgUHJvPC90ZXh0Pjwvc3ZnPg==',
      category: 'electronics',
      description: '프로페셔널 4K 드론 촬영',
      likes: 567,
      isLiked: false,
      brand: 'DJI'
    }
  ]

  // 현재 활성 탭에 따라 상품 리스트 선택
  const getCurrentProducts = () => {
    switch (activeTab) {
      case 'keyword':
        return keywordProducts
      case 'content':
        return contentBasedProducts
      case 'review':
        return reviewBasedProducts
      default:
        return keywordProducts
    }
  }

  useEffect(() => {
    setLoading(true)
    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setFilteredProducts(getCurrentProducts())
      setLoading(false)
    }, 1000)
  }, [activeTab])

  const handleLikeToggle = (productId: string) => {
    setFilteredProducts(prev => prev.map(product => {
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

  const handleSearch = (query: string) => {
    setCurrentPage(1) // 검색 시 첫 페이지로 이동
    const currentProducts = getCurrentProducts()
    if (!query.trim()) {
      setFilteredProducts(currentProducts)
      return
    }
    
    const filtered = currentProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredProducts(filtered)
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1) // 필터 변경 시 첫 페이지로 이동
    const currentProducts = getCurrentProducts()
    if (category === 'all') {
      setFilteredProducts(currentProducts)
    } else {
      setFilteredProducts(currentProducts.filter(product => product.category === category))
    }
  }

  const handleSort = (sortType: string) => {
    setSortBy(sortType)
    setCurrentPage(1) // 정렬 변경 시 첫 페이지로 이동
    const sorted = [...filteredProducts].sort((a, b) => {
      switch (sortType) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'likes':
          return b.likes - a.likes
        default:
          return a.name.localeCompare(b.name)
      }
    })
    setFilteredProducts(sorted)
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSelectedCategory('all')
  }

  // 페이징 계산
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

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
    
    return pages
  }

  const categories = [
    { value: 'all', label: '전체 카테고리', count: getCurrentProducts().length },
    { value: 'electronics', label: '전자제품', count: getCurrentProducts().filter(p => p.category === 'electronics').length },
    { value: 'fashion', label: '패션', count: getCurrentProducts().filter(p => p.category === 'fashion').length },
    { value: 'home', label: '홈 & 가든', count: getCurrentProducts().filter(p => p.category === 'home').length },
    { value: 'sports', label: '스포츠', count: getCurrentProducts().filter(p => p.category === 'sports').length },
  ]

  const sortOptions = [
    { value: 'name', label: '이름순' },
    { value: 'price-low', label: '낮은 가격순' },
    { value: 'price-high', label: '높은 가격순' },
    { value: 'rating', label: '평점순' },
    { value: 'likes', label: '인기순' }
  ]

  const tabs = [
    { id: 'keyword' as TabType, label: '키워드 검색', icon: Search, description: '입력한 키워드와 가장 유사한 상품' },
    { id: 'content' as TabType, label: '콘텐츠 기반 필터링', icon: Layers, description: '상품 특성과 카테고리 기반 추천' },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">상품 검색 결과</h1>
            <p className="text-lg text-gray-600">다양한 검색 방식으로 최적의 상품을 찾아보세요</p>
          </div>
          
          {/* 검색바 */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar onSearch={handleSearch} placeholder="상품명, 브랜드, 카테고리로 검색하세요..." />
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
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryFilter(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 상품 그리드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredProducts.length}</span>개의 상품이 있습니다
          </p>
          <p className="text-sm text-gray-500">
            {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {currentProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <Link to={`/products/${product.id}`} className="block">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-600">
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
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm text-center flex items-center justify-center"
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