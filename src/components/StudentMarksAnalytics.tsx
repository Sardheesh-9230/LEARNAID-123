'use client'

import { useState, useEffect } from 'react'
import { 
  FiBarChart, FiTrendingUp, FiUsers, FiBook, 
  FiTarget, FiAward, FiAlertTriangle, FiCheckCircle,
  FiDownload, FiFilter, FiRefreshCw, FiEye, FiCalendar
} from 'react-icons/fi'
import apiService from '../services/api'
import { exportComplexDataToExcel } from '../utils/excelExport'
import TaskNotificationSystem, { useTaskNotifications } from './TaskNotificationSystem'
import COAnalysis from './COAnalysis'

interface StudentMarkEntry {
  _id: string
  subject: {
    _id: string
    name: string
    code: string
    credits: number
    type: 'Core' | 'Elective' | 'Open Elective' | 'TCPL' | 'TCPR' | 'Problem Elective'
  }
  examType: 'CIA1' | 'CIA2' | 'MODEL'
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  remarks?: string
  enteredAt: string
  questionWiseMarks?: QuestionMark[]
}

interface QuestionMark {
  questionNumber: number
  unit: number
  maxMarks: number
  obtainedMarks: number
  questionType: '2mark' | '16mark'
  section?: 'A' | 'B' | 'C'
}

interface COPerformance {
  courseOutcome: string
  totalMarks: number
  obtainedMarks: number
  questionCount: number
  percentage: number
  attainment: 'Attained' | 'Not Attained'
  examTypes: string[]
}

interface COAnalysisResult {
  studentId: string
  studentName: string
  subjectId: string
  subjectName: string
  subjectCode: string
  academicYear: string
  analysisDate: string
  threshold: number
  coPerformance: COPerformance[]
  totalCOs: number
  attainedCOs: number
  notAttainedCOs: number
  overallPerformance: {
    averagePercentage: number
    attainmentRate: number
  }
  poorPerformanceCOs: {
    courseOutcome: string
    percentage: number
    gap: number
    totalMarks: number
    obtainedMarks: number
    questionCount: number
  }[]
  tasksAssigned: {
    courseOutcome: string
    status: string
    taskId?: string
    priority?: string
    dueDate?: string
    studyTime?: number
    message: string
  }[]
}

interface SubjectPerformance {
  subject: {
    _id: string
    name: string
    code: string
    credits: number
    type: string
  }
  cia1: StudentMarkEntry | null
  cia2: StudentMarkEntry | null
  model: StudentMarkEntry | null
  totalMarks: number
  totalPossible: number
  overallPercentage: number
  overallGrade: string
  creditPoints: number
  status: 'Completed' | 'Partial' | 'Not Started'
}

interface PerformanceAnalytics {
  currentGPA: number
  totalCredits: number
  completedSubjects: number
  totalSubjects: number
  passedSubjects: number
  failedSubjects: number
  averagePercentage: number
  gradeDistribution: { [grade: string]: number }
  semesterTrend: { semester: number; gpa: number }[]
}

interface StudentMarksAnalyticsProps {
  studentId?: string
}

