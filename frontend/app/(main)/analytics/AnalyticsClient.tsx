'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Database, FileText, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { getTrends, getEntities, getTopics } from '@/services/api'
import { TrendsData } from '@/services/api'

export default function AnalyticsClient() {
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [entities, setEntities] = useState<any>(null)
  const [topics, setTopics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(false)
        
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
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">🚀 Mission Analytics Dashboard</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
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
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">📚 Total Publications</p>
              <p className="text-2xl font-bold text-white mt-1">
                {trends?.total_publications?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Vector Database</p>
              <p className="text-2xl font-bold text-white mt-1">
                {trends?.database_stats?.vector_count?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Database className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Index Fullness</p>
              <p className="text-2xl font-bold text-white mt-1">
                {trends?.database_stats?.index_fullness ? 
                  (trends.database_stats.index_fullness * 100).toFixed(1) + '%' : 
                  '0%'
                }
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Vector Dimension</p>
              <p className="text-2xl font-bold text-white mt-1">
                {trends?.database_stats?.dimension || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
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
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Top Research Entities</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  stroke="#9CA3AF"
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Bar dataKey="count" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Research Topics Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Research Topics Distribution</h3>
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
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
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
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Most Common Research Terms</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {trends?.common_terms && Object.entries(trends.common_terms).slice(0, 15).map(([term, count]: [string, any]) => (
            <div key={term} className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div className="text-2xl font-bold text-cyan-400">{count}</div>
              <div className="text-sm text-gray-400 mt-1">{term}</div>
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
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Entity Analysis</h3>
          <div className="space-y-3">
            {entities?.entities?.slice(0, 10).map((entity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-white">{entity.name}</span>
                </div>
                <span className="text-sm font-medium text-cyan-400">{entity.count} mentions</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Research Topics List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Topic Analysis</h3>
          <div className="space-y-3">
            {topics?.topics && Object.entries(topics.topics).map(([topic, count]: [string, any], index: number) => (
              <div key={topic} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" 
                       style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-white capitalize">{topic}</span>
                </div>
                <span className="text-sm font-medium text-cyan-400">{count} papers</span>
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
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Database Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Database className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-cyan-400">
              {trends?.database_stats?.dimension || 0}
            </div>
            <div className="text-sm text-gray-400">Vector Dimension</div>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Activity className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">
              {trends?.database_stats?.index_fullness ? 
                (trends.database_stats.index_fullness * 100).toFixed(1) + '%' : 
                '0%'
              }
            </div>
            <div className="text-sm text-gray-400">Index Utilization</div>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">
              {trends?.sample_size || 0}
            </div>
            <div className="text-sm text-gray-400">Sample Analyzed</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
