'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, ExternalLink, BookOpen, Brain, Clock } from 'lucide-react'
import { askQuestion } from '@/services/api'
import { QAResponse } from '@/services/api'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function QAClient() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<QAResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [topK, setTopK] = useState(5)
  const [source, setSource] = useState('nasa_publications')

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    try {
      const response = await askQuestion(question, topK, source)
      setAnswer(response)
      toast.success('Answer generated successfully!')
    } catch (error) {
      console.error('Q&A error:', error)
      toast.error('Failed to generate answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSourceClick = (link: string) => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  const exampleQuestions = [
    "What are the effects of microgravity on bone density?",
    "How does space radiation affect cellular DNA?",
    "What research has been done on plant growth in space?",
    "How do astronauts' cardiovascular systems adapt to space?",
    "What are the psychological effects of long-duration spaceflight?"
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">AI-Powered Q&A</h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Ask questions about NASA space biology research and get intelligent answers 
          powered by AI
        </p>
      </div>

      {/* Question Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto"
      >
        <form onSubmit={handleAskQuestion} className="space-y-6">
          <div className="relative">
            <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about space biology research..."
              className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 min-h-[120px] resize-none"
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Sources:</label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
              >
                <option value={3}>3 sources</option>
                <option value={5}>5 sources</option>
                <option value={10}>10 sources</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Source:</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
              >
                <option value="nasa_publications">NASA Publications</option>
                <option value="">All Sources</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl ml-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Ask Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Example Questions */}
      {!answer && !question && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Example Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleQuestions.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuestion(example)}
                className="p-3 text-left bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 border border-gray-600/50 hover:border-gray-500/50"
              >
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{example}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Answer Display */}
      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* AI Answer */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Brain className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Answer</h3>
                <p className="text-sm text-gray-400">Powered by Google Gemini 2.5</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown 
                className="text-gray-300 leading-relaxed"
                components={{
                  p: ({ children }) => <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-3">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-300">{children}</li>
                }}
              >
                {answer.answer}
              </ReactMarkdown>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Based on {answer.total_results} relevant publications</span>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Sources & Citations</h3>
            <div className="space-y-3">
              {answer.sources.map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer group"
                  onClick={() => handleSourceClick(answer.links[index])}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Source {index + 1}</span>
                      </div>
                      <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {source}
                      </h4>
                      {answer.links[index] && (
                        <div className="flex items-center space-x-1 mt-2 text-sm text-gray-400">
                          <ExternalLink className="h-3 w-3" />
                          <span>View Publication</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center group-hover:bg-cyan-500/30 transition-all">
                        <ExternalLink className="h-4 w-4 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ask Another Question */}
          <div className="text-center max-w-4xl mx-auto">
            <button
              onClick={() => {
                setQuestion('')
                setAnswer(null)
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Ask Another Question
            </button>
          </div>
        </motion.div>
      )}

      {/* AI Info */}
      {!answer && !question && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 max-w-4xl mx-auto"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Brain className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI-Powered Research Assistant</h3>
              <p className="text-gray-300">
                Our AI system uses Google Gemini 2.0 to analyze NASA publications and provide 
                intelligent answers to your research questions. It searches through 600+ papers 
                and synthesizes information to give you comprehensive, cited responses.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
