import React, { useState } from 'react'
import { Department, Subject, User } from '../types'
import apiService from '../../../../services/api'

interface SubjectManagementTabProps {
    departments: Department[]
    subjects: Subject[]
    faculty: User[]
    loading: boolean
    onRefresh: () => void
    onDeleteSubject: (id: string) => Promise<void>
    onShowNotification: (message: string, type?: 'success' | 'error' | 'warning') => void
}

export default function SubjectManagementTab({
    departments,
    subjects,
    faculty,
    loading,
    onRefresh,
    onDeleteSubject,
    onShowNotification
}: SubjectManagementTabProps) {
    const [showSubjectForm, setShowSubjectForm] = useState(false)
    const [showFacultyAssignmentForm, setShowFacultyAssignmentForm] = useState(false)
    const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState<Subject | null>(null)
    const [selectedFaculty, setSelectedFaculty] = useState<any[]>([])
    const [localLoading, setLocalLoading] = useState(false)

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

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalLoading(true)

        try {
            if (subjectForm.createForAllSections) {
                // Create subjects for all sections of the selected department
                const selectedDept = departments.find(dept => dept.name === subjectForm.department)
                const sections = selectedDept ? selectedDept.sections : ['A'] // Fallback to A if department not found
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
                onShowNotification(`Subject created for all sections successfully!`, 'success')
            } else {
                // Create subject for specific section
                const { createForAllSections, ...subjectData } = subjectForm

                const response = await apiService.createSubject(subjectData)

                if (response.success) {
                    onShowNotification('Subject created successfully!', 'success')
                } else {
                    throw new Error(response.message || 'Failed to create subject')
                }
            }

            setShowSubjectForm(false)
            resetSubjectForm()
            onRefresh()

        } catch (error: any) {
            console.error('Create subject error:', error)
            onShowNotification(error.message || 'Failed to create subject', 'error')
        } finally {
            setLocalLoading(false)
        }
    }

    const handleAssignFaculty = async () => {
        try {
            if (!selectedSubjectForAssignment) {
                onShowNotification('No subject selected', 'warning');
                return;
            }

            if (selectedFaculty.length === 0) {
                onShowNotification('Please select at least one faculty member', 'warning');
                return;
            }

            setLocalLoading(true)

            // Assign each selected faculty to the subject with sequential processing
            let successCount = 0;
            for (const faculty of selectedFaculty) {
                try {
                    await apiService.assignFacultyToSubject(faculty.id, { subjectIds: [selectedSubjectForAssignment.id] });
                    successCount++;
                    // Small delay to prevent overwhelming the server
                    if (selectedFaculty.length > 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (error: any) {
                    console.error(`Error assigning faculty ${faculty.name}:`, error);
                    onShowNotification(`Failed to assign ${faculty.name}: ${error.message}`, 'error');
                }
            }

            if (successCount > 0) {
                onRefresh(); // Reload data
                onShowNotification(`${successCount} faculty assigned successfully!`, 'success');
                setShowFacultyAssignmentForm(false);
                setSelectedSubjectForAssignment(null);
                setSelectedFaculty([]);
            }
        } catch (error: any) {
            onShowNotification(error.message || 'Failed to assign faculty', 'error');
        } finally {
            setLocalLoading(false)
        }
    }

    const isLoading = loading || localLoading

    return (
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
                                                    <span className="text-gray-500 italic">No faculty assigned</span>
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
                                                        onClick={() => {
                                                            setSelectedSubjectForAssignment(subject)
                                                            setShowFacultyAssignmentForm(true)
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                                    >
                                                        Assign Faculty
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteSubject(subject.id)}
                                                        className="text-red-600 hover:text-red-800 text-xs bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
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
                                            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
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
                                            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
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
                                        onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Department *
                                        </label>
                                        <select
                                            value={subjectForm.department}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.name}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year *
                                        </label>
                                        <select
                                            value={subjectForm.year}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, year: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="1st Year">1st Year</option>
                                            <option value="2nd Year">2nd Year</option>
                                            <option value="3rd Year">3rd Year</option>
                                            <option value="4th Year">4th Year</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Section *
                                        </label>
                                        <select
                                            value={subjectForm.section}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, section: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                            disabled={subjectForm.createForAllSections}
                                        >
                                            {(() => {
                                                const selectedDept = departments.find(dept => dept.name === subjectForm.department)
                                                if (selectedDept) {
                                                    return selectedDept.sections.map(section => (
                                                        <option key={section} value={section}>Section {section}</option>
                                                    ))
                                                }
                                                return <option value="A">Section A</option>
                                            })()}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="createForAllSections"
                                        checked={subjectForm.createForAllSections}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, createForAllSections: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="createForAllSections" className="text-sm text-gray-700">
                                        Create for all sections in this department
                                    </label>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Credits *
                                        </label>
                                        <input
                                            type="number"
                                            value={subjectForm.credits}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) })}
                                            min="1"
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
                                            onChange={(e) => setSubjectForm({ ...subjectForm, semester: parseInt(e.target.value) })}
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
                                            onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="Core">Core</option>
                                            <option value="Elective">Elective</option>
                                            <option value="Lab">Lab</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Creating...' : 'Create Subject'}
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

            {/* Faculty Assignment Modal */}
            {showFacultyAssignmentForm && selectedSubjectForAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
                        <h3 className="text-xl font-bold mb-4 text-black">
                            Assign Faculty to {selectedSubjectForAssignment.name}
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-gray-600 mb-4">
                                    Subject: {selectedSubjectForAssignment.code} - {selectedSubjectForAssignment.department} Section {selectedSubjectForAssignment.section}
                                </p>
                            </div>

                            {/* Available Faculty List */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Available Faculty (Multiple Selection)</h4>
                                <div className="grid gap-3 max-h-64 overflow-y-auto">
                                    {faculty.map((f) => {
                                        const isSelected = selectedFaculty.some((sf: any) => sf.id === f.id)
                                        const isExternal = f.department !== selectedSubjectForAssignment.department

                                        return (
                                            <div key={f.id} className={`p-3 border rounded-lg cursor-pointer transition-colors ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedFaculty(selectedFaculty.filter((sf: any) => sf.id !== f.id))
                                                    } else {
                                                        setSelectedFaculty([...selectedFaculty, {
                                                            id: f.id,
                                                            name: f.name,
                                                            email: f.email,
                                                            department: f.department,
                                                            isExternal
                                                        }])
                                                    }
                                                }}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{f.name}</p>
                                                        <p className="text-sm text-gray-600">{f.email}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {f.department}
                                                            {isExternal && (
                                                                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                                    External
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Selected Faculty Preview */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Selected Faculty ({selectedFaculty.length})</h4>
                                <div className="space-y-2">
                                    {selectedFaculty.map((f: any, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-800">{f.name}</p>
                                                <p className="text-sm text-gray-600">{f.email}</p>
                                                <p className="text-sm text-gray-500">
                                                    {f.department}
                                                    {f.isExternal && (
                                                        <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                            External
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedFaculty(selectedFaculty.filter((sf: any) => sf.id !== f.id))}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    {selectedFaculty.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No faculty selected</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
                            <button
                                onClick={() => {
                                    setShowFacultyAssignmentForm(false)
                                    setSelectedSubjectForAssignment(null)
                                    setSelectedFaculty([])
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignFaculty}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
