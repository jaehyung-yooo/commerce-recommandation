import { Link } from 'react-router-dom'
import { Star, TrendingUp, Users } from 'lucide-react'

function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Commerce Recommendation
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Discover personalized product recommendations powered by advanced machine learning algorithms.
          Find exactly what you're looking for with our intelligent recommendation system.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/products"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
          <Link
            to="/recommendations"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Get Recommendations
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Personalized Recommendations
          </h3>
          <p className="text-gray-600">
            Get product suggestions tailored to your preferences and browsing history.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Trending Products
          </h3>
          <p className="text-gray-600">
            Discover what's popular and trending in your category of interest.
          </p>
        </div>
        
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Collaborative Filtering
          </h3>
          <p className="text-gray-600">
            Find products based on what similar users have liked and purchased.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Platform Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">1,000+</div>
            <div className="text-gray-600">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">50,000+</div>
            <div className="text-gray-600">Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">99.9%</div>
            <div className="text-gray-600">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage 