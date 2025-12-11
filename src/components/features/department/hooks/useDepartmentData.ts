import { useState, useEffect, useCallback } from 'react'
import apiService from '../../../../services/api'
import { Department, User, Subject } from '../types'

export const useDepartmentData = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [departments, setDepartments] = useState<Department[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])

    const updateDepartmentStats = useCallback((depts: Department[], usersList: User[], subjectsList: Subject[]) => {
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
    }, [])

    const loadAllData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            // Auto-login as admin if no token exists
            if (!apiService.token) {
                console.log('No token found, attempting auto-login as admin...')
                try {
                    const loginResponse = await apiService.login('admin@learnaia.edu', 'admin123')
                    if (loginResponse.success) {
                        console.log('Auto-login successful')
                    } else {
                        throw new Error('Auto-login failed')
                    }
                } catch (loginError) {
                    console.error('Auto-login failed:', loginError)
                    setError('Authentication failed. Please contact administrator.')
                    setLoading(false)
                    return
                }
            }

            // Load departments, users, and subjects in parallel
            const [departmentsData, usersData, subjectsData] = await Promise.all([
                apiService.getDepartments(),
                apiService.getUsers(),
                apiService.getSubjects()
            ])

            // Transform and set departments
            const transformedDepartments = departmentsData.data?.map(apiService.transformDepartmentData) || []

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
        } finally {
            setLoading(false)
        }
    }, [updateDepartmentStats])

    useEffect(() => {
        loadAllData()
    }, [loadAllData])

    return {
        departments,
        users,
        subjects,
        loading,
        error,
        loadAllData
    }
}
