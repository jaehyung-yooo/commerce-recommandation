import { Link, useLocation } from 'react-router-dom'
import { 
  Smartphone, 
  Laptop, 
  Shirt, 
  Dumbbell, 
  Home, 
  Book, 
  Car, 
  Heart,
  Sparkles
} from 'lucide-react'

interface Category {
  id: string
  name: string
  path: string
  icon: any
  color: string
}

interface CategoryTabsProps {
  className?: string
  showAll?: boolean
}

function CategoryTabs({ className = "", showAll = true }: CategoryTabsProps) {
  const location = useLocation()

  const categories: Category[] = [
    {
      id: 'all',
      name: '전체',
      path: '/',
      icon: Sparkles,
      color: 'text-purple-600'
    },
    {
      id: 'electronics',
      name: '전자기기',
      path: '/category/electronics',
      icon: Smartphone,
      color: 'text-blue-600'
    },
    {
      id: 'computers',
      name: '컴퓨터',
      path: '/category/computers',
      icon: Laptop,
      color: 'text-gray-600'
    },
    {
      id: 'fashion',
      name: '패션',
      path: '/category/fashion',
      icon: Shirt,
      color: 'text-pink-600'
    },
    {
      id: 'sports',
      name: '스포츠',
      path: '/category/sports',
      icon: Dumbbell,
      color: 'text-green-600'
    },
    {
      id: 'home',
      name: '홈&리빙',
      path: '/category/home',
      icon: Home,
      color: 'text-orange-600'
    },
    {
      id: 'books',
      name: '도서',
      path: '/category/books',
      icon: Book,
      color: 'text-indigo-600'
    },
    {
      id: 'automotive',
      name: '자동차',
      path: '/category/automotive',
      icon: Car,
      color: 'text-red-600'
    },
    {
      id: 'beauty',
      name: '뷰티',
      path: '/category/beauty',
      icon: Heart,
      color: 'text-rose-600'
    }
  ]

  const displayCategories = showAll ? categories : categories.slice(0, 6)

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || !categories.some(cat => 
        cat.path !== '/' && location.pathname.startsWith(cat.path)
      )
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className={`${className}`}>
      {/* Desktop Version */}
      <div className="hidden md:flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
        {displayCategories.map(category => {
          const Icon = category.icon
          const active = isActive(category.path)
          
          return (
            <Link
              key={category.id}
              to={category.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-primary-600' : category.color}`} />
              <span className="font-medium text-sm">{category.name}</span>
            </Link>
          )
        })}
      </div>

      {/* Mobile Version - Horizontal Scroll */}
      <div className="md:hidden">
        <div className="flex space-x-4 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide">
          {displayCategories.map(category => {
            const Icon = category.icon
            const active = isActive(category.path)
            
            return (
              <Link
                key={category.id}
                to={category.path}
                className={`flex flex-col items-center space-y-1 min-w-0 flex-shrink-0 px-3 py-2 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  active ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-5 w-5 ${active ? 'text-primary-600' : category.color}`} />
                </div>
                <span className="text-xs font-medium whitespace-nowrap">{category.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="hidden lg:flex items-center justify-center mt-4 space-x-8 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>실시간 배송</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
          <span>당일 배송</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
          <span>AI 추천</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
          <span>할인 중</span>
        </div>
      </div>
    </div>
  )
}

export default CategoryTabs 