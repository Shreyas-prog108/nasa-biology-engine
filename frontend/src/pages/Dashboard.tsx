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
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set loading to false immediately to show the UI
        setLoading(false)
        
        // Fetch data in background
        const [trendsData, neo4jData] = await Promise.all([
          getTrends(),
          checkNeo4jStatus()
        ])
        setTrends(trendsData)
        setNeo4jStatus(neo4jData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const stats = [
    {
      title: 'Research Database',
      value: trends?.total_publications || 0,
      icon: BookOpen,
      color: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      description: 'NASA space biology publications'
    },
    {
      title: 'Vector Engine',
      value: trends?.database_stats?.vector_count || 0,
      icon: Database,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      description: 'Embedded documents in Pinecone'
    },
    {
      title: 'Knowledge Network',
      value: neo4jStatus?.status === 'connected' ? 'Active' : 'Offline',
      icon: Network,
      color: neo4jStatus?.status === 'connected' ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-gradient-to-r from-gray-500 to-gray-600',
      description: 'Neo4j graph database status'
    },
    {
      title: 'AI Assistant',
      value: 'Gemini 2.0',
      icon: Brain,
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
      description: 'Google Gemini for Q&A'
    }
  ]

  const quickActions = [
    {
      title: '🔍 Search Publications',
      description: 'Find relevant research papers',
      icon: Search,
      href: '/search',
      color: 'bg-black/30 hover:bg-black/50 border-cyan-500/30 hover:border-cyan-400/50'
    },
    {
      title: '🤖 Ask Questions',
      description: 'Get AI-powered answers',
      icon: MessageCircle,
      href: '/qa',
      color: 'bg-black/30 hover:bg-black/50 border-green-500/30 hover:border-green-400/50'
    },
    {
      title: '🌐 Explore Knowledge Graph',
      description: 'Visualize research connections',
      icon: Network,
      href: '/knowledge-graph',
      color: 'bg-black/30 hover:bg-black/50 border-purple-500/30 hover:border-purple-400/50'
    },
    {
      title: '📊 View Analytics',
      description: 'Research trends and insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-black/30 hover:bg-black/50 border-orange-500/30 hover:border-orange-400/50'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
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
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Mission Control Dashboard
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Monitor your space biology research mission with real-time analytics, 
            AI-powered insights, and cosmic data visualization.
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
            <div key={stat.title} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} shadow-lg`}>
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
        <h2 className="text-2xl font-bold text-white mb-6">🚀 Mission Commands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <a
                key={action.title}
                href={action.href}
                className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 backdrop-blur-sm ${action.color}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{action.title}</h3>
                    <p className="text-sm text-gray-300">{action.description}</p>
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
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">🔬 Top Research Terms</h3>
            <div className="space-y-3">
              {Object.entries(trends.common_terms).slice(0, 8).map(([term, count]) => (
                <div key={term} className="flex items-center justify-between">
                  <span className="text-gray-300">{term}</span>
                  <span className="text-sm font-medium text-cyan-400">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">📊 System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Vector Dimension</span>
                <span className="text-sm font-medium text-cyan-400">{trends.database_stats.dimension}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Index Fullness</span>
                <span className="text-sm font-medium text-cyan-400">
                  {(trends.database_stats.index_fullness * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Neo4j Status</span>
                <span className={`text-sm font-medium ${
                  neo4jStatus?.status === 'connected' ? 'text-green-400' : 'text-red-400'
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
