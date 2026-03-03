'use client'

import { useState } from 'react'

interface TeacherSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isExpanded?: boolean
  onToggle?: () => void
}

export default function TeacherSidebar({ activeTab, onTabChange, isExpanded = true, onToggle }: TeacherSidebarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const menuItems = [
    {
      id: 'overview',
      title: 'Overview',
      icon: '📊',
      description: 'Dashboard Overview',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'subjects',
      title: 'My Subjects',
      icon: '📚',
      description: 'Course Management',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'students',
      title: 'Students',
      icon: '👥',
      description: 'Student Management',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: '📝',
      description: 'Assignment Center',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'notes',
      title: 'Study Notes',
      icon: '📖',
      description: 'Resource Library',
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: '📈',
      description: 'Performance Insights',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'mcq-generator',
      title: 'MCQ Generator',
      icon: '🎯',
      description: 'AI-Powered Questions',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'pdf-upload',
      title: 'PDF Manager',
      icon: '📄',
      description: 'Document Upload',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'task-manager',
      title: 'Task Manager',
      icon: '✅',
      description: 'Student Tasks',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'discussions',
      title: 'Discussions',
      icon: '💬',
      description: 'Student Q&A',
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`${isExpanded ? 'w-80' : 'w-16'} ${
      isDarkMode ? 'bg-gradient-to-b from-gray-900 via-blue-900 to-purple-900' : 'bg-gradient-to-b from-blue-600 via-purple-600 to-blue-700'
    } text-white transition-all duration-300 ease-in-out shadow-2xl relative overflow-hidden`}>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 -left-8 w-24 h-24 bg-white rounded-full animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-ping"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className={`${isExpanded ? 'block' : 'hidden'} transition-all duration-300`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              TeacherSpace
            </h2>
            <p className="text-blue-100 text-sm mt-1">Faculty Dashboard</p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 transform hover:scale-110"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {isExpanded && (
        <div className="relative z-10 p-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-2xl mb-1">📚</div>
            <div className="text-sm text-blue-100">Subjects</div>
            <div className="text-lg font-bold">8</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm text-purple-100">Students</div>
            <div className="text-lg font-bold">125</div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 p-4 space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              activeTab === item.id
                ? 'bg-white/20 backdrop-blur-md shadow-lg border border-white/30 transform scale-105'
                : 'hover:bg-white/10 backdrop-blur-sm hover:transform hover:scale-102'
            }`}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Gradient Background for Active Item */}
            {activeTab === item.id && (
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-30 rounded-xl`}></div>
            )}
            
            <span className="relative z-10 text-2xl group-hover:scale-110 transition-transform duration-200 animate-bounce-soft">
              {item.icon}
            </span>
            {isExpanded && (
              <div className="relative z-10 flex-1 text-left">
                <div className="font-medium group-hover:text-white transition-colors duration-200">
                  {item.title}
                </div>
                <div className="text-xs text-blue-100 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                  {item.description}
                </div>
              </div>
            )}
            
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        ))}
      </nav>

      {/* Quick Actions */}
      {isExpanded && (
        <div className="relative z-10 p-4 border-t border-white/20">
          <h3 className="text-sm font-semibold mb-3 text-blue-100">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs hover:bg-white/20 transition-all duration-200 transform hover:scale-105">
              <div className="text-lg mb-1">➕</div>
              New Assignment
            </button>
            <button className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-xs hover:bg-white/20 transition-all duration-200 transform hover:scale-105">
              <div className="text-lg mb-1">📊</div>
              View Reports
            </button>
          </div>
        </div>
      )}

      {/* Settings & Theme Toggle */}
      <div className="relative z-10 p-4 border-t border-white/20 space-y-3">
        {isExpanded && (
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
              isDarkMode ? 'bg-yellow-500/20 text-yellow-200' : 'bg-gray-800/20 text-gray-200'
            } hover:scale-105`}
          >
            <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
            <span className="text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        )}
        
        {isExpanded ? (
          <div className="text-center">
            <p className="text-xs text-blue-100 opacity-75">
              LearnAID Faculty v2.0
            </p>
            <p className="text-xs text-purple-100 opacity-50 mt-1">
              © 2024 Educational Platform
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-xs font-bold">TF</span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        .animate-bounce-soft {
          animation: bounce-soft 2s infinite;
        }
        @keyframes bounce-soft {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-2px);
          }
          60% {
            transform: translateY(-1px);
          }
        }
      `}</style>
    </div>
  )
}