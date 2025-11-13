'use client'

import { useState, useEffect } from 'react'
import apiService from '../services/api'

interface Subject {
  id: string
  name: string
  code: string
  type: 'Theory' | 'TCPR' | 'TCPL' | 'Elective'
  description: string
  credits: number
  semester: number
  department: string
  departmentId: string
  section: string
  faculty: Array<{
    id: string
    name: string
    email: string
    department: string
    isExternal: boolean
    isPrimary: boolean
  }>
  status: 'Active' | 'Inactive'
  prerequisite?: string
  syllabus?: string
  maxStudents: number
  enrolledStudents: string[]
  year: string
  academicYear: string
}

interface Department {
  id: string
  name: string
  code: string
}

interface Faculty {
  id: string
  name: string
  department: string
  departmentId: string
  email: string
  designation: string
}

export default function SubjectManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for real data
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    type: 'Theory' as 'Theory' | 'TCPR' | 'TCPL' | 'Elective',
    description: '',
    credits: 3,
    semester: 1,
    department: '',
    section: '',
    faculty: '',
    prerequisite: '',
    syllabus: '',
    maxStudents: 50,
    year: '1st Year',
    academicYear: '2024-2025'
  })

  const sections = ["A", "B", "C"]
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"]

  // Auto-login function for admin access
  const autoLogin = async () => {
    try {
      const existingToken = localStorage.getItem('authToken')
      if (existingToken) {
        apiService.setToken(existingToken)
        return true
      }

      // Auto-login as admin
      const loginResponse = await apiService.login('admin@learnaia.edu', 'admin123')
      if (loginResponse.success && loginResponse.token) {
        console.log('Auto-login successful')
        return true
      }
      return false
    } catch (error) {
      console.error('Auto-login failed:', error)
      return false
    }
  }

  // Load all data
  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Ensure authentication
      const isAuthenticated = await autoLogin()
      if (!isAuthenticated) {
        throw new Error('Authentication failed')
      }

      // Load data in parallel
      const [subjectsResponse, departmentsResponse, usersResponse] = await Promise.all([
        apiService.getSubjects(),
        apiService.getDepartments(),
        apiService.getUsersByRole('Faculty')
      ])

      if (subjectsResponse.success && subjectsResponse.data) {
        const transformedSubjects = subjectsResponse.data.map(apiService.transformSubjectData)
        setSubjects(transformedSubjects)
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        const transformedDepartments = departmentsResponse.data.map((dept: any) => ({
          id: dept._id,
          name: dept.name,
          code: dept.code
        }))
        setDepartments(transformedDepartments)
      }

      if (usersResponse.success && usersResponse.data) {
        const transformedFaculty = usersResponse.data.map(apiService.transformUserData)
        setFaculty(transformedFaculty)
      }

    } catch (error: any) {
      console.error('Error loading data:', error)
      setError(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const subjectData = {
        name: newSubject.name,
        code: newSubject.code,
        type: newSubject.type,
        description: newSubject.description,
        credits: newSubject.credits,
        semester: newSubject.semester,
        department: newSubject.department,
        section: newSubject.section,
        year: newSubject.year,
        academicYear: newSubject.academicYear,
        maxStudents: newSubject.maxStudents,
        prerequisite: newSubject.prerequisite || null
      }

      const response = await apiService.createSubject(subjectData)
      if (response.success) {
        await loadAllData() // Reload data
        resetForm()
        setShowAddForm(false)
      } else {
        setError(response.message || 'Failed to create subject')
      }
    } catch (error: any) {
      console.error('Error creating subject:', error)
      setError(error.message || 'Failed to create subject')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setNewSubject({
      name: subject.name,
      code: subject.code,
      type: subject.type,
      description: subject.description,
      credits: subject.credits,
      semester: subject.semester,
      department: subject.departmentId,
      section: subject.section,
      faculty: subject.faculty[0]?.id || '',
      prerequisite: subject.prerequisite || '',
      syllabus: subject.syllabus || '',
      maxStudents: subject.maxStudents,
      year: subject.year,
      academicYear: subject.academicYear
    })
    setShowAddForm(true)
  }

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubject) return

    try {
      setLoading(true)
      
      const subjectData = {
        name: newSubject.name,
        code: newSubject.code,
        type: newSubject.type,
        description: newSubject.description,
        credits: newSubject.credits,
        semester: newSubject.semester,
        department: newSubject.department,
        section: newSubject.section,
        year: newSubject.year,
        academicYear: newSubject.academicYear,
        maxStudents: newSubject.maxStudents,
        prerequisite: newSubject.prerequisite || null
      }

      const response = await apiService.updateSubject(editingSubject.id, subjectData)
      if (response.success) {
        await loadAllData() // Reload data
        resetForm()
        setShowAddForm(false)
        setEditingSubject(null)
      } else {
        setError(response.message || 'Failed to update subject')
      }
    } catch (error: any) {
      console.error('Error updating subject:', error)
      setError(error.message || 'Failed to update subject')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return

    try {
      setLoading(true)
      const response = await apiService.deleteSubject(subjectId)
      if (response.success) {
        await loadAllData() // Reload data
      } else {
        setError(response.message || 'Failed to delete subject')
      }
    } catch (error: any) {
      console.error('Error deleting subject:', error)
      setError(error.message || 'Failed to delete subject')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewSubject({
      name: '',
      code: '',
      type: 'Theory',
      description: '',
      credits: 3,
      semester: 1,
      department: '',
      section: '',
      faculty: '',
      prerequisite: '',
      syllabus: '',
      maxStudents: 50,
      year: '1st Year',
      academicYear: '2024-2025'
    })
    setEditingSubject(null)
  }

  const getSubjectsByDepartment = () => {
    const subjectsByDept: { [key: string]: Subject[] } = {}
    subjects.forEach(subject => {
      if (!subjectsByDept[subject.department]) {
        subjectsByDept[subject.department] = []
      }
      subjectsByDept[subject.department].push(subject)
    })
    return subjectsByDept
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading subjects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
        <button 
          onClick={loadAllData}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const subjectsByDepartment = getSubjectsByDepartment()

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Subject Management</h1>
          <p className="text-gray-600">Manage subjects, assignments, and faculty allocations</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Subject Overview
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Faculty Assignments
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Subjects</h3>
                <p className="text-3xl font-bold text-gray-800">{subjects.length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Subjects</h3>
                <p className="text-3xl font-bold text-green-600">{subjects.filter(s => s.status === 'Active').length}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Enrollment</h3>
                <p className="text-3xl font-bold text-blue-600">{subjects.reduce((acc, s) => acc + s.enrolledStudents.length, 0)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Departments</h3>
                <p className="text-3xl font-bold text-purple-600">{departments.length}</p>
              </div>
            </div>

            {/* Subjects by Department */}
            {Object.entries(subjectsByDepartment).map(([deptName, deptSubjects]) => (
              <div key={deptName} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{deptName}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-gray-700">Subject</th>
                        <th className="text-left py-3 text-gray-700">Code</th>
                        <th className="text-left py-3 text-gray-700">Type</th>
                        <th className="text-left py-3 text-gray-700">Credits</th>
                        <th className="text-left py-3 text-gray-700">Faculty</th>
                        <th className="text-left py-3 text-gray-700">Section</th>
                        <th className="text-left py-3 text-gray-700">Enrollment</th>
                        <th className="text-left py-3 text-gray-700">Status</th>
                        <th className="text-left py-3 text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptSubjects.map((subject) => (
                        <tr key={subject.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-800">{subject.name}</td>
                          <td className="py-3 text-blue-600 font-mono">{subject.code}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              subject.type === 'Theory' ? 'bg-blue-100 text-blue-800' :
                              subject.type === 'TCPR' ? 'bg-green-100 text-green-800' :
                              subject.type === 'TCPL' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {subject.type}
                            </span>
                          </td>
                          <td className="py-3">{subject.credits}</td>
                          <td className="py-3">{subject.faculty[0]?.name || 'Not Assigned'}</td>
                          <td className="py-3">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {subject.section}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-sm">
                              {subject.enrolledStudents.length}/{subject.maxStudents}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              subject.status === 'Active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subject.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditSubject(subject)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubject(subject.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Subject Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>

              <form onSubmit={editingSubject ? handleUpdateSubject : handleAddSubject} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newSubject.type}
                      onChange={(e) => setNewSubject({...newSubject, type: e.target.value as 'Theory' | 'TCPR' | 'TCPL' | 'Elective'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    >
                      <option value="Theory">Theory</option>
                      <option value="TCPR">TCPR (Theory + Practical)</option>
                      <option value="TCPL">TCPL (Theory + Computer Lab)</option>
                      <option value="Elective">Elective</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newSubject.description}
                    onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newSubject.credits}
                      onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={newSubject.semester}
                      onChange={(e) => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newSubject.maxStudents}
                      onChange={(e) => setNewSubject({...newSubject, maxStudents: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={newSubject.department}
                      onChange={(e) => setNewSubject({...newSubject, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={newSubject.section}
                      onChange={(e) => setNewSubject({...newSubject, section: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={newSubject.year}
                      onChange={(e) => setNewSubject({...newSubject, year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={newSubject.academicYear}
                    onChange={(e) => setNewSubject({...newSubject, academicYear: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    placeholder="2024-2025"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisite (Optional)</label>
                  <input
                    type="text"
                    value={newSubject.prerequisite}
                    onChange={(e) => setNewSubject({...newSubject, prerequisite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    placeholder="Enter prerequisite subject"
                  />
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingSubject ? 'Update Subject' : 'Add Subject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}