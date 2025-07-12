import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import RecommendationsPage from './pages/RecommendationsPage'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App 