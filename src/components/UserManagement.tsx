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
  year?: string
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

interface UserManagementProps {
  preSelectedUserId?: string;
}

export default function UserManagement({ preSelectedUserId }: UserManagementProps = {}) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Faculty' | 'Staff' | 'Admin'>('Student')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // State for real data
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student' as 'Student' | 'Faculty' | 'Staff' | 'Admin',
    department: '',
    phone: '',
    // Student specific fields
    batch: '',
    section: '',
    // Faculty specific fields
    designation: '',
    qualification: '',
    experience: 0,
    specialization: [] as string[]
  })

  const designations = ["Assistant Professor", "Associate Professor", "Professor", "Lecturer"]
  const qualifications = [
    "Ph.D",
    "M.Tech",
    "M.E",
    "M.Sc",
    "MBA",
    "B.Tech",
    "B.E",
    "B.Sc",
    "Other"
  ]

  // ---- Academic year helpers -----------------------------------------------
  // Academic year starts July. Jan-Jun = still in previous academic year.
  const getEffectiveYear = () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    return m < 7 ? y - 1 : y;
  }

  const getYearLabelForBatch = (batchYear: number): string => {
    const yos = getEffectiveYear() - batchYear + 1;
    switch (Math.min(Math.max(yos, 1), 4)) {
      case 1: return '1st Year';
      case 2: return '2nd Year';
      case 3: return '3rd Year';
      case 4: return '4th Year';
      default: return '1st Year';
    }
  }

  const getSemesterForBatch = (batchYear: number): number => {
    const yos = Math.min(Math.max(getEffectiveYear() - batchYear + 1, 1), 4);
    const m = new Date().getMonth() + 1;
    return m >= 7 ? (yos * 2) - 1 : yos * 2;
  }

  // Valid batches: current–3  to current effective year (4-year programme)
  const getValidBatchYears = (): number[] => {
    const eff = getEffectiveYear();
    return [eff - 3, eff - 2, eff - 1, eff];
  }
  // --------------------------------------------------------------------------

  const [refreshingAcademic, setRefreshingAcademic] = useState(false)

  const handleRefreshAcademicData = async () => {
    if (!confirm('Recalculate year and semester for all students based on their batch year and today\'s date?')) return;
    try {
      setRefreshingAcademic(true);
      const res = await apiService.makeRequest('/users/refresh-academic-data', { method: 'POST' });
      if (res.success) {
        setError(null);
        setSuccessMessage(res.message || 'Academic data refreshed successfully');
        setTimeout(() => setSuccessMessage(null), 7000);
        await loadAllData();
      } else {
        setError(res.message || 'Refresh failed');
      }
    } catch (e: any) {
      setError(e.message || 'Refresh failed');
    } finally {
      setRefreshingAcademic(false);
    }
  }

  // Generate ID based on department and role
  const generateUserId = (departmentId: string, role: string) => {
    const dept = departments.find(d => d.id === departmentId)
    const deptCode = dept?.code || 'DEPT'
    const year = new Date().getFullYear().toString().slice(-2)
    const timestamp = Date.now().toString().slice(-6)
    
    let prefix = ''
    switch (role) {
      case 'Student':
        prefix = `${deptCode}${year}S`
        break
      case 'Faculty':
        prefix = `${deptCode}F`
        break
      case 'Staff':
        prefix = `${deptCode}ST`
        break
      case 'Admin':
        prefix = `${deptCode}AD`
        break
      default:
        prefix = `${deptCode}U`
    }
    
    return `${prefix}${timestamp}`
  }

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

      // Load data in parallel with cache-busting
      const timestamp = Date.now()
      console.log(`🔄 Loading data with timestamp: ${timestamp}`)
      
      const [usersResponse, departmentsResponse] = await Promise.all([
        apiService.getUsers({ _t: timestamp, limit: 1000 }), // Cache-busting + higher limit to get all users
        apiService.getDepartments()
      ])

      if (usersResponse.success && usersResponse.data) {
        console.log('📥 Loaded users from API:', usersResponse.data.length)
        
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
          year: user.year || '',
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
        console.log('✅ Users state updated, count:', transformedUsers.length)
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

  // Handle pre-selected user for editing
  useEffect(() => {
    if (preSelectedUserId && users.length > 0) {
      const userToEdit = users.find(u => u.id === preSelectedUserId);
      if (userToEdit) {
        setEditingUser(userToEdit);
        setShowAddForm(true);
        setActiveTab('users');
        // Scroll to top after a brief delay
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [preSelectedUserId, users]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // Enforce single-admin constraint (matches UI restriction)
      if (newUser.role === 'Admin' && users.filter(u => u.role === 'Admin').length > 0) {
        setError('An admin already exists. Only one admin is allowed in the system.')
        setLoading(false)
        return
      }
      
      if (!newUser.name || !newUser.name.trim()) {
        setError('Name is required')
        setLoading(false)
        return
      }
      if (!newUser.email || !newUser.email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }
      if (!newUser.department) {
        setError('Department is required')
        setLoading(false)
        return
      }
      
      // Auto-generate user ID based on department and role
      const generatedId = generateUserId(newUser.department, newUser.role)
      
      const userData: any = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password || 'TempPass123!', // Use provided password or default
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        status: 'Active'
      }

      // Add role-specific fields
      if (newUser.role === 'Student') {
        // Validate batch is required
        if (!newUser.batch || !newUser.batch.trim()) {
          setError('Batch year is required for students')
          setLoading(false)
          return
        }
        
        userData.studentId = generatedId // Auto-generated student ID
        userData.batch = newUser.batch
        // Section is optional - add it only if provided
        if (newUser.section) {
          userData.section = newUser.section
        }
      } else if (newUser.role === 'Faculty') {
        // Validate required Faculty fields
        if (!newUser.designation || !newUser.designation.trim()) {
          setError('Designation is required for faculty')
          setLoading(false)
          return
        }
        if (!newUser.qualification || !newUser.qualification.trim()) {
          setError('Qualification is required for faculty')
          setLoading(false)
          return
        }
        if (!newUser.experience || newUser.experience <= 0) {
          setError('Experience is required for faculty (must be greater than 0)')
          setLoading(false)
          return
        }

        userData.employeeId = generatedId // Auto-generated employee ID
        userData.designation = newUser.designation.trim()
        userData.qualification = newUser.qualification.trim()
        userData.experience = newUser.experience
      } else if (newUser.role === 'Staff') {
        userData.employeeId = generatedId // Auto-generated employee ID
        userData.designation = newUser.designation
        userData.qualification = newUser.qualification
      } else if (newUser.role === 'Admin') {
        userData.employeeId = generatedId // Auto-generated admin ID
      }

      // Debug: Log the data being sent
      console.log('Sending user data:', userData)

      const response = await apiService.createUser(userData)
      if (response.success) {
        console.log('✅ User created successfully, reloading data...')
        
        // Small delay to ensure backend processing is complete
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Force data reload
        await loadAllData()
        
        resetForm()
        setShowAddForm(false)
        
        // Show success message with generated ID
        setError(null)
        setSuccessMessage(`User created successfully! Generated ID: ${generatedId}`)
        setTimeout(() => setSuccessMessage(null), 7000)
        
        console.log('📊 Current users count after add:', users.length)
      } else {
        // Show detailed validation errors if available
        if (response.errors && Array.isArray(response.errors)) {
          const errorMessages = response.errors.map((err: any) => err.msg).join(', ')
          setError(`Validation failed: ${errorMessages}`)
        } else {
          setError(response.message || 'Failed to create user')
        }
      }
    } catch (error: any) {
      console.error('Error creating user:', error)
      // Show detailed error information for debugging
      if (error.response && error.response.data) {
        const errorData = error.response.data
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(', ')
          setError(`Validation failed: ${errorMessages}`)
        } else {
          setError(errorData.message || 'Failed to create user')
        }
      } else {
        setError(error.message || 'Failed to create user')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Don't show existing password
      role: user.role,
      department: user.departmentId,
      phone: user.phone,
      // Student fields
      batch: user.batch || '',
      section: user.section || '',
      // Faculty fields
      designation: user.designation || '',
      qualification: user.qualification || '',
      experience: user.experience || 0,
      specialization: user.specialization || []
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
        email: newUser.email
      }

      // Only add phone if it has a value
      if (newUser.phone && newUser.phone.trim()) {
        userData.phone = newUser.phone
      }

      // Add role-specific fields for Faculty only
      if (newUser.role === 'Faculty') {
        if (newUser.designation) userData.designation = newUser.designation
        if (newUser.qualification) userData.qualification = newUser.qualification
        if (newUser.experience !== undefined && newUser.experience !== null) {
          userData.experience = parseInt(newUser.experience.toString())
        }
        // Ensure specialization is an array
        if (newUser.specialization) {
          userData.specialization = Array.isArray(newUser.specialization) 
            ? newUser.specialization 
            : []
        }
      }

      // Add role-specific fields for Student
      if (newUser.role === 'Student') {
        if (newUser.section) userData.section = newUser.section
        if (newUser.batch) userData.batch = newUser.batch
      }

      console.log('Sending update data:', userData) // Debug log

      const response = await apiService.updateUser(editingUser.id, userData)
      if (response.success) {
        // If password was provided, change it separately
        if (newUser.password && newUser.password.trim().length >= 6) {
          console.log('Changing password...')
          const passwordResponse = await apiService.changeUserPassword(editingUser.id, newUser.password)
          if (!passwordResponse.success) {
            setError('User updated but password change failed: ' + passwordResponse.message)
            await loadAllData()
            return
          }
        }
        
        await loadAllData() // Reload data
        resetForm()
        setShowAddForm(false)
        setEditingUser(null)
      } else {
        setError(response.message || 'Failed to update user')
      }
    } catch (error: any) {
      console.error('Error updating user:', error)
      // Extract validation errors if available
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors.map((err: any) => err.msg).join(', ')
        : error.message || 'Failed to update user'
      setError(errorMessage)
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
      password: '',
      role: 'Student',
      department: '',
      phone: '',
      // Student fields
      batch: '',
      section: '',
      // Faculty fields
      designation: '',
      qualification: '',
      experience: 0,
      specialization: []
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

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading users...</p>
      </div>
    )
  }

  const filteredUsers = getFilteredUsers()
  const stats = getUserStats()

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Inline error banner */}
        {error && !loading && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span><strong>Error: </strong>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700 font-bold">✕</button>
          </div>
        )}
        {/* Success banner */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span>✅ {successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-4 text-green-500 hover:text-green-700 font-bold">✕</button>
          </div>
        )}
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
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshAcademicData}
                disabled={refreshingAcademic || loading}
                title="Recalculate year &amp; semester for all students based on batch and today's date"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <span>🎓</span>
                <span>{refreshingAcademic ? 'Syncing...' : 'Sync Academic Year'}</span>
              </button>
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered')
                  loadAllData()
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4 text-sm text-gray-600">
            📊 Displaying {filteredUsers.length} of {users.length} total users
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-700">Name</th>
                  <th className="text-left py-3 text-gray-700">Email</th>
                  <th className="text-left py-3 text-gray-700">Role</th>
                  <th className="text-left py-3 text-gray-700">Department</th>
                  <th className="text-left py-3 text-gray-700">ID/Year/Section</th>
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
                        ? `${user.studentId || 'N/A'} / ${user.year || 'N/A'} / ${user.section || 'N/A'}` 
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
                      <option 
                        value="Admin" 
                        disabled={users.filter(u => u.role === 'Admin').length > 0}
                      >
                        Admin {users.filter(u => u.role === 'Admin').length > 0 ? '(Already exists)' : ''}
                      </option>
                    </select>
                    {users.filter(u => u.role === 'Admin').length > 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        ⚠️ Admin already exists. Only one admin is allowed in the system.
                      </p>
                    )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                      required={!editingUser}
                    />
                  </div>
                </div>

                {/* Role-specific fields */}
                {newUser.role === 'Student' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch Year <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newUser.batch || ''}
                          onChange={(e) => setNewUser({...newUser, batch: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select Batch Year</option>
                          {getValidBatchYears().map(yr => (
                            <option key={yr} value={String(yr)}>
                              {yr} — {getYearLabelForBatch(yr)}, Sem {getSemesterForBatch(yr)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Section <span className="text-gray-400">(Optional - assigned during subject allocation)</span>
                        </label>
                        <select
                          value={newUser.section || ''}
                          onChange={(e) => setNewUser({...newUser, section: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                        >
                          <option value="">No Section (Assigned Later)</option>
                          {(() => {
                            const selectedDept = departments.find(d => d.id === newUser.department);
                            const sections = (selectedDept as any)?.sections || ['A', 'B', 'C'];
                            return sections.map((section: string) => (
                              <option key={section} value={section}>Section {section}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Student ID will be auto-generated</strong> based on department and batch year
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Section assignment is optional during creation and will typically be done during subject allocation.
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Guardian information will be added by students themselves when they update their profile.
                      </p>
                    </div>
                  </>
                )}

                {newUser.role === 'Faculty' && (
                  <>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                        <select
                          value={newUser.designation}
                          onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select Designation</option>
                          {designations.map(designation => (
                            <option key={designation} value={designation}>{designation}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                        <select
                          value={newUser.qualification}
                          onChange={(e) => setNewUser({...newUser, qualification: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select Qualification</option>
                          {qualifications.map(qualification => (
                            <option key={qualification} value={qualification}>{qualification}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={newUser.experience}
                          onChange={(e) => setNewUser({...newUser, experience: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={newUser.specialization?.join(', ') || ''}
                        onChange={(e) => setNewUser({
                          ...newUser, 
                          specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                        placeholder="Enter specializations separated by commas (e.g., AI, Machine Learning, Data Science)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Separate multiple specializations with commas</p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Employee ID will be auto-generated</strong> based on department code
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Required fields: Name, Designation, Phone, Department, Qualification, Experience, Specialization
                      </p>
                    </div>
                  </>
                )}

                {(newUser.role === 'Staff' || newUser.role === 'Admin') && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                        <input
                          type="text"
                          value={newUser.designation}
                          onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          placeholder="Enter designation"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                        <select
                          value={newUser.qualification}
                          onChange={(e) => setNewUser({...newUser, qualification: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                          required
                        >
                          <option value="">Select Qualification</option>
                          {qualifications.map(qualification => (
                            <option key={qualification} value={qualification}>{qualification}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-700">
                        <strong>Employee ID will be auto-generated</strong> based on department and role
                      </p>
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