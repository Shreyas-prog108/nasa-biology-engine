import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import { Toaster } from 'react-hot-toast'

// Lazy load components
const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Search = lazy(() => import('./pages/Search'))
const QAndA = lazy(() => import('./pages/QAndA'))
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'))
const Analytics = lazy(() => import('./pages/Analytics'))

const AppContent: React.FC = () => {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const { isCollapsed } = useSidebar()

  // Full-screen layout for landing page
  if (isLandingPage) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      }>
        <Landing />
      </Suspense>
    )
  }

  // Standard layout for other pages
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className={`flex-1 p-6 transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                  <p className="text-gray-300">Loading...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/search" element={<Search />} />
                <Route path="/qa" element={<QAndA />} />
                <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <SidebarProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
    </SidebarProvider>
  )
}

export default App
