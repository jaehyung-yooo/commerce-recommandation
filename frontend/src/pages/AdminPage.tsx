import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Target, 
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import NativeChatbot from '../components/NativeChatbot'
// import StreamlitChatbot from '../components/StreamlitChatbot'  // 대안: iframe 방식

interface MetricCard {
  title: string
  value: string
  change: number
  changeType: 'increase' | 'decrease'
  icon: React.ComponentType<any>
  color: string
}

interface ChartData {
  name: string
  value: number
  percentage?: number
}

function AdminPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7days')
  const [loading, setLoading] = useState(true)

  // Mock data - 실제로는 API에서 가져올 데이터
  const metricsData: MetricCard[] = [
    {
      title: 'CTR (Click Through Rate)',
      value: '8.4%',
      change: 12.5,
      changeType: 'increase',
      icon: Target,
      color: 'bg-blue-500'
    },
    {
      title: '추천 정확도',
      value: '87.2%',
      change: 3.2,
      changeType: 'increase',
      icon: BarChart3,
      color: 'bg-green-500'
    },
    {
      title: '매출 전환율',
      value: '23.1%',
      change: -1.8,
      changeType: 'decrease',
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      title: '추천 기여 매출',
      value: '₩45.2M',
      change: 18.7,
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: '활성 사용자',
      value: '12,847',
      change: 8.9,
      changeType: 'increase',
      icon: Users,
      color: 'bg-indigo-500'
    },
    {
      title: '평균 세션 시간',
      value: '4분 32초',
      change: 5.3,
      changeType: 'increase',
      icon: Activity,
      color: 'bg-pink-500'
    }
  ]

  // CTR 트렌드 데이터
  const ctrTrendData: ChartData[] = [
    { name: '월', value: 7.2 },
    { name: '화', value: 8.1 },
    { name: '수', value: 7.8 },
    { name: '목', value: 9.2 },
    { name: '금', value: 8.9 },
    { name: '토', value: 6.4 },
    { name: '일', value: 8.4 }
  ]

  // 추천 알고리즘별 성능
  const algorithmPerformance: ChartData[] = [
    { name: '키워드 검색', value: 42, percentage: 42 },
    { name: '콘텐츠 기반', value: 35, percentage: 35 },
    { name: '리뷰 기반', value: 23, percentage: 23 }
  ]

  // 매출 전환 데이터
  const conversionData: ChartData[] = [
    { name: '1주차', value: 21.5 },
    { name: '2주차', value: 24.8 },
    { name: '3주차', value: 22.1 },
    { name: '4주차', value: 23.1 }
  ]

  // 상품별 성과 데이터
  const productPerformance = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      views: 12847,
      clicks: 1085,
      ctr: 8.4,
      conversions: 247,
      conversionRate: 22.8,
      revenue: 297640000
    },
    {
      id: 2,
      name: 'MacBook Air M3',
      views: 9632,
      clicks: 894,
      ctr: 9.3,
      conversions: 198,
      conversionRate: 22.1,
      revenue: 297000000
    },
    {
      id: 3,
      name: 'Galaxy S24 Ultra',
      views: 8421,
      clicks: 672,
      ctr: 8.0,
      conversions: 156,
      conversionRate: 23.2,
      revenue: 218400000
    },
    {
      id: 4,
      name: 'Sony WH-1000XM5',
      views: 6234,
      clicks: 523,
      ctr: 8.4,
      conversions: 134,
      conversionRate: 25.6,
      revenue: 60300000
    },
    {
      id: 5,
      name: 'Nintendo Switch OLED',
      views: 5847,
      clicks: 467,
      ctr: 8.0,
      conversions: 98,
      conversionRate: 21.0,
      revenue: 41160000
    }
  ]

  useEffect(() => {
    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [selectedPeriod])

  const periods = [
    { value: '7days', label: '최근 7일' },
    { value: '30days', label: '최근 30일' },
    { value: '90days', label: '최근 90일' },
    { value: '1year', label: '최근 1년' }
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
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">추천 시스템 성능 및 비즈니스 지표</p>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                내보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 핵심 지표 카드들 */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {metricsData.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.changeType === 'increase' ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs 이전 기간</span>
                    </div>
                  </div>
                  <div className={`${metric.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* CTR 트렌드 차트 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">CTR 트렌드</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                최근 7일
              </div>
            </div>
            <div className="space-y-3">
              {ctrTrendData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 text-sm text-gray-600">{item.name}</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(item.value / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm font-medium text-gray-900">{item.value}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* 추천 알고리즘별 성능 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">알고리즘별 추천 성능</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {algorithmPerformance.map((item, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500']
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${colors[index]} mr-3`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">전체 추천 수</span>
                <span className="font-semibold text-gray-900">47,832건</span>
              </div>
            </div>
          </div>
        </div>

        {/* 매출 전환 트렌드 */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">매출 전환율 트렌드</h3>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              최근 4주
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {conversionData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-100 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-blue-600">{item.value}%</div>
                  <div className="text-sm text-gray-600">{item.name}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">₩128.4M</div>
                <div className="text-sm text-gray-600">총 매출</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">₩45.2M</div>
                <div className="text-sm text-gray-600">추천 기여 매출</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">35.2%</div>
                <div className="text-sm text-gray-600">추천 기여율</div>
              </div>
            </div>
          </div>
        </div>

        {/* 상품별 성과 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">상품별 성과</h3>
              <button className="flex items-center text-sm text-gray-600 hover:text-gray-900">
                <Filter className="h-4 w-4 mr-1" />
                필터
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상품명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    노출 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    클릭 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    매출
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productPerformance.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.views.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.clicks.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.ctr}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.conversions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.conversionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₩{(product.revenue / 1000000).toFixed(1)}M
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* AI 챗봇 */}
      <NativeChatbot />
      {/* <StreamlitChatbot streamlitUrl="http://localhost:8501" /> */}
    </div>
  )
}

export default AdminPage 