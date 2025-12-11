import React, { useState } from 'react'
import { Department, User } from '../types'
import apiService from '../../../../services/api'

interface StudentAllocationTabProps {
    users: User[]
    departments: Department[]
    loading: boolean
    onRefresh: () => void
    onShowNotification: (message: string, type?: 'success' | 'error' | 'warning') => void
}

export default function StudentAllocationTab({
    users,
    departments,
    loading,
    onRefresh,
    onShowNotification
}: StudentAllocationTabProps) {
    // Filter states
    const [studentFilters, setStudentFilters] = useState({
        department: '',
        year: '',
        section: '',
        status: '' // assigned, unassigned, all
    })

    const [searchStudentTerm, setSearchStudentTerm] = useState('')

    // Student action states
    const [showViewStudentPopup, setShowViewStudentPopup] = useState(false)
    const [showReassignPopup, setShowReassignPopup] = useState(false)
    const [showAssignPopup, setShowAssignPopup] = useState(false)
    const [selectedStudentForAction, setSelectedStudentForAction] = useState<User | null>(null)

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

    // Student allocation system functions
    const getUnassignedStudents = () => {
        return users.filter(user =>
            user.role === 'Student' &&
            user.department &&
            user.batch &&
            !user.section // Only students without section assignment
        );
    };

    // Get class combinations (Department + Year + Section)
    const getClassCombinations = () => {
        const combinations: { department: string; year: string; section: string; currentCount: number }[] = [];

        departments.forEach(dept => {
            const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
            years.forEach(year => {
                // Use department's configured sections instead of hardcoded ones
                dept.sections.forEach(section => {
                    const currentCount = users.filter(user =>
                        user.role === 'Student' &&
                        user.department === dept.name &&
                        getAcademicYear(user.batch || '') === year &&
                        user.section === section
                    ).length;

                    combinations.push({
                        department: dept.name,
                        year,
                        section,
                        currentCount
                    });
                });
            });
        });

        return combinations;
    };

    const filteredStudents = users.filter(user => {
        if (user.role !== 'Student') return false

        const matchesDepartment = !studentFilters.department || user.department === studentFilters.department
        const matchesYear = !studentFilters.year || getAcademicYear(user.batch || '') === studentFilters.year
        const matchesSection = !studentFilters.section || user.section === studentFilters.section
        const matchesStatus = !studentFilters.status ||
            (studentFilters.status === 'assigned' && user.section) ||
            (studentFilters.status === 'unassigned' && !user.section)

        const matchesSearch = !searchStudentTerm ||
            user.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
            (user.studentId && user.studentId.toLowerCase().includes(searchStudentTerm.toLowerCase()))

        return matchesDepartment && matchesYear && matchesSection && matchesStatus && matchesSearch
    })

    const unassignedStudents = filteredStudents.filter(student => !student.section)
    const assignedStudents = filteredStudents.filter(student => student.section)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Student Allocation</h3>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={onRefresh}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Refresh student data"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Total: {filteredStudents.length}
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Assigned: {assignedStudents.length}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        Unassigned: {unassignedStudents.length}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
                        <input
                            type="text"
                            value={searchStudentTerm}
                            onChange={(e) => setSearchStudentTerm(e.target.value)}
                            placeholder="Name, email, or student ID..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                            value={studentFilters.department}
                            onChange={(e) => setStudentFilters({ ...studentFilters, department: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                        <select
                            value={studentFilters.year}
                            onChange={(e) => setStudentFilters({ ...studentFilters, year: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Years</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select
                            value={studentFilters.section}
                            onChange={(e) => setStudentFilters({ ...studentFilters, section: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Sections</option>
                            {(() => {
                                const selectedDept = departments.find(dept => dept.name === studentFilters.department)
                                if (selectedDept) {
                                    return selectedDept.sections.map(section => (
                                        <option key={section} value={section}>Section {section}</option>
                                    ))
                                }
                                // If no department selected, show all possible sections from all departments
                                const allSections = Array.from(new Set(departments.flatMap(dept => dept.sections))).sort()
                                return allSections.map(section => (
                                    <option key={section} value={section}>Section {section}</option>
                                ))
                            })()}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={studentFilters.status}
                            onChange={(e) => setStudentFilters({ ...studentFilters, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Student Info</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Academic Year</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Section</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div>
                                            <p className="font-medium text-gray-800">{student.name}</p>
                                            <p className="text-sm text-gray-600">{student.email}</p>
                                            {student.studentId && (
                                                <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-700">{student.department}</td>
                                    <td className="py-3 px-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                            {getAcademicYear(student.batch || '')}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {student.section ? (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                                Section {student.section}
                                            </span>
                                        ) : (
                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                                                Not Assigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${student.status === 'Active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedStudentForAction(student)
                                                    setShowViewStudentPopup(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                            >
                                                View
                                            </button>
                                            {student.section ? (
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudentForAction(student)
                                                        setShowReassignPopup(true)
                                                    }}
                                                    className="text-orange-600 hover:text-orange-800 text-xs bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors"
                                                >
                                                    Reassign
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudentForAction(student)
                                                        setShowAssignPopup(true)
                                                    }}
                                                    className="text-green-600 hover:text-green-800 text-xs bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                                                >
                                                    Assign
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredStudents.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
            )}

            {/* Student View Popup */}
            {
                showViewStudentPopup && selectedStudentForAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
                                    <button
                                        onClick={() => {
                                            setShowViewStudentPopup(false)
                                            setSelectedStudentForAction(null)
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Student Info */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-100 p-3 rounded-full">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-800">{selectedStudentForAction?.name}</h4>
                                                <p className="text-gray-600">{selectedStudentForAction?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <h5 className="font-semibold text-gray-800">Academic Information</h5>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Department:</span>
                                                    <span className="font-medium">{selectedStudentForAction?.department}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Batch:</span>
                                                    <span className="font-medium">{selectedStudentForAction?.batch}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Academic Year:</span>
                                                    <span className="font-medium">{getAcademicYear(selectedStudentForAction?.batch || '')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Section:</span>
                                                    <span className="font-medium">
                                                        {selectedStudentForAction?.section ? (
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                                Section {selectedStudentForAction?.section}
                                                            </span>
                                                        ) : (
                                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                                                                Not Assigned
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status:</span>
                                                    <span className={`px-2 py-1 rounded text-sm font-medium ${selectedStudentForAction?.status === 'Active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {selectedStudentForAction?.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="font-semibold text-gray-800">Contact Information</h5>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Phone:</span>
                                                    <span className="font-medium">{selectedStudentForAction?.phone}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Address:</span>
                                                    <span className="font-medium text-right">{selectedStudentForAction?.address}</span>
                                                </div>
                                                {selectedStudentForAction?.guardianName && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Guardian:</span>
                                                            <span className="font-medium">{selectedStudentForAction?.guardianName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-600">Guardian Phone:</span>
                                                            <span className="font-medium">{selectedStudentForAction?.guardianPhone}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => {
                                            setShowViewStudentPopup(false)
                                            setSelectedStudentForAction(null)
                                        }}
                                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Student Reassign Popup */}
            {
                showReassignPopup && selectedStudentForAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-lg w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800">Reassign Student</h3>
                                    <button
                                        onClick={() => {
                                            setShowReassignPopup(false)
                                            setSelectedStudentForAction(null)
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2">Student Information</h4>
                                        <p className="text-gray-700"><strong>Name:</strong> {selectedStudentForAction?.name}</p>
                                        <p className="text-gray-700"><strong>Current Section:</strong> {selectedStudentForAction?.section || 'Not Assigned'}</p>
                                        <p className="text-gray-700"><strong>Department:</strong> {selectedStudentForAction?.department}</p>
                                        <p className="text-gray-700"><strong>Academic Year:</strong> {getAcademicYear(selectedStudentForAction?.batch || '')}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select New Section</label>
                                        {(() => {
                                            const year = getAcademicYear(selectedStudentForAction?.batch || '')
                                            const currentClassCombinations = getClassCombinations();
                                            const availableSections = currentClassCombinations.filter(c =>
                                                c.department === selectedStudentForAction?.department &&
                                                c.year === year &&
                                                c.section !== selectedStudentForAction?.section &&
                                                c.currentCount < 65
                                            )

                                            if (availableSections.length === 0) {
                                                return (
                                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                                        <p className="text-yellow-800">No available sections for reassignment. All sections are either full or this is the student's current section.</p>
                                                        <div className="flex justify-end mt-3">
                                                            <button
                                                                onClick={() => {
                                                                    setShowReassignPopup(false)
                                                                    setSelectedStudentForAction(null)
                                                                }}
                                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                            >
                                                                OK
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div className="space-y-2">
                                                    {availableSections.map((section) => (
                                                        <button
                                                            type="button"
                                                            key={section.section}
                                                            onClick={async () => {
                                                                if (selectedStudentForAction) {
                                                                    try {
                                                                        await apiService.updateUser(selectedStudentForAction.id, { section: section.section });
                                                                        onRefresh(); // Reload data
                                                                        onShowNotification(`${selectedStudentForAction.name} successfully reassigned to Section ${section.section}`, 'success');
                                                                        setShowReassignPopup(false);
                                                                        setSelectedStudentForAction(null);
                                                                    } catch (error: any) {
                                                                        onShowNotification(error.message || 'Failed to reassign student', 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">Section {section.section}</span>
                                                                <span className="text-sm text-gray-600">
                                                                    {section.currentCount}/65 students
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${(section.currentCount / 65) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    <div className="flex justify-end gap-3 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setShowReassignPopup(false)
                                                                setSelectedStudentForAction(null)
                                                            }}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Student Assign Popup */}
            {
                showAssignPopup && selectedStudentForAction && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-lg w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800">Assign Student to Section</h3>
                                    <button
                                        onClick={() => {
                                            setShowAssignPopup(false)
                                            setSelectedStudentForAction(null)
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-gray-800 mb-2">Student Information</h4>
                                        <p className="text-gray-700"><strong>Name:</strong> {selectedStudentForAction?.name}</p>
                                        <p className="text-gray-700"><strong>Current Section:</strong> Not Assigned</p>
                                        <p className="text-gray-700"><strong>Department:</strong> {selectedStudentForAction?.department}</p>
                                        <p className="text-gray-700"><strong>Academic Year:</strong> {getAcademicYear(selectedStudentForAction?.batch || '')}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
                                        {(() => {
                                            const year = getAcademicYear(selectedStudentForAction?.batch || '')
                                            const currentClassCombinations = getClassCombinations();
                                            const availableSections = currentClassCombinations.filter(c =>
                                                c.department === selectedStudentForAction?.department &&
                                                c.year === year &&
                                                c.currentCount < 65
                                            )

                                            if (availableSections.length === 0) {
                                                return (
                                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                                        <p className="text-yellow-800">No available sections. All sections for {selectedStudentForAction?.department} {year} are full.</p>
                                                        <div className="flex justify-end mt-3">
                                                            <button
                                                                onClick={() => {
                                                                    setShowAssignPopup(false)
                                                                    setSelectedStudentForAction(null)
                                                                }}
                                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                            >
                                                                OK
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            return (
                                                <div className="space-y-2">
                                                    {availableSections.map((section) => (
                                                        <button
                                                            type="button"
                                                            key={section.section}
                                                            onClick={async () => {
                                                                if (selectedStudentForAction) {
                                                                    try {
                                                                        await apiService.updateUser(selectedStudentForAction.id, { section: section.section });
                                                                        onRefresh(); // Reload data
                                                                        onShowNotification(`${selectedStudentForAction.name} successfully assigned to Section ${section.section}`, 'success');
                                                                        setShowAssignPopup(false);
                                                                        setSelectedStudentForAction(null);
                                                                    } catch (error: any) {
                                                                        onShowNotification(error.message || 'Failed to assign student', 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium">Section {section.section}</span>
                                                                <span className="text-sm text-gray-600">
                                                                    {section.currentCount}/65 students
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                                <div
                                                                    className="bg-green-600 h-2 rounded-full"
                                                                    style={{ width: `${(section.currentCount / 65) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    <div className="flex justify-end gap-3 mt-4">
                                                        <button
                                                            onClick={() => {
                                                                setShowAssignPopup(false)
                                                                setSelectedStudentForAction(null)
                                                            }}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
