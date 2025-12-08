'use client'

import { useState, useEffect } from 'react'
import { FiPlay, FiPause, FiSquare, FiRefreshCw, FiLogOut, FiUser } from 'react-icons/fi'
import apiService from '@/services/api'
import { useRouter } from 'next/navigation'

interface StudentSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isExpanded?: boolean
  onToggle?: () => void
}

interface StudentStats {
  currentGPA: number
  totalCourses: number
  pendingTasks: number
  completedAssignments: number
  overallPercentage: number
}

interface StudyTimer {
  isRunning: boolean
  timeElapsed: number
  subject: string
}

export default function StudentSidebar({ activeTab, onTabChange, isExpanded = true, onToggle }: StudentSidebarProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(3)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [studentStats, setStudentStats] = useState<StudentStats>({
    currentGPA: 0,
    totalCourses: 0,
    pendingTasks: 0,
    completedAssignments: 0,
    overallPercentage: 0
  })
  const [studyTimer, setStudyTimer] = useState<StudyTimer>({
    isRunning: false,
    timeElapsed: 0,
    subject: 'General Study'
  })
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState<string>('Student')

  // Load student data function
  const loadStudentData = async () => {
    try {
      setLoading(true)
      
      // Get current user information
      const userResponse = await apiService.getCurrentUser()
      if (userResponse.success && userResponse.data) {
        setStudentName(userResponse.data.name || 'Student')
        
        const studentId = userResponse.data._id || userResponse.data.id
        
        // Get student analytics
        const analyticsResponse = await apiService.makeRequest(
          `/student-analytics/student/${studentId}/analytics?semester=current&academicYear=2024-2025`
        )
        
        if (analyticsResponse.success && analyticsResponse.data) {
          const analytics = analyticsResponse.data
          setStudentStats({
            currentGPA: analytics.currentGPA || 0,
            totalCourses: analytics.totalSubjects || 0,
            pendingTasks: (analytics.totalSubjects || 0) - (analytics.completedSubjects || 0),
            completedAssignments: analytics.completedSubjects || 0,
            overallPercentage: analytics.averagePercentage || 0
          })
        }
        
        // Get pending tasks count
        try {
          const tasksResponse = await apiService.makeRequest(`/improvement-tasks/student/${studentId}/improvement`)
          if (tasksResponse.success && tasksResponse.data) {
            const pendingTasks = tasksResponse.data.filter((task: any) => task.status === 'pending').length
            setStudentStats(prev => ({ ...prev, pendingTasks: pendingTasks }))
          }
        } catch (taskError) {
          console.log('No improvement tasks found or error loading tasks')
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error)
      // Keep default values on error
    } finally {
      setLoading(false)
    }
  }

  // useEffect hooks
  useEffect(() => {
    loadStudentData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (studyTimer.isRunning) {
      interval = setInterval(() => {
        setStudyTimer(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [studyTimer.isRunning])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    setStudyTimer(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }))
  }

  const resetTimer = () => {
    setStudyTimer(prev => ({
      ...prev,
      isRunning: false,
      timeElapsed: 0
    }))
  }
  
  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '🏠',
      description: 'Overview & Updates',
      color: 'from-emerald-500 to-teal-600',
      badge: null
    },
    {
      id: 'courses',
      title: 'My Courses',
      icon: '📚',
      description: 'Enrolled Subjects',
      color: 'from-blue-500 to-cyan-600',
      badge: null
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: '📝',
      description: 'Tasks & Homework',
      color: 'from-purple-500 to-indigo-600',
      badge: '5'
    },
    {
      id: 'grades',
      title: 'Grades',
      icon: '📊',
      description: 'Performance Tracking',
      color: 'from-green-500 to-emerald-600',
      badge: null
    },
    {
      id: 'resources',
      title: 'Study Materials',
      icon: '📖',
      description: 'Notes & Resources',
      color: 'from-orange-500 to-red-600',
      badge: null
    },
    {
      id: 'schedule',
      title: 'Class Schedule',
      icon: '🗓️',
      description: 'Timetable & Events',
      color: 'from-pink-500 to-rose-600',
      badge: null
    },
    {
      id: 'progress',
      title: 'Progress Tracker',
      icon: '📈',
      description: 'Learning Analytics',
      color: 'from-violet-500 to-purple-600',
      badge: null
    },
    {
      id: 'learning-tasks',
      title: 'Learning Tasks',
      icon: '🎯',
      description: 'CO-based MCQ Tasks',
      color: 'from-teal-500 to-cyan-600',
      badge: notifications > 0 ? notifications.toString() : null
    },
    {
      id: 'improvement-tasks',
      title: 'Improvement Tasks',
      icon: '📋',
      description: 'Auto-assigned tasks',
      color: 'from-red-500 to-pink-600',
      badge: 'NEW'
    },
    {
      id: 'discussions',
      title: 'Discussions',
      icon: '💬',
      description: 'Class Forums',
      color: 'from-teal-500 to-cyan-600',
      badge: '2'
    },
    {
      id: 'library',
      title: 'Digital Library',
      icon: '🏛️',
      description: 'E-Books & Papers',
      color: 'from-indigo-500 to-blue-600',
      badge: null
    }
  ]

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleLogout = () => {
    // Clear localStorage/sessionStorage
    localStorage.removeItem('authToken')
    sessionStorage.removeItem('authToken')
    // Redirect to login
    router.push('/login')
  }

  return (
    <div className={`${isExpanded ? 'w-80' : 'w-16'} ${
      isDarkMode ? 'bg-gradient-to-b from-gray-900 via-emerald-900 to-teal-900' : 'bg-gradient-to-b from-emerald-500 via-teal-500 to-green-600'
    } text-white transition-all duration-300 ease-in-out shadow-2xl relative overflow-hidden`}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-8 w-20 h-20 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 -left-6 w-16 h-16 bg-white rounded-full animate-bounce slow"></div>
        <div className="absolute bottom-20 right-12 w-12 h-12 bg-white rounded-full animate-ping slow"></div>
        <div className="absolute top-2/3 left-1/2 w-8 h-8 bg-white rounded-full animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className={`${isExpanded ? 'block' : 'hidden'} transition-all duration-300`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              StudentHub
            </h2>
            <p className="text-green-100 text-sm mt-1">Learning Portal</p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 transform hover:scale-110 hover:rotate-180"
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

      {/* Student Stats Cards - Real Data */}
      {isExpanded && (
        <div className="relative z-10 p-4">
          {/* Student Name Welcome */}
          <div className="mb-3 text-center">
            <p className="text-sm font-medium text-white/90">Welcome back,</p>
            <p className="text-lg font-bold text-white">{loading ? 'Loading...' : studentName}!</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-200">
              <div className="text-xl mb-1">📈</div>
              <div className="text-xs text-green-100">CGPA</div>
              <div className="text-sm font-bold">
                {loading ? '-.--' : studentStats.currentGPA.toFixed(2)}
              </div>
              <div className="text-xs text-green-200 opacity-75">
                {loading ? '' : `${studentStats.overallPercentage.toFixed(1)}%`}
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-200">
              <div className="text-xl mb-1">📚</div>
              <div className="text-xs text-teal-100">Courses</div>
              <div className="text-sm font-bold">
                {loading ? '-' : studentStats.totalCourses}
              </div>
              <div className="text-xs text-teal-200 opacity-75">
                {loading ? '' : `${studentStats.completedAssignments} completed`}
              </div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20 transform hover:scale-105 transition-all duration-200">
              <div className="text-xl mb-1">⏰</div>
              <div className="text-xs text-emerald-100">Tasks</div>
              <div className="text-sm font-bold">
                {loading ? '-' : studentStats.pendingTasks}
              </div>
              <div className="text-xs text-emerald-200 opacity-75">
                pending
              </div>
            </div>
          </div>
          
          {/* Refresh Button - Simplified */}
          <div className="mt-3 text-center">
            <button
              onClick={loadStudentData}
              disabled={loading}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white/80 hover:text-white transition-all duration-200 flex items-center gap-1 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="relative z-10 flex-1 p-4 space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              activeTab === item.id
                ? 'bg-white/25 backdrop-blur-md shadow-lg border border-white/40 transform scale-105'
                : 'hover:bg-white/15 backdrop-blur-sm hover:transform hover:scale-102 hover:shadow-lg'
            }`}
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            {/* Gradient Background for Active Item */}
            {activeTab === item.id && (
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-40 rounded-xl`}></div>
            )}
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex items-center space-x-3 w-full">
              <span className="text-2xl group-hover:scale-125 transition-all duration-300 filter group-hover:drop-shadow-lg">
                {item.icon}
              </span>
              {isExpanded && (
                <>
                  <div className="flex-1 text-left">
                    <div className="font-medium group-hover:text-white transition-colors duration-200 flex items-center">
                      {item.title}
                      {item.badge && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-green-100 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
                      {item.description}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          </button>
        ))}
      </nav>

      {/* Enhanced Study Tools with Functional Timer */}
      {isExpanded && (
        <div className="relative z-10 p-4 border-t border-white/20">
          <h3 className="text-sm font-semibold mb-3 text-green-100">Study Tools</h3>
          
          {/* Study Timer */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-3 border border-white/20">
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-white mb-1">
                {formatTime(studyTimer.timeElapsed)}
              </div>
              <div className="text-xs text-green-100">
                {studyTimer.subject}
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={toggleTimer}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  studyTimer.isRunning 
                    ? 'bg-red-500/80 hover:bg-red-500 text-white' 
                    : 'bg-green-500/80 hover:bg-green-500 text-white'
                }`}
              >
                {studyTimer.isRunning ? <FiPause size={14} /> : <FiPlay size={14} />}
              </button>
              
              <button
                onClick={resetTimer}
                className="p-2 rounded-lg bg-gray-500/80 hover:bg-gray-500 text-white transition-all duration-200 flex items-center justify-center"
              >
                <FiSquare size={14} />
              </button>
            </div>
            
            {studyTimer.isRunning && (
              <div className="mt-2 text-center">
                <div className="text-xs text-green-200 animate-pulse">
                  📚 Focus time active
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Search */}
          <button 
            onClick={() => onTabChange('resources')}
            className="w-full bg-white/15 backdrop-blur-sm rounded-lg p-3 text-xs hover:bg-white/25 transition-all duration-300 transform hover:scale-105 border border-white/20 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🔍</span>
            <span>Quick Search</span>
          </button>
        </div>
      )}

      {/* Notifications Panel - Dynamic */}
      {isExpanded && (studentStats.pendingTasks > 0 || notifications > 0) && (
        <div className="relative z-10 p-4 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Notifications</span>
              <span className="bg-red-500 text-xs px-2 py-1 rounded-full animate-bounce">
                {studentStats.pendingTasks + notifications}
              </span>
            </div>
            <div className="space-y-1">
              {studentStats.pendingTasks > 0 && (
                <p className="text-xs text-yellow-200">
                  🎯 {studentStats.pendingTasks} improvement task{studentStats.pendingTasks > 1 ? 's' : ''} pending
                </p>
              )}
              {notifications > 0 && (
                <p className="text-xs text-green-100 opacity-75">
                  📚 {notifications} course update{notifications > 1 ? 's' : ''} available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings & Footer */}
      <div className="relative z-10 p-4 border-t border-white/20 space-y-3">
        {isExpanded && (
          <>
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                isDarkMode ? 'bg-yellow-500/20 text-yellow-200' : 'bg-gray-800/20 text-gray-200'
              }`}
            >
              <span className="text-xl animate-spin-slow">{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="text-sm">{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </button>

            {/* Profile Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white truncate">{studentName}</p>
                  <p className="text-xs text-green-100 opacity-75">Student Portal</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-100 hover:text-white transition-all duration-200 border border-red-300/20"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>

            {/* Footer Info */}
            <div className="text-center">
              <p className="text-xs text-green-100 opacity-75">
                LearnAID Student Portal v2.0
              </p>
              <p className="text-xs text-teal-100 opacity-50 mt-1">
                🎓 Empowering Education
              </p>
            </div>
          </>
        )}
        
        {!isExpanded && (
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              <FiUser className="w-4 h-4" />
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center mx-auto text-red-100 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
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
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animate-float-1 { animation: float1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float3 3.5s ease-in-out infinite; }
        .animate-float-4 { animation: float4 4.5s ease-in-out infinite; }
        .animate-float-5 { animation: float5 3.2s ease-in-out infinite; }
        .animate-float-6 { animation: float6 4.2s ease-in-out infinite; }
        
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-10px) translateX(5px); }
          66% { transform: translateY(5px) translateX(-3px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(-8px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-8px) translateX(4px); }
          75% { transform: translateY(6px) translateX(-6px); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          40% { transform: translateY(-12px) translateX(-2px); }
          80% { transform: translateY(8px) translateX(7px); }
        }
        @keyframes float5 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          60% { transform: translateY(-6px) translateX(-5px); }
        }
        @keyframes float6 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          30% { transform: translateY(-14px) translateX(3px); }
          70% { transform: translateY(4px) translateX(-4px); }
        }
        .slow {
          animation-duration: 3s;
        }
      `}</style>
    </div>
  )
}