'use client'

import React, { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import StudentChatbot from '@/components/StudentChatbot'
import StudentImprovementDashboard from '@/components/StudentImprovementDashboard'
import StudentStudyMaterials from '@/components/StudentStudyMaterials'
import StudentPerformanceDashboard from '@/components/StudentPerformanceDashboard'
import DiscussionPanel from '@/components/DiscussionPanel'
import apiService from '@/services/api'

interface Subject {
  _id: string
  name: string
  code: string
  credits: number
  semester: number
  department: {
    name: string
    code: string
  }
  faculty?: Array<{
    user: {
      name: string
      email: string
    }
    isPrimary: boolean
    isExternal: boolean
  }>
  progress?: number
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Fetch student's subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (activeTab === 'courses' || activeTab === 'discussions') {
        setLoadingSubjects(true)
        try {
          console.log('Fetching student subjects...')
          const response = await apiService.makeRequest('/subjects/student/my-subjects')
          console.log('Subjects response:', response)
          if (response.success) {
            setSubjects(response.data || [])
            console.log(`Loaded ${response.data?.length || 0} subjects`)
          } else {
            console.error('Failed to fetch subjects:', response)
            setSubjects([])
          }
        } catch (error) {
          console.error('Error fetching subjects:', error)
          setSubjects([])
        } finally {
          setLoadingSubjects(false)
        }
      }
    }

    fetchSubjects()
  }, [activeTab])

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StudentPerformanceDashboard />
      
      case 'courses':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📚 My Courses</h2>
            
            {loadingSubjects ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading your courses...</span>
                </div>
              </div>
            ) : subjects.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-600 text-center py-8">
                  No courses found. Please contact your administrator.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {subjects.map((subject) => (
                  <div key={subject._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">{subject.name}</h3>
                        <p className="text-sm text-gray-600">{subject.code}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {subject.credits} Credits
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">🏛️ Department:</span>
                        <span>{subject.department.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">📅 Semester:</span>
                        <span>{subject.semester}</span>
                      </div>
                      {(subject.faculty?.find((f: any) => f.isPrimary)?.user || subject.faculty?.[0]?.user) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">👨‍🏫 Faculty:</span>
                          <span>{(subject.faculty?.find((f: any) => f.isPrimary)?.user || subject.faculty?.[0]?.user)?.name}</span>
                        </div>
                      )}
                    </div>

                    {subject.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Course Progress</span>
                          <span className="font-medium text-blue-600">{subject.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${subject.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      
      case 'tasks':
        return <StudentImprovementDashboard />
      
      case 'grades':
        return <StudentPerformanceDashboard />

      case 'chatbot':
        return <StudentChatbot mode="page" />
      
      case 'resources':
        return <StudentStudyMaterials />
      
      case 'schedule':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">🗓️ Class Schedule</h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center py-8">
                Your class schedule will be displayed here.
              </p>
            </div>
          </div>
        )
      
      case 'progress':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📈 Progress Tracker</h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center py-8">
                Your learning progress and analytics will be shown here.
              </p>
            </div>
          </div>
        )
      
      case 'discussions':
        return (
          <div className="h-[calc(100vh-6rem)] min-h-[500px]">
            {loadingSubjects ? (
              <div className="flex items-center justify-center h-40 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <span className="text-gray-500">Loading subjects…</span>
              </div>
            ) : (
              <DiscussionPanel
                subjects={subjects.map(s => ({ _id: s._id, name: s.name, code: s.code }))}
                userRole="Student"
              />
            )}
          </div>
        )
      
      case 'study-materials':
        return <StudentStudyMaterials />
      
      case 'library':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">🏛️ Digital Library</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search books..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center py-8">
                Digital library books and resources will be available here.
              </p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{activeTab}</h2>
            <p className="text-gray-600">This section is under development. More features coming soon!</p>
          </div>
        )
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      <StudentSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      
      <main className={`flex-1 overflow-auto ${activeTab === 'chatbot' ? 'p-0' : 'p-8'}`}>
        {activeTab === 'chatbot' ? (
          <div className="h-full">
            {renderContent()}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        )}
      </main>

      {/* AI Chatbot (floating) */}
      {activeTab !== 'chatbot' && <StudentChatbot />}
    </div>
  )
}
