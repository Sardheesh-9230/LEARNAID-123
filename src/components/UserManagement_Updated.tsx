'use client'

import { useState, useEffect } from 'react'
import apiService from '../services/api'

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
  dateJoined: string
  status: 'Active' | 'Inactive'
  profileImage?: string
  guardianName?: string
  guardianPhone?: string
  // Student-specific fields
  studentId?: string
  semester?: number
  gpa?: number
  enrolledSubjects?: string[]
  // Faculty-specific fields
  employeeId?: string
  designation?: string
  qualification?: string
  experience?: number
  specialization?: string[]
  assignedSubjects?: string[]
}

interface Department {
  id: string
  name: string
  code: string
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Faculty' | 'Staff' | 'Admin'>('Student')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for real data
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Student' as 'Student' | 'Faculty' | 'Staff' | 'Admin',
    department: '',
    section: '',
    batch: '',
    phone: '',
    address: '',
    // Faculty fields
    employeeId: '',
    designation: '',
    qualification: '',
    experience: 0,
    specialization: '',
    // Student fields
    studentId: '',
    semester: 1,
    gpa: 0,
    guardianName: '',
    guardianPhone: ''
  })

  const sections = ["A", "B", "C"]
  const batches = ["2024", "2023", "2022", "2021"]
  const designations = ["Assistant Professor", "Associate Professor", "Professor", "Lecturer", "Head of Department"]

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
      const [usersResponse, departmentsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getDepartments()
      ])

      if (usersResponse.success && usersResponse.data) {
        const transformedUsers = usersResponse.data.map((user: any) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department?.name || 'Unknown',
          departmentId: user.department?._id || '',
          section: user.section || '',
          batch: user.batch || '',
          phone: user.phone || '',
          address: user.address || '',
          dateJoined: user.createdAt || new Date().toISOString(),
          status: user.status || 'Active',
          // Student fields
          studentId: user.studentId || '',
          semester: user.semester || 1,
          gpa: user.gpa || 0,
          guardianName: user.guardianName || '',
          guardianPhone: user.guardianPhone || '',
          enrolledSubjects: user.enrolledSubjects || [],
          // Faculty fields
          employeeId: user.employeeId || '',
          designation: user.designation || '',
          qualification: user.qualification || '',
          experience: user.experience || 0,
          specialization: user.specialization || [],
          assignedSubjects: user.assignedSubjects || []
        }))
        setUsers(transformedUsers)
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        const transformedDepartments = departmentsResponse.data.map((dept: any) => ({
          id: dept._id,
          name: dept.name,
          code: dept.code
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        address: newUser.address,
        status: 'Active'
      }

      // Add role-specific fields
      if (newUser.role === 'Student') {
        userData.section = newUser.section
        userData.batch = newUser.batch
        userData.studentId = newUser.studentId
        userData.semester = newUser.semester
        userData.guardianName = newUser.guardianName
        userData.guardianPhone = newUser.guardianPhone
        if (newUser.gpa > 0) userData.gpa = newUser.gpa
      } else if (newUser.role === 'Faculty') {
        userData.employeeId = newUser.employeeId
        userData.designation = newUser.designation
        userData.qualification = newUser.qualification
        userData.experience = newUser.experience
        if (newUser.specialization) {
          userData.specialization = newUser.specialization.split(',').map(s => s.trim())
        }
      }

      const response = await apiService.createUser(userData)
      if (response.success) {
        await loadAllData() // Reload data
        resetForm()
        setShowAddForm(false)
      } else {
        setError(response.message || 'Failed to create user')
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      setError(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.departmentId,
      section: user.section || '',
      batch: user.batch || '',
      phone: user.phone,
      address: user.address,
      // Faculty fields
      employeeId: user.employeeId || '',
      designation: user.designation || '',
      qualification: user.qualification || '',
      experience: user.experience || 0,
      specialization: user.specialization?.join(', ') || '',
      // Student fields
      studentId: user.studentId || '',
      semester: user.semester || 1,
      gpa: user.gpa || 0,
      guardianName: user.guardianName || '',
      guardianPhone: user.guardianPhone || ''
    })
    setShowAddForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      setLoading(true)
      
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        address: newUser.address
      }

      // Add role-specific fields
      if (newUser.role === 'Student') {
        userData.section = newUser.section
        userData.batch = newUser.batch
        userData.studentId = newUser.studentId
        userData.semester = newUser.semester
        userData.guardianName = newUser.guardianName
        userData.guardianPhone = newUser.guardianPhone
        if (newUser.gpa > 0) userData.gpa = newUser.gpa
      } else if (newUser.role === 'Faculty') {
        userData.employeeId = newUser.employeeId
        userData.designation = newUser.designation
        userData.qualification = newUser.qualification
        userData.experience = newUser.experience
        if (newUser.specialization) {
          userData.specialization = newUser.specialization.split(',').map(s => s.trim())
        }
      }

      const response = await apiService.updateUser(editingUser.id, userData)
      if (response.success) {
        await loadAllData() // Reload data
        resetForm()
        setShowAddForm(false)
        setEditingUser(null)
      } else {
        setError(response.message || 'Failed to update user')
      }
    } catch (error: any) {
      console.error('Error updating user:', error)
      setError(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setLoading(true)
      const response = await apiService.deleteUser(userToDelete.id)
      if (response.success) {
        await loadAllData() // Reload data
        setShowDeleteConfirm(false)
        setUserToDelete(null)
      } else {
        setError(response.message || 'Failed to delete user')
      }
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewUser({
      name: '',
      email: '',
      role: 'Student',
      department: '',
      section: '',
      batch: '',
      phone: '',
      address: '',
      employeeId: '',
      designation: '',
      qualification: '',
      experience: 0,
      specialization: '',
      studentId: '',
      semester: 1,
      gpa: 0,
      guardianName: '',
      guardianPhone: ''
    })
    setEditingUser(null)
  }

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/[^\d+]/g, '')
    
    if (cleaned.startsWith('+91')) {
      const digits = cleaned.substring(3)
      if (digits.length <= 5) {
        return `+91 ${digits}`
      } else {
        return `+91 ${digits.substring(0, 5)} ${digits.substring(5, 10)}`
      }
    }
    
    if (cleaned.length <= 5) {
      return cleaned
    } else {
      return `${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`
    }
  }

  const getFilteredUsers = () => {
    if (activeTab === 'overview') return users
    return users.filter(user => user.role === selectedRole)
  }

  const getUserStats = () => {
    const stats = {
      total: users.length,
      students: users.filter(u => u.role === 'Student').length,
      faculty: users.filter(u => u.role === 'Faculty').length,
      staff: users.filter(u => u.role === 'Staff').length,
      admins: users.filter(u => u.role === 'Admin').length,
      active: users.filter(u => u.status === 'Active').length,
      inactive: users.filter(u => u.status === 'Inactive').length
    }
    return stats
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading users...</p>
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

  const filteredUsers = getFilteredUsers()
  const stats = getUserStats()

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage students, faculty, staff, and admin users</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Students</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Faculty</h3>
            <p className="text-2xl font-bold text-green-600">{stats.faculty}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Staff</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.staff}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Active</h3>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Inactive</h3>
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          </div>
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
                All Users
              </button>
              <button
                onClick={() => {
                  setActiveTab('role')
                  setSelectedRole('Student')
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'role' && selectedRole === 'Student'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => {
                  setActiveTab('role')
                  setSelectedRole('Faculty')
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'role' && selectedRole === 'Faculty'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Faculty
              </button>
              <button
                onClick={() => {
                  setActiveTab('role')
                  setSelectedRole('Staff')
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'role' && selectedRole === 'Staff'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Staff
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-700">Name</th>
                  <th className="text-left py-3 text-gray-700">Email</th>
                  <th className="text-left py-3 text-gray-700">Role</th>
                  <th className="text-left py-3 text-gray-700">Department</th>
                  <th className="text-left py-3 text-gray-700">ID/Section</th>
                  <th className="text-left py-3 text-gray-700">Phone</th>
                  <th className="text-left py-3 text-gray-700">Status</th>
                  <th className="text-left py-3 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="py-3 text-blue-600">{user.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'Student' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'Faculty' ? 'bg-green-100 text-green-800' :
                        user.role === 'Staff' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{user.department}</td>
                    <td className="py-3 text-gray-600">
                      {user.role === 'Student' 
                        ? `${user.studentId || 'N/A'} / ${user.section}` 
                        : user.employeeId || 'N/A'
                      }
                    </td>
                    <td className="py-3 text-gray-600">{user.phone}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user)
                            setShowDeleteConfirm(true)
                          }}
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
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit User Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>

              <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty">Faculty</option>
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: formatPhoneNumber(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={newUser.address}
                      onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      required
                    />
                  </div>
                </div>

                {/* Role-specific fields */}
                {newUser.role === 'Student' && (
                  <>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input
                          type="text"
                          value={newUser.studentId}
                          onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                          value={newUser.section}
                          onChange={(e) => setNewUser({...newUser, section: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select</option>
                          {sections.map(section => (
                            <option key={section} value={section}>{section}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                        <select
                          value={newUser.batch}
                          onChange={(e) => setNewUser({...newUser, batch: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select</option>
                          {batches.map(batch => (
                            <option key={batch} value={batch}>{batch}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={newUser.semester}
                          onChange={(e) => setNewUser({...newUser, semester: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                        <input
                          type="text"
                          value={newUser.guardianName}
                          onChange={(e) => setNewUser({...newUser, guardianName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                        <input
                          type="text"
                          value={newUser.guardianPhone}
                          onChange={(e) => setNewUser({...newUser, guardianPhone: formatPhoneNumber(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          placeholder="+91 XXXXX XXXXX"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {newUser.role === 'Faculty' && (
                  <>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                        <input
                          type="text"
                          value={newUser.employeeId}
                          onChange={(e) => setNewUser({...newUser, employeeId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                        <select
                          value={newUser.designation}
                          onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select</option>
                          {designations.map(designation => (
                            <option key={designation} value={designation}>{designation}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          min="0"
                          value={newUser.experience}
                          onChange={(e) => setNewUser({...newUser, experience: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <input
                        type="text"
                        value={newUser.qualification}
                        onChange={(e) => setNewUser({...newUser, qualification: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                        placeholder="Ph.D in Computer Science, M.Tech"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization (comma-separated)</label>
                      <input
                        type="text"
                        value={newUser.specialization}
                        onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                        placeholder="Machine Learning, Data Science, AI"
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{userToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteUser}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setUserToDelete(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}