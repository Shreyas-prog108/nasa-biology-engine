import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import QAndA from './pages/QAndA'
import KnowledgeGraph from './pages/KnowledgeGraph'
import Analytics from './pages/Analytics'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/qa" element={<QAndA />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default App
