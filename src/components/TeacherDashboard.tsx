'use client'

import { useState, useEffect, useRef } from 'react'
import apiService from '../services/api'
import SubjectsManagementView from './SubjectsManagementView'
import MCQGeneratorV3 from './MCQGeneratorV3'
import AnalyticsDashboard from './AnalyticsDashboard'

interface User {
  id: string
  _id?: string
  name: string
  email: string
  role: string
  department?: string | { _id: string; name: string; code: string; id?: string }
  section?: string
  batch?: string
  studentId?: string
  employeeId?: string
  status: string
  enrolledSubjects?: (string | { _id: string })[]
  enrolledSections?: any[]
}

interface Subject {
  _id: string
  name: string
  code: string
  department: string | { _id: string; name: string; code: string }
  semester: number
  credits: number
  year: string
  section: string
  description?: string
  faculty?: {
    id?: string
    _id?: string
    name: string
    isPrimary: boolean
    isExternal: boolean
    user?: string | { _id: string; id?: string; name?: string }
  }[]
  maxStudents: number
  enrolledStudents?: string[]
}

interface Note {
  _id: string
  title: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  uploadDate: string
  uploadedBy: string
  subject: string
}

interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  status: 'active' | 'expired' | 'draft'
  submissions: number
  totalStudents: number
}

interface PDFContent {
  _id: string
  filename: string
  originalname: string
  size: number
  uploadDate: string
  text: string
  chunks: string[]
}

interface GeneratedMCQ {
  _id: string
  pdfId: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  createdAt: string
}

interface TaskAssignment {
  _id: string
  studentId: string
  pdfId: string
  questions: any[]
  status: 'assigned' | 'in_progress' | 'completed'
  assignedDate: string
  completedDate?: string
}

interface StudentPerformance {
  _id: string
  studentId: string
  correctAnswers: number
  totalQuestions: number
  averageScore: number
  weakChapters: string[]
  strongChapters: string[]
  recommendations: string[]
  lastUpdated: string
}

interface TeacherDashboardProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export default function TeacherDashboard({ activeTab: propActiveTab, onTabChange }: TeacherDashboardProps = {}) {
  const [user, setUser] = useState<User | null>(null)
  const [mySubjects, setMySubjects] = useState<Subject[]>([])
  const [myStudents, setMyStudents] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(propActiveTab || 'overview')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Sync external activeTab changes
  useEffect(() => {
    if (propActiveTab && propActiveTab !== activeTab) {
      setActiveTab(propActiveTab)
    }
  }, [propActiveTab])

  // Notify parent of tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  // Sprint 4 Feature States
  const [uploadedPDFs, setUploadedPDFs] = useState<PDFContent[]>([])
  const [generatedMCQs, setGeneratedMCQs] = useState<GeneratedMCQ[]>([])
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([])
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([])
  const [selectedPDF, setSelectedPDF] = useState<PDFContent | null>(null)
  const [mcqGeneration, setMcqGeneration] = useState({
    isGenerating: false,
    numQuestions: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    topic: ''
  })

  // Modal states
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [showUploadNote, setShowUploadNote] = useState(false)
  const [showSubjectNotes, setShowSubjectNotes] = useState(false)
  const [selectedSubjectForNotes, setSelectedSubjectForNotes] = useState<Subject | null>(null)
  
