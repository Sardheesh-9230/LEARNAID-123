'use client'

import { useState } from 'react'
import DepartmentManagement from './DepartmentManagement'
import UserManagement from './UserManagement'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Empty data arrays - to be populated from actual data sources
  const departmentStats: Array<{
    name: string;
    students: number;
    faculty: number;
    staff: number;
    subjects: number;
  }> = []

  const recentActivities: Array<{
    action: string;
    department?: string;
    section?: string;
    subject?: string;
    faculty?: string;
    time: string;
  }> = []

  const adminFeatures = [
    {
      id: 'departments',
      title: "Department Management",
      icon: "🏢",
      description: "Create and manage departments with class sections and subjects",
      actions: ["Create Department", "Manage Sections", "Assign Subjects", "Faculty Assignment"]
    },
    {
      id: 'users',
      title: "User Management",
      icon: "👥",
      description: "Manage students, faculty, and staff",
      actions: ["Add User", "Edit Profile", "Assign Roles", "View Activity"]
    },
    {
      id: 'reports',
      title: "Analytics & Reports",
      icon: "📊",
      description: "Generate comprehensive reports",
      actions: ["Department Reports", "Performance Analytics", "Export Data", "Custom Reports"]
    }
  ]

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Students</h3>
              <p className="text-3xl font-bold text-blue-600">{departmentStats.reduce((sum, dept) => sum + dept.students, 0)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Faculty</h3>
              <p className="text-3xl font-bold text-purple-600">{departmentStats.reduce((sum, dept) => sum + dept.faculty, 0)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👩‍🏫</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Departments</h3>
              <p className="text-3xl font-bold text-green-600">{departmentStats.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Active Subjects</h3>
              <p className="text-3xl font-bold text-orange-600">{departmentStats.reduce((sum, dept) => sum + dept.subjects, 0)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📖</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Department Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Students</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Faculty</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Subjects</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{dept.name}</td>
                  <td className="py-3 px-4 text-blue-600">{dept.students}</td>
                  <td className="py-3 px-4 text-purple-600">{dept.faculty}</td>
                  <td className="py-3 px-4 text-green-600">{dept.staff}</td>
                  <td className="py-3 px-4 text-orange-600">{dept.subjects}</td>
                  <td className="py-3 px-4">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-600">
                  {activity.department && `Department: ${activity.department}`}
                  {activity.section && ` | Section: ${activity.section}`}
                  {activity.subject && `Subject: ${activity.subject}`}
                  {activity.faculty && ` | Faculty: ${activity.faculty}`}
                </p>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Generate Reports</h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Department Report</h4>
            <p className="text-gray-600 mb-4">Comprehensive analysis of all departments</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full">
              Generate Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Student Analytics</h4>
            <p className="text-gray-600 mb-4">Student performance and enrollment data</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 w-full">
              Generate Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H8a2 2 0 00-2-2V6m8 0H8m0 0v-.5A1.5 1.5 0 009.5 4h5A1.5 1.5 0 0116 5.5V6m-8 0h8" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Faculty Workload</h4>
            <p className="text-gray-600 mb-4">Faculty assignments and teaching loads</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 w-full">
              Generate Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Subject Analytics</h4>
            <p className="text-gray-600 mb-4">Subject performance and enrollment trends</p>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 w-full">
              Generate Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Financial Report</h4>
            <p className="text-gray-600 mb-4">Budget allocation and expenses</p>
            <button className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 w-full">
              Generate Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Custom Report</h4>
            <p className="text-gray-600 mb-4">Create custom reports with specific filters</p>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full">
              Create Custom
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600">LearnAIA Management Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, Administrator</span>
              <a href="/login" className="text-red-600 hover:text-red-700 font-medium">Logout</a>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            {adminFeatures.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === feature.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{feature.icon}</span>
                {feature.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'reports' && renderReports()}
      </div>
    </div>
  )
}
