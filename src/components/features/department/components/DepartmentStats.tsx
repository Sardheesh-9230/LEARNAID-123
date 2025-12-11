import React from 'react'
import { Department } from '../types'

interface DepartmentStatsProps {
    departments: Department[]
}

export default function DepartmentStats({ departments }: DepartmentStatsProps) {
    return (
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
    )
}
