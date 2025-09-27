import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  MessageCircle, 
  Network, 
  BarChart3, 
  BookOpen, 
  Database,
  TrendingUp,
  Users,
  FileText,
  Brain
} from 'lucide-react'
import { getTrends, checkNeo4jStatus } from '../services/api'
import { TrendsData } from '../services/api'

const Dashboard: React.FC = () => {
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [neo4jStatus, setNeo4jStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsData, neo4jData] = await Promise.all([
          getTrends(),
          checkNeo4jStatus()
        ])
        setTrends(trendsData)
        setNeo4jStatus(neo4jData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = [
    {
      title: 'Total Publications',
      value: trends?.total_publications || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      description: 'NASA space biology research papers'
    },
    {
      title: 'Vector Database',
      value: trends?.database_stats?.vector_count || 0,
      icon: Database,
      color: 'bg-green-500',
      description: 'Embedded documents in Pinecone'
    },
    {
      title: 'Knowledge Graph',
      value: neo4jStatus?.status === 'connected' ? 'Active' : 'Offline',
      icon: Network,
      color: neo4jStatus?.status === 'connected' ? 'bg-purple-500' : 'bg-gray-500',
      description: 'Neo4j graph database status'
    },
    {
      title: 'AI Model',
      value: 'Gemini 2.0',
      icon: Brain,
      color: 'bg-orange-500',
      description: 'Google Gemini for Q&A'
    }
  ]

  const quickActions = [
    {
      title: 'Search Publications',
      description: 'Find relevant research papers',
      icon: Search,
      href: '/search',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      title: 'Ask Questions',
      description: 'Get AI-powered answers',
      icon: MessageCircle,
      href: '/qa',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      title: 'Explore Knowledge Graph',
      description: 'Visualize research connections',
      icon: Network,
      href: '/knowledge-graph',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      title: 'View Analytics',
      description: 'Research trends and insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    }
  ]

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
      <div className="text-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            NASA Space Biology Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore 600+ NASA space biology publications with AI-powered search, 
            knowledge graphs, and intelligent question answering.
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <a
                key={action.title}
                href={action.href}
                className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${action.color}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white rounded-lg">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Activity / Top Terms */}
      {trends && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Research Terms</h3>
            <div className="space-y-3">
              {Object.entries(trends.common_terms).slice(0, 8).map(([term, count]) => (
                <div key={term} className="flex items-center justify-between">
                  <span className="text-gray-700">{term}</span>
                  <span className="text-sm font-medium text-nasa-blue">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Vector Dimension</span>
                <span className="text-sm font-medium text-nasa-blue">{trends.database_stats.dimension}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Index Fullness</span>
                <span className="text-sm font-medium text-nasa-blue">
                  {(trends.database_stats.index_fullness * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Neo4j Status</span>
                <span className={`text-sm font-medium ${
                  neo4jStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {neo4jStatus?.status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Dashboard
