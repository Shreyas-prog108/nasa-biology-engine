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
  Settings
} from 'lucide-react'

const Sidebar: React.FC = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', description: 'Overview & Stats' },
    { path: '/search', icon: Search, label: 'Search', description: 'Find Publications' },
    { path: '/qa', icon: MessageCircle, label: 'Q&A', description: 'Ask Questions' },
    { path: '/knowledge-graph', icon: Network, label: 'Knowledge Graph', description: 'Explore Connections' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Research Trends' },
  ]

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-nasa-blue text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600">
              <Database className="h-4 w-4" />
              <span>Pinecone Vector DB</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600">
              <Network className="h-4 w-4" />
              <span>Neo4j Graph DB</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>600+ Publications</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
