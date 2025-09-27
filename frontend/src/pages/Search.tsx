import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Filter, ExternalLink, BookOpen, Calendar, User } from 'lucide-react'
import { searchPublications } from '../services/api'
import { SearchResponse } from '../services/api'
import toast from 'react-hot-toast'

const Search: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [topK, setTopK] = useState(10)
  const [source, setSource] = useState('nasa_publications')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const searchResults = await searchPublications(query, topK, source)
      setResults(searchResults)
      toast.success(`Found ${searchResults.length} publications`)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result: SearchResponse) => {
    if (result.link) {
      window.open(result.link, '_blank')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Publications</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Search through 600+ NASA space biology publications using semantic search technology
        </p>
      </div>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card max-w-4xl mx-auto"
      >
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for research topics, organisms, or biological processes..."
              className="input-field pl-12 text-lg"
              disabled={loading}
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Results:</label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Source:</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="nasa_publications">NASA Publications</option>
                <option value="">All Sources</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Search Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results ({results.length})
            </h2>
            <div className="text-sm text-gray-500">
              Click on any result to view the full publication
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Publication #{result.row_id}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">Score: {(result.score * 100).toFixed(1)}%</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-nasa-blue transition-colors">
                      {result.title}
                    </h3>
                    
                    {result.abstract && (
                      <p className="text-gray-600 mb-3 line-clamp-3">
                        {result.abstract}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>View Publication</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{result.source}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-12 h-12 bg-nasa-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                      <ExternalLink className="h-6 w-6 text-nasa-blue" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Results */}
      {results.length === 0 && !loading && query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try different keywords or check your spelling
          </p>
        </motion.div>
      )}

      {/* Search Tips */}
      {results.length === 0 && !query && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Try searching for:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• "microgravity effects on bone"</li>
                <li>• "space radiation biology"</li>
                <li>• "plant growth in space"</li>
                <li>• "astronaut health"</li>
                <li>• "cellular responses to spaceflight"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Research areas include:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Bone and muscle physiology</li>
                <li>• Cardiovascular health</li>
                <li>• Plant biology</li>
                <li>• Cellular biology</li>
                <li>• Radiation effects</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Search
