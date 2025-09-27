import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // Reduced timeout to 5 seconds
})

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('API request timeout')
    }
    return Promise.reject(error)
  }
)

// Types
export interface Publication {
  id: string
  title: string
  link: string
  abstract: string
  source: string
  score: number
  row_id: string
}

export interface SearchResponse {
  id: string
  title: string
  link: string
  abstract: string
  source: string
  score: number
  row_id: string
}

export interface QAResponse {
  answer: string
  sources: string[]
  links: string[]
  total_results: number
}

export interface KnowledgeGraphStats {
  pub_count: number
  entity_count: number
  image_count: number
  finding_count: number
}

export interface TrendsData {
  total_publications: number
  sample_size: number
  common_terms: Record<string, number>
  database_stats: {
    vector_count: number
    dimension: number
    index_fullness: number
  }
}

// API Functions
export const searchPublications = async (
  query: string,
  topK: number = 5,
  source?: string
): Promise<SearchResponse[]> => {
  const params = new URLSearchParams({
    q: query,
    top_k: topK.toString(),
  })
  
  if (source) {
    params.append('source', source)
  }
  
  const response = await api.get(`/search?${params}`)
  return response.data
}

export const askQuestion = async (
  question: string,
  topK: number = 5,
  source?: string
): Promise<QAResponse> => {
  const params = new URLSearchParams({
    q: question,
    top_k: topK.toString(),
  })
  
  if (source) {
    params.append('source', source)
  }
  
  const response = await api.get(`/qa?${params}`)
  return response.data
}

export const getKnowledgeGraphStats = async (): Promise<KnowledgeGraphStats> => {
  const response = await api.get('/neo4j/stats')
  return response.data.knowledge_graph_stats
}

export const getTrends = async (): Promise<TrendsData> => {
  const response = await api.get('/trends')
  return response.data
}

export const getEntities = async (topN: number = 20) => {
  const response = await api.get(`/knowledge-graph/entities?top_n=${topN}`)
  return response.data
}

export const getTopics = async (topN: number = 10) => {
  const response = await api.get(`/knowledge-graph/topics?top_n=${topN}`)
  return response.data
}

export const checkNeo4jStatus = async () => {
  const response = await api.get('/neo4j/status')
  return response.data
}

export const searchKnowledgeGraph = async (query: string, limit: number = 10) => {
  const response = await api.get(`/neo4j/search?query=${encodeURIComponent(query)}&limit=${limit}`)
  return response.data
}

export const getGraphVisualizationData = async (limit: number = 50) => {
  const response = await api.get(`/neo4j/graph-data?limit=${limit}`)
  return response.data
}

export default api
