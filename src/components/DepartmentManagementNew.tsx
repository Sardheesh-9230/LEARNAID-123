'use client'

import { useState, useEffect } from 'react'
import apiService from '../services/api'

interface Department {
  id: string
  name: string
  code: string
  description: string
  hod: string
  hodId?: string
  establishedYear: number
  sections: string[]
  facilities: any[]
  programs: any[]
  contactInfo: {
    email: string
    phone: string
    location: string
  }
  status: 'Active' | 'Inactive'
  students: number
  faculty: number
  staff: number
  subjects: number
}

interface User {
  id: string
  name: string
  email: string
  role: 'Student' | 'Faculty' | 'Staff' | 'Admin'
  department: string
  departmentId: string
  section?: string
  batch?: string
  phone: string
  address: string
  status: 'Active' | 'Inactive'
  // Student specific
  studentId?: string
  semester?: number
  gpa?: number
  guardianName?: string
  guardianPhone?: string
  // Faculty specific
  employeeId?: string
  designation?: string
  qualification?: string
  experience?: number
  specialization?: string[]
}

interface Subject {
  id: string
  name: string
  code: string
  credits: number
  description: string
  department: string
  departmentId: string
  year: string
  section: string
  semester: number
  academicYear: string
  type: string
  faculty: any[]
  enrolledStudents: string[]
  maxStudents: number
  status: 'Active' | 'Inactive'
}

