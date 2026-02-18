'use client'

import React from 'react'
import { Rocket } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 fixed top-0 left-0 right-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Rocket className="h-8 w-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">
                NASA Space Biology Engine
              </h1>
            </div>

          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected</span>
            </div> 
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
