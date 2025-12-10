'use client'

import { useState, useEffect } from 'react'
import { 
  FiUser, FiBook, FiEdit3, FiSave, FiEye, FiFilter, 
  FiUsers, FiBarChart, FiTrendingUp, FiCheckCircle,
  FiAlertTriangle, FiPlus, FiDownload, FiSearch
} from 'react-icons/fi'
import apiService from '../services/api'
import { exportComplexDataToExcel } from '../utils/excelExport'

interface Student {
  _id: string
  name: string
  rollNumber: string
  email: string
  department: {
    _id: string
    name: string
    code: string
  }
  year: string
  section: string
}

interface Subject {
  _id: string
  name: string
  code: string
  credits: number
  type: 'Core' | 'Elective' | 'Open Elective' | 'TCPL' | 'TCPR' | 'Problem Elective'
  year: string
  section: string
  semester: number
  department: string | {
    _id: string
    name: string
    code: string
  }
}

interface ExamType {
  code: 'CIA1' | 'CIA2' | 'MODEL'
  name: string
  maxMarks: number
  passingMarks: number
  description: string
}

interface COMark {
  courseOutcome: 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5'
  maxMarks: number
  obtainedMarks: number
  description: string
}

interface COWiseEntry {
  student: string
  coMarks: COMark[]
  totalMarks: number
  percentage: number
  grade: string
}

interface QuestionMark {
  questionNumber: number
  unit: number
  maxMarks: number
  obtainedMarks: number
  questionType: '2mark' | '16mark'
  section?: 'A' | 'B' | 'C' | 'D' | 'E'
  courseOutcome?: 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5'
}

interface QuestionWiseEntry {
  student: string
  questions: QuestionMark[]
  totalMarks: number
  percentage: number
  grade: string
}

interface MarkEntry {
  _id?: string
  student: string
  subject: string
  examType: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  remarks?: string
  enteredBy: string
  enteredAt: string
  questionWiseMarks?: QuestionMark[] // New field for detailed marks
}

// CIA CO Structure - Direct CO-wise Assessment
const getCIACOStructure = (examType: string) => {
  if (examType === 'CIA1') {
    return {
      courseOutcomes: [
        { 
          courseOutcome: 'CO1' as const, 
          maxMarks: 30, 
          description: 'Remember and understand fundamental concepts'
        },
        { 
          courseOutcome: 'CO2' as const, 
          maxMarks: 30, 
          description: 'Apply theoretical knowledge to solve problems'
        }
      ],
      totalMarks: 60,
      description: 'CIA 1 - Course Outcomes 1 & 2 (30 marks each)'
    }
  } else if (examType === 'CIA2') {
    return {
      courseOutcomes: [
        { 
          courseOutcome: 'CO3' as const, 
          maxMarks: 30, 
          description: 'Analyze and evaluate complex scenarios'
        },
        { 
          courseOutcome: 'CO4' as const, 
          maxMarks: 30, 
          description: 'Synthesize solutions for real-world applications'
        }
      ],
      totalMarks: 60,
      description: 'CIA 2 - Course Outcomes 3 & 4 (30 marks each)'
    }
  } else {
    // Model exam - all 5 COs
    return {
      courseOutcomes: [
        { 
          courseOutcome: 'CO1' as const, 
          maxMarks: 20, 
          description: 'Remember and understand fundamental concepts'
        },
        { 
          courseOutcome: 'CO2' as const, 
          maxMarks: 20, 
          description: 'Apply theoretical knowledge to solve problems'
        },
        { 
          courseOutcome: 'CO3' as const, 
          maxMarks: 20, 
          description: 'Analyze and evaluate complex scenarios'
        },
        { 
          courseOutcome: 'CO4' as const, 
          maxMarks: 20, 
          description: 'Synthesize solutions for real-world applications'
        },
        { 
          courseOutcome: 'CO5' as const, 
          maxMarks: 20, 
          description: 'Evaluate and create innovative approaches'
        }
      ],
      totalMarks: 100,
      description: 'Model Exam - All 5 Course Outcomes (20 marks each)'
    }
  }
}

