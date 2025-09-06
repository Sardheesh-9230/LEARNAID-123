'use client'

import { useState } from 'react'

interface User {
  id: number
  name: string
  email: string
  role: 'Student' | 'Faculty' | 'Staff' | 'Admin'
  department: string
  section?: string // Only for students
  batch?: string // Only for students - Year of study (e.g., "2024", "2023", "2022", "2021")
  phone: string
  address: string
  dateJoined: string
  status: 'Active' | 'Inactive'
  profileImage?: string
  guardianName?: string // Only for students
  guardianPhone?: string // Only for students
}

interface FacultyProfile extends User {
  designation: string
  qualification: string
  experience: number
  specialization: string
  assignedSubjects: string[]
}

interface StudentProfile extends User {
  studentId: string
  semester: number
  batch: string // Year of study (e.g., "2024", "2023", "2022", "2021")
  enrolledSubjects: string[]
  gpa?: number
  guardianName: string
  guardianPhone: string
}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<'Student' | 'Faculty' | 'Staff' | 'Admin'>('Student')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)

  // Sample users data
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@learnaia.edu",
      role: "Student",
      department: "Computer Science",
      section: "A",
      batch: "2024", // First year student
      phone: "+91 98765 43210",
      address: "123 Main St, City",
      dateJoined: "2024-01-15",
      status: "Active",
      guardianName: "Mr. Michael Doe",
      guardianPhone: "+91 98765 43211"
    },
    {
      id: 2,
      name: "Prof. Alice Johnson",
      email: "alice.johnson@learnaia.edu",
      role: "Faculty",
      department: "Computer Science",
      phone: "+91 97654 32109",
      address: "456 Faculty Ave, City",
      dateJoined: "2020-08-01",
      status: "Active"
    },
    {
      id: 3,
      name: "Jane Smith",
      email: "jane.smith@learnaia.edu",
      role: "Student",
      department: "Business Administration",
      section: "B",
      batch: "2023", // Second year student
      phone: "+91 96543 21098",
      address: "789 Student Blvd, City",
      dateJoined: "2023-09-01",
      status: "Active",
      guardianName: "Mrs. Susan Smith",
      guardianPhone: "+91 96543 21099"
    },
    {
      id: 4,
      name: "Dr. Robert Brown",
      email: "robert.brown@learnaia.edu",
      role: "Faculty",
      department: "Mechanical Engineering",
      phone: "+91 95432 10987",
      address: "321 University Dr, City",
      dateJoined: "2019-01-15",
      status: "Active"
    },
    {
      id: 5,
      name: "Sarah Wilson",
      email: "sarah.wilson@learnaia.edu",
      role: "Staff",
      department: "Administration",
      phone: "+91 94321 09876",
      address: "654 Office St, City",
      dateJoined: "2022-03-10",
      status: "Active"
    },
    {
      id: 6,
      name: "Michael Chen",
      email: "michael.chen@learnaia.edu",
      role: "Student",
      department: "Computer Science",
      section: "B",
      batch: "2022", // Third year student
      phone: "+91 93210 98765",
      address: "987 Campus Rd, City",
      dateJoined: "2024-01-15",
      status: "Inactive",
      guardianName: "Mr. David Chen",
      guardianPhone: "+91 93210 98766"
    }
  ])

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Student' as 'Student' | 'Faculty' | 'Staff' | 'Admin',
    department: '',
    section: '',
    batch: '', // Year of study for students
    phone: '',
    address: '',
    // Additional fields for specific roles
    designation: '', // Faculty
    qualification: '', // Faculty
    experience: 0, // Faculty
    specialization: '', // Faculty
    studentId: '', // Student
    semester: 1, // Student
    gpa: 0, // Student
    guardianName: '', // Student
    guardianPhone: '' // Student
  })

  const departments = ["Computer Science", "Mechanical Engineering", "Business Administration", "Electrical Engineering", "Administration"]
  const sections = ["A", "B", "C"]
  const batches = ["2024", "2023", "2022", "2021"] // Academic years for students
  const designations = ["Assistant Professor", "Associate Professor", "Professor", "Lecturer"]

  // Helper function to get academic year from batch
  const getAcademicYear = (batch: string): string => {
    const currentYear = 2025;
    const batchYear = parseInt(batch);
    const yearOfStudy = currentYear - batchYear + 1;
    
    switch (yearOfStudy) {
      case 1: return '1st Year';
      case 2: return '2nd Year';
      case 3: return '3rd Year';
      case 4: return '4th Year';
      default: return `${yearOfStudy}th Year`;
    }
  };

  // Helper function to format Indian phone number
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // If it starts with +91, format as +91 XXXXX XXXXX
    if (cleaned.startsWith('+91')) {
      const digits = cleaned.substring(3);
      if (digits.length <= 5) {
        return `+91 ${digits}`;
      } else if (digits.length <= 10) {
        return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
      } else {
        return `+91 ${digits.substring(0, 5)} ${digits.substring(5, 10)}`;
      }
    }
    
    // If it starts with 91, add + and format
    if (cleaned.startsWith('91') && cleaned.length > 2) {
      const digits = cleaned.substring(2);
      if (digits.length <= 5) {
        return `+91 ${digits}`;
      } else if (digits.length <= 10) {
        return `+91 ${digits.substring(0, 5)} ${digits.substring(5)}`;
      } else {
        return `+91 ${digits.substring(0, 5)} ${digits.substring(5, 10)}`;
      }
    }
    
    // If it's just digits, assume it's a 10-digit Indian number
    if (/^\d+$/.test(cleaned)) {
      if (cleaned.length <= 5) {
        return `+91 ${cleaned}`;
      } else if (cleaned.length <= 10) {
        return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
      } else {
        return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5, 10)}`;
      }
    }
    
    return value;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    const user: User = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      section: newUser.role === 'Student' ? newUser.section : undefined,
      batch: newUser.role === 'Student' ? newUser.batch : undefined,
      phone: newUser.phone,
      address: newUser.address,
      dateJoined: new Date().toISOString().split('T')[0],
      status: 'Active'
    }
    setUsers([...users, user])
    resetForm()
    setShowAddForm(false)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      section: user.section || '',
      batch: user.batch || '',
      phone: user.phone,
      address: user.address,
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
    setShowAddForm(true)
  }

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      const updatedUsers = users.map(user =>
        user.id === editingUser.id
          ? {
              ...user,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              department: newUser.department,
              section: newUser.role === 'Student' ? newUser.section : undefined,
              batch: newUser.role === 'Student' ? newUser.batch : undefined,
              phone: newUser.phone,
              address: newUser.address,
              guardianName: newUser.role === 'Student' ? newUser.guardianName : undefined,
              guardianPhone: newUser.role === 'Student' ? newUser.guardianPhone : undefined
            }
          : user
      )
      setUsers(updatedUsers)
      setEditingUser(null)
      resetForm()
      setShowAddForm(false)
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete.id))
      setShowDeleteConfirm(false)
      setUserToDelete(null)
    }
  }

  const handleToggleStatus = (user: User) => {
    setUserToToggle(user)
    setShowDeactivateConfirm(true)
  }

  const confirmToggleStatus = () => {
    if (userToToggle) {
      setUsers(users.map(user =>
        user.id === userToToggle.id
          ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
          : user
      ))
      setShowDeactivateConfirm(false)
      setUserToToggle(null)
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
  }

  const getUsersByRole = (role: string) => {
    return users.filter(user => user.role === role)
  }

  const getUserStats = () => {
    return {
      total: users.length,
      students: users.filter(u => u.role === 'Student').length,
      faculty: users.filter(u => u.role === 'Faculty').length,
      staff: users.filter(u => u.role === 'Staff').length,
      active: users.filter(u => u.status === 'Active').length,
      inactive: users.filter(u => u.status === 'Inactive').length
    }
  }

  const renderOverview = () => {
    const stats = getUserStats()

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-500">All registered users</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Students</h3>
            <p className="text-3xl font-bold text-green-600">{stats.students}</p>
            <p className="text-sm text-gray-500">Enrolled students</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-800">Faculty</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.faculty}</p>
            <p className="text-sm text-gray-500">Teaching staff</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-800">Staff</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.staff}</p>
            <p className="text-sm text-gray-500">Administrative staff</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">All Users</h3>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-black"
              >
                <option value="Student">Students</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add User
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-gray-700">Name</th>
                  <th className="text-left py-3 text-gray-700">Email</th>
                  <th className="text-left py-3 text-gray-700">Role</th>
                  <th className="text-left py-3 text-gray-700">Department</th>
                  <th className="text-left py-3 text-gray-700">Section</th>
                  <th className="text-left py-3 text-gray-700">Batch/Year</th>
                  <th className="text-left py-3 text-gray-700">Status</th>
                  <th className="text-left py-3 text-gray-700">Joined</th>
                  <th className="text-left py-3 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getUsersByRole(selectedRole).map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-blue-600">{user.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'Student' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'Faculty' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Staff' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">{user.department}</td>
                    <td className="py-3">
                      {user.section ? (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {user.section}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3">
                      {user.batch ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Batch {user.batch} ({getAcademicYear(user.batch)})
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{user.dateJoined}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2 py-1 rounded text-xs ${
                            user.status === 'Active'
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
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
      </div>
    )
  }

  const renderRoleDetails = () => (
    <div className="space-y-6">
      {/* Role Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Student', 'Faculty', 'Staff', 'Admin'].map((role) => {
          const roleUsers = getUsersByRole(role)
          const activeCount = roleUsers.filter(u => u.status === 'Active').length
          
          return (
            <div key={role} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{role}s</h3>
              <p className="text-2xl font-bold text-blue-600">{roleUsers.length}</p>
              <p className="text-sm text-green-600">{activeCount} active</p>
              <p className="text-sm text-red-600">{roleUsers.length - activeCount} inactive</p>
            </div>
          )
        })}
      </div>

      {/* Department-wise Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Department-wise Distribution</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptUsers = users.filter(u => u.department === dept)
            const students = deptUsers.filter(u => u.role === 'Student').length
            const faculty = deptUsers.filter(u => u.role === 'Faculty').length
            const staff = deptUsers.filter(u => u.role === 'Staff').length
            
            return (
              <div key={dept} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">{dept}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium text-blue-600">{students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Faculty:</span>
                    <span className="font-medium text-purple-600">{faculty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Staff:</span>
                    <span className="font-medium text-orange-600">{staff}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-gray-800">{deptUsers.length}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">User Management</h2>
        <p className="text-gray-600">Manage students, faculty, staff, and administrators</p>
      </div>

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
          👥 User Overview
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'roles'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Role Analytics
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'roles' && renderRoleDetails()}

      {/* Add/Edit User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-black">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section and Batch for Students */}
              {newUser.role === 'Student' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={newUser.section}
                      onChange={(e) => setNewUser({...newUser, section: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Academic Year)</label>
                    <select
                      value={newUser.batch}
                      onChange={(e) => setNewUser({...newUser, batch: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option key={batch} value={batch}>
                          Batch {batch} ({getAcademicYear(batch)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={newUser.studentId}
                      onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="e.g., CS2024001"
                    />
                  </div>
                </div>
              )}

              {/* Designation for Faculty */}
              {newUser.role === 'Faculty' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <select
                      value={newUser.designation}
                      onChange={(e) => setNewUser({...newUser, designation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      <option value="">Select Designation</option>
                      {designations.map((designation) => (
                        <option key={designation} value={designation}>{designation}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                    <input
                      type="number"
                      value={newUser.experience}
                      onChange={(e) => setNewUser({...newUser, experience: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                    />
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: formatPhoneNumber(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="+91 98765 43210"
                    pattern="^\+91\s[0-9]{5}\s[0-9]{5}$"
                    title="Please enter phone number in format: +91 XXXXX XXXXX"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: +91 XXXXX XXXXX</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={newUser.address}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
              </div>

              {/* Guardian info for Students */}
              {newUser.role === 'Student' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={newUser.guardianName}
                      onChange={(e) => setNewUser({...newUser, guardianName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label>
                    <input
                      type="tel"
                      value={newUser.guardianPhone}
                      onChange={(e) => setNewUser({...newUser, guardianPhone: formatPhoneNumber(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="+91 98765 43210"
                      pattern="^\+91\s[0-9]{5}\s[0-9]{5}$"
                      title="Please enter phone number in format: +91 XXXXX XXXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: +91 XXXXX XXXXX</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete User</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setUserToDelete(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate/Activate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                userToToggle?.status === 'Active' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <svg className={`h-6 w-6 ${
                  userToToggle?.status === 'Active' ? 'text-yellow-600' : 'text-green-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {userToToggle?.status === 'Active' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userToToggle?.status === 'Active' ? 'Deactivate' : 'Activate'} User
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to {userToToggle?.status === 'Active' ? 'deactivate' : 'activate'} <strong>{userToToggle?.name}</strong>?
                {userToToggle?.status === 'Active' && ' This will restrict their access to the system.'}
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={confirmToggleStatus}
                  className={`px-4 py-2 rounded text-white ${
                    userToToggle?.status === 'Active' 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {userToToggle?.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setShowDeactivateConfirm(false)
                    setUserToToggle(null)
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
