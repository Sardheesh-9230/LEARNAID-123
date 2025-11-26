'use client'

import { useState, useEffect } from 'react'
import { FiUser, FiBook, FiTrendingUp, FiCalendar, FiTarget, FiAward, FiClock } from 'react-icons/fi'
import StudentSidebar from '@/components/StudentSidebar'
import StudentMarksAnalytics from '@/components/StudentMarksAnalytics'
import StudentImprovementDashboard from '@/components/StudentImprovementDashboard'
import StudentStudyMaterials from '@/components/StudentStudyMaterials'
import apiService from '@/services/api'

interface StudentData {
  _id: string
  name: string
  email: string
  rollNumber?: string
  department?: string
  year?: number
  section?: string
}

interface DashboardStats {
  currentGPA: number
  totalCredits: number
  activeCourses: number
  completedAssignments: number
  pendingTasks: number
  overallPercentage: number
  totalSubjects: number
  passedSubjects: number
}

interface RecentActivity {
  _id: string
  type: 'exam' | 'assignment' | 'grade'
  title: string
  subject: string
  date: string
  score?: number
  status: 'completed' | 'pending' | 'graded'
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user information
      const userResponse = await apiService.getCurrentUser()
      if (!userResponse.success || !userResponse.data) {
        throw new Error('Failed to get user information')
      }

      const student = userResponse.data
      setStudentData({
        _id: student._id || student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber || student.studentId,
        department: student.department,
        year: student.year,
        section: student.section
      })

      // Get student analytics for dashboard stats
      const analyticsResponse = await apiService.makeRequest(
        `/student-analytics/student/${student._id || student.id}/analytics?semester=current&academicYear=2024-2025`
      )

      if (analyticsResponse.success && analyticsResponse.data) {
        const analytics = analyticsResponse.data
        setDashboardStats({
          currentGPA: analytics.currentGPA || 0,
          totalCredits: analytics.totalCredits || 0,
          activeCourses: analytics.totalSubjects || 0,
          completedAssignments: analytics.completedSubjects || 0,
          pendingTasks: (analytics.totalSubjects || 0) - (analytics.completedSubjects || 0),
          overallPercentage: analytics.averagePercentage || 0,
          totalSubjects: analytics.totalSubjects || 0,
          passedSubjects: analytics.passedSubjects || 0
        })
      } else {
        // Set default stats if no analytics data
        setDashboardStats({
          currentGPA: 0,
          totalCredits: 0,
          activeCourses: 0,
          completedAssignments: 0,
          pendingTasks: 0,
          overallPercentage: 0,
          totalSubjects: 0,
          passedSubjects: 0
        })
      }

      // Get recent activities (marks/grades)
      const marksResponse = await apiService.makeRequest(
        `/student-analytics/student/${student._id || student.id}?semester=current&academicYear=2024-2025`
      )

      if (marksResponse.success && marksResponse.data) {
        const marks = marksResponse.data.slice(0, 5) // Get recent 5 activities
        const activities: RecentActivity[] = marks.map((mark: any) => ({
          _id: mark._id,
          type: 'exam',
          title: `${mark.examType} Examination`,
          subject: mark.subject?.name || 'Unknown Subject',
          date: new Date(mark.enteredAt || mark.createdAt).toLocaleDateString(),
          score: mark.percentage,
          status: 'graded'
        }))
        setRecentActivities(activities)
      }

    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
      // Set default student data if error
      setStudentData({
        _id: 'unknown',
        name: 'Student',
        email: 'student@example.com'
      })
      setDashboardStats({
        currentGPA: 0,
        totalCredits: 0,
        activeCourses: 0,
        completedAssignments: 0,
        pendingTasks: 0,
        overallPercentage: 0,
        totalSubjects: 0,
        passedSubjects: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (loading) {
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900">Loading Your Dashboard...</h3>
                <p className="text-gray-500 mt-2">Fetching your latest academic data</p>
              </div>
            </div>
          )
        }

        if (error) {
          return (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-red-500 flex-shrink-0 mt-0.5">
                    <FiUser size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
                    <p className="text-red-700">{error}</p>
                    <button 
                      onClick={loadDashboardData}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            {/* Welcome Header with Student Name */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-xl">
                    <FiUser size={40} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Welcome Back, {studentData?.name || 'Student'}!</h1>
                    <p className="text-blue-100 mt-2">
                      {studentData?.rollNumber && `Roll No: ${studentData.rollNumber} • `}
                      {studentData?.department && `${studentData.department} • `}
                      {studentData?.year && `Year ${studentData.year}`}
                      {studentData?.section && ` - Section ${studentData.section}`}
                    </p>
                    <p className="text-blue-200 text-sm mt-1">
                      Your learning journey continues here. Check your progress and achievements below.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold mb-1">{dashboardStats?.currentGPA.toFixed(2) || '0.00'}</div>
                  <div className="text-blue-200 text-sm">Current GPA</div>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center gap-3 mb-3">
                  <FiTrendingUp className="text-blue-600" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">Current GPA</h3>
                </div>
                <p className="text-3xl font-bold text-blue-600">{dashboardStats?.currentGPA.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats?.overallPercentage.toFixed(1) || '0.0'}% Overall Average
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center gap-3 mb-3">
                  <FiBook className="text-green-600" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">Active Courses</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">{dashboardStats?.activeCourses || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats?.passedSubjects || 0} passed • {dashboardStats?.totalCredits || 0} credits
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center gap-3 mb-3">
                  <FiTarget className="text-orange-600" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                </div>
                <p className="text-3xl font-bold text-orange-600">{dashboardStats?.completedAssignments || 0}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {dashboardStats?.pendingTasks || 0} pending evaluations
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center gap-3 mb-3">
                  <FiAward className="text-purple-600" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">Achievement</h3>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {(dashboardStats?.overallPercentage || 0) >= 75 ? 'Excellent' :
                   (dashboardStats?.overallPercentage || 0) >= 60 ? 'Good' :
                   (dashboardStats?.overallPercentage || 0) >= 40 ? 'Average' : 'Needs Improvement'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Based on current performance
                </p>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <FiClock className="text-gray-600" size={24} />
                <h3 className="text-xl font-bold text-gray-800">Recent Activities</h3>
              </div>
              
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'exam' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'assignment' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {activity.type === 'exam' ? <FiBook size={20} /> :
                           activity.type === 'assignment' ? <FiTarget size={20} /> :
                           <FiAward size={20} />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{activity.title}</h4>
                          <p className="text-sm text-gray-600">{activity.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {activity.score ? `${activity.score.toFixed(1)}%` : activity.status}
                        </div>
                        <div className="text-xs text-gray-500">{activity.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiCalendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No Recent Activities</h4>
                  <p className="text-gray-500">Your recent exam results and activities will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'courses':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <FiBook className="text-blue-600" />
                📚 My Courses
              </h2>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FiTarget size={16} />
                Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {dashboardStats?.activeCourses ? (
                  // If we have real course data, we would map through them here
                  // For now, showing message that courses will be loaded from subjects
                  <div className="col-span-2 bg-white rounded-xl shadow-lg p-8 text-center">
                    <FiBook className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {studentData?.name ? `${studentData.name}'s Courses` : 'Your Courses'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You have {dashboardStats.activeCourses} active courses this semester.
                    </p>
                    <p className="text-sm text-gray-500">
                      Detailed course information will be loaded from your enrolled subjects.
                      Your current GPA is {dashboardStats.currentGPA.toFixed(2)} with {dashboardStats.totalCredits} total credits.
                    </p>
                  </div>
                ) : (
                  <div className="col-span-2 bg-white rounded-xl shadow-lg p-8 text-center">
                    <FiBook className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Courses Found</h3>
                    <p className="text-gray-600">
                      Your enrolled courses will appear here once you have subjects assigned.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      
      case 'assignments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📝 Assignments</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Assignment</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Course</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: 'Calculus Problem Set 5', course: 'Mathematics', due: '2024-01-15', status: 'pending' },
                      { title: 'Physics Lab Report', course: 'Physics', due: '2024-01-18', status: 'in-progress' },
                      { title: 'Essay on Modern Literature', course: 'English', due: '2024-01-20', status: 'pending' },
                    ].map((assignment, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-800">{assignment.title}</td>
                        <td className="py-3 px-4 text-gray-600">{assignment.course}</td>
                        <td className="py-3 px-4 text-gray-600">{assignment.due}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            assignment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {assignment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      
      case 'grades':
        return <StudentMarksAnalytics />
      
      case 'improvement-tasks':
        return <StudentImprovementDashboard />
      
      case 'resources':
        return <StudentStudyMaterials />
      
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
    </div>
  )
}