  // Sprint 4 Modal States
  const [showUploadPDF, setShowUploadPDF] = useState(false)
  const [showMCQViewer, setShowMCQViewer] = useState(false)
  const [showTaskManager, setShowTaskManager] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Form states
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    maxMarks: 100,
    instructions: ''
  })

  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
    subject: ''
  })

  // Sprint 4 Form States
  const [pdfForm, setPdfForm] = useState({
    file: null as File | null,
    subject: '',
    description: ''
  })

  const [taskForm, setTaskForm] = useState({
    studentId: '',
    pdfId: '',
    instructions: ''
  })

  // Modern UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [currentGesture, setCurrentGesture] = useState<string | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [draggedCard, setDraggedCard] = useState<string | null>(null)

  // Helper function to safely render department name
  const getDepartmentName = (department: string | { name: string; _id: string; code: string } | undefined): string => {
    if (!department) return 'Not Assigned'
    if (typeof department === 'string') return department
    if (typeof department === 'object') {
      return department.name || department.code || 'Not Assigned'
    }
    return 'Not Assigned'
  }

  // Helper function for notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type: type as 'success' | 'error' })
    setTimeout(() => setNotification(null), 5000)
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  // Modern Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    
    // Detect swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setCurrentGesture('swipe-right')
      } else {
        setCurrentGesture('swipe-left')
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        setCurrentGesture('swipe-down')
      } else {
        setCurrentGesture('swipe-up')
      }
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(null)
    setTimeout(() => setCurrentGesture(null), 500)
  }

  const handleTabSwipe = (direction: 'left' | 'right') => {
    const tabs = ['overview', 'subjects', 'students', 'assignments', 'mcq', 'tasks', 'analytics', 'schedule']
    const currentIndex = tabs.indexOf(activeTab)
    
    if (direction === 'right' && currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1])
    } else if (direction === 'left' && currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1])
    }
  }

  // Handle gesture effects
  useEffect(() => {
    if (currentGesture === 'swipe-left') {
      handleTabSwipe('right')
    } else if (currentGesture === 'swipe-right') {
      handleTabSwipe('left')
    }
  }, [currentGesture])

  // Dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedCard && draggedCard !== targetId) {
      // Handle reordering logic here
      showNotification('Card reordered successfully!', 'success')
    }
    setDraggedCard(null)
  }

  // Helper function to get academic year from batch
  const getAcademicYear = (batch: string): string => {
    if (!batch) return 'Unknown'
    // Extract year from batch like "2021-2025" or "2021"
    const yearMatch = batch.match(/(\d{4})/)
    if (yearMatch) {
      const startYear = parseInt(yearMatch[1])
      return `${startYear}-${startYear + 4}`
    }
    return batch
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Get current user info from localStorage
      const userData = getCurrentUserData()
      
      if (userData) {
        setUser(userData)
        console.log('👤 Loading dashboard for user:', {
          name: userData.name,
          id: userData.id || userData._id,
          role: userData.role,
          department: userData.department,
          email: userData.email
        })
        
        const teacherId = userData.id || userData._id
        if (teacherId) {
          await Promise.all([
            loadMySubjects(teacherId),
            loadAssignments(),
            // loadUploadedPDFs() // Commented out - Sprint 4 feature not implemented yet
          ])
        } else {
          showNotification('User ID not found. Please login again.', 'error')
          redirectToLogin()
        }
      } else {
        showNotification('Please login to access the dashboard', 'error')
        redirectToLogin()
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      showNotification('Error loading dashboard data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentUserData = () => {
    try {
      // Try localStorage user object first
      const currentUser = localStorage.getItem('user')
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        console.log('Loaded user from localStorage:', userData)
        return userData
      }
      
      // Fallback: construct from individual items
      const userId = localStorage.getItem('userId')
      const userEmail = localStorage.getItem('userEmail')
      const userName = localStorage.getItem('userName')
      const userRole = localStorage.getItem('userRole')
      const userDepartment = localStorage.getItem('userDepartment')
      const employeeId = localStorage.getItem('employeeId')
      
      if (userId || userEmail) {
        const userData = {
          id: userId,
          _id: userId,
          email: userEmail,
          name: userName,
          role: userRole,
          department: userDepartment,
          employeeId: employeeId
        }
        console.log('Constructed user from individual items:', userData)
        return userData
      }
      
      return null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  const redirectToLogin = () => {
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }, 2000)
  }

  const loadMySubjects = async (teacherId: string) => {
    try {
      const response = await apiService.getSubjects()
      const allSubjects = response?.data || response || []
      
      if (!Array.isArray(allSubjects) || allSubjects.length === 0) {
        console.log('No subjects found in system')
        setMySubjects([])
        return
      }
      
      // Filter subjects where current user is assigned as faculty
      const mySubjects = allSubjects.filter((subject: Subject) => {
        if (!subject.faculty || !Array.isArray(subject.faculty)) {
          return false
        }
        
        return subject.faculty.some(f => {
          // Handle different faculty structure formats
          let facultyId = null
          
          // Get the user ID from the faculty object
          if (f.user) {
            if (typeof f.user === 'string') {
              facultyId = f.user
            } else if (f.user._id) {
              facultyId = f.user._id
            } else if (f.user.id) {
              facultyId = f.user.id
            }
          }
          
          return facultyId === teacherId
        })
      })
      
      console.log(`📚 Loaded ${mySubjects.length} subjects assigned to faculty`)
      
      if (mySubjects.length === 0) {
        showNotification('No subjects are currently assigned to you. Contact your administrator.', 'info')
      }
      
      setMySubjects(mySubjects)
      
      // Load students for these subjects
      if (mySubjects.length > 0) {
        // Sync enrollments first to ensure students are properly enrolled
        try {
          console.log('🔄 Syncing student enrollments...')
          const syncResult = await apiService.syncStudentEnrollments()
          console.log('✅ Enrollment sync completed:', syncResult)
          
          if (syncResult && syncResult.success) {
            console.log('📊 Sync stats:', syncResult.data)
          }
        } catch (syncError) {
          console.error('❌ Enrollment sync failed:', syncError)
          // Continue anyway - fallback to department/year/section matching
        }
        
        await loadStudentsForSubjects(mySubjects)
      } else {
        console.log('⚠️ No subjects assigned to this teacher')
        showNotification('No subjects are currently assigned to you. Contact your administrator.', 'info')
      }
    } catch (error) {
      console.error('❌ Error loading subjects:', error)
      showNotification('Error loading your subjects. Please try refreshing.', 'error')
    }
  }

  const loadStudentsForSubjects = async (subjects: Subject[]) => {
    try {
      console.log('👥 Loading students for subjects:', subjects.map(s => s.name))
      
      if (!Array.isArray(subjects)) {
        console.error('❌ Subjects parameter is not an array:', subjects)
        return
      }
      
      // Get all users - try with and without filters
      let users: User[] = []
      try {
        // First try to get only students
        const studentUsersResponse = await apiService.getUsers({ role: 'Student', status: 'Active', limit: 1000 })
        console.log('🔍 Students API response:', studentUsersResponse)
        
        // Extract data from response - backend returns { success: true, data: [...] }
        if (studentUsersResponse && studentUsersResponse.data && Array.isArray(studentUsersResponse.data)) {
          users = studentUsersResponse.data
        } else if (Array.isArray(studentUsersResponse)) {
          // Fallback if response is directly an array
          users = studentUsersResponse
        } else {
          console.warn('⚠️ Unexpected response format:', studentUsersResponse)
          users = []
        }
        console.log('👤 Active student users loaded:', users.length)
      } catch (filteredError) {
        console.warn('⚠️ Filtered user query failed, trying all users:', filteredError)
        try {
          // Fallback: get all users and filter client-side
          const allUsersResponse = await apiService.getUsers({ limit: 1000 })
          console.log('🔍 All users API response:', allUsersResponse)
          
          let allUsers: User[] = []
          // Extract data from response
          if (allUsersResponse && allUsersResponse.data && Array.isArray(allUsersResponse.data)) {
            allUsers = allUsersResponse.data
          } else if (Array.isArray(allUsersResponse)) {
            allUsers = allUsersResponse
          } else {
            console.warn('⚠️ Unexpected all users response format:', allUsersResponse)
            allUsers = []
          }
          
          users = allUsers.filter((user: User) => user.role === 'Student' && user.status === 'Active')
          console.log('👤 Filtered student users from all users:', users.length)
        } catch (allUsersError) {
          console.error('❌ Failed to load any users:', allUsersError)
          users = []
        }
      }
      
      // Ensure users is always an array
      if (!Array.isArray(users)) {
        console.error('❌ Users response is not an array:', typeof users, users)
        users = []
      }
      
      if (users.length === 0) {
        console.warn('⚠️ No students found in the system')
        setMyStudents([])
        showNotification('No students found in the system.', 'info')
        return
      }
      
      // Debug subject data structure
      console.log('📚 Available subjects for matching:')
      subjects.forEach(subject => {
        console.log(`  - ${subject.name}: ${getDepartmentName(subject.department)} ${subject.year} Section ${subject.section}`)
      })
      
      // Debug student data structure (first few students)
      console.log('👤 Sample students:')
      if (Array.isArray(users) && users.length > 0) {
        users.slice(0, 5).forEach((user: User) => {
          if (user && user.name) {
            console.log(`  - ${user.name}: ${getDepartmentName(user.department)} ${getAcademicYear(user.batch || '')} Section ${user.section}`)
          }
        })
      } else {
        console.warn('⚠️ Users array is empty or invalid for debugging')
      }
      
      // Get all students in the departments and years of teacher's subjects
      const relevantStudents = users.filter((user: User) => {
        if (user.role !== 'Student' || user.status !== 'Active') return false
        
        const userDeptName = getDepartmentName(user.department)
        const academicYear = getAcademicYear(user.batch || '')
        
        // Check if this student matches any of our subjects
        const matchingSubject = subjects.some(subject => {
          const subjectDeptName = getDepartmentName(subject.department)
          
          // First check enrolledSubjects array (this is what the backend sync updates)
          if (user.enrolledSubjects && Array.isArray(user.enrolledSubjects)) {
            const enrolledMatch = user.enrolledSubjects.some((enrolledSubjectId: any) => {
              // Handle both ObjectId objects and string IDs
              const enrolledId = enrolledSubjectId._id || enrolledSubjectId
              return enrolledId === subject._id || String(enrolledId) === String(subject._id)
            })
            
            if (enrolledMatch) {
              console.log(`✅ EnrolledSubjects match - Student: ${user.name} ↔ Subject: ${subject.name}`)
              return true
            }
          }
          
          // Also check enrolledSections if it exists (for backward compatibility)
          if (user.enrolledSections && Array.isArray(user.enrolledSections)) {
            const sectionMatch = user.enrolledSections.some((section: any) => {
              const sectionSubjectId = section.subject?._id || section.subject || section.subjectId
              return sectionSubjectId === subject._id || String(sectionSubjectId) === String(subject._id)
            })
            
            if (sectionMatch) {
              console.log(`✅ EnrolledSections match - Student: ${user.name} ↔ Subject: ${subject.name}`)
              return true
            }
          }
          
          // Fallback to department/year/section matching
          const deptMatch = userDeptName.toLowerCase() === subjectDeptName.toLowerCase()
          const yearMatch = academicYear === subject.year
          const sectionMatch = user.section === subject.section
          
          const isMatch = deptMatch && yearMatch && sectionMatch
          
          if (isMatch) {
            console.log(`✅ Criteria match - Student: ${user.name} (Dept: ${userDeptName}, Year: ${academicYear}, Section: ${user.section}) ↔ Subject: ${subject.name} (Dept: ${subjectDeptName}, Year: ${subject.year}, Section: ${subject.section})`)
          }
          
          return isMatch
        })
        
        return matchingSubject
      })
      
      console.log('🎯 Filtered relevant students:', relevantStudents.length)
      
      if (relevantStudents.length > 0) {
        console.log('📋 Students list:')
        relevantStudents.forEach((student: User) => {
          console.log(`  - ${student.name} (ID: ${student.studentId}) - ${getDepartmentName(student.department)} ${getAcademicYear(student.batch || '')} Section ${student.section}`)
        })
      }
      
      setMyStudents(relevantStudents)
      
      if (relevantStudents.length === 0) {
        console.warn('⚠️ No matching students found. This could mean:')
        console.warn('   1. No students are assigned to your subjects\' sections')
        console.warn('   2. Department/year/section data doesn\'t match between students and subjects')
        console.warn('   3. Students may need to be enrolled in subjects')
        
        showNotification(
          'No students found matching your subjects. This may be normal if students haven\'t been assigned to sections yet.',
          'info'
        )
      } else {
        showNotification(`Found ${relevantStudents.length} students in your subjects`, 'success')
      }
    } catch (error) {
      console.error('❌ Error loading students:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showNotification(`Error loading students: ${errorMessage}`, 'error')
    }
  }

  const loadAssignments = () => {
    // Mock assignments data - in real app, fetch from backend
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        title: 'Data Structures Assignment 1',
        subject: 'Data Structures',
        dueDate: '2025-10-20',
        status: 'active',
        submissions: 32,
        totalStudents: 45
      },
      {
        id: '2',
        title: 'Algorithm Analysis Quiz',
        subject: 'Algorithms',
        dueDate: '2025-10-15',
        status: 'active',
        submissions: 28,
        totalStudents: 38
      }
    ]
    setAssignments(mockAssignments)
  }

  const loadNotesForSubject = async (subjectId: string) => {
    try {
      // Note: getNotes API endpoint not implemented yet
      // const subjectNotes = await apiService.getNotes(subjectId)
      // setNotes(subjectNotes || [])
      setNotes([])
      showNotification('Notes feature coming soon', 'info')
    } catch (error) {
      console.error('Error loading notes:', error)
      showNotification('Error loading notes for this subject', 'error')
      setNotes([])
    }
  }

  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!noteForm.file || !noteForm.title || !noteForm.subject) {
      showNotification('Please fill in all required fields and select a file', 'error')
      return
    }

    try {
      // Note: uploadNote API endpoint not implemented yet
      showNotification('Note upload feature coming soon', 'info')
      return
      
      // First upload the file
      // const formData = new FormData()
      // formData.append('file', noteForm.file)
      // formData.append('type', 'note')
      // 
      // const uploadResponse = await apiService.uploadFile(formData)
      // 
      // // Then create the note record
      // const noteData = {
      //   title: noteForm.title,
      //   description: noteForm.description,
      //   fileName: noteForm.file.name,
      //   filePath: uploadResponse.filePath,
      //   fileSize: noteForm.file.size,
      // }
      // 
      // await apiService.uploadNote(noteForm.subject, noteData)
      // 
      // showNotification('Note uploaded successfully!', 'success')
      // setShowUploadNote(false)
      // setNoteForm({
      //   title: '',
      //   description: '',
      //   file: null,
      //   subject: ''
      // })
      // 
      // // Refresh notes if viewing notes for this subject
      // if (selectedSubjectForNotes && selectedSubjectForNotes._id === noteForm.subject) {
      //   await loadNotesForSubject(noteForm.subject)
      // }
    } catch (error) {
      console.error('Error uploading note:', error)
      showNotification('Error uploading note. Please try again.', 'error')
    }
  }

  const handleDeleteNote = async (noteId: string, subjectId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      // Note: deleteNote API endpoint not implemented yet
      showNotification('Note delete feature coming soon', 'info')
      // await apiService.deleteNote(subjectId, noteId)
      // showNotification('Note deleted successfully', 'success')
      // await loadNotesForSubject(subjectId)
    } catch (error) {
      console.error('Error deleting note:', error)
      showNotification('Error deleting note', 'error')
    }
  }

  const handleDownloadNote = async (noteId: string, fileName: string) => {
    try {
      // Note: downloadNote API endpoint not implemented yet
      showNotification('Note download feature coming soon', 'info')
      // const blob = await apiService.downloadNote(noteId)
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = fileName
      // document.body.appendChild(a)
      // a.click()
      // window.URL.revokeObjectURL(url)
      // document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading note:', error)
      showNotification('Error downloading note', 'error')
    }
  }

  const openNotesModal = async (subject: Subject) => {
    setSelectedSubjectForNotes(subject)
    setShowSubjectNotes(true)
    await loadNotesForSubject(subject._id)
  }

  const handleSyncEnrollments = async () => {
    try {
      console.log('🔄 Manual enrollment sync triggered')
      showNotification('Syncing student enrollments...', 'info')
      
      const syncResult = await apiService.syncStudentEnrollments()
      console.log('✅ Manual sync result:', syncResult)
      
      if (syncResult && syncResult.success) {
        const stats = syncResult.data
        showNotification(
          `Sync completed! Processed ${stats?.totalStudents || 0} students, ${stats?.studentsProcessed || 0} successfully.`, 
          'success'
        )
        console.log('📊 Sync statistics:', stats)
      } else {
        showNotification('Sync completed but may have had issues. Check console for details.', 'info')
      }
      
      // Reload students after sync
      if (mySubjects.length > 0) {
        await loadStudentsForSubjects(mySubjects)
      }
    } catch (error) {
      console.error('❌ Manual sync failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showNotification(`Failed to sync enrollments: ${errorMessage}`, 'error')
    }
  }

  // Sprint 4 Feature Functions
  const loadUploadedPDFs = async () => {
    try {
      console.log('📚 Loading uploaded PDFs...')
      
      const response = await fetch('http://localhost:5000/api/pdf', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to load PDFs:', response.status, response.statusText)
        if (response.status === 401) {
          showNotification('Session expired. Please log in again.', 'error')
        }
        return
      }

      const data = await response.json()
      if (data.success && data.data) {
        console.log(`✅ Loaded ${data.data.length} PDFs`)
        setUploadedPDFs(data.data)
      } else {
        console.warn('⚠️ No PDFs found or invalid response')
        setUploadedPDFs([])
      }
    } catch (error: any) {
      console.error('❌ Error loading PDFs:', error)
      if (!error.message.includes('Failed to fetch')) {
        showNotification('Error loading PDFs', 'error')
      }
    }
  }

  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!pdfForm.file) {
      showNotification('Please select a PDF file', 'error')
      return
    }

    if (!pdfForm.subject || pdfForm.subject.trim().length === 0) {
      showNotification('Please enter a subject name', 'error')
      return
    }

    // File type validation
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(pdfForm.file.type)) {
      showNotification('Only PDF and Word documents are allowed', 'error')
      return
    }

    // File size validation (50MB)
    const maxSize = 50 * 1024 * 1024
    if (pdfForm.file.size > maxSize) {
      showNotification('File size must be less than 50MB', 'error')
      return
    }

    console.log('📤 Starting PDF upload:', {
      fileName: pdfForm.file.name,
      fileSize: `${(pdfForm.file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: pdfForm.file.type,
      subject: pdfForm.subject
    })

    try {
      const formData = new FormData()
      formData.append('file', pdfForm.file)
      formData.append('subject', pdfForm.subject.trim())
      formData.append('description', pdfForm.description.trim() || '')

      showNotification('Uploading PDF...', 'info')

      const response = await fetch('http://localhost:5000/api/pdf/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      })

      console.log('📥 Upload response status:', response.status, response.statusText)

      let data
      try {
        const responseText = await response.text()
        console.log('📄 Response body:', responseText)
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError)
        throw new Error('Invalid response from server. Please check if the backend is running correctly.')
      }

      if (response.ok && data.success) {
        console.log('✅ PDF uploaded successfully:', data.data)
        showNotification('PDF uploaded and processed successfully!', 'success')
        setShowUploadPDF(false)
        setPdfForm({ file: null, subject: '', description: '' })
        await loadUploadedPDFs()
      } else {
        // Handle specific error codes
        const errorMessage = data.message || data.error || 'Upload failed'
        console.error('❌ Upload failed:', {
          status: response.status,
          message: errorMessage,
          data
        })

        if (response.status === 400) {
          showNotification(`Validation Error: ${errorMessage}`, 'error')
        } else if (response.status === 401) {
          showNotification('Authentication failed. Please log in again.', 'error')
          // Optionally redirect to login
          // router.push('/login')
        } else if (response.status === 413) {
          showNotification('File too large. Maximum size is 50MB.', 'error')
        } else if (response.status === 500) {
          showNotification('Server error. Please try again later.', 'error')
        } else {
          showNotification(`Upload failed: ${errorMessage}`, 'error')
        }
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ Error uploading PDF:', error)
      
      // Network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        showNotification('Network error. Please check if the backend server is running on port 5000.', 'error')
      } else if (!error.message.includes('Upload failed') && !error.message.includes('Validation Error')) {
        // Only show generic error if we haven't already shown a specific one
        showNotification(`Error: ${error.message}`, 'error')
      }
    }
  }

  const handleGenerateMCQs = async (pdfId: string) => {
    // Validation
    if (!mcqGeneration.topic || mcqGeneration.topic.trim().length === 0) {
      showNotification('Please enter a topic for MCQ generation', 'error')
      return
    }

    if (mcqGeneration.topic.trim().length < 3) {
      showNotification('Topic must be at least 3 characters long', 'error')
      return
    }

    setMcqGeneration({ ...mcqGeneration, isGenerating: true })
    
    console.log('🤖 Starting MCQ generation:', {
      materialId: pdfId,
      topic: mcqGeneration.topic,
      numberOfQuestions: mcqGeneration.numQuestions,
      difficulty: mcqGeneration.difficulty
    })

    try {
      showNotification('Generating MCQs with AI... This may take a moment.', 'info')

      const response = await fetch('http://localhost:5000/api/mcq/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          materialId: pdfId,
          topic: mcqGeneration.topic.trim(),
          numberOfQuestions: mcqGeneration.numQuestions,
          difficulty: mcqGeneration.difficulty
        })
      })

      console.log('📥 MCQ generation response status:', response.status, response.statusText)

      let data
      try {
        const responseText = await response.text()
        console.log('📄 MCQ Response body (first 500 chars):', responseText.substring(0, 500))
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ Failed to parse MCQ response:', parseError)
        throw new Error('Invalid response from AI server. The response may be incomplete or malformed.')
      }

      if (response.ok && data.success && data.data.mcqs) {
        const mcqs = data.data.mcqs
        console.log(`✅ Generated ${mcqs.length} MCQs successfully`)
        
        showNotification(`Successfully generated ${mcqs.length} MCQs!`, 'success')
        setGeneratedMCQs(mcqs)
        
        // Optionally show metadata
        if (data.data.metadata) {
          console.log('📊 Generation metadata:', data.data.metadata)
        }
      } else {
        const errorMessage = data.message || data.error || 'MCQ generation failed'
        console.error('❌ MCQ generation failed:', {
          status: response.status,
          message: errorMessage,
          data
        })

        if (response.status === 400) {
          showNotification(`Validation Error: ${errorMessage}`, 'error')
        } else if (response.status === 401) {
          showNotification('Authentication failed. Please log in again.', 'error')
        } else if (response.status === 404) {
          showNotification('Material not found or has no PDF file.', 'error')
        } else if (response.status === 500) {
          showNotification('AI service error. Please try again or use a different topic.', 'error')
        } else {
          showNotification(`MCQ Generation failed: ${errorMessage}`, 'error')
        }
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ Error generating MCQs:', error)
      
      // Network error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        showNotification('Network error. Please check if the backend server is running.', 'error')
      } else if (error.message.includes('timeout')) {
        showNotification('Request timed out. The PDF might be too large or complex.', 'error')
      } else if (!error.message.includes('failed') && !error.message.includes('Error:')) {
        showNotification(`Error: ${error.message}`, 'error')
      }
    } finally {
      setMcqGeneration({ ...mcqGeneration, isGenerating: false })
    }
  }

  const loadMCQsForPDF = async (pdfId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/mcq/${pdfId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setGeneratedMCQs(data.data)
      }
    } catch (error) {
      console.error('Error loading MCQs:', error)
      showNotification('Error loading MCQs', 'error')
    }
  }

  const handleAssignTask = async (studentId: string, pdfId: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/task/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ studentId, pdfId })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Task assigned successfully!', 'success')
        await loadTaskAssignments()
      } else {
        throw new Error(data.error || 'Task assignment failed')
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      showNotification('Error assigning task', 'error')
    }
  }

  const loadTaskAssignments = async () => {
    try {
      const allTasks: TaskAssignment[] = []
      for (const student of myStudents) {
        const response = await fetch(`/api/task/student/${student.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        if (data.success) {
          allTasks.push(...data.data)
        }
      }
      setTaskAssignments(allTasks)
    } catch (error) {
      console.error('Error loading task assignments:', error)
    }
  }

  const loadStudentPerformances = async () => {
    try {
      const performances: StudentPerformance[] = []
      for (const student of myStudents) {
        const response = await fetch(`/api/performance/student/${student.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        if (data.success && data.data) {
          performances.push(data.data)
        }
      }
      setStudentPerformances(performances)
    } catch (error) {
      console.error('Error loading student performances:', error)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // In real app, call API to create assignment
      console.log('Creating assignment:', assignmentForm)
      
      showNotification('Assignment created successfully!', 'success')
      setShowCreateAssignment(false)
      setAssignmentForm({
        title: '',
        description: '',
        subject: '',
        dueDate: '',
        maxMarks: 100,
        instructions: ''
      })
      
      // Refresh assignments
      loadAssignments()
    } catch (error) {
      showNotification('Error creating assignment', 'error')
    }
  }

  const getStudentsForSubject = (subject: Subject) => {
    const studentsForSubject = myStudents.filter((student: User) => {
      const userDeptName = getDepartmentName(student.department)
      const subjectDeptName = getDepartmentName(subject.department)
      const userYear = getAcademicYear(student.batch || '')
      
      return userDeptName === subjectDeptName && 
             userYear === subject.year &&
             student.section === subject.section
    })
    
    console.log(`👥 Students for subject ${subject.name}:`, studentsForSubject.length)
    return studentsForSubject
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={dashboardRef} className="w-full">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <div className="w-full">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Modern Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Subjects Card */}
              <div 
                className={`group relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl border transition-all duration-500 transform hover:scale-105 hover:rotate-1 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-purple-900/80 to-purple-800/60 border-purple-700/50 hover:shadow-purple-500/30' 
                    : 'bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-purple-200 hover:shadow-purple-500/20'
                } shadow-xl hover:shadow-2xl`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'subjects')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'subjects')}
                onClick={() => handleTabChange('subjects')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="text-2xl animate-bounce">📚</div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>My Subjects</h3>
                  <p className="text-4xl font-black bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    {mySubjects.length}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} font-medium`}>
                    Active Courses
                  </p>
                </div>
              </div>

              {/* Students Card */}
              <div 
                className={`group relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl border transition-all duration-500 transform hover:scale-105 hover:-rotate-1 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-blue-900/80 to-blue-800/60 border-blue-700/50 hover:shadow-blue-500/30' 
                    : 'bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-200 hover:shadow-blue-500/20'
                } shadow-xl hover:shadow-2xl`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'students')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'students')}
                onClick={() => setActiveTab('students')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-2xl animate-pulse">👥</div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Total Students</h3>
                  <p className="text-4xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent mb-2">
                    {myStudents.length}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-600'} font-medium`}>
                    Enrolled Learners
                  </p>
                </div>
              </div>

              {/* Assignments Card */}
              <div 
                className={`group relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl border transition-all duration-500 transform hover:scale-105 hover:rotate-1 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-green-900/80 to-green-800/60 border-green-700/50 hover:shadow-green-500/30' 
                    : 'bg-gradient-to-br from-green-500/10 to-green-600/20 border-green-200 hover:shadow-green-500/20'
                } shadow-xl hover:shadow-2xl`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'assignments')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'assignments')}
                onClick={() => setActiveTab('assignments')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-2xl animate-bounce">📝</div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Active Assignments</h3>
                  <p className="text-4xl font-black bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-2">
                    {assignments.filter(a => a.status === 'active').length}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-600'} font-medium`}>
                    In Progress
                  </p>
                </div>
              </div>

              {/* Analytics Card */}
              <div 
                className={`group relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl border transition-all duration-500 transform hover:scale-105 hover:-rotate-1 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-orange-900/80 to-orange-800/60 border-orange-700/50 hover:shadow-orange-500/30' 
                    : 'bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-200 hover:shadow-orange-500/20'
                } shadow-xl hover:shadow-2xl`}
                draggable
                onDragStart={(e) => handleDragStart(e, 'analytics')}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'analytics')}
                onClick={() => setActiveTab('analytics')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-2xl animate-spin">📈</div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Pending Reviews</h3>
                  <p className="text-4xl font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-2">
                    {assignments.reduce((acc, a) => acc + (a.totalStudents - a.submissions), 0)}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'} font-medium`}>
                    Need Attention
                  </p>
                </div>
              </div>


            </div>

            {/* Modern Recent Activity */}
            <div className={`rounded-3xl p-8 backdrop-blur-xl border shadow-2xl transition-all duration-500 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 border-gray-700/50' 
                : 'bg-gradient-to-br from-white/80 to-gray-50/60 border-white/50'
            }`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                    Recent Activity
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your latest subjects and activities
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                {mySubjects.slice(0, 3).map((subject: Subject, index: number) => (
                  <div 
                    key={subject._id} 
                    className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 border border-gray-600/30' 
                        : 'bg-gradient-to-r from-white/70 to-gray-50/70 hover:from-white/90 hover:to-gray-50/90 border border-gray-200/50'
                    } backdrop-blur-sm shadow-lg hover:shadow-xl`}
                    onClick={() => setActiveTab('subjects')}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-r ${
                          index === 0 ? 'from-blue-500 to-blue-600' :
                          index === 1 ? 'from-purple-500 to-purple-600' :
                          'from-green-500 to-green-600'
                        }`}>
                          <span className="text-white font-bold text-lg">{subject.code.charAt(0)}</span>
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'} group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300`}>
                            {subject.name}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {getDepartmentName(subject.department)} • Section {subject.section}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                        }`}>
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                          {getStudentsForSubject(subject).length} students
                        </div>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {subject.year} • Semester {subject.semester}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className={`w-full h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${
                            index === 0 ? 'from-blue-500 to-blue-600' :
                            index === 1 ? 'from-purple-500 to-purple-600' :
                            'from-green-500 to-green-600'
                          } transition-all duration-1000`}
                          style={{ 
                            width: `${Math.min(100, (getStudentsForSubject(subject).length / (subject.maxStudents || 50)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {mySubjects.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>No Recent Activity</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Your subjects and activities will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modern Subjects Tab */}
        {activeTab === 'subjects' && (
          <SubjectsManagementView
            mySubjects={mySubjects}
            myStudents={myStudents}
            getDepartmentName={getDepartmentName}
            showNotification={showNotification}
          />
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Students</h2>
              <div className="text-sm text-gray-600">
                Total: {myStudents.length} students
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Year</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Section</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myStudents.map((student: User) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {student.studentId || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-700">{getDepartmentName(student.department)}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {getAcademicYear(student.batch || '')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            Section {student.section}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            student.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {myStudents.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No students found</p>
                <p className="text-sm">Students will appear here once subjects are assigned.</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Assignments</h2>
              <button 
                onClick={() => setShowCreateAssignment(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Create Assignment
              </button>
            </div>

            <div className="grid gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">Subject: {assignment.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      assignment.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submissions</p>
                      <p className="font-medium">{assignment.submissions} / {assignment.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(assignment.submissions / assignment.totalStudents) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      View Submissions
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {assignments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No assignments created</p>
                <p className="text-sm">Click "Create Assignment" to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* MCQ Generator Tab - New V3 Component */}
        {activeTab === 'mcq' && (
          <div className="-m-6">
            <MCQGeneratorV3 />
          </div>
        )}

        {/* Smart Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">🎯 Smart Task Assignment</h2>
              <button 
                onClick={() => {
                  loadTaskAssignments()
                  loadStudentPerformances()
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh Data
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Task Assignment */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">⚡ Quick Assignment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Student
                    </label>
                    <select
                      value={taskForm.studentId}
                      onChange={(e) => setTaskForm({...taskForm, studentId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Choose a student</option>
                      {myStudents.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.studentId}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select PDF Content
                    </label>
                    <select
                      value={taskForm.pdfId}
                      onChange={(e) => setTaskForm({...taskForm, pdfId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Choose PDF content</option>
                      {uploadedPDFs.map(pdf => (
                        <option key={pdf._id} value={pdf._id}>
                          {pdf.originalname}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (taskForm.studentId && taskForm.pdfId) {
                        handleAssignTask(taskForm.studentId, taskForm.pdfId)
                        setTaskForm({studentId: '', pdfId: '', instructions: ''})
                      }
                    }}
                    disabled={!taskForm.studentId || !taskForm.pdfId}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    Assign Task
                  </button>
                </div>
              </div>

              {/* Task Status */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">📊 Task Status</h3>
                <div className="space-y-3">
                  {taskAssignments.slice(0, 5).map((task) => {
                    const student = myStudents.find(s => s.id === task.studentId)
                    return (
                      <div key={task._id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{student?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">
                              Assigned: {new Date(task.assignedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {taskAssignments.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No tasks assigned yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            userRole="faculty" 
            currentUser={user ? {
              id: user._id || user.id,
              email: user.email,
              role: user.role,
              department: typeof user.department === 'string' ? user.department : user.department?.name,
              subjects: mySubjects.map(s => s._id)
            } : undefined}
          />
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Schedule</h2>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Schedule Management</p>
                <p className="text-sm">Schedule features coming soon. This will show your class timetable and upcoming sessions.</p>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Create Assignment Modal */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Create Assignment</h3>
                <button
                  onClick={() => setShowCreateAssignment(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({...assignmentForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {mySubjects.map(subject => (
                      <option key={subject._id} value={subject.name}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={assignmentForm.dueDate}
                      onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Marks
                    </label>
                    <input
                      type="number"
                      value={assignmentForm.maxMarks}
                      onChange={(e) => setAssignmentForm({...assignmentForm, maxMarks: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Assignment description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions
                  </label>
                  <textarea
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({...assignmentForm, instructions: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Special instructions for students..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAssignment(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload Note Modal */}
      {showUploadNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload Note</h3>
                <button
                  onClick={() => setShowUploadNote(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUploadNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Title *
                  </label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Enter note title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    value={noteForm.subject}
                    onChange={(e) => setNoteForm({...noteForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {mySubjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code}) - Section {subject.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setNoteForm({...noteForm, file: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={noteForm.description}
                    onChange={(e) => setNoteForm({...noteForm, description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional description for the note"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadNote(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subject Notes Modal */}
      {showSubjectNotes && selectedSubjectForNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Notes for {selectedSubjectForNotes.name}
                </h3>
                <button
                  onClick={() => {
                    setShowSubjectNotes(false)
                    setSelectedSubjectForNotes(null)
                    setNotes([])
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <button
                  onClick={() => {
                    setNoteForm({...noteForm, subject: selectedSubjectForNotes._id})
                    setShowUploadNote(true)
                    setShowSubjectNotes(false)
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Note
                </button>
              </div>

              {notes.length > 0 ? (
                <div className="grid gap-4">
                  {notes.map((note: Note) => (
                    <div key={note._id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{note.title}</h4>
                        {note.description && (
                          <p className="text-sm text-gray-600 mt-1">{note.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📄 {note.fileName}</span>
                          <span>📅 {new Date(note.uploadDate).toLocaleDateString()}</span>
                          <span>💾 {(note.fileSize / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadNote(note._id, note.fileName)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note._id, selectedSubjectForNotes._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">No notes uploaded</p>
                  <p className="text-sm">Upload your first note for this subject.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subject Details Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Subject Details</h3>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedSubject.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedSubject.description || 'No description available.'}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subject Code</p>
                    <p className="font-medium">{selectedSubject.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{getDepartmentName(selectedSubject.department)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-medium">{selectedSubject.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Section</p>
                    <p className="font-medium">{selectedSubject.section}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Semester</p>
                    <p className="font-medium">{selectedSubject.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="font-medium">{selectedSubject.credits}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Enrolled Students</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid gap-2">
                      {getStudentsForSubject(selectedSubject).slice(0, 5).map(student => (
                        <div key={student.id} className="flex justify-between items-center">
                          <span className="text-sm">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.studentId}</span>
                        </div>
                      ))}
                      {getStudentsForSubject(selectedSubject).length > 5 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          +{getStudentsForSubject(selectedSubject).length - 5} more students
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setSelectedSubject(null)
                      openNotesModal(selectedSubject)
                    }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Manage Notes
                  </button>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload PDF for MCQ Generation</h3>
                <button
                  onClick={() => setShowUploadPDF(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUploadPDF} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PDF File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setPdfForm({...pdfForm, file: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    accept=".pdf"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Only PDF files are supported for MCQ generation
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Subject
                  </label>
                  <select
                    value={pdfForm.subject}
                    onChange={(e) => setPdfForm({...pdfForm, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Subject (Optional)</option>
                    {mySubjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code}) - Section {subject.section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={pdfForm.description}
                    onChange={(e) => setPdfForm({...pdfForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the content (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload & Process PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadPDF(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes tilt {
          0%, 50%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(0.5deg); }
          75% { transform: rotate(-0.5deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        
        .animate-tilt {
          animation: tilt 10s infinite linear;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite alternate;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .backdrop-blur-xl {
          backdrop-filter: blur(16px);
        }
        
        .group:hover .group-hover\\:animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Touch-specific styles */
        @media (hover: none) and (pointer: coarse) {
          .hover\\:scale-105:hover {
            transform: scale(1.02);
          }
          
          .hover\\:rotate-6:hover {
            transform: rotate(2deg);
          }
          
          .hover\\:-rotate-1:hover {
            transform: rotate(-0.5deg);
          }
          
          .hover\\:rotate-1:hover {
            transform: rotate(0.5deg);
          }
        }
        
        /* Gesture feedback */
        .touch-feedback {
          transition: transform 0.1s ease-out;
        }
        
        .touch-feedback:active {
          transform: scale(0.98);
        }
        
        /* Modern glass morphism effect */
        .glass-morphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-morphism-dark {
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}