import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Database, FileText, Activity, PieChart } from 'lucide-react'
import { getTrends, getEntities, getTopics } from '../services/api'
import { TrendsData } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

const Analytics: React.FC = () => {
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [entities, setEntities] = useState<any>(null)
  const [topics, setTopics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsData, entitiesData, topicsData] = await Promise.all([
          getTrends(),
          getEntities(15),
          getTopics(8)
        ])
        setTrends(trendsData)
        setEntities(entitiesData)
        setTopics(topicsData)
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Prepare data for charts
  const entityChartData = entities?.entities?.slice(0, 10).map((entity: any) => ({
    name: entity.name.length > 15 ? entity.name.substring(0, 15) + '...' : entity.name,
    count: entity.count
  })) || []

  const topicChartData = topics?.topics ? Object.entries(topics.topics).map(([topic, count]: [string, any]) => ({
    name: topic.charAt(0).toUpperCase() + topic.slice(1),
    count: count
  })) : []

  const COLORS = ['#0B3D91', '#FC3D21', '#4CAF50', '#FF9800', '#9C27B0', '#2196F3', '#F44336', '#795548']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nasa-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Research Analytics</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore trends, patterns, and insights from NASA space biology research publications
        </p>
      </div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Publications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {trends?.total_publications?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vector Database</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {trends?.database_stats?.vector_count?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Index Fullness</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {trends?.database_stats?.index_fullness ? 
                  (trends.database_stats.index_fullness * 100).toFixed(1) + '%' : 
                  '0%'
                }
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vector Dimension</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {trends?.database_stats?.dimension || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Entities Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Research Entities</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0B3D91" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Research Topics Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Topics Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={topicChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {topicChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Common Terms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="card max-w-6xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Research Terms</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {trends?.common_terms && Object.entries(trends.common_terms).slice(0, 15).map(([term, count]: [string, any]) => (
            <div key={term} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-nasa-blue">{count}</div>
              <div className="text-sm text-gray-600 mt-1">{term}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Entities List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entity Analysis</h3>
          <div className="space-y-3">
            {entities?.entities?.slice(0, 10).map((entity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-nasa-blue text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{entity.name}</span>
                </div>
                <span className="text-sm font-medium text-nasa-blue">{entity.count} mentions</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Research Topics List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic Analysis</h3>
          <div className="space-y-3">
            {topics?.topics && Object.entries(topics.topics).map(([topic, count]: [string, any], index: number) => (
              <div key={topic} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" 
                       style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900 capitalize">{topic}</span>
                </div>
                <span className="text-sm font-medium text-nasa-blue">{count} papers</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Database Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="card max-w-4xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">
              {trends?.database_stats?.dimension || 0}
            </div>
            <div className="text-sm text-gray-600">Vector Dimension</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {trends?.database_stats?.index_fullness ? 
                (trends.database_stats.index_fullness * 100).toFixed(1) + '%' : 
                '0%'
              }
            </div>
            <div className="text-sm text-gray-600">Index Utilization</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">
              {trends?.sample_size || 0}
            </div>
            <div className="text-sm text-gray-600">Sample Analyzed</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Analytics