// CIA Question Structure with proper CO mapping
const getQuestionStructure = (examType: string) => {
  if (examType === 'CIA1') {
    // CIA1: CO1, CO2 focus - Units 1 & 2
    return {
      twoMarkQuestions: [
        { questionNumber: 1, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 2, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 3, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 4, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
        { questionNumber: 5, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
        { questionNumber: 6, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
      ],
      sixteenMarkQuestions: [
        { questionNumber: 7, unit: 1, maxMarks: 16, questionType: '16mark' as const, section: 'A' as const, courseOutcome: 'CO1' },
        { questionNumber: 8, unit: 2, maxMarks: 16, questionType: '16mark' as const, section: 'B' as const, courseOutcome: 'CO2' },
        { questionNumber: 9, unit: 0, maxMarks: 16, questionType: '16mark' as const, section: 'C' as const, courseOutcome: 'CO1' }, // Choice between units
      ],
      description: 'CIA 1 - CO1 (Remember & Understand), CO2 (Apply Knowledge)'
    }
  } else if (examType === 'CIA2') {
    // CIA2: CO3, CO4 focus - Units 3 & 4
    return {
      twoMarkQuestions: [
        { questionNumber: 1, unit: 3, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO3' },
        { questionNumber: 2, unit: 3, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO3' },
        { questionNumber: 3, unit: 3, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO3' },
        { questionNumber: 4, unit: 4, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO4' },
        { questionNumber: 5, unit: 4, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO4' },
        { questionNumber: 6, unit: 4, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO4' },
      ],
      sixteenMarkQuestions: [
        { questionNumber: 7, unit: 3, maxMarks: 16, questionType: '16mark' as const, section: 'A' as const, courseOutcome: 'CO3' },
        { questionNumber: 8, unit: 4, maxMarks: 16, questionType: '16mark' as const, section: 'B' as const, courseOutcome: 'CO4' },
        { questionNumber: 9, unit: 0, maxMarks: 16, questionType: '16mark' as const, section: 'C' as const, courseOutcome: 'CO3' }, // Choice between units
      ],
      description: 'CIA 2 - CO3 (Analyze & Evaluate), CO4 (Synthesize Solutions)'
    }
  } else if (examType === 'MODEL') {
    // Model exam: All 5 sections - Units 1-5 (100 marks total)
    return {
      twoMarkQuestions: [
        { questionNumber: 1, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 2, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 3, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
        { questionNumber: 4, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
        { questionNumber: 5, unit: 3, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO3' },
        { questionNumber: 6, unit: 3, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO3' },
        { questionNumber: 7, unit: 4, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO4' },
        { questionNumber: 8, unit: 4, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO4' },
        { questionNumber: 9, unit: 5, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO5' },
        { questionNumber: 10, unit: 5, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO5' },
      ],
      sixteenMarkQuestions: [
        { questionNumber: 11, unit: 1, maxMarks: 16, questionType: '16mark' as const, section: 'A' as const, courseOutcome: 'CO1' },
        { questionNumber: 12, unit: 2, maxMarks: 16, questionType: '16mark' as const, section: 'B' as const, courseOutcome: 'CO2' },
        { questionNumber: 13, unit: 3, maxMarks: 16, questionType: '16mark' as const, section: 'C' as const, courseOutcome: 'CO3' },
        { questionNumber: 14, unit: 4, maxMarks: 16, questionType: '16mark' as const, section: 'D' as const, courseOutcome: 'CO4' },
        { questionNumber: 15, unit: 5, maxMarks: 16, questionType: '16mark' as const, section: 'E' as const, courseOutcome: 'CO5' },
      ],
      description: 'Model Exam - All 5 Sections (A→U1, B→U2, C→U3, D→U4, E→U5) - 100 marks'
    }
  } else {
    // Default structure for other exams
    return {
      twoMarkQuestions: [
        { questionNumber: 1, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 2, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 3, unit: 1, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO1' },
        { questionNumber: 4, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
        { questionNumber: 5, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
        { questionNumber: 6, unit: 2, maxMarks: 2, questionType: '2mark' as const, courseOutcome: 'CO2' },
      ],
      sixteenMarkQuestions: [
        { questionNumber: 7, unit: 1, maxMarks: 16, questionType: '16mark' as const, section: 'A' as const, courseOutcome: 'CO1' },
        { questionNumber: 8, unit: 2, maxMarks: 16, questionType: '16mark' as const, section: 'B' as const, courseOutcome: 'CO2' },
        { questionNumber: 9, unit: 0, maxMarks: 16, questionType: '16mark' as const, section: 'C' as const, courseOutcome: 'CO1' },
      ],
      description: 'Standard Question Structure'
    }
  }
}

const EXAM_TYPES: ExamType[] = [
  {
    code: 'CIA1',
    name: 'CIA - 1',
    maxMarks: 60,
    passingMarks: 24,
    description: 'Continuous Internal Assessment 1 (Question-wise Entry - CO1, CO2)'
  },
  {
    code: 'CIA2',
    name: 'CIA - 2', 
    maxMarks: 60,
    passingMarks: 24,
    description: 'Continuous Internal Assessment 2 (Question-wise Entry - CO3, CO4)'
  },
  {
    code: 'MODEL',
    name: 'Model Exam',
    maxMarks: 100,
    passingMarks: 40,
    description: 'Model Examination (Question-wise Entry - All 5 COs)'
  }
]

const SUBJECT_TYPES = [
  'All Types',
  'Core',
  'Elective', 
  'Open Elective',
  'TCPL',
  'TCPR',
  'Problem Elective'
]

const calculateGrade = (percentage: number): string => {
  if (percentage >= 90) return 'O'
  if (percentage >= 80) return 'A+'
  if (percentage >= 70) return 'A'
  if (percentage >= 60) return 'B+'
  if (percentage >= 50) return 'B'
  if (percentage >= 40) return 'C'
  return 'F'
}

interface StudentMarkEntryProps {
  preSelectedSubject?: Subject
  preSelectedStudents?: Student[]
}

export default function StudentMarkEntry({ preSelectedSubject, preSelectedStudents }: StudentMarkEntryProps = {}) {
  // State Management
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>(preSelectedStudents || [])
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([])
  
  // Filter States
  const [selectedSubject, setSelectedSubject] = useState<string>(preSelectedSubject?._id || '')
  const [selectedExamType, setSelectedExamType] = useState<string>('CIA1')
  const [refreshKey, setRefreshKey] = useState<number>(0) // Force refresh when exam type changes
  const [selectedSubjectType, setSelectedSubjectType] = useState<string>('All Types')
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // UI States
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showBulkEntry, setShowBulkEntry] = useState(false) // Available for all exam types
  const [marksStatus, setMarksStatus] = useState<'Draft' | 'Final' | 'Published'>('Draft')
  
  // Mark Entry States (legacy - now all exams use question-wise)
  const [editingMarks, setEditingMarks] = useState<{ [key: string]: string }>({})
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({})
  
  // CO-wise Mark States (enabled for CIA exams)
  const [coWiseMarks, setCOWiseMarks] = useState<{ [studentId: string]: COWiseEntry }>({})
  
  // Question-wise Mark States (legacy/backward compatibility)
  const [questionWiseMarks, setQuestionWiseMarks] = useState<{ [studentId: string]: QuestionWiseEntry }>({})
  const [selectedUnit9, setSelectedUnit9] = useState<{ [studentId: string]: number }>({})

  // Load data on component mount
  useEffect(() => {
    loadSubjects()
    // If pre-selected subject, also load its marks
    if (preSelectedSubject && preSelectedStudents) {
      loadExistingMarks()
    }
  }, [])

  // Load students when subject is selected (only subject dependency)
  useEffect(() => {
    if (selectedSubject) {
      loadStudents()
    }
  }, [selectedSubject])
  
  // Load data when subject or exam type changes
  useEffect(() => {
    if (!selectedSubject) {
      console.log('⚠️ No subject selected, skipping load')
      return
    }
    
    console.log(`🔄 LOADING saved data for ${selectedExamType}`)
    
    // Short delay to ensure state clearing is complete
    const loadTimer = setTimeout(() => {
      console.log(`🚀 LOADING ${selectedExamType} marks from database`)
      loadExistingMarks()
    }, 300) // Reduced delay - just enough for state clearing
    
    return () => {
      console.log(`🛑 Cleanup: Clearing load timer for ${selectedExamType}`)
      clearTimeout(loadTimer)
    }
  }, [selectedSubject, selectedExamType]) // Only depend on subject and exam type
  
  // Filter subjects by type
  const filteredSubjects = subjects.filter(subject => 
    selectedSubjectType === 'All Types' || subject.type === selectedSubjectType
  )

  // Filter students by search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get current exam type details
  const currentExamType = EXAM_TYPES.find(exam => exam.code === selectedExamType)
  const isCIAExam = selectedExamType === 'CIA1' || selectedExamType === 'CIA2' || selectedExamType === 'MODEL'
  
  // Initialize CO-wise marks for CIA exams when students are loaded
  useEffect(() => {
    if (isCIAExam && students.length > 0) {
      const initialCOWiseMarks: { [key: string]: COWiseEntry } = {}
      students.forEach(student => {
        if (!coWiseMarks[student._id]) {
          initialCOWiseMarks[student._id] = initializeCOWiseMarks(student._id)
        }
      })
      if (Object.keys(initialCOWiseMarks).length > 0) {
        setCOWiseMarks(prev => ({ ...prev, ...initialCOWiseMarks }))
      }
    }
  }, [students, isCIAExam])

  // Initialize CO-wise marks for a student  
  const initializeCOWiseMarks = (studentId: string): COWiseEntry => {
    // Don't return existing data if it might be from a different exam type
    // Always create fresh structure to ensure exam type consistency
    const coStructure = getCIACOStructure(selectedExamType)
    const coMarks: COMark[] = coStructure.courseOutcomes.map(co => ({
      courseOutcome: co.courseOutcome,
      maxMarks: co.maxMarks,
      obtainedMarks: 0,
      description: co.description
    }))
    
    return {
      student: studentId,
      coMarks,
      totalMarks: 0,
      percentage: 0,
      grade: 'F'
    }
  }

  // Initialize question-wise marks for a student
  const initializeQuestionWiseMarks = (studentId: string) => {
    // Always create fresh structure to prevent contamination between exam types
    console.log(`🆕 Initializing fresh question structure for ${studentId} in ${selectedExamType}`)
    const questionStructure = getQuestionStructure(selectedExamType)
    const questions: QuestionMark[] = []
    
    // Add 2-mark questions
    questionStructure.twoMarkQuestions.forEach(q => {
      questions.push({
        questionNumber: q.questionNumber,
        unit: q.unit,
        maxMarks: q.maxMarks,
        obtainedMarks: 0,
        questionType: q.questionType,
        courseOutcome: q.courseOutcome as "CO1" | "CO2" | "CO3" | "CO4" | "CO5"
      })
    })
    
    // Add 16-mark questions
    questionStructure.sixteenMarkQuestions.forEach(q => {
      questions.push({
        questionNumber: q.questionNumber,
        unit: q.unit,
        maxMarks: q.maxMarks,
        obtainedMarks: 0,
        questionType: q.questionType,
        section: q.section,
        courseOutcome: q.courseOutcome as "CO1" | "CO2" | "CO3" | "CO4" | "CO5"
      })
    })

    return {
      student: studentId,
      questions,
      totalMarks: 0,
      percentage: 0,
      grade: 'F'
    }
  }

  // Calculate total marks and grade from question-wise marks
  const calculateQuestionWiseTotal = (questions: QuestionMark[]) => {
    const total = questions.reduce((sum, q) => sum + q.obtainedMarks, 0)
    const percentage = (total / 60) * 100
    const grade = percentage >= 90 ? 'O' : percentage >= 80 ? 'A+' : 
                 percentage >= 70 ? 'A' : percentage >= 60 ? 'B+' : 
                 percentage >= 50 ? 'B' : percentage >= 40 ? 'C' : 'F'
    
    return { total, percentage, grade }
  }

  // Calculate total marks and grade from CO-wise marks
  const calculateCOWiseTotal = (coMarks: COMark[]) => {
    const total = coMarks.reduce((sum, co) => sum + co.obtainedMarks, 0)
    const maxTotal = coMarks.reduce((sum, co) => sum + co.maxMarks, 0)
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0
    const grade = percentage >= 90 ? 'O' : percentage >= 80 ? 'A+' : 
                 percentage >= 70 ? 'A' : percentage >= 60 ? 'B+' : 
                 percentage >= 50 ? 'B' : percentage >= 40 ? 'C' : 'F'
    
    return { total, percentage, grade }
  }

  // Update CO-wise marks
  const updateCOMark = (studentId: string, courseOutcome: 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5', marks: number) => {
    setCOWiseMarks(prev => {
      const studentMarks = prev[studentId] || initializeCOWiseMarks(studentId)
      const updatedCOMarks = studentMarks.coMarks.map(co => 
        co.courseOutcome === courseOutcome ? { ...co, obtainedMarks: marks } : co
      )
      
      const { total, percentage, grade } = calculateCOWiseTotal(updatedCOMarks)
      
      return {
        ...prev,
        [studentId]: {
          ...studentMarks,
          coMarks: updatedCOMarks,
          totalMarks: total,
          percentage,
          grade
        }
      }
    })
  }

  // Update question-wise marks (legacy)
  const updateQuestionMark = (studentId: string, questionNumber: number, marks: number) => {
    console.log(`✏️ Updating question ${questionNumber} for student ${studentId} in ${selectedExamType}: ${marks} marks`)
    setQuestionWiseMarks(prev => {
      const studentMarks = prev[studentId] || initializeQuestionWiseMarks(studentId)
      const updatedQuestions = studentMarks.questions.map(q => 
        q.questionNumber === questionNumber ? { ...q, obtainedMarks: marks } : q
      )
      
      const { total, percentage, grade } = calculateQuestionWiseTotal(updatedQuestions)
      
      return {
        ...prev,
        [studentId]: {
          ...studentMarks,
          questions: updatedQuestions,
          totalMarks: total,
          percentage,
          grade
        }
      }
    })
  }

  const loadSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current user to filter subjects by faculty assignment
      const currentUser = await apiService.getCurrentUser()
      if (!currentUser.success) {
        throw new Error('Failed to get user information')
      }
      
      const response = await apiService.getSubjects()
      if (response.success) {
        // Filter subjects assigned to current faculty member
        const facultySubjects = response.data.filter((subject: any) => {
          return subject.faculty && subject.faculty.some((f: any) => {
            const facultyId = f.user?._id || f.user
            return facultyId === currentUser.data.user._id
          })
        })
        
        setSubjects(facultySubjects)
        console.log(`✅ Loaded ${facultySubjects.length} subjects for faculty`)
      }
    } catch (err: any) {
      console.error('❌ Error loading subjects:', err)
      setError(err.message || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      setLoading(true)
      const subject = subjects.find(s => s._id === selectedSubject)
      if (!subject) {
        console.warn('⚠️ Subject not found')
        return
      }

      // Handle department being either object or string ID
      const departmentId = typeof subject.department === 'object' && subject.department?._id 
        ? subject.department._id 
        : subject.department

      if (!departmentId) {
        console.error('❌ Department ID not found for subject:', subject)
        setError('Subject department information is missing')
        return
      }

      // Get students by department, year, and section with higher limit to show all
      const timestamp = Date.now()
      console.log(`🔄 Loading students with timestamp: ${timestamp}`)
      
      const response = await apiService.getUsers({
        role: 'Student',
        department: departmentId,
        year: subject.year,
        section: subject.section,
        limit: 1000, // Higher limit to get all students
        _t: timestamp // Cache-busting
      })
      
      if (response.success) {
        const studentList = response.data || []
        setStudents(studentList)
        console.log(`✅ Loaded ${studentList.length} students for ${subject.name} (${subject.year}-${subject.section})`)
        console.log('📊 Students loaded:', studentList.map((s: Student) => `${s.name} (${s.rollNumber})`).slice(0, 5).join(', ') + (studentList.length > 5 ? '...' : ''))
      } else {
        console.warn('⚠️ Failed to load students:', response.message)
        setStudents([])
      }
    } catch (err: any) {
      console.error('❌ Error loading students:', err)
      setError(err.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const loadExistingMarks = async () => {
    try {
      // Verify state is clean before loading
      console.log(`🧹 Loading marks - Current state before load:`, {
        examType: selectedExamType,
        editingMarks: Object.keys(editingMarks).length,
        questionWiseMarks: Object.keys(questionWiseMarks).length,
        remarks: Object.keys(remarks).length
      })
      
      console.log(`🕐 Loading data for ${selectedExamType}`)
      
      const response = await apiService.getMarksBySubjectAndExam(
        selectedSubject, 
        selectedExamType,
        { academicYear: '2024-2025', semester: 'Odd' }
      )
      
      if (response.success) {
        const existingMarks = response.data || []
        console.log(`✅ Loaded ${existingMarks.length} existing marks for ${selectedExamType}`)
        console.log(`📥 RAW API DATA:`, existingMarks.map((mark: any) => ({
          studentId: mark.student._id || mark.student,
          examType: mark.examType,
          marks: mark.marksObtained,
          hasQuestionWise: !!mark.questionWiseMarks
        })))
        console.log(`📋 Exam type filter applied: ${selectedExamType}`)
        
        // Verify loaded marks are for correct exam type
        // STRICT FILTERING: Only process marks that match current exam type
        const validMarks = existingMarks.filter((mark: any) => {
          const isValid = mark.examType === selectedExamType
          if (!isValid) {
            console.warn(`❌ FILTERING OUT wrong exam type: ${mark.examType} (expected ${selectedExamType})`)
          }
          return isValid
        })
        
        console.log(`✅ Valid marks for ${selectedExamType}: ${validMarks.length}/${existingMarks.length}`)
        
        if (validMarks.length === 0) {
          console.log(`🆕 No valid marks found for ${selectedExamType}, keeping clean state`)
          return // Exit early with empty state
        }
        
        // Pre-fill editing state with existing marks
        const markData: { [key: string]: string } = {}
        const remarkData: { [key: string]: string } = {}
        const questionWiseData: { [key: string]: QuestionWiseEntry } = {}
        
        validMarks.forEach((mark: any) => {
          const studentId = mark.student._id || mark.student
          markData[studentId] = mark.marksObtained.toString()
          remarkData[studentId] = mark.remarks || ''
          
          console.log(`📝 Processing mark for student ${studentId}:`, {
            examType: mark.examType,
            marks: mark.marksObtained,
            hasQuestionWiseMarks: !!mark.questionWiseMarks,
            questionCount: mark.questionWiseMarks?.length || 0
          })
          
          // If exam uses question-wise entry and has question-wise marks, load them
          if (isCIAExam && mark.questionWiseMarks && Array.isArray(mark.questionWiseMarks) && mark.questionWiseMarks.length > 0) {
            console.log(`✅ Loading ${mark.questionWiseMarks.length} questions for student ${studentId}`)
            const { total, percentage, grade } = calculateQuestionWiseTotal(mark.questionWiseMarks)
            questionWiseData[studentId] = {
              student: studentId,
              questions: mark.questionWiseMarks,
              totalMarks: total,
              percentage,
              grade
            }
          } else if (isCIAExam && mark.marksObtained > 0) {
            // If marks exist but no question-wise breakdown, keep the total
            console.log(`⚠️ Mark exists (${mark.marksObtained}) but no question-wise data for student ${studentId}`)
            questionWiseData[studentId] = {
              student: studentId,
              questions: [],
              totalMarks: mark.marksObtained,
              percentage: (mark.marksObtained / (currentExamType?.maxMarks || 60)) * 100,
              grade: mark.grade || 'N/A'
            }
          }
        })
        
        setEditingMarks(markData)
        setRemarks(remarkData)
        if (isCIAExam) {
          setQuestionWiseMarks(questionWiseData)
          console.log('🔄 Updated questionWiseMarks state with:', Object.keys(questionWiseData).length, 'entries')
          console.log('📊 Question-wise data loaded for:', Object.keys(questionWiseData))
        }
      }
    } catch (err: any) {
      console.error('❌ Error loading existing marks:', err)
    }
  }

  const handleMarkChange = (studentId: string, value: string) => {
    const numValue = parseFloat(value)
    const maxMarks = currentExamType?.maxMarks || 100
    
    // Validate marks range
    if (numValue < 0 || numValue > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}`)
      return
    }
    
    setEditingMarks(prev => ({
      ...prev,
      [studentId]: value
    }))
    setError(null)
  }

  const handleRemarksChange = (studentId: string, value: string) => {
    setRemarks(prev => ({
      ...prev,
      [studentId]: value
    }))
  }

  const saveMarks = async (studentId: string) => {
    try {
      setSaving(true)
      setError(null)
      
      const marksObtained = parseFloat(editingMarks[studentId] || '0')
      const totalMarks = currentExamType?.maxMarks || 100
      
      const markEntry = {
        student: studentId,
        subject: selectedSubject,
        examType: selectedExamType,
        marksObtained,
        totalMarks,
        remarks: remarks[studentId] || '',
        academicYear: '2024-2025',
        semester: 'Odd'
      }

      const response = await apiService.enterStudentMarks(markEntry)
      
      if (response.success) {
        setSuccess(`Marks saved successfully for student`)
        
        // Clear editing state for this student
        const newEditingMarks = { ...editingMarks }
        delete newEditingMarks[studentId]
        setEditingMarks(newEditingMarks)
        
        // Reload existing marks
        loadExistingMarks()
      } else {
        throw new Error(response.message || 'Failed to save marks')
      }
      
    } catch (err: any) {
      console.error('❌ Error saving marks:', err)
      setError(err.message || 'Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  // Convert CO marks to question-wise format for backend compatibility
  const generateQuestionWiseFromCO = (coMarks: COMark[]) => {
    // Map CO marks to legacy question structure for backend processing
    const questions = []
    
    // Distribute CO marks across questions for backend compatibility
    // CO1 -> Q1-Q3 (2m each) + part of Sec-A
    // CO2 -> Q4-Q6 (2m each) + part of Sec-B  
    // CO3-CO5 -> distributed across Sec-A, Sec-B, Sec-C
    const co1 = coMarks.find(co => co.courseOutcome === 'CO1')?.obtainedMarks || 0
    const co2 = coMarks.find(co => co.courseOutcome === 'CO2')?.obtainedMarks || 0
    const co3 = coMarks.find(co => co.courseOutcome === 'CO3')?.obtainedMarks || 0
    const co4 = coMarks.find(co => co.courseOutcome === 'CO4')?.obtainedMarks || 0
    const co5 = coMarks.find(co => co.courseOutcome === 'CO5')?.obtainedMarks || 0
    
    // Approximate distribution for backend compatibility
    questions.push(
      { questionNumber: 1, unit: 1, maxMarks: 2, obtainedMarks: Math.min(2, co1 * 0.1), questionType: '2mark' },
      { questionNumber: 2, unit: 1, maxMarks: 2, obtainedMarks: Math.min(2, co1 * 0.1), questionType: '2mark' },
      { questionNumber: 3, unit: 1, maxMarks: 2, obtainedMarks: Math.min(2, co1 * 0.1), questionType: '2mark' },
      { questionNumber: 4, unit: 2, maxMarks: 2, obtainedMarks: Math.min(2, co2 * 0.1), questionType: '2mark' },
      { questionNumber: 5, unit: 2, maxMarks: 2, obtainedMarks: Math.min(2, co2 * 0.1), questionType: '2mark' },
      { questionNumber: 6, unit: 2, maxMarks: 2, obtainedMarks: Math.min(2, co2 * 0.1), questionType: '2mark' },
      { questionNumber: 7, unit: 1, maxMarks: 16, obtainedMarks: (co1 + co3 + co5) * 0.27, questionType: '16mark', section: 'A' },
      { questionNumber: 8, unit: 2, maxMarks: 16, obtainedMarks: (co2 + co4) * 0.4, questionType: '16mark', section: 'B' },
      { questionNumber: 9, unit: 1, maxMarks: 16, obtainedMarks: (co3 + co4 + co5) * 0.27, questionType: '16mark', section: 'C' }
    )
    
    return questions
  }

  const saveCOWiseMarks = async (studentId: string) => {
    try {
      setSaving(true)
      setError(null)
      
      const studentCOMarks = coWiseMarks[studentId] || initializeCOWiseMarks(studentId)
      
      const markEntry = {
        student: studentId,
        subject: selectedSubject,
        examType: selectedExamType,
        marksObtained: studentCOMarks.totalMarks,
        totalMarks: currentExamType?.maxMarks || 100,
        remarks: remarks[studentId] || '',
        academicYear: '2024-2025',
        semester: 'Odd',
        coWiseMarks: studentCOMarks.coMarks, // Include CO-wise breakdown
        questionWiseMarks: generateQuestionWiseFromCO(studentCOMarks.coMarks) // Backend compatibility
      }

      const response = await apiService.enterStudentMarks(markEntry)
      
      if (response.success) {
        setSuccess(`CO-wise marks saved successfully for student`)
        
        // Update editing state to reflect saved marks
        setEditingMarks(prev => ({
          ...prev,
          [studentId]: studentCOMarks.totalMarks.toString()
        }))
        
        // Reload existing marks
        loadExistingMarks()
      } else {
        throw new Error(response.message || 'Failed to save marks')
      }
      
    } catch (err: any) {
      console.error('❌ Error saving CO-wise marks:', err)
      setError(err.message || 'Failed to save CO-wise marks')
    } finally {
      setSaving(false)
    }
  }

  const saveQuestionWiseMarks = async (studentId: string) => {
    try {
      setSaving(true)
      setError(null)
      
      const studentMarks = questionWiseMarks[studentId] || initializeQuestionWiseMarks(studentId)
      
      // Validate exam type to ensure proper categorization
      if (!selectedExamType || !['CIA1', 'CIA2', 'MODEL'].includes(selectedExamType)) {
        throw new Error(`Invalid exam type: ${selectedExamType}`)
      }
      
      const markEntry = {
        student: studentId,
        subject: selectedSubject,
        examType: selectedExamType, // Explicitly set to ensure CIA1/CIA2 separation
        marksObtained: studentMarks.totalMarks,
        totalMarks: currentExamType?.maxMarks || (selectedExamType === 'MODEL' ? 100 : 60),
        remarks: remarks[studentId] || '',
        academicYear: '2024-2025',
        semester: 'Odd',
        questionWiseMarks: studentMarks.questions // Include question-wise breakdown
      }
      
      console.log(`💾 SAVING MARKS - Full payload:`, {
        student: studentId,
        subject: selectedSubject,
        examType: selectedExamType,
        totalMarks: studentMarks.totalMarks,
        questionWiseCount: studentMarks.questions.length
      })

      const response = await apiService.enterStudentMarks(markEntry)
      console.log(`📤 SAVE RESPONSE:`, response)
      
      if (response.success) {
        setSuccess(`Question-wise marks saved successfully for student (${studentMarks.totalMarks}/${currentExamType?.maxMarks} marks)`)
        
        // Update editing state to reflect saved marks
        setEditingMarks(prev => ({
          ...prev,
          [studentId]: studentMarks.totalMarks.toString()
        }))
        
        console.log(`✅ SAVE SUCCESS: Marks preserved in UI for ${selectedExamType}`)
        console.log(`📊 Current questionWiseMarks after save:`, Object.keys(questionWiseMarks).length, 'students')
        
        // Reload marks from backend to ensure they persist
        await loadExistingMarks()
      } else {
        throw new Error(response.message || 'Failed to save marks')
      }
      
    } catch (err: any) {
      console.error('❌ Error saving question-wise marks:', err)
      setError(err.message || 'Failed to save question-wise marks')
    } finally {
      setSaving(false)
    }
  }

  const saveBulkMarks = async () => {
    try {
      setSaving(true)
      setError(null)
      
      let marksData: any[]
      
      // All exams now use question-wise marks (CIA1, CIA2, MODEL)
      marksData = Object.entries(questionWiseMarks).map(([studentId, studentMarks]) => ({
        student: studentId,
        examType: selectedExamType, // Ensure proper exam type categorization
        marksObtained: studentMarks.totalMarks,
        remarks: remarks[studentId] || '',
        questionWiseMarks: studentMarks.questions,
        status: 'Draft' // Save as Draft by default
      })).filter(entry => entry.marksObtained > 0)
      
      console.log(`💾 Bulk saving ${marksData.length} students for ${selectedExamType}:`, 
        marksData.map(m => ({ student: m.student, marks: m.marksObtained, examType: m.examType })))

      if (marksData.length === 0) {
        setError('No valid marks to save')
        return
      }

      const bulkData = {
        subject: selectedSubject,
        examType: selectedExamType,
        marksData,
        academicYear: '2024-2025',
        semester: 'Odd'
      }

      const response = await apiService.bulkEnterStudentMarks(bulkData)
      
      if (response.success) {
        const { successful, errors } = response.data
        setSuccess(`Draft marks saved: ${successful.length} successful, ${errors.length} errors`)
        
        if (errors.length > 0) {
          console.warn('Some marks failed to save:', errors)
        }
        
        console.log(`✅ BULK SAVE SUCCESS: Preserving ${Object.keys(questionWiseMarks).length} student marks in UI`)
        setMarksStatus('Draft')
        
        // Reload marks from backend to ensure persistence
        await loadExistingMarks()
        
        // DON'T clear the state - keep marks visible after save
        // The questionWiseMarks should remain in the UI to show what was saved
      } else {
        throw new Error(response.message || 'Failed to save bulk marks')
      }
      
    } catch (err: any) {
      console.error('❌ Error saving bulk marks:', err)
      setError(err.message || 'Failed to save bulk marks')
    } finally {
      setSaving(false)
    }
  }

  const finalizeMarks = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Get all students with entered marks
      const studentIds = Object.keys(questionWiseMarks).filter(id => questionWiseMarks[id].totalMarks > 0)
      
      if (studentIds.length === 0) {
        setError('No marks to finalize')
        return
      }
      
      // Update status to Final for all marks
      const promises = studentIds.map(async (studentId) => {
        const response = await apiService.getMarksBySubjectAndExam(
          selectedSubject,
          selectedExamType,
          { academicYear: '2024-2025', semester: 'Odd' }
        )
        
        if (response.success && response.data) {
          const studentMark = response.data.find((m: any) => m.student._id === studentId || m.student === studentId)
          if (studentMark) {
            return apiService.updateMarkStatus(studentMark._id, 'Final')
          }
        }
      })
      
      await Promise.all(promises)
      
      setSuccess(`Marks finalized for ${studentIds.length} students. Ready to publish.`)
      setMarksStatus('Final')
      
    } catch (err: any) {
      console.error('❌ Error finalizing marks:', err)
      setError(err.message || 'Failed to finalize marks')
    } finally {
      setSaving(false)
    }
  }

  const publishMarks = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Get all students with entered marks
      const studentIds = Object.keys(questionWiseMarks).filter(id => questionWiseMarks[id].totalMarks > 0)
      
      if (studentIds.length === 0) {
        setError('No marks to publish')
        return
      }
      
      // Update status to Published for all marks
      const promises = studentIds.map(async (studentId) => {
        const response = await apiService.getMarksBySubjectAndExam(
          selectedSubject,
          selectedExamType,
          { academicYear: '2024-2025', semester: 'Odd' }
        )
        
        if (response.success && response.data) {
          const studentMark = response.data.find((m: any) => m.student._id === studentId || m.student === studentId)
          if (studentMark) {
            return apiService.updateMarkStatus(studentMark._id, 'Published')
          }
        }
      })
      
      await Promise.all(promises)
      
      setSuccess(`Marks published for ${studentIds.length} students. Now visible to students in analytics.`)
      setMarksStatus('Published')
      
    } catch (err: any) {
      console.error('❌ Error publishing marks:', err)
      setError(err.message || 'Failed to publish marks')
    } finally {
      setSaving(false)
    }
  }

  const exportMarks = async () => {
    try {
      // Generate marks report for export
      const reportData = {
        subject: selectedSubject,
        examType: selectedExamType,
        marks: editingMarks,
        students: filteredStudents.map(s => ({
          id: s._id,
          name: s.name,
          rollNumber: s.rollNumber,
          marks: editingMarks[s._id] || 'Not entered'
        })),
        timestamp: new Date().toISOString()
      }
      
      const filename = `marks_${selectedExamType}_${new Date().toISOString().split('T')[0]}`
      const success = exportComplexDataToExcel(reportData, filename)
      
      if (success) {
        setSuccess('Marks exported successfully to Excel!')
      } else {
        setError('Failed to export marks')
      }
    } catch (err: any) {
      setError('Failed to export marks')
    }
  }

  const getMarkStatus = (studentId: string) => {
    const marks = editingMarks[studentId]
    if (!marks || marks === '') return 'not-entered'
    
    const numMarks = parseFloat(marks)
    const passingMarks = currentExamType?.passingMarks || 40
    
    return numMarks >= passingMarks ? 'pass' : 'fail'
  }

  return (
    <div key={`mark-entry-${selectedExamType}`} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <FiEdit3 size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Student Mark Entry</h1>
                <p className="text-blue-100 mt-2">
                  Enter question-wise marks for CIA-1, CIA-2, and Model examinations
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Current Academic Year</div>
              <div className="text-xl font-semibold">2024-2025</div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-green-900">Success</h3>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Student Count Info */}
        {students.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                📊 <strong>{students.length}</strong> students loaded for mark entry
                {filteredStudents.length < students.length && (
                  <span className="ml-2 text-blue-600">(🔍 {filteredStudents.length} filtered)</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {selectedSubject && subjects.find(s => s._id === selectedSubject) && (
                  <>📚 {subjects.find(s => s._id === selectedSubject)?.name}</>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters & Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <FiFilter className="text-indigo-600" />
            Filters & Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Subject Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject Type
              </label>
              <select
                value={selectedSubjectType}
                onChange={(e) => setSelectedSubjectType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {SUBJECT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code}) - {subject.type}
                  </option>
                ))}
              </select>
              {selectedSubject && (
                <p className="text-xs text-gray-500 mt-1">
                  Credits: {subjects.find(s => s._id === selectedSubject)?.credits || 'N/A'}
                </p>
              )}
            </div>

            {/* Exam Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Exam Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedExamType}
                onChange={(e) => {
                  const newExamType = e.target.value
                  console.log(`⚙️ SWITCHING: ${selectedExamType} → ${newExamType}`)
                  
                  // Clear UI state but don't force unnecessary refresh
                  setEditingMarks({})
                  setQuestionWiseMarks({})
                  setCOWiseMarks({})
                  setRemarks({})
                  setSelectedUnit9({})
                  setError(null)
                  setSuccess(null)
                  
                  console.log(`🧹 STATE CLEARED for ${newExamType}`)
                  
                  // Set new exam type - useEffect will handle loading
                  setSelectedExamType(newExamType)
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {EXAM_TYPES.map(exam => (
                  <option key={exam.code} value={exam.code}>
                    {exam.name} ({exam.maxMarks} marks)
                  </option>
                ))}
              </select>
              {currentExamType && (
                <p className="text-xs text-gray-500 mt-1">
                  Passing: {currentExamType.passingMarks} marks
                </p>
              )}
            </div>

            {/* Search Students */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Students
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Name or Roll Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => {
                    console.log('🔄 Manual student refresh triggered')
                    loadStudents()
                  }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  disabled={!selectedSubject}
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Exam Type Info & Question-wise Toggle */}
          {currentExamType && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <h3 className="font-semibold text-indigo-900 mb-2">{currentExamType.name} Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-indigo-700 font-medium">Maximum Marks:</span>
                    <span className="ml-2 text-indigo-900">{currentExamType.maxMarks}</span>
                  </div>
                  <div>
                    <span className="text-indigo-700 font-medium">Passing Marks:</span>
                    <span className="ml-2 text-indigo-900">{currentExamType.passingMarks}</span>
                  </div>
                  <div>
                    <span className="text-indigo-700 font-medium">Description:</span>
                    <span className="ml-2 text-indigo-900">{currentExamType.description}</span>
                  </div>
                </div>
              </div>
              
              {/* Question-wise Entry Info for CIA and Model */}
              {isCIAExam && (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">{selectedExamType === 'MODEL' ? 'Model Exam Question-wise Entry' : 'Question-wise Mark Entry with CO Mapping'}</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      {selectedExamType === 'CIA1' ? 'CIA 1 covers Units 1-2 with focus on CO1 (Remember/Understand) and CO2 (Apply)' :
                       selectedExamType === 'CIA2' ? 'CIA 2 covers Units 3-4 with focus on CO3 (Analyze/Evaluate) and CO4 (Synthesize)' :
                       selectedExamType === 'MODEL' ? 'Model Exam covers all 5 units with comprehensive assessment of all Course Outcomes' :
                       'Question-wise entry for precise CO performance tracking'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-100 rounded border">
                    <h5 className="font-medium text-blue-900 mb-2">
                      {selectedExamType === 'CIA1' ? 'CIA 1 Question Structure (60 marks)' :
                       selectedExamType === 'CIA2' ? 'CIA 2 Question Structure (60 marks)' :
                       selectedExamType === 'MODEL' ? 'Model Exam Question Structure (100 marks)' :
                       'Question Structure'}
                    </h5>
                    <div className="text-sm text-blue-800 space-y-1">
                      {selectedExamType === 'CIA1' && (
                        <>
                          <p><strong>2-Mark Questions (12 marks):</strong></p>
                          <p className="ml-4">• Q1-Q3: Unit 1 (CO1 - Remember/Understand) - 2 marks each</p>
                          <p className="ml-4">• Q4-Q6: Unit 2 (CO2 - Apply Knowledge) - 2 marks each</p>
                          <p><strong>16-Mark Questions (48 marks):</strong></p>
                          <p className="ml-4">• Section A: Unit 1 (CO1) - 16 marks</p>
                          <p className="ml-4">• Section B: Unit 2 (CO2) - 16 marks</p>
                          <p className="ml-4">• Section C: Choice between Unit 1 or Unit 2 - 16 marks</p>
                        </>
                      )}
                      {selectedExamType === 'CIA2' && (
                        <>
                          <p><strong>2-Mark Questions (12 marks):</strong></p>
                          <p className="ml-4">• Q1-Q3: Unit 3 (CO3 - Analyze/Evaluate) - 2 marks each</p>
                          <p className="ml-4">• Q4-Q6: Unit 4 (CO4 - Synthesize Solutions) - 2 marks each</p>
                          <p><strong>16-Mark Questions (48 marks):</strong></p>
                          <p className="ml-4">• Section A: Unit 3 (CO3) - 16 marks</p>
                          <p className="ml-4">• Section B: Unit 4 (CO4) - 16 marks</p>
                          <p className="ml-4">• Section C: Choice between Unit 3 or Unit 4 - 16 marks</p>
                        </>
                      )}
                      {selectedExamType === 'MODEL' && (
                        <>
                          <p><strong>2-Mark Questions (20 marks):</strong></p>
                          <p className="ml-4">• Q1-Q2: Unit 1 (CO1) - 4 marks</p>
                          <p className="ml-4">• Q3-Q4: Unit 2 (CO2) - 4 marks</p>
                          <p className="ml-4">• Q5-Q6: Unit 3 (CO3) - 4 marks</p>
                          <p className="ml-4">• Q7-Q8: Unit 4 (CO4) - 4 marks</p>
                          <p className="ml-4">• Q9-Q10: Unit 5 (CO5) - 4 marks</p>
                          <p><strong>16-Mark Questions (80 marks):</strong></p>
                          <p className="ml-4">• Section A: Unit 1 (CO1) - 16 marks</p>
                          <p className="ml-4">• Section B: Unit 2 (CO2) - 16 marks</p>
                          <p className="ml-4">• Section C: Unit 3 (CO3) - 16 marks</p>
                          <p className="ml-4">• Section D: Unit 4 (CO4) - 16 marks</p>
                          <p className="ml-4">• Section E: Unit 5 (CO5) - 16 marks</p>
                        </>
                      )}
                      <p className="text-blue-600 font-medium mt-2">
                        {selectedExamType === 'MODEL' ? 'Complete 5-section structure: A→U1, B→U2, C→U3, D→U4, E→U5 (20 marks each)' : 'Questions are mapped to specific COs for automatic performance analysis'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {selectedSubject && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            {/* Status Badge */}
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Marks Status:</span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                marksStatus === 'Draft' ? 'bg-blue-100 text-blue-700' :
                marksStatus === 'Final' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {marksStatus === 'Draft' ? '📝 Draft - Not visible to students' :
                 marksStatus === 'Final' ? '✅ Finalized - Ready to publish' :
                 '🎉 Published - Visible to students'}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowBulkEntry(!showBulkEntry)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FiPlus size={20} />
                  {showBulkEntry ? 'Individual Save' : 'Bulk Save All'}
                </button>
                
                <button
                  onClick={saveBulkMarks}
                  disabled={saving || Object.keys(questionWiseMarks).length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave size={20} />
                  {saving ? 'Saving...' : 'Save All (Draft)'}
                </button>

                <button
                  onClick={finalizeMarks}
                  disabled={saving || marksStatus !== 'Draft'}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiCheckCircle size={20} />
                  {marksStatus === 'Final' ? 'Finalized' : 'Finalize Marks'}
                </button>

                <button
                  onClick={publishMarks}
                  disabled={saving || marksStatus !== 'Final'}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiEye size={20} />
                  {marksStatus === 'Published' ? 'Published' : 'Publish to Students'}
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={exportMarks}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiDownload size={20} />
                  Export Report
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiUsers className="text-blue-600" size={24} />
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{filteredStudents.length}</div>
                    <div className="text-sm text-blue-600">Total Students</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-green-600" size={24} />
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {Object.values(questionWiseMarks).filter(marks => 
                        marks.totalMarks >= (currentExamType?.passingMarks || 24)
                      ).length}
                    </div>
                    <div className="text-sm text-green-600">Passing</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiAlertTriangle className="text-red-600" size={24} />
                  <div>
                    <div className="text-2xl font-bold text-red-900">
                      {isCIAExam ? 
                        Object.values(questionWiseMarks).filter(marks => 
                          marks.totalMarks > 0 && marks.totalMarks < (currentExamType?.passingMarks || 24)
                        ).length :
                        Object.values(editingMarks).filter(mark => {
                          const num = parseFloat(mark)
                          return !isNaN(num) && num < (currentExamType?.passingMarks || 40)
                        }).length
                      }
                    </div>
                    <div className="text-sm text-red-600">Failing</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiEdit3 className="text-yellow-600" size={24} />
                  <div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {Object.keys(questionWiseMarks).length}
                    </div>
                    <div className="text-sm text-yellow-600">Question-wise Entry</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Mark Entry Table */}
        {selectedSubject && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gray-50 border-b">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <FiUsers className="text-indigo-600" />
                Student Mark Entry - {subjects.find(s => s._id === selectedSubject)?.name} ({currentExamType?.name})
              </h3>
              <p className="text-gray-600 mt-1">
                Enter marks out of {currentExamType?.maxMarks} (Passing: {currentExamType?.passingMarks})
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student Details
                    </th>
                    {isCIAExam ? (
                      <>
                        {/* Question-wise headers for CIA - Dynamic based on exam type */}
                        {(() => {
                          const questionStructure = getQuestionStructure(selectedExamType)
                          const headers: JSX.Element[] = []
                          
                          // 2-mark question headers
                          questionStructure.twoMarkQuestions.forEach(q => {
                            const unitLabel = selectedExamType === 'CIA1' ? 
                              (q.unit === 1 ? 'U1' : 'U2') : 
                              (q.unit === 3 ? 'U3' : 'U4')
                            const borderColor = q.courseOutcome === 'CO1' || q.courseOutcome === 'CO3' ? 
                              'border-blue-100' : 'border-green-100'
                            
                            headers.push(
                              <th key={q.questionNumber} className={`px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider ${q.questionNumber === 1 || q.questionNumber === 4 ? 'border-l-2' : ''} ${borderColor}`}>
                                Q{q.questionNumber} ({unitLabel})<br/><span className={q.courseOutcome === 'CO1' || q.courseOutcome === 'CO3' ? 'text-blue-600' : 'text-green-600'}>2m</span>
                              </th>
                            )
                          })
                          
                          // 16-mark question headers
                          questionStructure.sixteenMarkQuestions.forEach(q => {
                            const sectionLabel = q.section
                            const unitLabel = selectedExamType === 'CIA1' ? 
                              (q.unit === 1 ? 'U1' : q.unit === 2 ? 'U2' : 'Choice') : 
                              (q.unit === 3 ? 'U3' : q.unit === 4 ? 'U4' : 'Choice')
                            
                            headers.push(
                              <th key={q.questionNumber} className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l-2 border-purple-200">
                                Sec-{sectionLabel} ({unitLabel})<br/><span className="text-purple-600">16m</span>
                              </th>
                            )
                          })
                          
                          return headers
                        })()}
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l-2 border-gray-400">
                          Total (60)
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Remarks
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    ) : (
                      <>
                        {/* Total marks for Model exam */}
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Marks ({currentExamType?.maxMarks})
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Grade
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Remarks
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => {
                    const currentMarks = editingMarks[student._id] || ''
                    const numMarks = parseFloat(currentMarks)
                    const percentage = isNaN(numMarks) ? 0 : (numMarks / (currentExamType?.maxMarks || 100)) * 100
                    const grade = isNaN(numMarks) ? '-' : calculateGrade(percentage)
                    const status = getMarkStatus(student._id)

                    // Get or initialize CO-wise marks for this student
                    const studentCOMarks = coWiseMarks[student._id] || initializeCOWiseMarks(student._id)
                    
                    // Legacy: Get or initialize question-wise marks for this student
                    // Get student marks, always initialize fresh if not loaded from backend
                    const studentQuestionMarks = questionWiseMarks[student._id] || initializeQuestionWiseMarks(student._id)
                    
                    // Debug: Log what data is being displayed
                    if (student._id.endsWith('1') || student._id.endsWith('2')) { // Log for first couple students only
                      console.log(`🔍 Displaying marks for student ${student._id} in ${selectedExamType}:`, {
                        hasData: !!questionWiseMarks[student._id],
                        totalMarks: studentQuestionMarks.totalMarks,
                        questionsCount: studentQuestionMarks.questions.length
                      })
                    }

                    return (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {index + 1}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full">
                              <FiUser className="text-indigo-600" size={16} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.rollNumber}</div>
                              <div className="text-xs text-gray-400">{student.email}</div>
                            </div>
                          </div>
                        </td>

                        {isCIAExam ? (
                          <>
                            {/* Question-wise mark entry cells for CIA */}
                            {(() => {
                              const questionStructure = getQuestionStructure(selectedExamType)
                              const cells: JSX.Element[] = []
                              
                              // 2-mark questions
                              questionStructure.twoMarkQuestions.forEach(q => {
                                const questionMark = studentQuestionMarks.questions.find(qm => qm.questionNumber === q.questionNumber)
                                const borderClass = q.questionNumber === 1 || q.questionNumber === 4 ? 
                                  (q.courseOutcome === 'CO1' || q.courseOutcome === 'CO3' ? 'border-l-2 border-blue-100' : 'border-l-2 border-green-100') : ''
                                const inputBorderClass = q.courseOutcome === 'CO1' || q.courseOutcome === 'CO3' ? 
                                  'border-blue-200 focus:border-blue-400' : 'border-green-200 focus:border-green-400'
                                
                                cells.push(
                                  <td key={q.questionNumber} className={`px-3 py-4 text-center ${borderClass}`}>
                                    <input
                                      type="number"
                                      min="0"
                                      max="2"
                                      step="0.5"
                                      value={questionMark?.obtainedMarks || 0}
                                      onChange={(e) => updateQuestionMark(student._id, q.questionNumber, parseFloat(e.target.value) || 0)}
                                      className={`w-12 px-2 py-1 border rounded text-center text-sm ${inputBorderClass}`}
                                    />
                                  </td>
                                )
                              })
                              
                              // 16-mark questions
                              questionStructure.sixteenMarkQuestions.forEach(q => {
                                const questionMark = studentQuestionMarks.questions.find(qm => qm.questionNumber === q.questionNumber)
                                
                                cells.push(
                                  <td key={q.questionNumber} className="px-3 py-4 text-center border-l-2 border-purple-100">
                                    <div className="space-y-2">
                                      <input
                                        type="number"
                                        min="0"
                                        max="16"
                                        step="0.5"
                                        value={questionMark?.obtainedMarks || 0}
                                        onChange={(e) => updateQuestionMark(student._id, q.questionNumber, parseFloat(e.target.value) || 0)}
                                        className="w-16 px-2 py-1 border border-purple-200 rounded text-center text-sm focus:border-purple-400"
                                      />
                                      {q.section === 'C' && selectedExamType !== 'MODEL' && (
                                        <select
                                          value={selectedUnit9[student._id] || (selectedExamType === 'CIA2' ? 3 : 1)}
                                          onChange={(e) => setSelectedUnit9(prev => ({ ...prev, [student._id]: parseInt(e.target.value) }))}
                                          className="w-16 px-1 py-1 border border-purple-200 rounded text-xs"
                                        >
                                          {selectedExamType === 'CIA1' ? (
                                            <>
                                              <option value={1}>U1</option>
                                              <option value={2}>U2</option>
                                            </>
                                          ) : (
                                            <>
                                              <option value={3}>U3</option>
                                              <option value={4}>U4</option>
                                            </>
                                          )}
                                        </select>
                                      )}
                                      {q.section === 'C' && selectedExamType === 'MODEL' && (
                                        <span className="text-xs text-gray-600 px-1">U3</span>
                                      )}
                                    </div>
                                  </td>
                                )
                              })
                              
                              return cells
                            })()}
                            
                            {/* Total column */}
                            <td className="px-6 py-4 text-center border-l-2 border-gray-200">
                              <div className="font-bold text-lg text-gray-900">
                                {studentQuestionMarks.totalMarks}
                              </div>
                              <div className="text-xs text-gray-500">
                                {studentQuestionMarks.percentage.toFixed(1)}%
                              </div>
                              <div className={`text-xs font-medium mt-1 ${
                                studentQuestionMarks.grade === 'F' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {studentQuestionMarks.grade}
                              </div>
                            </td>
                            
                            {/* Remarks for CIA */}
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={remarks[student._id] || ''}
                                onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                placeholder="Add remarks..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </td>
                            
                            {/* Actions for CIA */}
                            <td className="px-6 py-4 text-center">
                              {!showBulkEntry && (
                                <button
                                  onClick={() => saveQuestionWiseMarks(student._id)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiSave size={14} />
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="number"
                                min="0"
                                max={currentExamType?.maxMarks || 100}
                                step="0.5"
                                value={currentMarks}
                                onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                placeholder="0"
                                className={`w-20 px-3 py-2 border-2 rounded-lg text-center font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                                  status === 'pass' ? 'border-green-300 bg-green-50' :
                                  status === 'fail' ? 'border-red-300 bg-red-50' :
                                  'border-gray-300'
                                }`}
                              />
                              {!isNaN(numMarks) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {percentage.toFixed(1)}%
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                grade === 'O' || grade === 'A+' ? 'bg-green-100 text-green-800' :
                                grade === 'A' || grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                                grade === 'B' || grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                grade === 'F' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {grade}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={remarks[student._id] || ''}
                                onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                placeholder="Add remarks..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            </td>

                            <td className="px-6 py-4 text-center">
                              {status === 'pass' && (
                                <FiCheckCircle className="text-green-600 mx-auto" size={20} />
                              )}
                              {status === 'fail' && (
                                <FiAlertTriangle className="text-red-600 mx-auto" size={20} />
                              )}
                              {status === 'not-entered' && (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded mx-auto"></div>
                              )}
                            </td>

                            <td className="px-6 py-4 text-center">
                              {!showBulkEntry && (
                                <button
                                  onClick={() => saveMarks(student._id)}
                                  disabled={saving || !currentMarks}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiSave size={14} />
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="p-12 text-center">
                <FiUsers className="mx-auto text-gray-400" size={64} />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">No Students Found</h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm ? 'No students match your search criteria.' : 'Please select a subject to view students.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Subject Info */}
        {selectedSubject && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <FiBook className="text-indigo-600" />
              Subject Information
            </h3>
            
            {(() => {
              const subject = subjects.find(s => s._id === selectedSubject)
              if (!subject) return null

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Subject Name</label>
                    <div className="text-lg font-medium text-gray-900">{subject.name}</div>
                    <div className="text-sm text-gray-500">Code: {subject.code}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Type & Credits</label>
                    <div className="text-lg font-medium text-gray-900">{subject.type}</div>
                    <div className="text-sm text-gray-500">{subject.credits} Credits</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Class Details</label>
                    <div className="text-lg font-medium text-gray-900">{subject.year}</div>
                    <div className="text-sm text-gray-500">Section {subject.section} - {subject.semester}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Department</label>
                    <div className="text-lg font-medium text-gray-900">
                      {typeof subject.department === 'object' ? subject.department.name : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {typeof subject.department === 'object' ? subject.department.code : ''}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}