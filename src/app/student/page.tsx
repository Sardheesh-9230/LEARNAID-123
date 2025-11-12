'use client'

import { useState, useEffect } from 'react'

export default function StudentDashboard() {
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Get user info from localStorage
    const email = localStorage.getItem('userEmail')
    const name = localStorage.getItem('userName')
    if (email) setUserEmail(email)
    if (name) setUserName(name)
  }, [])

  const enrolledSubjects = [
    { id: 1, name: "Data Structures", code: "CS101", credits: 4, faculty: "Dr. Priya Sharma", grade: "A" },
    { id: 2, name: "Algorithms", code: "CS102", credits: 4, faculty: "Dr. Rajesh Kumar", grade: "B+" },
    { id: 3, name: "Database Systems", code: "CS201", credits: 3, faculty: "Dr. Anjali Verma", grade: "A-" },
    { id: 4, name: "Web Development", code: "CS202", credits: 3, faculty: "Prof. Amit Singh", grade: "A" }
  ]

  const upcomingAssignments = [
    { subject: "Data Structures", title: "Binary Trees Assignment", dueDate: "Sept 25, 2025", status: "pending" },
    { subject: "Algorithms", title: "Sorting Algorithm Analysis", dueDate: "Sept 28, 2025", status: "pending" },
    { subject: "Database Systems", title: "ER Diagram Project", dueDate: "Oct 2, 2025", status: "pending" }
  ]

  const recentGrades = [
    { subject: "Web Development", assignment: "JavaScript Quiz", grade: "95/100", date: "Sept 15, 2025" },
    { subject: "Data Structures", assignment: "Linked List Lab", grade: "88/100", date: "Sept 12, 2025" },
    { subject: "Algorithms", assignment: "Time Complexity Test", grade: "92/100", date: "Sept 10, 2025" }
  ]

  const todaySchedule = [
    { subject: "Data Structures", time: "9:00 AM", room: "CS-101", type: "Lecture" },
    { subject: "Algorithms", time: "11:00 AM", room: "CS-102", type: "Lab" },
    { subject: "Database Systems", time: "2:00 PM", room: "CS-201", type: "Lecture" }
  ]

  const calculateGPA = () => {
    const gradePoints: { [key: string]: number } = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    }
    
    let totalPoints = 0
    let totalCredits = 0
    
    enrolledSubjects.forEach(subject => {
      const points = gradePoints[subject.grade] || 0
      totalPoints += points * subject.credits
      totalCredits += subject.credits
    })
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
                <p className="text-gray-600">Welcome, {userName || userEmail}</p>
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
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Current GPA</h3>
            <p className="text-3xl font-bold text-green-600">{calculateGPA()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Enrolled Subjects</h3>
            <p className="text-3xl font-bold text-blue-600">{enrolledSubjects.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-800">Pending Assignments</h3>
            <p className="text-3xl font-bold text-orange-600">{upcomingAssignments.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Credits</h3>
            <p className="text-3xl font-bold text-purple-600">{enrolledSubjects.reduce((acc, subj) => acc + subj.credits, 0)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Today's Schedule</h3>
            <div className="space-y-4">
              {todaySchedule.map((cls, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{cls.subject}</h4>
                      <p className="text-sm text-gray-600">Room: {cls.room} | {cls.type}</p>
                    </div>
                    <span className="text-blue-600 font-medium">{cls.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Upcoming Assignments</h3>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.subject}</p>
                      <p className="text-sm text-orange-600">Due: {assignment.dueDate}</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrolled Subjects */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Enrolled Subjects</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-700">Subject</th>
                  <th className="text-left py-3 text-gray-700">Code</th>
                  <th className="text-left py-3 text-gray-700">Credits</th>
                  <th className="text-left py-3 text-gray-700">Faculty</th>
                  <th className="text-left py-3 text-gray-700">Grade</th>
                </tr>
              </thead>
              <tbody>
                {enrolledSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium">{subject.name}</td>
                    <td className="py-3 text-blue-600">{subject.code}</td>
                    <td className="py-3">{subject.credits}</td>
                    <td className="py-3">{subject.faculty}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        subject.grade.startsWith('A') ? 'bg-green-100 text-green-800' :
                        subject.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {subject.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Recent Grades</h3>
          <div className="space-y-4">
            {recentGrades.map((grade, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{grade.assignment}</p>
                  <p className="text-sm text-gray-600">{grade.subject}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{grade.grade}</p>
                  <p className="text-sm text-gray-500">{grade.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}