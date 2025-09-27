import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, Database, Search, Image, FileText, TrendingUp, Activity } from 'lucide-react'
import { getKnowledgeGraphStats, checkNeo4jStatus, getEntities, getTopics, searchKnowledgeGraph } from '../services/api'
import toast from 'react-hot-toast'

const KnowledgeGraph: React.FC = () => {
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
      } finally {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nasa-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Knowledge Graph</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
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
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Publications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.pub_count || 0}
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
              <p className="text-sm font-medium text-gray-600">Entities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.entity_count || 0}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Images</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.image_count || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <Image className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Findings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.finding_count || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
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
        className="card max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              neo4jStatus?.status === 'connected' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Database className={`h-5 w-5 ${
                neo4jStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Neo4j Database</h3>
              <p className="text-sm text-gray-600">
                {neo4jStatus?.status === 'connected' 
                  ? 'Connected and ready for graph operations' 
                  : 'Disconnected - Graph features unavailable'
                }
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            neo4jStatus?.status === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
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
        className="card max-w-4xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Knowledge Graph</h3>
        <form onSubmit={handleGraphSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for entities, publications, or relationships..."
              className="input-field pl-12"
              disabled={searchLoading || neo4jStatus?.status !== 'connected'}
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading || !searchQuery.trim() || neo4jStatus?.status !== 'connected'}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="card max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Search Results</h3>
          <div className="space-y-3">
            {searchResults.results?.map((result: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">{result.title}</h4>
                <p className="text-sm text-gray-600 mt-1">Publication ID: {result.pub_id}</p>
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
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Research Entities</h3>
          <div className="space-y-3">
            {entities?.entities?.slice(0, 10).map((entity: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{entity.name}</span>
                <span className="text-sm font-medium text-nasa-blue">{entity.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Research Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Topics</h3>
          <div className="space-y-3">
            {topics?.topics && Object.entries(topics.topics).map(([topic, count]: [string, any]) => (
              <div key={topic} className="flex items-center justify-between">
                <span className="text-gray-700 capitalize">{topic}</span>
                <span className="text-sm font-medium text-nasa-blue">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Graph Visualization Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="card max-w-6xl mx-auto"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Visualization</h3>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Interactive Graph Visualization</p>
            <p className="text-sm text-gray-400">
              Graph visualization will be implemented with D3.js or Cytoscape.js
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default KnowledgeGraph
