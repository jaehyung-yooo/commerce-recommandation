import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Home, Package, Star } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/recommendations', label: 'Recommendations', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Commerce Recommendation
              </span>
            </div>
            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout 