'use client'

import { useState } from 'react'
import StudentSidebar from '@/components/StudentSidebar'

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

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
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Current GPA</h3>
                <p className="text-3xl font-bold text-blue-600">3.85</p>
                <p className="text-sm text-gray-500 mt-1">↑ 0.15 from last semester</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Courses</h3>
                <p className="text-3xl font-bold text-green-600">6</p>
                <p className="text-sm text-gray-500 mt-1">All courses on track</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Tasks</h3>
                <p className="text-3xl font-bold text-orange-600">5</p>
                <p className="text-sm text-gray-500 mt-1">3 due this week</p>
              </div>
            </div>
          </div>
        )
      
      case 'courses':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📚 My Courses</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {['Mathematics', 'Physics', 'Computer Science', 'English Literature', 'History', 'Chemistry'].map((course, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{course}</h3>
                  <p className="text-gray-600 mb-4">Semester 1 • 2024</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.random() * 40 + 60}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Progress: {Math.floor(Math.random() * 40 + 60)}%</p>
                </div>
              ))}
            </div>
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
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">📊 Grade Report</h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Semester</h3>
              <div className="space-y-4">
                {[
                  { course: 'Mathematics', grade: 'A-', points: '3.7' },
                  { course: 'Physics', grade: 'B+', points: '3.3' },
                  { course: 'Computer Science', grade: 'A', points: '4.0' },
                  { course: 'English Literature', grade: 'A-', points: '3.7' },
                ].map((grade, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-800">{grade.course}</span>
                    <div className="text-right">
                      <span className="font-bold text-lg text-blue-600">{grade.grade}</span>
                      <span className="text-gray-500 ml-2">({grade.points})</span>
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  )
}