export default function StudentMarksAnalytics({ studentId }: StudentMarksAnalyticsProps) {
  const [marks, setMarks] = useState<StudentMarkEntry[]>([])
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tasksAssigned, setTasksAssigned] = useState<number>(0)
  
  // Notification system
  const { notifications, removeNotification, addTaskAssignmentNotification, addSuccessNotification, addErrorNotification } = useTaskNotifications()
  
  // Filter states
  const [selectedSemester, setSelectedSemester] = useState<string>('current')
  const [selectedSubjectType, setSelectedSubjectType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analytics' | 'co-analysis'>('overview')

  useEffect(() => {
    loadStudentMarks()
  }, [studentId, selectedSemester])

  const loadStudentMarks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current student if not provided
      const currentUser = await apiService.getCurrentUser()
      if (!currentUser.success || !currentUser.data) {
        throw new Error('Failed to get user information or user data is incomplete')
      }

      const actualStudentId = studentId || currentUser.data._id

      // Load student marks
      const marksResponse = await apiService.makeRequest(
        `/student-analytics/student/${actualStudentId}?semester=${selectedSemester}&academicYear=2024-2025`
      )

      if (marksResponse.success) {
        const studentMarks = marksResponse.data || []
        setMarks(studentMarks)
        
        // Check if no marks found
        if (studentMarks.length === 0) {
          console.log('No marks found for student:', actualStudentId)
          setSubjectPerformance([])
          setAnalytics(null)
          return
        }
        
        // Process marks to create subject performance
        const subjectMap = new Map<string, SubjectPerformance>()
        
        studentMarks.forEach((mark: StudentMarkEntry) => {
          const subjectId = mark.subject._id
          
          if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
              subject: mark.subject,
              cia1: null,
              cia2: null,
              model: null,
              totalMarks: 0,
              totalPossible: 0,
              overallPercentage: 0,
              overallGrade: 'F',
              creditPoints: 0,
              status: 'Not Started'
            })
          }
          
          const performance = subjectMap.get(subjectId)!
          
          if (mark.examType === 'CIA1') {
            performance.cia1 = mark
          } else if (mark.examType === 'CIA2') {
            performance.cia2 = mark
          } else if (mark.examType === 'MODEL') {
            performance.model = mark
          }
        })
        
        // Calculate overall performance for each subject
        const processedPerformance = Array.from(subjectMap.values()).map(performance => {
          const cia1Marks = performance.cia1?.marksObtained || 0
          const cia2Marks = performance.cia2?.marksObtained || 0
          const modelMarks = performance.model?.marksObtained || 0
          
          const totalMarks = cia1Marks + cia2Marks + modelMarks
          const totalPossible = 60 + 60 + 100 // CIA1 + CIA2 + Model
          const overallPercentage = (totalMarks / totalPossible) * 100
          
          const overallGrade = overallPercentage >= 90 ? 'O' :
                              overallPercentage >= 80 ? 'A+' :
                              overallPercentage >= 70 ? 'A' :
                              overallPercentage >= 60 ? 'B+' :
                              overallPercentage >= 50 ? 'B' :
                              overallPercentage >= 40 ? 'C' : 'F'
          
          const gradePoints = overallGrade === 'O' ? 10 :
                             overallGrade === 'A+' ? 9 :
                             overallGrade === 'A' ? 8 :
                             overallGrade === 'B+' ? 7 :
                             overallGrade === 'B' ? 6 :
                             overallGrade === 'C' ? 5 : 0
                             
          const creditPoints = gradePoints * performance.subject.credits
          
          const status: 'Completed' | 'Partial' | 'Not Started' = (performance.cia1 && performance.cia2 && performance.model) ? 'Completed' :
                        (performance.cia1 || performance.cia2 || performance.model) ? 'Partial' : 'Not Started'
          
          return {
            ...performance,
            totalMarks,
            totalPossible,
            overallPercentage,
            overallGrade,
            creditPoints,
            status
          }
        })
        
        setSubjectPerformance(processedPerformance)
        
        // Calculate analytics
        const totalCredits = processedPerformance.reduce((sum, p) => sum + p.subject.credits, 0)
        const totalCreditPoints = processedPerformance.reduce((sum, p) => sum + p.creditPoints, 0)
        const currentGPA = totalCredits > 0 ? totalCreditPoints / totalCredits : 0
        
        const completedSubjects = processedPerformance.filter(p => p.status === 'Completed').length
        const passedSubjects = processedPerformance.filter(p => p.overallPercentage >= 40).length
        const failedSubjects = processedPerformance.filter(p => p.overallPercentage < 40 && p.status === 'Completed').length
        
        const averagePercentage = processedPerformance.length > 0 
          ? processedPerformance.reduce((sum, p) => sum + p.overallPercentage, 0) / processedPerformance.length 
          : 0
        
        const gradeDistribution: { [grade: string]: number } = {}
        processedPerformance.forEach(p => {
          gradeDistribution[p.overallGrade] = (gradeDistribution[p.overallGrade] || 0) + 1
        })
        
        setAnalytics({
          currentGPA: Math.round(currentGPA * 100) / 100,
          totalCredits,
          completedSubjects,
          totalSubjects: processedPerformance.length,
          passedSubjects,
          failedSubjects,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          gradeDistribution,
          semesterTrend: [
            { semester: 1, gpa: 3.2 },
            { semester: 2, gpa: 3.6 },
            { semester: 3, gpa: currentGPA }
          ]
        })
        
        // Check for poor performance and assign tasks automatically
        // Trigger CO-based improvement task assignment
        await checkAndAssignImprovementTasks(processedPerformance, actualStudentId)
      }
    } catch (err: any) {
      console.error('Error loading student marks:', err)
      setError(err.message || 'Failed to load marks')
      // Set empty state on error
      setMarks([])
      setSubjectPerformance([])
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  // Check and assign improvement tasks for poor CO performance
  const checkAndAssignImprovementTasks = async (performance: SubjectPerformance[], studentId: string) => {
    try {
      const poorPerformanceSubjects = performance.filter(p => p.overallPercentage < 50)
      
      if (poorPerformanceSubjects.length === 0) {
        console.log('✅ Student performance is satisfactory in all subjects')
        return
      }

      console.log(`⚠️ Found ${poorPerformanceSubjects.length} subjects with poor performance (<50%)`)
      
      let assignedCount = 0
      for (const subject of poorPerformanceSubjects) {
        const success = await assignImprovementTask(studentId, subject)
        if (success) {
          assignedCount++
          addTaskAssignmentNotification(
            subject.subject.name, 
            calculateStudyTime(subject.overallPercentage)
          )
        }
      }
      
      setTasksAssigned(assignedCount)
      if (assignedCount > 0) {
        addSuccessNotification(`${assignedCount} improvement task(s) assigned based on your performance analysis.`)
      }
    } catch (error) {
      console.error('Error checking performance and assigning tasks:', error)
    }
  }

  // Assign improvement task for a specific subject
  const assignImprovementTask = async (studentId: string, subjectPerformance: SubjectPerformance) => {
    try {
      const taskData = {
        studentId,
        subjectId: subjectPerformance.subject._id,
        subjectName: subjectPerformance.subject.name,
        currentPerformance: subjectPerformance.overallPercentage,
        taskType: 'CO_IMPROVEMENT',
        priority: subjectPerformance.overallPercentage < 30 ? 'HIGH' : 'MEDIUM',
        studyTimeMinutes: calculateStudyTime(subjectPerformance.overallPercentage),
        generatedMCQs: true,
        weakAreas: identifyWeakAreas(subjectPerformance),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        description: `Improvement task for ${subjectPerformance.subject.name} - Current performance: ${subjectPerformance.overallPercentage.toFixed(1)}%`
      }

      const response = await apiService.makeRequest('/improvement-tasks/assign-improvement', {
        method: 'POST',
        body: JSON.stringify(taskData)
      })

      if (response.success) {
        console.log(`✅ Assigned improvement task for ${subjectPerformance.subject.name}`)
        return true
      } else {
        console.log(`❌ Failed to assign task for ${subjectPerformance.subject.name}:`, response.message)
        return false
      }
    } catch (error) {
      console.error(`Error assigning task for ${subjectPerformance.subject.name}:`, error)
      return false
    }
  }

  // Calculate recommended study time based on performance
  const calculateStudyTime = (percentage: number): number => {
    if (percentage < 20) return 180 // 3 hours
    if (percentage < 30) return 150 // 2.5 hours
    if (percentage < 40) return 120 // 2 hours
    if (percentage < 50) return 90  // 1.5 hours
    return 60 // 1 hour
  }

  // Identify weak areas based on exam performance
  const identifyWeakAreas = (subjectPerformance: SubjectPerformance): string[] => {
    const weakAreas: string[] = []
    
    if (subjectPerformance.cia1 && subjectPerformance.cia1.percentage < 50) {
      weakAreas.push('CIA-1 Topics')
    }
    if (subjectPerformance.cia2 && subjectPerformance.cia2.percentage < 50) {
      weakAreas.push('CIA-2 Topics')  
    }
    if (subjectPerformance.model && subjectPerformance.model.percentage < 50) {
      weakAreas.push('Model Exam Topics')
    }
    
    if (weakAreas.length === 0) {
      weakAreas.push('General Understanding')
    }
    
    return weakAreas
  }

  const getQuestionWiseAnalysis = (marks: StudentMarkEntry) => {
    if (!marks.questionWiseMarks) return null
    
    const unitWisePerformance = {
      unit1: { total: 0, obtained: 0 },
      unit2: { total: 0, obtained: 0 }
    }
    
    marks.questionWiseMarks.forEach(q => {
      if (q.unit === 1) {
        unitWisePerformance.unit1.total += q.maxMarks
        unitWisePerformance.unit1.obtained += q.obtainedMarks
      } else if (q.unit === 2) {
        unitWisePerformance.unit2.total += q.maxMarks
        unitWisePerformance.unit2.obtained += q.obtainedMarks
      }
    })
    
    return unitWisePerformance
  }

  const exportReport = () => {
    const reportData = {
      studentAnalytics: analytics,
      subjectPerformance,
      detailedMarks: marks,
      generatedAt: new Date().toISOString()
    }
    
    const filename = `student_marks_report_${new Date().toISOString().split('T')[0]}`
    const success = exportComplexDataToExcel(reportData, filename)
    
    if (success) {
      alert('📊 Student marks report exported successfully to Excel!')
    } else {
      alert('❌ Failed to export report')
    }
  }

  const filteredPerformance = subjectPerformance.filter(p => 
    selectedSubjectType === 'all' || p.subject.type.toLowerCase() === selectedSubjectType.toLowerCase()
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900">Loading Your Marks...</h3>
        <p className="text-gray-500 mt-2">Fetching your academic performance data</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Marks</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadStudentMarks}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <TaskNotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <FiBarChart size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">My Academic Performance</h1>
              <p className="text-blue-100 mt-2">
                Track your marks, analyze progress, and monitor your academic journey
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">{analytics?.currentGPA.toFixed(2) || '0.00'}</div>
            <div className="text-blue-200 text-sm">Current GPA</div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analytics.completedSubjects}</div>
                <div className="text-sm text-gray-600">Completed Subjects</div>
                <div className="text-xs text-green-600 font-medium">
                  {analytics.totalSubjects > 0 ? ((analytics.completedSubjects / analytics.totalSubjects) * 100).toFixed(1) : 0}% Complete
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiTrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analytics.averagePercentage.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-xs text-blue-600 font-medium">
                  {analytics.passedSubjects} Passed
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiAward className="text-purple-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalCredits}</div>
                <div className="text-sm text-gray-600">Total Credits</div>
                <div className="text-xs text-purple-600 font-medium">
                  This Semester
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FiTarget className="text-orange-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(analytics.gradeDistribution).filter(grade => ['O', 'A+', 'A'].includes(grade)).reduce((sum, grade) => sum + analytics.gradeDistribution[grade], 0)}
                </div>
                <div className="text-sm text-gray-600">Top Grades</div>
                <div className="text-xs text-orange-600 font-medium">
                  O, A+, A Grades
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="detailed">Detailed Marks</option>
              <option value="analytics">Performance Analytics</option>
              <option value="co-analysis">CO Analysis</option>
            </select>

            <select
              value={selectedSubjectType}
              onChange={(e) => setSelectedSubjectType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subject Types</option>
              <option value="core">Core Subjects</option>
              <option value="elective">Elective Subjects</option>
              <option value="tcpl">TCPL</option>
              <option value="tcpr">TCPR</option>
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Current Semester</option>
              <option value="previous">Previous Semester</option>
              <option value="all">All Semesters</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadStudentMarks}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiDownload size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gray-50 border-b">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <FiBook className="text-blue-600" />
              Subject-wise Performance Overview
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    CIA-1
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    CIA-2
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPerformance.map((performance) => (
                  <tr key={performance.subject._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{performance.subject.name}</div>
                        <div className="text-sm text-gray-500">
                          {performance.subject.code} • {performance.subject.credits} Credits • {performance.subject.type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-gray-900">
                        {performance.cia1 ? `${performance.cia1.marksObtained}/60` : '-'}
                      </div>
                      {performance.cia1 && (
                        <div className="text-xs text-gray-500">{performance.cia1.percentage.toFixed(1)}%</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-gray-900">
                        {performance.cia2 ? `${performance.cia2.marksObtained}/60` : '-'}
                      </div>
                      {performance.cia2 && (
                        <div className="text-xs text-gray-500">{performance.cia2.percentage.toFixed(1)}%</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-gray-900">
                        {performance.model ? `${performance.model.marksObtained}/100` : '-'}
                      </div>
                      {performance.model && (
                        <div className="text-xs text-gray-500">{performance.model.percentage.toFixed(1)}%</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-lg text-gray-900">
                        {performance.totalMarks}/{performance.totalPossible}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`font-bold text-lg ${
                        performance.overallPercentage >= 75 ? 'text-green-600' :
                        performance.overallPercentage >= 60 ? 'text-blue-600' :
                        performance.overallPercentage >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {performance.overallPercentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        performance.overallGrade === 'O' || performance.overallGrade === 'A+' ? 'bg-green-100 text-green-800' :
                        performance.overallGrade === 'A' || performance.overallGrade === 'B+' ? 'bg-blue-100 text-blue-800' :
                        performance.overallGrade === 'B' || performance.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {performance.overallGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        performance.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        performance.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {performance.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPerformance.length === 0 && (
            <div className="p-12 text-center">
              <FiBook className="mx-auto text-gray-400" size={64} />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">No Marks Available</h3>
              <p className="mt-2 text-gray-500">
                Your marks will appear here once your faculty enters them.
              </p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {filteredPerformance.map((performance) => (
            <div key={performance.subject._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{performance.subject.name}</h3>
                    <p className="text-gray-600 mt-1">
                      {performance.subject.code} • {performance.subject.credits} Credits • {performance.subject.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{performance.overallGrade}</div>
                    <div className="text-sm text-gray-600">{performance.overallPercentage.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CIA-1 Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm">CIA-1</span>
                    </h4>
                    {performance.cia1 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marks:</span>
                          <span className="font-medium">{performance.cia1.marksObtained}/60</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Percentage:</span>
                          <span className="font-medium">{performance.cia1.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-medium">{performance.cia1.grade}</span>
                        </div>
                        {performance.cia1.questionWiseMarks && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Question-wise Breakdown:</h5>
                            <div className="space-y-1 text-sm">
                              {performance.cia1.questionWiseMarks.map((q, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span>Q{q.questionNumber} (U{q.unit}):</span>
                                  <span>{q.obtainedMarks}/{q.maxMarks}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {performance.cia1.remarks && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Remarks: {performance.cia1.remarks}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Not yet evaluated</div>
                    )}
                  </div>

                  {/* CIA-2 Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm">CIA-2</span>
                    </h4>
                    {performance.cia2 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marks:</span>
                          <span className="font-medium">{performance.cia2.marksObtained}/60</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Percentage:</span>
                          <span className="font-medium">{performance.cia2.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-medium">{performance.cia2.grade}</span>
                        </div>
                        {performance.cia2.questionWiseMarks && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Question-wise Breakdown:</h5>
                            <div className="space-y-1 text-sm">
                              {performance.cia2.questionWiseMarks.map((q, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span>Q{q.questionNumber} (U{q.unit}):</span>
                                  <span>{q.obtainedMarks}/{q.maxMarks}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {performance.cia2.remarks && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Remarks: {performance.cia2.remarks}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Not yet evaluated</div>
                    )}
                  </div>

                  {/* Model Exam Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded text-sm">Model</span>
                    </h4>
                    {performance.model ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Marks:</span>
                          <span className="font-medium">{performance.model.marksObtained}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Percentage:</span>
                          <span className="font-medium">{performance.model.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-medium">{performance.model.grade}</span>
                        </div>
                        {performance.model.remarks && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Remarks: {performance.model.remarks}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Not yet evaluated</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Grade Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FiBarChart className="text-blue-600" />
              Grade Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {['O', 'A+', 'A', 'B+', 'B', 'C', 'F'].map(grade => (
                <div key={grade} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.gradeDistribution[grade] || 0}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{grade}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Semester Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FiTrendingUp className="text-green-600" />
              GPA Trend
            </h3>
            <div className="space-y-4">
              {analytics.semesterTrend.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">{trend.semester}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(trend.gpa / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-green-600 w-12 text-right">
                      {trend.gpa.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'co-analysis' && (
        <COAnalysis
          studentId={studentId}
          subjects={Array.from(new Set(subjectPerformance.map(p => p.subject))).map(subject => ({
            _id: subject._id,
            name: subject.name,
            code: subject.code
          }))}
          onTasksAssigned={(count: number) => {
            if (count > 0) {
              addSuccessNotification(
                `${count} improvement tasks have been automatically assigned based on CO performance analysis`
              )
              // Refresh tasks
              loadStudentMarks()
            }
          }}
          onNotification={(message: string) => {
            addSuccessNotification(message)
          }}
        />
      )}
      </div>
    </>
  )
}