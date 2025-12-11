'use client'

import { useState, useEffect } from 'react'
import apiService from '../../../services/api'
import { Department, User, Subject } from './types'
import DepartmentStats from './components/DepartmentStats'
import DepartmentList from './components/DepartmentList'
import DepartmentForm from './components/DepartmentForm'
import SubjectManagementTab from './components/SubjectManagementTab'
import StudentAllocationTab from './components/StudentAllocationTab'
import { useDepartmentData } from './hooks/useDepartmentData'



export default function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState(false)

  // Use custom hook for data management
  const {
    departments,
    users,
    subjects,
    loading,
    error,
    loadAllData
  } = useDepartmentData()

  // Form states
  const [showAddForm, setShowAddForm] = useState(false)

  const [showHodAssignmentForm, setShowHodAssignmentForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [selectedDepartmentForHod, setSelectedDepartmentForHod] = useState<Department | null>(null)

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning'
  })

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  // Effect to show notification on error
  useEffect(() => {
    if (error) {
      showNotification(error, 'error')
    }
  }, [error])

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000)
  }

  const showConfirmationDialog = (message: string, action: () => void) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setShowConfirmDialog(true)
  }

  const handleFormSubmit = async (formData: any) => {
    setActionLoading(true)
    try {
      if (editingDepartment) {
        // Update
        const response = await apiService.updateDepartment(editingDepartment.id, {
          ...formData,
          hod: formData.hod || null
        })

        if (response.success) {
          showNotification('Department updated successfully!')
          setShowAddForm(false)
          setEditingDepartment(null)
          loadAllData()
        } else {
          throw new Error(response.message || 'Failed to update department')
        }
      } else {
        // Create
        const response = await apiService.createDepartment({
          ...formData,
          hod: formData.hod || null,
          facilities: [],
          programs: []
        })

        if (response.success) {
          showNotification('Department created successfully!')
          setShowAddForm(false)
          loadAllData()
        } else {
          throw new Error(response.message || 'Failed to create department')
        }
      }
    } catch (error: any) {
      console.error('Department form error:', error)
      showNotification(error.message || 'Failed to save department', 'error')
    } finally {
      setActionLoading(false)
    }
  }



  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return
    }

    setActionLoading(true)

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
      setActionLoading(false)
    }
  }



  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setShowAddForm(true)
  }



  // HOD Assignment Functions
  const getFacultyForHodAssignment = (departmentId: string) => {
    return users.filter(user =>
      user.role === 'Faculty' &&
      (user.departmentId === departmentId || user.department === departments.find(d => d.id === departmentId)?.name)
    )
  }

  const handleAssignHod = async (facultyId: string) => {
    if (!selectedDepartmentForHod) return

    setActionLoading(true)
    try {
      const selectedFaculty = users.find(u => u.id === facultyId)
      if (!selectedFaculty) throw new Error('Faculty not found')

      // Update department with new HOD (backend expects hod field to be the faculty ObjectId)
      const response = await apiService.updateDepartment(selectedDepartmentForHod.id, {
        hod: selectedFaculty.id  // Send the faculty ID, backend will populate the name
      })

      if (response.success) {
        showNotification(`${selectedFaculty.name} assigned as HOD successfully!`)
        setShowHodAssignmentForm(false)
        setSelectedDepartmentForHod(null)
        loadAllData() // Reload data
      } else {
        throw new Error(response.message || 'Failed to assign HOD')
      }
    } catch (error: any) {
      console.error('HOD assignment error:', error)
      showNotification(error.message || 'Failed to assign HOD. Please try again.', 'error')
    } finally {
      setActionLoading(false)
    }
  }



  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Department Management</h2>
        <p className="text-gray-600">Manage departments, sections, and subjects</p>
      </div>

      {/* Loading State */}
      {(loading || actionLoading) && (
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
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ ...notification, show: false })}
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
          className={`pb-2 px-1 border-b-2 font-medium ${activeTab === 'overview'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          📊 Department Overview
        </button>
        <button
          onClick={() => setActiveTab('subject-management')}
          className={`pb-2 px-1 border-b-2 font-medium ${activeTab === 'subject-management'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          📚 Subject Management
        </button>
        <button
          onClick={() => setActiveTab('student-allocation')}
          className={`pb-2 px-1 border-b-2 font-medium ${activeTab === 'student-allocation'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          👥 Student Allocation
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
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
            <DepartmentStats departments={departments} />
          </div>

          <DepartmentList
            departments={departments}
            loading={loading}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
            onAssignHod={(dept) => {
              setSelectedDepartmentForHod(dept)
              setShowHodAssignmentForm(true)
            }}
            onManageSubjects={() => setActiveTab('subject-management')}
            onCreateFirst={() => setShowAddForm(true)}
          />
        </div>
      )}
      {activeTab === 'subject-management' && (
        <SubjectManagementTab
          departments={departments}
          subjects={subjects}
          faculty={users.filter(u => u.role === 'Faculty')}
          loading={loading}
          onRefresh={loadAllData}
          onDeleteSubject={async (id) => {
            if (!confirm('Are you sure you want to delete this subject?')) return
            setActionLoading(true)
            try {
              const response = await apiService.deleteSubject(id)
              if (response.success) {
                showNotification('Subject deleted successfully!')
                loadAllData()
              } else {
                throw new Error(response.message || 'Failed to delete subject')
              }
            } catch (error: any) {
              showNotification(error.message || 'Failed to delete subject', 'error')
            } finally {
              setActionLoading(false)
            }
          }}
          onShowNotification={(msg, type) => showNotification(msg, type as any)}
        />
      )}
      {activeTab === 'student-allocation' && (
        <StudentAllocationTab
          users={users}
          departments={departments}
          loading={loading}
          onRefresh={loadAllData}
          onShowNotification={(msg, type) => showNotification(msg, type as any)}
        />
      )}

      {/* Department Form Modal */}
      <DepartmentForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false)
          setEditingDepartment(null)
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDepartment}
        faculty={users.filter(u => u.role === 'Faculty')}
      />

      {/* Confirmation Dialog */}
      {
        showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Confirm Action</h3>
                </div>

                <p className="text-gray-600 mb-6">{confirmMessage}</p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmDialog(false)
                      setConfirmAction(null)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmAction) {
                        confirmAction();
                      }
                      setShowConfirmDialog(false);
                      setConfirmAction(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* HOD Assignment Modal */}
      {
        showHodAssignmentForm && selectedDepartmentForHod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedDepartmentForHod.hod ? 'Change HOD' : 'Assign HOD'} - {selectedDepartmentForHod.name}
                  </h3>
                  <button
                    onClick={() => {
                      setShowHodAssignmentForm(false)
                      setSelectedDepartmentForHod(null)
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedDepartmentForHod.hod && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Current HOD:</span> {selectedDepartmentForHod.hod}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Faculty Member as HOD:
                  </label>

                  {(() => {
                    const facultyMembers = getFacultyForHodAssignment(selectedDepartmentForHod.id)

                    if (facultyMembers.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-sm">No faculty members found in this department.</p>
                          <p className="text-xs text-gray-400 mt-1">Add faculty members first to assign as HOD.</p>
                        </div>
                      )
                    }

                    return facultyMembers.map((faculty) => (
                      <div
                        key={faculty.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => handleAssignHod(faculty.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{faculty.name}</h4>
                            <p className="text-sm text-gray-600">{faculty.email}</p>
                            <p className="text-xs text-gray-500">
                              {faculty.designation} | {faculty.experience} years exp.
                            </p>
                            {faculty.specialization && faculty.specialization.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {faculty.specialization.slice(0, 2).map((spec, index) => (
                                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {spec}
                                  </span>
                                ))}
                                {faculty.specialization.length > 2 && (
                                  <span className="text-xs text-gray-500">+{faculty.specialization.length - 2} more</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowHodAssignmentForm(false)
                      setSelectedDepartmentForHod(null)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}