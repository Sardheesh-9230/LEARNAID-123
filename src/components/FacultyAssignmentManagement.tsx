'use client'

import { useState, useEffect } from 'react'
import apiService from '../services/api'

interface Faculty {
  id: string
  name: string
  department: string
  departmentId: string
  designation: string
  specialization: string[]
  experience: number
  email: string
  phone: string
}

interface Subject {
  id: string
  name: string
  code: string
  type: string
  credits: number
  semester: number
  department: string
  departmentId: string
  section: string
  year: string
  academicYear: string
  maxStudents: number
  enrolledStudents: string[]
  faculty: Array<{
    id: string
    name: string
    email: string
    department: string
    isExternal: boolean
    isPrimary: boolean
  }>
}

interface Assignment {
  id: string
  facultyId: string
  facultyName: string
  facultyDepartment: string
  subjectName: string
  subjectCode: string
  subjectId: string
  teachingDepartment: string
  section: string
  credits: number
  semester: string
  academicYear: string
  isExternal: boolean
  isPrimary: boolean
}

export default function FacultyAssignmentManagement() {
  const [activeTab, setActiveTab] = useState('assignments')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for real data
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([])

  const [newAssignment, setNewAssignment] = useState({
    facultyId: '',
    subjectId: '',
    isExternal: false,
    isPrimary: false
  })

  // Auto-login function for admin access
  const autoLogin = async () => {
    try {
      const existingToken = localStorage.getItem('authToken')
      if (existingToken) {
        apiService.setToken(existingToken)
        return true
      }

      // Auto-login as admin
      const loginResponse = await apiService.login('admin@learnaid.edu', 'admin123')
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
      const [facultyResponse, subjectsResponse, departmentsResponse] = await Promise.all([
        apiService.getUsersByRole('Faculty'),
        apiService.getSubjects(),
        apiService.getDepartments()
      ])

      if (facultyResponse.success && facultyResponse.data) {
        const transformedFaculty = facultyResponse.data.map((fac: any) => ({
          id: fac._id,
          name: fac.name,
          department: fac.department?.name || 'Unknown',
          departmentId: fac.department?._id || '',
          designation: fac.designation || 'Faculty',
          specialization: fac.specialization || [],
          experience: fac.experience || 0,
          email: fac.email,
          phone: fac.phone || ''
        }))
        setFaculty(transformedFaculty)
      }

      if (subjectsResponse.success && subjectsResponse.data) {
        const transformedSubjects = subjectsResponse.data.map(apiService.transformSubjectData)
        setSubjects(transformedSubjects)
        
        // Generate assignments from subjects with faculty
        const allAssignments: Assignment[] = []
        transformedSubjects.forEach((subject: Subject) => {
          subject.faculty.forEach((fac, index) => {
            allAssignments.push({
              id: `${subject.id}-${fac.id}-${index}`,
              facultyId: fac.id,
              facultyName: fac.name,
              facultyDepartment: fac.department,
              subjectName: subject.name,
              subjectCode: subject.code,
              subjectId: subject.id,
              teachingDepartment: subject.department,
              section: subject.section,
              credits: subject.credits,
              semester: subject.semester.toString(),
              academicYear: subject.academicYear,
              isExternal: fac.isExternal,
              isPrimary: fac.isPrimary
            })
          })
        })
        setAssignments(allAssignments)
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        const transformedDepartments = departmentsResponse.data.map((dept: any) => ({
          id: dept._id,
          name: dept.name
        }))
        setDepartments(transformedDepartments)
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

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const facultyData = {
        facultyId: newAssignment.facultyId,
        isExternal: newAssignment.isExternal,
        isPrimary: newAssignment.isPrimary
      }

      const response = await apiService.assignFacultyToSubject(newAssignment.facultyId, { subjectIds: [newAssignment.subjectId] })
      if (response.success) {
        await loadAllData() // Reload data
        resetForm()
        setShowAssignForm(false)
      } else {
        setError(response.message || 'Failed to assign faculty')
      }
    } catch (error: any) {
      console.error('Error assigning faculty:', error)
      setError(error.message || 'Failed to assign faculty')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignment: Assignment) => {
    if (!confirm(`Are you sure you want to remove ${assignment.facultyName} from ${assignment.subjectName}?`)) return

    try {
      setLoading(true)
      const response = await apiService.removeFacultyFromSubject(assignment.subjectId, assignment.facultyId)
      if (response.success) {
        await loadAllData() // Reload data
      } else {
        setError(response.message || 'Failed to remove assignment')
      }
    } catch (error: any) {
      console.error('Error removing assignment:', error)
      setError(error.message || 'Failed to remove assignment')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewAssignment({
      facultyId: '',
      subjectId: '',
      isExternal: false,
      isPrimary: false
    })
  }

  const getWorkloadStats = () => {
    const workloadMap = new Map<string, { faculty: Faculty; credits: number; subjects: number }>()
    
    assignments.forEach(assignment => {
      const facultyMember = faculty.find((f: Faculty) => f.id === assignment.facultyId)
      if (facultyMember) {
        const current = workloadMap.get(assignment.facultyId) || { 
          faculty: facultyMember, 
          credits: 0, 
          subjects: 0 
        }
        current.credits += assignment.credits
        current.subjects += 1
        workloadMap.set(assignment.facultyId, current)
      }
    })

    return Array.from(workloadMap.values())
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading faculty assignments...</p>
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

  const workloadStats = getWorkloadStats()

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Faculty Assignment Management</h1>
          <p className="text-gray-600">Manage faculty assignments to subjects and track workload</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Current Assignments
              </button>
              <button
                onClick={() => setActiveTab('workload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'workload'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Faculty Workload
              </button>
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'faculty'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Faculty Directory
              </button>
            </div>
            <button
              onClick={() => setShowAssignForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>Assign Faculty</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Current Faculty Assignments</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-700">Faculty</th>
                    <th className="text-left py-3 text-gray-700">Department</th>
                    <th className="text-left py-3 text-gray-700">Subject</th>
                    <th className="text-left py-3 text-gray-700">Code</th>
                    <th className="text-left py-3 text-gray-700">Teaching Dept</th>
                    <th className="text-left py-3 text-gray-700">Section</th>
                    <th className="text-left py-3 text-gray-700">Credits</th>
                    <th className="text-left py-3 text-gray-700">Role</th>
                    <th className="text-left py-3 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{assignment.facultyName}</td>
                      <td className="py-3 text-gray-600">{assignment.facultyDepartment}</td>
                      <td className="py-3">{assignment.subjectName}</td>
                      <td className="py-3 font-mono text-blue-600">{assignment.subjectCode}</td>
                      <td className="py-3 text-gray-600">{assignment.teachingDepartment}</td>
                      <td className="py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {assignment.section}
                        </span>
                      </td>
                      <td className="py-3">{assignment.credits}</td>
                      <td className="py-3">
                        <div className="flex flex-col space-y-1">
                          {assignment.isPrimary && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Primary</span>
                          )}
                          {assignment.isExternal && (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">External</span>
                          )}
                          {!assignment.isPrimary && !assignment.isExternal && (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Regular</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleRemoveAssignment(assignment)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {assignments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No faculty assignments found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'workload' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Faculty Workload Overview</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-700">Faculty</th>
                    <th className="text-left py-3 text-gray-700">Department</th>
                    <th className="text-left py-3 text-gray-700">Designation</th>
                    <th className="text-left py-3 text-gray-700">Total Subjects</th>
                    <th className="text-left py-3 text-gray-700">Total Credits</th>
                    <th className="text-left py-3 text-gray-700">Workload Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadStats.map((stat) => (
                    <tr key={stat.faculty.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{stat.faculty.name}</td>
                      <td className="py-3 text-gray-600">{stat.faculty.department}</td>
                      <td className="py-3 text-gray-600">{stat.faculty.designation}</td>
                      <td className="py-3">{stat.subjects}</td>
                      <td className="py-3">{stat.credits}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          stat.credits <= 12 ? 'bg-green-100 text-green-800' :
                          stat.credits <= 18 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stat.credits <= 12 ? 'Light' : stat.credits <= 18 ? 'Normal' : 'Heavy'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {workloadStats.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No workload data available
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Faculty Directory</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {faculty.map((fac) => (
                <div key={fac.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800">{fac.name}</h3>
                  <p className="text-sm text-gray-600">{fac.designation}</p>
                  <p className="text-sm text-gray-600">{fac.department}</p>
                  <p className="text-sm text-blue-600">{fac.email}</p>
                  {fac.specialization.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Specializations:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fac.specialization.map((spec, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Experience: {fac.experience} years</p>
                </div>
              ))}
            </div>
            
            {faculty.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No faculty members found
              </div>
            )}
          </div>
        )}

        {/* Assignment Form Modal */}
        {showAssignForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Faculty to Subject</h2>

              <form onSubmit={handleAssignFaculty} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                  <select
                    value={newAssignment.facultyId}
                    onChange={(e) => setNewAssignment({...newAssignment, facultyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {faculty.map(fac => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} - {fac.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={newAssignment.subjectId}
                    onChange={(e) => setNewAssignment({...newAssignment, subjectId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name} ({subject.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAssignment.isPrimary}
                      onChange={(e) => setNewAssignment({...newAssignment, isPrimary: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Primary Faculty</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newAssignment.isExternal}
                      onChange={(e) => setNewAssignment({...newAssignment, isExternal: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">External Faculty</span>
                  </label>
                </div>

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Assign Faculty'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignForm(false)
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