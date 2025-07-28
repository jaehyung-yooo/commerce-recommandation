import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import ProductDetailPage from './pages/ProductDetailPage'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Home Page */}
          <Route path="/" element={<HomePage />} />
          
          {/* Category Pages */}
          <Route path="/category/:category" element={<CategoryPage />} />
          
          {/* Search Results */}
          <Route path="/search" element={<SearchPage />} />
          
          {/* Product Detail */}
          <Route path="/products/:id" element={<ProductDetailPage />} />
          
          {/* Legacy Routes - 기존 라우트들도 유지 */}
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h2>
              <p className="text-gray-600 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
              <a 
                href="/" 
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-block"
              >
                홈으로 돌아가기
              </a>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App 