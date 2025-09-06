'use client'

import { useState, useEffect } from 'react'

export default function FacultyDashboard() {
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Get user info from localStorage
    const email = localStorage.getItem('userEmail')
    if (email) setUserEmail(email)
  }, [])

  const mySubjects = [
    { id: 1, name: "Data Structures", department: "Computer Science", section: "A", students: 45 },
    { id: 2, name: "Algorithms", department: "Computer Science", section: "B", students: 38 },
    { id: 3, name: "Database Systems", department: "Computer Science", section: "A", students: 42 }
  ]

  const recentActivities = [
    { activity: "Assignment graded", subject: "Data Structures", time: "2 hours ago" },
    { activity: "Attendance marked", subject: "Algorithms", time: "1 day ago" },
    { activity: "Quiz created", subject: "Database Systems", time: "2 days ago" }
  ]

  const upcomingClasses = [
    { subject: "Data Structures", time: "10:00 AM", room: "CS-101", section: "A" },
    { subject: "Algorithms", time: "2:00 PM", room: "CS-102", section: "B" },
    { subject: "Database Systems", time: "4:00 PM", room: "CS-103", section: "A" }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Faculty Dashboard</h1>
                <p className="text-gray-600">Welcome, {userEmail}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-red-600 hover:text-red-700">Logout</a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-800">My Subjects</h3>
            <p className="text-3xl font-bold text-purple-600">{mySubjects.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">{mySubjects.reduce((acc, subj) => acc + subj.students, 0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Today's Classes</h3>
            <p className="text-3xl font-bold text-green-600">{upcomingClasses.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-800">Pending Tasks</h3>
            <p className="text-3xl font-bold text-orange-600">7</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Subjects */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800">My Subjects</h3>
            <div className="space-y-4">
              {mySubjects.map((subject) => (
                <div key={subject.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                      <p className="text-sm text-gray-600">{subject.department} - Section {subject.section}</p>
                      <p className="text-sm text-blue-600">{subject.students} students</p>
                    </div>
                    <button className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Today's Schedule</h3>
            <div className="space-y-4">
              {upcomingClasses.map((cls, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{cls.subject}</h4>
                      <p className="text-sm text-gray-600">Room: {cls.room} | Section: {cls.section}</p>
                    </div>
                    <span className="text-blue-600 font-medium">{cls.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{activity.activity}</p>
                  <p className="text-sm text-gray-600">Subject: {activity.subject}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
