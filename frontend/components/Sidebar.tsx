'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Search, 
  MessageCircle, 
  Network, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useAuth } from '@/contexts/AuthContext'

const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { user, logout } = useAuth()

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', description: 'Overview & Stats' },
    { path: '/search', icon: Search, label: 'Search', description: 'Find Publications' },
    { path: '/qa', icon: MessageCircle, label: 'Q&A', description: 'Ask Questions' },
    { path: '/knowledge-graph', icon: Network, label: 'Knowledge Graph', description: 'Explore Connections' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Research Trends' },
  ]

  return (
    <aside className={`fixed left-0 top-16 bottom-0 bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50 overflow-y-auto transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full p-6">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="mb-6 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors text-gray-300 hover:text-white self-start"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        
        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-lg transition-all duration-200 group ${
                  isActive
                    ? isCollapsed
                      ? 'bg-cyan-500 shadow-lg shadow-cyan-500/30'
                      : 'bg-cyan-500/20 border border-cyan-500/30 shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                } ${isCollapsed ? 'justify-center p-3 mx-1' : 'px-3 py-3 space-x-3'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? (isCollapsed ? 'text-white' : 'text-cyan-300') : 'text-gray-400 group-hover:text-gray-200'}`} />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-cyan-200' : 'text-gray-400'}`}>
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Account Section */}
        <div className={`mt-auto pt-4 border-t border-gray-700/50 ${isCollapsed ? 'px-0' : ''}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="User" className="w-8 h-8 rounded-full" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user?.name || user?.username} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    @{user?.username || 'guest'}
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
