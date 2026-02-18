'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, Database, Search, Image, FileText, Activity } from 'lucide-react'
import GraphVisualization from '@/components/GraphVisualization'
import { getKnowledgeGraphStats, checkNeo4jStatus, getEntities, getTopics, searchKnowledgeGraph } from '@/services/api'
import toast from 'react-hot-toast'

export default function KnowledgeGraphClient() {
  const [stats, setStats] = useState<any>(null)
  const [neo4jStatus, setNeo4jStatus] = useState<any>(null)
  const [entities, setEntities] = useState<any>(null)
  const [topics, setTopics] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(false)
        
        const [statsData, statusData, entitiesData, topicsData] = await Promise.all([
          getKnowledgeGraphStats(),
          checkNeo4jStatus(),
          getEntities(20),
          getTopics(10)
        ])
        setStats(statsData)
        setNeo4jStatus(statusData)
        setEntities(entitiesData)
        setTopics(topicsData)
      } catch (error) {
        console.error('Error fetching knowledge graph data:', error)
        toast.error('Failed to load knowledge graph data')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleGraphSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    try {
      const results = await searchKnowledgeGraph(searchQuery, 10)
      setSearchResults(results)
      toast.success(`Found ${results.results?.length || 0} graph results`)
    } catch (error) {
      console.error('Graph search error:', error)
      toast.error('Graph search failed')
    } finally {
      setSearchLoading(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-white mb-4">Knowledge Graph</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Explore the interconnected network of NASA space biology research, 
          entities, and relationships stored in Neo4j
        </p>
      </div>

      {/* Status Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Publications</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.pub_count || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Entities</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.entity_count || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Images</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.image_count || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg">
              <Image className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Findings</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats?.finding_count || 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Neo4j Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              neo4jStatus?.status === 'connected' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <Database className={`h-5 w-5 ${
                neo4jStatus?.status === 'connected' ? 'text-green-400' : 'text-red-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Neo4j Database</h3>
              <p className="text-sm text-gray-400">
                {neo4jStatus?.status === 'connected' 
                  ? 'Connected and ready for graph operations' 
                  : 'Disconnected - Graph features unavailable'
                }
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            neo4jStatus?.status === 'connected' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {neo4jStatus?.status === 'connected' ? 'Online' : 'Offline'}
          </div>
        </div>
      </motion.div>

      {/* Graph Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Search Knowledge Graph</h3>
        <form onSubmit={handleGraphSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for entities, publications, or relationships..."
              className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
              disabled={searchLoading || neo4jStatus?.status !== 'connected'}
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim() || neo4jStatus?.status !== 'connected'}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searchLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </div>
            ) : (
              'Search Graph'
            )}
          </button>
        </form>
      </motion.div>

      {/* Search Results */}
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Graph Search Results</h3>
          <div className="space-y-3">
            {searchResults.results?.map((result: any, index: number) => (
              <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-medium text-white">{result.title}</h4>
                <p className="text-sm text-gray-400 mt-1">Publication ID: {result.pub_id}</p>
                {result.images && result.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Images: {result.images.length}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Entities and Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Entities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Top Research Entities</h3>
          <div className="space-y-3">
            {entities?.entities?.slice(0, 10).map((entity: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-300">{entity.name}</span>
                <span className="text-sm font-medium text-cyan-400">{entity.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Research Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Research Topics</h3>
          <div className="space-y-3">
            {topics?.topics && Object.entries(topics.topics).map(([topic, count]: [string, any]) => (
              <div key={topic} className="flex items-center justify-between">
                <span className="text-gray-300 capitalize">{topic}</span>
                <span className="text-sm font-medium text-cyan-400">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Graph Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
      >
        <GraphVisualization />
      </motion.div>
    </div>
  )
}