export default function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Data states
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  
  // Form data
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    description: '',
    hod: '',
    establishedYear: new Date().getFullYear(),
    sections: [] as string[],
    contactInfo: {
      email: '',
      phone: '',
      location: ''
    }
  })

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    credits: 3,
    department: '',
    year: '1st Year',
    section: 'A',
    semester: 1,
    academicYear: '2024-2025',
    type: 'Core',
    description: '',
    createForAllSections: false
  })

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning'
  })

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000)
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Load departments, users, and subjects in parallel
      const [departmentsData, usersData, subjectsData] = await Promise.all([
        apiService.getDepartments(),
        apiService.getUsers(),
        apiService.getSubjects()
      ])

      // Transform and set departments
      const transformedDepartments = departmentsData.data?.map(apiService.transformDepartmentData) || []
      setDepartments(transformedDepartments)

      // Transform and set users
      const transformedUsers = usersData.data?.map(apiService.transformUserData) || []
      setUsers(transformedUsers)

      // Transform and set subjects
      const transformedSubjects = subjectsData.data?.map(apiService.transformSubjectData) || []
      setSubjects(transformedSubjects)

      // Update department statistics
      updateDepartmentStats(transformedDepartments, transformedUsers, transformedSubjects)

    } catch (error: any) {
      console.error('Failed to load data:', error)
      setError(error.message || 'Failed to load data')
      showNotification('Failed to load data from server', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateDepartmentStats = (depts: Department[], usersList: User[], subjectsList: Subject[]) => {
    const updatedDepartments = depts.map(dept => {
      const deptUsers = usersList.filter(user => user.department === dept.name)
      const deptSubjects = subjectsList.filter(subject => subject.department === dept.name)
      
      return {
        ...dept,
        students: deptUsers.filter(user => user.role === 'Student').length,
        faculty: deptUsers.filter(user => user.role === 'Faculty').length,
        staff: deptUsers.filter(user => user.role === 'Staff').length,
        subjects: deptSubjects.length
      }
    })
    setDepartments(updatedDepartments)
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const departmentData = {
        name: departmentForm.name,
        code: departmentForm.code,
        description: departmentForm.description,
        hod: departmentForm.hod || null,
        establishedYear: departmentForm.establishedYear,
        sections: departmentForm.sections,
        contactInfo: departmentForm.contactInfo,
        facilities: [],
        programs: []
      }

      const response = await apiService.createDepartment(departmentData)
      
      if (response.success) {
        showNotification('Department created successfully!')
        setShowAddForm(false)
        resetDepartmentForm()
        loadAllData() // Reload data
      } else {
        throw new Error(response.message || 'Failed to create department')
      }
    } catch (error: any) {
      console.error('Create department error:', error)
      showNotification(error.message || 'Failed to create department', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDepartment) return
    
    setLoading(true)
    
    try {
      const departmentData = {
        name: departmentForm.name,
        code: departmentForm.code,
        description: departmentForm.description,
        hod: departmentForm.hod || null,
        establishedYear: departmentForm.establishedYear,
        sections: departmentForm.sections,
        contactInfo: departmentForm.contactInfo
      }

      const response = await apiService.updateDepartment(editingDepartment.id, departmentData)
      
      if (response.success) {
        showNotification('Department updated successfully!')
        setShowAddForm(false)
        setEditingDepartment(null)
        resetDepartmentForm()
        loadAllData() // Reload data
      } else {
        throw new Error(response.message || 'Failed to update department')
      }
    } catch (error: any) {
      console.error('Update department error:', error)
      showNotification(error.message || 'Failed to update department', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await apiService.deleteDepartment(departmentId)
      
      if (response.success) {
        showNotification('Department deleted successfully!')
        loadAllData() // Reload data
      } else {
        throw new Error(response.message || 'Failed to delete department')
      }
    } catch (error: any) {
      console.error('Delete department error:', error)
      showNotification(error.message || 'Failed to delete department', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (subjectForm.createForAllSections) {
        // Create subjects for all sections A, B, C
        const sections = ['A', 'B', 'C']
        const promises = sections.map(section => {
          const { createForAllSections, ...subjectData } = {
            ...subjectForm,
            section,
            code: `${subjectForm.code}-${section}`, // Add section to code
            department: subjectForm.department
          }
          return apiService.createSubject(subjectData)
        })
        
        await Promise.all(promises)
        showNotification(`Subject created for all sections successfully!`)
      } else {
        // Create subject for specific section
        const { createForAllSections, ...subjectData } = subjectForm
        
        const response = await apiService.createSubject(subjectData)
        
        if (response.success) {
          showNotification('Subject created successfully!')
        } else {
          throw new Error(response.message || 'Failed to create subject')
        }
      }
      
      setShowSubjectForm(false)
      resetSubjectForm()
      loadAllData() // Reload data
      
    } catch (error: any) {
      console.error('Create subject error:', error)
      showNotification(error.message || 'Failed to create subject', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await apiService.deleteSubject(subjectId)
      
      if (response.success) {
        showNotification('Subject deleted successfully!')
        loadAllData() // Reload data
      } else {
        throw new Error(response.message || 'Failed to delete subject')
      }
    } catch (error: any) {
      console.error('Delete subject error:', error)
      showNotification(error.message || 'Failed to delete subject', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      code: '',
      description: '',
      hod: '',
      establishedYear: new Date().getFullYear(),
      sections: [],
      contactInfo: {
        email: '',
        phone: '',
        location: ''
      }
    })
  }

  const resetSubjectForm = () => {
    setSubjectForm({
      name: '',
      code: '',
      credits: 3,
      department: '',
      year: '1st Year',
      section: 'A',
      semester: 1,
      academicYear: '2024-2025',
      type: 'Core',
      description: '',
      createForAllSections: false
    })
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setDepartmentForm({
      name: department.name,
      code: department.code,
      description: department.description,
      hod: department.hodId || '',
      establishedYear: department.establishedYear,
      sections: department.sections,
      contactInfo: department.contactInfo
    })
    setShowAddForm(true)
  }

  const addSection = (section: string) => {
    if (section && !departmentForm.sections.includes(section)) {
      setDepartmentForm({
        ...departmentForm,
        sections: [...departmentForm.sections, section]
      })
    }
  }

  const removeSection = (section: string) => {
    setDepartmentForm({
      ...departmentForm,
      sections: departmentForm.sections.filter(s => s !== section)
    })
  }

  const getFacultyOptions = () => {
    return users.filter(user => user.role === 'Faculty')
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Department Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Manage departments, faculty, students, and academic sections</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Department
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {departments.reduce((sum, dept) => sum + dept.students, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Faculty</p>
                <p className="text-2xl font-bold text-purple-600">
                  {departments.reduce((sum, dept) => sum + dept.faculty, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-orange-600">
                  {departments.reduce((sum, dept) => sum + dept.subjects, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Department Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{dept.name}</h3>
                  <p className="text-sm text-gray-500">Code: {dept.code}</p>
                  <p className="text-sm text-gray-500">Est. {dept.establishedYear}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                dept.status === 'Active' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {dept.status}
              </span>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{dept.description}</p>
            
            {/* Statistics */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Head of Department:</span>
                <span className="font-semibold text-gray-800 text-sm">{dept.hod || 'Not Assigned'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 font-medium">Students</span>
                    <span className="text-lg font-bold text-blue-700">{dept.students}</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium">Faculty</span>
                    <span className="text-lg font-bold text-purple-700">{dept.faculty}</span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium">Subjects</span>
                    <span className="text-lg font-bold text-green-700">{dept.subjects}</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-600 font-medium">Staff</span>
                    <span className="text-lg font-bold text-orange-700">{dept.staff}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Sections:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {dept.sections.map((section) => (
                  <span key={section} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-200">
                    Section {section}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditDepartment(dept)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setActiveTab('subject-management')}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Subjects
              </button>
              <button
                onClick={() => handleDeleteDepartment(dept.id)}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {departments.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Departments Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Get started by creating your first department. You can manage students, faculty, and subjects within each department.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Create First Department
          </button>
        </div>
      )}
    </div>
  )

  const renderSubjectManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Subject Management</h3>
        <button
          onClick={() => setShowSubjectForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Subject
        </button>
      </div>

      {/* Subjects by Department */}
      {departments.map((dept) => {
        const deptSubjects = subjects.filter(subject => subject.department === dept.name)
        if (deptSubjects.length === 0) return null

        return (
          <div key={dept.id} className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">{dept.name}</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-700">Subject</th>
                    <th className="text-left py-2 text-gray-700">Code</th>
                    <th className="text-left py-2 text-gray-700">Credits</th>
                    <th className="text-left py-2 text-gray-700">Year</th>
                    <th className="text-left py-2 text-gray-700">Section</th>
                    <th className="text-left py-2 text-gray-700">Faculty</th>
                    <th className="text-left py-2 text-gray-700">Enrollment</th>
                    <th className="text-left py-2 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deptSubjects.map((subject) => (
                    <tr key={subject.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium">{subject.name}</td>
                      <td className="py-3 text-blue-600">{subject.code}</td>
                      <td className="py-3">{subject.credits}</td>
                      <td className="py-3">{subject.year}</td>
                      <td className="py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {subject.section}
                        </span>
                      </td>
                      <td className="py-3">
                        {subject.faculty.length > 0 ? (
                          <div className="space-y-1">
                            {subject.faculty.map((faculty, index) => (
                              <div key={index} className="text-sm">
                                {faculty.name}
                                {faculty.isExternal && (
                                  <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                    External
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No faculty</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="text-sm">
                          <span className="font-medium">{subject.enrolledStudents.length}/{subject.maxStudents}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(subject.enrolledStudents.length / subject.maxStudents) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
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
        )
      })}

      {subjects.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg font-medium">No subjects created yet</p>
          <p className="text-sm">Click "Add Subject" to create your first subject</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Department Management</h2>
        <p className="text-gray-600">Manage departments, sections, and subjects</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={loadAllData}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-yellow-50 border border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification({...notification, show: false})}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Department Overview
        </button>
        <button
          onClick={() => setActiveTab('subject-management')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'subject-management'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📚 Subject Management
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'subject-management' && renderSubjectManagement()}

      {/* Department Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingDepartment(null)
                    resetDepartmentForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      value={departmentForm.name}
                      onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Code *
                    </label>
                    <input
                      type="text"
                      value={departmentForm.code}
                      onChange={(e) => setDepartmentForm({...departmentForm, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Head of Department
                    </label>
                    <select
                      value={departmentForm.hod}
                      onChange={(e) => setDepartmentForm({...departmentForm, hod: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select HOD</option>
                      {getFacultyOptions().map(faculty => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name} ({faculty.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Established Year *
                    </label>
                    <input
                      type="number"
                      value={departmentForm.establishedYear}
                      onChange={(e) => setDepartmentForm({...departmentForm, establishedYear: parseInt(e.target.value)})}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={departmentForm.contactInfo.email}
                        onChange={(e) => setDepartmentForm({
                          ...departmentForm, 
                          contactInfo: {...departmentForm.contactInfo, email: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={departmentForm.contactInfo.phone}
                          onChange={(e) => setDepartmentForm({
                            ...departmentForm, 
                            contactInfo: {...departmentForm.contactInfo, phone: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={departmentForm.contactInfo.location}
                          onChange={(e) => setDepartmentForm({
                            ...departmentForm, 
                            contactInfo: {...departmentForm.contactInfo, location: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Sections</h4>
                  <div className="flex gap-2 mb-3">
                    {['A', 'B', 'C'].map(section => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => addSection(section)}
                        disabled={departmentForm.sections.includes(section)}
                        className={`px-3 py-1 rounded text-sm ${
                          departmentForm.sections.includes(section)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        Add Section {section}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {departmentForm.sections.map(section => (
                      <span
                        key={section}
                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        Section {section}
                        <button
                          type="button"
                          onClick={() => removeSection(section)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingDepartment ? 'Update Department' : 'Create Department')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingDepartment(null)
                      resetDepartmentForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subject Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add New Subject</h3>
                <button
                  onClick={() => {
                    setShowSubjectForm(false)
                    resetSubjectForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      value={subjectForm.name}
                      onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      value={subjectForm.code}
                      onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credits *
                    </label>
                    <input
                      type="number"
                      value={subjectForm.credits}
                      onChange={(e) => setSubjectForm({...subjectForm, credits: parseInt(e.target.value)})}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester *
                    </label>
                    <input
                      type="number"
                      value={subjectForm.semester}
                      onChange={(e) => setSubjectForm({...subjectForm, semester: parseInt(e.target.value)})}
                      min="1"
                      max="8"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={subjectForm.type}
                      onChange={(e) => setSubjectForm({...subjectForm, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="Core">Core</option>
                      <option value="Elective">Elective</option>
                      <option value="Lab">Lab</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      value={subjectForm.department}
                      onChange={(e) => setSubjectForm({...subjectForm, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year *
                    </label>
                    <select
                      value={subjectForm.year}
                      onChange={(e) => setSubjectForm({...subjectForm, year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Year *
                    </label>
                    <input
                      type="text"
                      value={subjectForm.academicYear}
                      onChange={(e) => setSubjectForm({...subjectForm, academicYear: e.target.value})}
                      placeholder="2024-2025"
                      pattern="\d{4}-\d{4}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section
                    </label>
                    <select
                      value={subjectForm.section}
                      onChange={(e) => setSubjectForm({...subjectForm, section: e.target.value})}
                      disabled={subjectForm.createForAllSections}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={subjectForm.createForAllSections}
                    onChange={(e) => setSubjectForm({...subjectForm, createForAllSections: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm text-gray-700">
                    Create this subject for all sections (A, B, C)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Subject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubjectForm(false)
                      resetSubjectForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}