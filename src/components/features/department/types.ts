export interface Department {
    id: string
    name: string
    code: string
    description: string
    hod: string
    hodId?: string
    establishedYear: number
    sections: string[]
    facilities: any[]
    programs: any[]
    contactInfo: {
        email: string
        phone: string
        location: string
    }
    status: 'Active' | 'Inactive'
    students: number
    faculty: number
    staff: number
    subjects: number
}

export interface User {
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
    status: 'Active' | 'Inactive'
    // Student specific
    studentId?: string
    semester?: number
    gpa?: number
    guardianName?: string
    guardianPhone?: string
    // Faculty specific
    employeeId?: string
    designation?: string
    qualification?: string
    experience?: number
    specialization?: string[]
}

export interface Subject {
    id: string
    name: string
    code: string
    credits: number
    description: string
    department: string
    departmentId: string
    year: string
    section: string
    semester: number
    academicYear: string
    type: string
    faculty: any[]
    enrolledStudents: string[]
    maxStudents: number
    status: 'Active' | 'Inactive'
}
