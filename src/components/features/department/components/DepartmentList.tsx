import React from 'react'
import { Department } from '../types'

interface DepartmentListProps {
    departments: Department[]
    loading: boolean
    onEdit: (department: Department) => void
    onDelete: (id: string) => void
    onAssignHod: (department: Department) => void
    onManageSubjects: () => void
    onCreateFirst: () => void
}

export default function DepartmentList({
    departments,
    loading,
    onEdit,
    onDelete,
    onAssignHod,
    onManageSubjects,
    onCreateFirst
}: DepartmentListProps) {
    return (
        <>
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
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dept.status === 'Active'
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
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => onEdit(dept)}
                                className="flex-1 min-w-[100px] bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                            <button
                                onClick={() => onAssignHod(dept)}
                                className="flex-1 min-w-[100px] bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {dept.hod ? 'Change HOD' : 'Assign HOD'}
                            </button>
                            <button
                                onClick={onManageSubjects}
                                className="flex-1 min-w-[100px] bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Subjects
                            </button>
                            <button
                                onClick={() => onDelete(dept.id)}
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
                        onClick={onCreateFirst}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                        Create First Department
                    </button>
                </div>
            )}
        </>
    )
}
