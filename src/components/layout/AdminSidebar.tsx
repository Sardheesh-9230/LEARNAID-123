'use client'

import { useState } from 'react'

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isExpanded?: boolean
  onToggle?: () => void
}

interface SystemLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  module: string
}

export default function AdminSidebar({ activeTab, onTabChange, isExpanded = true, onToggle }: AdminSidebarProps) {
  const [systemSettings, setSystemSettings] = useState({
    applicationEnabled: true,
    maintenanceMode: false,
    userRegistration: true,
    systemNotifications: true
  })
  
  const [logs] = useState<SystemLog[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      level: 'info',
      message: 'User login successful',
      module: 'Authentication'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      level: 'warning',
      message: 'High memory usage detected',
      module: 'System Monitor'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      level: 'error',
      message: 'Database connection timeout',
      module: 'Database'
    }
  ])

  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '🏠',
      description: 'System Overview'
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      icon: '⚙️',
      description: 'Application Controls'
    },
    {
      id: 'system-logs',
      title: 'System Logs',
      icon: '📋',
      description: 'Activity Monitor'
    },
    {
      id: 'departments',
      title: 'Departments',
      icon: '🏢',
      description: 'Department Management'
    },
    {
      id: 'users',
      title: 'User Management',
      icon: '👥',
      description: 'Manage All Users'
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      icon: '📊',
      description: 'System Reports'
    }
  ]

  const handleSystemToggle = (setting: keyof typeof systemSettings) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }))
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'info': return '💡'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'critical': return '🚨'
      default: return '📝'
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      case 'critical': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={`${isExpanded ? 'w-80' : 'w-16'} bg-gradient-to-b from-red-500 via-orange-500 to-red-600 text-white transition-all duration-300 ease-in-out shadow-2xl`}>
      {/* Header */}
      <div className="p-6 border-b border-red-400/30">
        <div className="flex items-center justify-between">
          <div className={`${isExpanded ? 'block' : 'hidden'} transition-all duration-300`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              Admin Control
            </h2>
            <p className="text-red-100 text-sm mt-1">System Administration</p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
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

      {/* System Status Indicator */}
      <div className={`${isExpanded ? 'px-6 py-4' : 'px-3 py-4'} border-b border-red-400/30`}>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${systemSettings.applicationEnabled ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
          {isExpanded && (
            <span className="text-sm font-medium">
              System {systemSettings.applicationEnabled ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-white/20 backdrop-blur-sm shadow-lg border border-white/30'
                : 'hover:bg-white/10 backdrop-blur-sm'
            }`}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
              {item.icon}
            </span>
            {isExpanded && (
              <div className="flex-1 text-left">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-red-100 opacity-75">{item.description}</div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* System Settings Panel (when system-settings is active) */}
      {activeTab === 'system-settings' && isExpanded && (
        <div className="p-4 border-t border-red-400/30">
          <h3 className="text-lg font-semibold mb-4">Quick Controls</h3>
          <div className="space-y-3">
            {Object.entries(systemSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
                <button
                  onClick={() => handleSystemToggle(key as keyof typeof systemSettings)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    value ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      value ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Logs Preview (when system-logs is active) */}
      {activeTab === 'system-logs' && isExpanded && (
        <div className="p-4 border-t border-red-400/30">
          <h3 className="text-lg font-semibold mb-4">Recent Logs</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <span>{getLogIcon(log.level)}</span>
                  <span className={`text-xs font-medium ${getLogColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-red-100">{log.message}</p>
                <p className="text-xs text-red-200 opacity-75 mt-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`${isExpanded ? 'p-6' : 'p-3'} border-t border-red-400/30`}>
        {isExpanded ? (
          <div className="text-center">
            <p className="text-xs text-red-100 opacity-75">
              LearnAID Admin Panel v2.0
            </p>
            <p className="text-xs text-red-200 opacity-50 mt-1">
              © 2024 All Rights Reserved
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-xs font-bold">LA</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}