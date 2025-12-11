import React, { useState, useEffect } from 'react'
import { Department, User } from '../types'

interface DepartmentFormData {
    name: string
    code: string
    description: string
    hod: string
    establishedYear: number
    sections: string[]
    contactInfo: {
        email: string
        phone: string
        location: string
    }
}

interface DepartmentFormProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: DepartmentFormData) => Promise<void>
    initialData: Department | null
    faculty: User[]
}

export default function DepartmentForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    faculty
}: DepartmentFormProps) {
    const [formData, setFormData] = useState<DepartmentFormData>({
        name: '',
        code: '',
        description: '',
        hod: '',
        establishedYear: new Date().getFullYear(),
        sections: ['A'],
        contactInfo: {
            email: '',
            phone: '',
            location: ''
        }
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                code: initialData.code,
                description: initialData.description,
                hod: initialData.hodId || '',
                establishedYear: initialData.establishedYear,
                sections: initialData.sections,
                contactInfo: initialData.contactInfo
            })
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
                hod: '',
                establishedYear: new Date().getFullYear(),
                sections: ['A'],
                contactInfo: {
                    email: '',
                    phone: '',
                    location: ''
                }
            })
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    const addSection = (section: string) => {
        if (section && !formData.sections.includes(section)) {
            setFormData({
                ...formData,
                sections: [...formData.sections, section]
            })
        }
    }

    const removeSection = (section: string) => {
        setFormData({
            ...formData,
            sections: formData.sections.filter(s => s !== section)
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">
                            {initialData ? 'Edit Department' : 'Add New Department'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                    value={formData.hod}
                                    onChange={(e) => setFormData({ ...formData, hod: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select HOD</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.employeeId})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Established Year
                                </label>
                                <input
                                    type="number"
                                    value={formData.establishedYear}
                                    onChange={(e) => setFormData({ ...formData, establishedYear: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Sections Management */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sections
                            </label>
                            <div className="flex gap-2 flex-wrap mb-2">
                                {formData.sections.map(section => (
                                    <span key={section} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                        {section}
                                        <button
                                            type="button"
                                            onClick={() => removeSection(section)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add Section (e.g. A, B, C)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            addSection(e.currentTarget.value.toUpperCase())
                                            e.currentTarget.value = ''
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                        addSection(input.value.toUpperCase())
                                        input.value = ''
                                    }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-bold text-gray-700 mb-3">Contact Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contactInfo.email}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contactInfo: { ...formData.contactInfo, email: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.contactInfo.phone}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contactInfo: { ...formData.contactInfo, phone: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contactInfo.location}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contactInfo: { ...formData.contactInfo, location: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 shadow-lg"
                            >
                                {initialData ? 'Update Department' : 'Create Department'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
