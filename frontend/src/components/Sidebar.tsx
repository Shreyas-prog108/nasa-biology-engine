import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Search, 
  MessageCircle, 
  Network, 
  BarChart3,
  BookOpen,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useSidebar } from '../contexts/SidebarContext'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { isCollapsed, toggleSidebar } = useSidebar()

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
      <div className="p-6">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="mb-6 p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors text-gray-300 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-300' : 'text-gray-400 group-hover:text-gray-200'}`} />
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

        {!isCollapsed && (
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300">
                <Database className="h-4 w-4 text-green-400" />
                <span>Vector DB</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300">
                <Network className="h-4 w-4 text-purple-400" />
                <span>Graph DB</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span>600+ Publications</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
