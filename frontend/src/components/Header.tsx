import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Brain, BarChart3, Network, Rocket } from 'lucide-react'

const Header: React.FC = () => {
  const location = useLocation()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Rocket className="h-8 w-8 text-nasa-blue" />
              <h1 className="text-2xl font-bold text-gray-900">
                NASA Space Biology Engine
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-1 text-sm text-gray-500">
              <span>•</span>
              <span>600+ Publications</span>
              <span>•</span>
              <span>AI-Powered Search</span>
              <span>•</span>
              <span>Knowledge Graph</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Backend Connected</span>
            </div>
            <div className="bg-nasa-blue text-white px-3 py-1 rounded-full text-sm font-medium">
              Research Platform
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
