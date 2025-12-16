'use client'

import React, { useState, useEffect } from 'react'
import StudentSidebar from '@/components/StudentSidebar'
import StudentChatbot from '@/components/StudentChatbot'
import StudentImprovementDashboard from '@/components/StudentImprovementDashboard'
import StudentStudyMaterials from '@/components/StudentStudyMaterials'
import StudentTaskDashboard from '@/components/StudentTaskDashboard'
import apiService from '@/services/api'

interface Discussion {
  id: number
  title: string
  course: string
  author: string
  replies: number
  time: string
  status: string
  content: string
  replyList: Array<{ author: string; text: string; time: string }>
}

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
  faculty?: {
    user: {
      name: string
      email: string
    }
  }
  progress?: number
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [newReply, setNewReply] = useState('')
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false)
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('')
  const [newDiscussionCourse, setNewDiscussionCourse] = useState('Mathematics')
  const [newDiscussionContent, setNewDiscussionContent] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Fetch student's subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      if (activeTab === 'courses') {
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
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🎓 Welcome Back, Student!</h2>
              <p className="text-gray-600">
                Your learning journey continues here. Check your courses, assignments, and progress below.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center py-8">
                Dashboard statistics will be displayed here based on your real data.
              </p>
            </div>
          </div>
        )
      
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
                      {subject.faculty?.user && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">👨‍🏫 Faculty:</span>
                          <span>{subject.faculty.user.name}</span>
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
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500" 
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
        return <StudentTaskDashboard />
      
      case 'grades':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📊 Grade Report</h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <p className="text-gray-600 text-center py-8">
                Your grades and academic performance will be shown here.
              </p>
            </div>
          </div>
        )
      
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">💬 Class Discussions</h2>
              <button 
                onClick={() => setShowNewDiscussionModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Discussion
              </button>
            </div>
            <div className="space-y-4">
              {discussions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <p className="text-gray-600 text-center py-8">
                    No discussions yet. Start a new discussion to engage with your classmates!
                  </p>
                </div>
              ) : (
                discussions.map((discussion) => (
                  <div 
                    key={discussion.id} 
                    onClick={() => setSelectedDiscussion(discussion)}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{discussion.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{discussion.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">{discussion.course}</span>
                          <span>👤 {discussion.author}</span>
                          <span className="font-medium text-blue-600">💬 {discussion.replies} replies</span>
                          <span>⏰ {discussion.time}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        discussion.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {discussion.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setShowNewDiscussionModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold"
            >
              + Start New Discussion
            </button>
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <StudentSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* AI Chatbot */}
      <StudentChatbot />

      {/* Discussion Modal */}
      {selectedDiscussion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDiscussion(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedDiscussion.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-blue-100 flex-wrap">
                    <span className="px-3 py-1 bg-white/20 rounded-full">{selectedDiscussion.course}</span>
                    <span>👤 {selectedDiscussion.author}</span>
                    <span>⏰ {selectedDiscussion.time}</span>
                    <span className={`px-3 py-1 rounded-full ${
                      selectedDiscussion.status === 'active' ? 'bg-green-500/30' : 'bg-gray-500/30'
                    }`}>
                      {selectedDiscussion.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedDiscussion(null)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-600">
                <p className="text-gray-800">{selectedDiscussion.content}</p>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💬 Replies ({selectedDiscussion.replyList.length})</h3>
              <div className="space-y-4 mb-6">
                {selectedDiscussion.replyList.map((reply, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">{reply.author}</span>
                      <span className="text-xs text-gray-500">{reply.time}</span>
                    </div>
                    <p className="text-gray-700">{reply.text}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Add Your Reply</h4>
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button 
                    onClick={() => setNewReply('')}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (newReply.trim() && selectedDiscussion) {
                        const updatedDiscussions = discussions.map(d => {
                          if (d.id === selectedDiscussion.id) {
                            return {
                              ...d,
                              replies: d.replies + 1,
                              replyList: [...d.replyList, {
                                author: 'You',
                                text: newReply,
                                time: 'Just now'
                              }]
                            }
                          }
                          return d
                        })
                        setDiscussions(updatedDiscussions)
                        const updated = updatedDiscussions.find(d => d.id === selectedDiscussion.id)
                        if (updated) setSelectedDiscussion(updated)
                        setNewReply('')
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                  >
                    Post Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewDiscussionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewDiscussionModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold">Start New Discussion</h2>
                <button onClick={() => setShowNewDiscussionModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discussion Title</label>
                  <input
                    type="text"
                    value={newDiscussionTitle}
                    onChange={(e) => setNewDiscussionTitle(e.target.value)}
                    placeholder="Enter discussion title..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={newDiscussionCourse}
                    onChange={(e) => setNewDiscussionCourse(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Mathematics</option>
                    <option>Physics</option>
                    <option>Computer Science</option>
                    <option>Chemistry</option>
                    <option>History</option>
                    <option>English Literature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newDiscussionContent}
                    onChange={(e) => setNewDiscussionContent(e.target.value)}
                    placeholder="Describe your question or topic..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={6}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => {
                    setShowNewDiscussionModal(false)
                    setNewDiscussionTitle('')
                    setNewDiscussionContent('')
                  }}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (newDiscussionTitle.trim() && newDiscussionContent.trim()) {
                      const newDiscussion: Discussion = {
                        id: discussions.length + 1,
                        title: newDiscussionTitle,
                        course: newDiscussionCourse,
                        author: 'You',
                        replies: 0,
                        time: 'Just now',
                        status: 'active',
                        content: newDiscussionContent,
                        replyList: []
                      }
                      setDiscussions([newDiscussion, ...discussions])
                      setShowNewDiscussionModal(false)
                      setNewDiscussionTitle('')
                      setNewDiscussionContent('')
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                >
                  Post Discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}