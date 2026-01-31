'use client'

import { useState, useEffect } from 'react'
import { 
  FiTrendingUp, FiTrendingDown, FiAward, FiTarget, 
  FiBarChart2, FiBook, FiCheckCircle, FiAlertCircle,
  FiClock, FiCalendar
} from 'react-icons/fi'
import apiService from '@/services/api'
import { getCurrentUserId } from '@/services/authStorage'

interface PerformanceData {
  ciaExams: Record<
    string,
    {
      obtained: number
      total: number
      percentage: number
      attempts: number
    }
  >
  improvementTasks: {
    total: number
    completed: number
    inProgress: number
    assigned: number
    overdue: number
    averageScore: number
    scoreByTask: Array<{ label: string; percentage: number }>
    studyTime: { completed: number; required: number; percentage: number }
  }
  subjectPerformance: Array<{
    subject: string
    code: string
    marks: number
    totalMarks: number
    percentage: number
    weakCOs: string[]
  }>
  overallStats: {
    totalSubjects: number
    averagePercentage: number
    strongSubjects: number
    needsImprovement: number
    ciaAveragePercentage: number
    taskCompletionPercentage: number
  }
}

export default function StudentPerformanceDashboard() {
  const [loading, setLoading] = useState(true)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [selectedView, setSelectedView] = useState<'overview' | 'cia' | 'improvement'>('overview')

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      const studentId = getCurrentUserId()
      
      if (!studentId) {
        console.warn('⚠️ No student ID found in localStorage')
        // Set empty data to show the empty state UI
        setPerformance({
          ciaExams: {},
          improvementTasks: {
            total: 0,
            completed: 0,
            inProgress: 0,
            assigned: 0,
            overdue: 0,
            averageScore: 0,
            scoreByTask: [],
            studyTime: { completed: 0, required: 0, percentage: 0 }
          },
          subjectPerformance: [],
          overallStats: {
            totalSubjects: 0,
            averagePercentage: 0,
            strongSubjects: 0,
            needsImprovement: 0,
            ciaAveragePercentage: 0,
            taskCompletionPercentage: 0
          }
        })
        setLoading(false)
        return
      }

      console.log('📊 Fetching performance data for student:', studentId)
      
      // Fetch all performance data with individual error handling
      let marksData: any[] = []
      let tasksData: any[] = []
      let subjectsData: any[] = []

      // Try to fetch marks
      try {
        const marksResponse = await apiService.makeRequest(`/marks/student/${studentId}`)
        console.log('📝 Marks Response:', marksResponse)
        // Backend returns { success: true, count: X, data: [...] }
        if (marksResponse && marksResponse.success && Array.isArray(marksResponse.data)) {
          marksData = marksResponse.data
          console.log(`✅ Loaded ${marksData.length} marks records`)
        }
      } catch (err) {
        console.warn('⚠️ Marks API failed:', err)
      }

      // Try to fetch tasks
      try {
        const tasksResponse = await apiService.makeRequest(`/improvement-tasks/student/${studentId}/improvement`)
        console.log('🎯 Tasks Response:', tasksResponse)
        // Backend returns { success: true, data: [...], message: "..." }
        if (tasksResponse && tasksResponse.success && Array.isArray(tasksResponse.data)) {
          tasksData = tasksResponse.data
          console.log(`✅ Loaded ${tasksData.length} improvement tasks`)
        }
      } catch (err) {
        console.warn('⚠️ Tasks API failed:', err)
      }

      // Try to fetch subjects
      try {
        const subjectsResponse = await apiService.makeRequest('/subjects/student/my-subjects')
        console.log('📚 Subjects Response:', subjectsResponse)
        // Backend returns { success: true, count: X, data: [...] }
        if (subjectsResponse && subjectsResponse.success && Array.isArray(subjectsResponse.data)) {
          subjectsData = subjectsResponse.data
          console.log(`✅ Loaded ${subjectsData.length} subjects`)
        }
      } catch (err) {
        console.warn('⚠️ Subjects API failed:', err)
      }

      console.log('📊 Data Summary:', { 
        marks: marksData.length, 
        tasks: tasksData.length, 
        subjects: subjectsData.length 
      })

      // Process the data - always create a data structure even if empty
      const processedData = processPerformanceData(marksData, tasksData, subjectsData)
      
      console.log('✅ Processed Performance Data:', processedData)
      setPerformance(processedData)
      
    } catch (error) {
      console.error('❌ Critical error loading performance data:', error)
      // Set empty data structure instead of null
      setPerformance({
        ciaExams: {},
        improvementTasks: {
          total: 0,
          completed: 0,
          inProgress: 0,
          assigned: 0,
          overdue: 0,
          averageScore: 0,
          scoreByTask: [],
          studyTime: { completed: 0, required: 0, percentage: 0 }
        },
        subjectPerformance: [],
        overallStats: {
          totalSubjects: 0,
          averagePercentage: 0,
          strongSubjects: 0,
          needsImprovement: 0,
          ciaAveragePercentage: 0,
          taskCompletionPercentage: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const processPerformanceData = (marks: any[], tasks: any[], subjects: any[]): PerformanceData => {
    const toNumber = (value: any) => {
      const n = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(n) ? n : 0
    }

    const safePercent = (obtained: number, total: number) => {
      if (!Number.isFinite(obtained) || !Number.isFinite(total) || total <= 0) return 0
      const p = (obtained / total) * 100
      if (!Number.isFinite(p)) return 0
      return Math.max(0, Math.min(100, p))
    }

    // Build subject metadata lookup
    const subjectLookup = new Map<string, { name: string; code: string }>()
    subjects.forEach((s: any) => {
      const id = (s?._id || s?.id || s)?.toString?.() || ''
      if (!id) return
      subjectLookup.set(id, { name: s?.name || 'Unknown Subject', code: s?.code || '' })
    })

    // Map weak COs from improvement tasks (per subject)
    const taskWeakCOsBySubject = new Map<string, Set<string>>()
    let totalStudyRequired = 0
    let totalStudyCompleted = 0
    tasks.forEach((t: any) => {
      const subjectId = (t?.subject?._id || t?.subject || '')?.toString?.() || ''
      if (!subjectId) return

      const set = taskWeakCOsBySubject.get(subjectId) || new Set<string>()
      const weakCOs = (t?.isMultiStudent ? t?.personalizedData?.weakCOs : t?.metadata?.coWeakAreas) || []
      weakCOs.forEach((co: any) => {
        const label =
          (typeof co?.courseOutcome === 'string' && co.courseOutcome.trim()) ||
          (co?.co ? String(co.co) : '') ||
          (co?.coNumber ? `CO${co.coNumber}` : '')
        if (label) set.add(label)
      })
      taskWeakCOsBySubject.set(subjectId, set)

      totalStudyRequired += toNumber(t?.metadata?.studyTimeMinutes)
      totalStudyCompleted += toNumber(t?.metadata?.studyTimeCompleted)
    })

    // Normalize marks into consistent shape
    const normalizedMarks = marks.map((m: any) => {
      const exam = m?.exam || {}
      const examTypeRaw = (exam?.examType || m?.examType || 'Other')?.toString?.() || 'Other'
      const examType = examTypeRaw.toLowerCase()

      const questionMarks: any[] = Array.isArray(m?.questionMarks) ? m.questionMarks : []
      const obtained = questionMarks.reduce((sum, qm) => sum + toNumber(qm?.marksObtained), 0)
      const totalFromQuestions = questionMarks.reduce((sum, qm) => sum + toNumber(qm?.question?.marks), 0)
      const total = toNumber(exam?.totalMarks) || totalFromQuestions
      const percentage = safePercent(obtained, total)

      const subjectId = (exam?.subject?._id || exam?.subject || '')?.toString?.() || ''
      const subjectMeta = subjectId ? subjectLookup.get(subjectId) : undefined

      return {
        examType,
        obtained,
        total,
        percentage,
        subjectId,
        subjectName: subjectMeta?.name || exam?.subject?.name || 'Unknown Subject',
        subjectCode: subjectMeta?.code || exam?.subject?.code || '',
        scheduledDate: exam?.scheduledDate || m?.createdAt || null,
        title: exam?.title || ''
      }
    })

    // Aggregate CIA analytics by exam type
    const examTypeAgg = new Map<string, { obtained: number; total: number; attempts: number }>()
    normalizedMarks.forEach(m => {
      const entry = examTypeAgg.get(m.examType) || { obtained: 0, total: 0, attempts: 0 }
      entry.obtained += m.obtained
      entry.total += m.total
      entry.attempts += 1
      examTypeAgg.set(m.examType, entry)
    })

    const examTypeOrder = ['cia1', 'cia2', 'cia3', 'semester', 'assignment', 'quiz', 'other']
    const ciaExams: PerformanceData['ciaExams'] = {}
    examTypeOrder.forEach(k => {
      const agg = examTypeAgg.get(k)
      if (!agg) return
      ciaExams[k] = {
        obtained: agg.obtained,
        total: agg.total,
        percentage: safePercent(agg.obtained, agg.total),
        attempts: agg.attempts
      }
    })
    // Add any unexpected exam types at the end
    Array.from(examTypeAgg.keys())
      .filter(k => !examTypeOrder.includes(k))
      .sort()
      .forEach(k => {
        const agg = examTypeAgg.get(k)!
        ciaExams[k] = {
          obtained: agg.obtained,
          total: agg.total,
          percentage: safePercent(agg.obtained, agg.total),
          attempts: agg.attempts
        }
      })

    // Process improvement tasks
    const completedTasks = tasks.filter((t: any) => {
      const status = t.isMultiStudent ? t.personalizedData?.status : t.status
      return status === 'Completed'
    })
    const inProgressTasks = tasks.filter((t: any) => {
      const status = t.isMultiStudent ? t.personalizedData?.status : t.status
      return status === 'In Progress'
    })
    const assignedTasks = tasks.filter((t: any) => {
      const status = t.isMultiStudent ? t.personalizedData?.status : t.status
      return status === 'Assigned'
    })

    const overdueTasks = tasks.filter((t: any) => {
      const status = t.isMultiStudent ? t.personalizedData?.status : t.status
      return status === 'Overdue'
    })

    // Calculate average improvement task score (latest attempts)
    const taskScoreEntries: Array<{ label: string; percentage: number; timestamp: number }> = []
    tasks.forEach((t: any) => {
      const subjectCode = t?.subject?.code || ''
      const label = subjectCode || (t?.title ? String(t.title).slice(0, 18) : 'Task')

      if (t?.isMultiStudent && Array.isArray(t?.personalizedData?.scores) && t.personalizedData.scores.length > 0) {
        const last = t.personalizedData.scores[t.personalizedData.scores.length - 1]
        const p = toNumber(last?.percentage)
        if (p > 0) {
          taskScoreEntries.push({
            label,
            percentage: Math.max(0, Math.min(100, p)),
            timestamp: new Date(last?.timestamp || t?.updatedAt || t?.createdAt || Date.now()).getTime()
          })
        }
        return
      }

      const mcqScores: any[] = Array.isArray(t?.metadata?.mcqScores) ? t.metadata.mcqScores : []
      if (mcqScores.length > 0) {
        const last = mcqScores[mcqScores.length - 1]
        const p = toNumber(last?.percentage) || toNumber(last?.score)
        if (p > 0) {
          taskScoreEntries.push({
            label,
            percentage: Math.max(0, Math.min(100, p)),
            timestamp: new Date(last?.timestamp || t?.updatedAt || t?.createdAt || Date.now()).getTime()
          })
        }
      }
    })

    const scoreByTask = taskScoreEntries
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)
      .map(s => ({ label: s.label, percentage: s.percentage }))

    const averageTaskScore = taskScoreEntries.length > 0
      ? taskScoreEntries.reduce((sum, s) => sum + s.percentage, 0) / taskScoreEntries.length
      : 0

    // Process subject-wise performance (from marks + task weak CO hints)
    const subjectAgg = new Map<
      string,
      { subject: string; code: string; marks: number; totalMarks: number }
    >()

    normalizedMarks.forEach(m => {
      if (!m.subjectId) return
      const existing = subjectAgg.get(m.subjectId) || {
        subject: m.subjectName || 'Unknown Subject',
        code: m.subjectCode || '',
        marks: 0,
        totalMarks: 0
      }
      existing.marks += m.obtained
      existing.totalMarks += m.total
      subjectAgg.set(m.subjectId, existing)
    })

    // Ensure all enrolled subjects exist in map (even if marks are missing)
    subjects.forEach((s: any) => {
      const id = (s?._id || s?.id || '')?.toString?.() || ''
      if (!id) return
      if (!subjectAgg.has(id)) {
        subjectAgg.set(id, {
          subject: s?.name || 'Unknown Subject',
          code: s?.code || '',
          marks: 0,
          totalMarks: 0
        })
      }
    })

    const subjectPerformance = Array.from(subjectAgg.entries()).map(([subjectId, s]) => {
      const weakCOs = Array.from(taskWeakCOsBySubject.get(subjectId) || [])
      return {
        subject: s.subject,
        code: s.code,
        marks: s.marks,
        totalMarks: s.totalMarks,
        percentage: safePercent(s.marks, s.totalMarks),
        weakCOs
      }
    })

    // Calculate overall stats
    const validSubjects = subjectPerformance.filter(s => s.totalMarks > 0)
    const averagePercentage = validSubjects.length > 0
      ? validSubjects.reduce((sum, s) => sum + s.percentage, 0) / validSubjects.length
      : 0
    const strongSubjects = validSubjects.filter(s => s.percentage >= 70).length
    const needsImprovement = validSubjects.filter(s => s.percentage < 60).length

    const ciaTotalObtained = Object.values(ciaExams).reduce((sum, e) => sum + e.obtained, 0)
    const ciaTotalPossible = Object.values(ciaExams).reduce((sum, e) => sum + e.total, 0)
    const ciaAveragePercentage = safePercent(ciaTotalObtained, ciaTotalPossible)

    const taskCompletionPercentage = tasks.length > 0
      ? Math.max(0, Math.min(100, (completedTasks.length / tasks.length) * 100))
      : 0

    const studyTimeRequired = Math.max(0, totalStudyRequired)
    const studyTimeCompleted = Math.max(0, totalStudyCompleted)
    const studyTimePercentage = safePercent(studyTimeCompleted, studyTimeRequired)

    return {
      ciaExams,
      improvementTasks: {
        total: tasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        assigned: assignedTasks.length,
        overdue: overdueTasks.length,
        averageScore: averageTaskScore,
        scoreByTask,
        studyTime: {
          completed: studyTimeCompleted,
          required: studyTimeRequired,
          percentage: studyTimePercentage
        }
      },
      subjectPerformance: validSubjects,
      overallStats: {
        totalSubjects: validSubjects.length,
        averagePercentage,
        strongSubjects,
        needsImprovement,
        ciaAveragePercentage,
        taskCompletionPercentage
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading your performance data...</p>
        </div>
      </div>
    )
  }

  if (!performance) {
    // This should rarely happen now since we always set performance to a valid object
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <FiAlertCircle className="mx-auto text-red-400 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">System Error</h3>
        <p className="text-gray-600 mb-4">Unable to initialize dashboard. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    )
  }

  // Check if there's ANY data at all
  const hasAnyData = 
    performance.overallStats.totalSubjects > 0 ||
    Object.keys(performance.ciaExams).length > 0 ||
    performance.improvementTasks.total > 0

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        {/* Welcome Card for New Students */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <FiAward size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome to Your Dashboard! 🎓</h1>
              <p className="text-blue-100 mt-1">Your learning journey starts here</p>
            </div>
          </div>
        </div>

        {/* Empty State Guide */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBook className="text-blue-600" size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Enrolled Subjects</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your subjects will appear here once your faculty assigns them
            </p>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              0 Subjects
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiBarChart2 className="text-green-600" size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">CIA Exams</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your exam scores will be displayed here after faculty enters marks
            </p>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              0 Exams
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiTarget className="text-purple-600" size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Improvement Tasks</h3>
            <p className="text-sm text-gray-600 mb-4">
              Personalized tasks will be assigned based on your performance
            </p>
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              0 Tasks
            </span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-green-600" />
            What's Next?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-800">Wait for Subject Assignment</p>
                <p className="text-sm text-gray-600">Your faculty will assign subjects to you soon</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-800">Attend CIA Exams</p>
                <p className="text-sm text-gray-600">Your performance will be tracked automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-800">Complete Improvement Tasks</p>
                <p className="text-sm text-gray-600">AI-generated tasks will help you improve weak areas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-3">📚 Explore Other Sections</h3>
          <p className="text-purple-100 mb-4">While waiting for data, you can:</p>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors">
              View Courses
            </button>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors">
              Study Materials
            </button>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors">
              Ask Chatbot
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalTasks = performance.improvementTasks.total
  const completedTaskPct = totalTasks > 0 ? (performance.improvementTasks.completed / totalTasks) * 100 : 0
  const inProgressTaskPct = totalTasks > 0 ? (performance.improvementTasks.inProgress / totalTasks) * 100 : 0
  const assignedTaskPct = totalTasks > 0 ? (performance.improvementTasks.assigned / totalTasks) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Performance Dashboard</h1>
            <p className="text-blue-100">Track your academic progress and improvement</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{performance.overallStats.averagePercentage.toFixed(1)}%</div>
              <div className="text-sm text-blue-100">Overall Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Subjects</p>
              <p className="text-3xl font-bold text-gray-800">{performance.overallStats.totalSubjects}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiBook className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Strong Subjects</p>
              <p className="text-3xl font-bold text-gray-800">{performance.overallStats.strongSubjects}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FiTrendingUp className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">≥70% performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Needs Focus</p>
              <p className="text-3xl font-bold text-gray-800">{performance.overallStats.needsImprovement}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <FiTarget className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">&lt;60% performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Improvement Tasks</p>
              <p className="text-3xl font-bold text-gray-800">{performance.improvementTasks.completed}/{performance.improvementTasks.total}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FiCheckCircle className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Avg: {performance.improvementTasks.averageScore.toFixed(1)}%</p>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 bg-white rounded-xl shadow-lg p-2">
        <button
          onClick={() => setSelectedView('overview')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            selectedView === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📈 Overview
        </button>
        <button
          onClick={() => setSelectedView('cia')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            selectedView === 'cia'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📝 CIA Exams
        </button>
        <button
          onClick={() => setSelectedView('improvement')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            selectedView === 'improvement'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🎯 Improvement
        </button>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Subject-wise Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiBarChart2 className="text-blue-600" />
              Subject-wise Performance
            </h3>
            <div className="space-y-4">
              {performance.subjectPerformance.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No subject data available yet</p>
              ) : (
                performance.subjectPerformance.map((subject, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{subject.subject}</h4>
                        <p className="text-sm text-gray-500">{subject.code}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          {subject.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          {subject.marks}/{subject.totalMarks}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          subject.percentage >= 70
                            ? 'bg-green-500'
                            : subject.percentage >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                      ></div>
                    </div>

                    {/* Weak COs */}
                    {subject.weakCOs.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600">Weak COs:</span>
                        <div className="flex flex-wrap gap-1">
                          {subject.weakCOs.map((co, i) => (
                            <span key={i} className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              {co}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'cia' && (
        <div className="space-y-6">
          {/* CIA Progress Graph */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiBarChart2 className="text-blue-600" />
              CIA Exam Performance Trend
            </h3>
            
            {/* Bar Chart */}
            <div className="space-y-4">
              {Object.entries(performance.ciaExams).map(([examType, data]: [string, any]) => {
                const percentage = data.percentage
                const color = percentage >= 70 ? 'blue' : percentage >= 60 ? 'yellow' : 'red'
                
                return (
                  <div key={examType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700 uppercase min-w-[80px]">
                        {examType}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${
                              color === 'blue'
                                ? 'from-blue-500 to-blue-600'
                                : color === 'yellow'
                                ? 'from-yellow-500 to-yellow-600'
                                : 'from-red-500 to-red-600'
                            } transition-all duration-1000 ease-out flex items-center justify-end pr-3`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            <span className="text-white font-bold text-sm">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-800 min-w-[80px] text-right">
                        {data.obtained}/{data.total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Performance Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.values(performance.ciaExams).reduce((sum: number, exam: any) => sum + exam.obtained, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {(Object.values(performance.ciaExams).reduce((sum: number, exam: any) => sum + exam.percentage, 0) / 
                      Object.keys(performance.ciaExams).length).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Average</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(performance.ciaExams).length}
                  </div>
                  <div className="text-sm text-gray-600">Exams</div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual CIA Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(performance.ciaExams).map(([examType, data]: [string, any]) => (
              <div key={examType} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 uppercase">{examType}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    data.percentage >= 70
                      ? 'bg-green-100 text-green-700'
                      : data.percentage >= 60
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
                
                {/* Circular Progress */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={data.percentage >= 70 ? '#10b981' : data.percentage >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.percentage / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-2xl font-bold text-gray-800">{data.obtained}</div>
                    <div className="text-sm text-gray-500">/ {data.total}</div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 text-sm">Marks Obtained</p>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(performance.ciaExams).length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-xl">
              No CIA exam data available yet
            </div>
          )}
        </div>
      )}

      {selectedView === 'improvement' && (
        <div className="space-y-6">
          {/* Task Status Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiTarget className="text-purple-600" />
              Improvement Tasks Overview
            </h3>
            
            {/* Progress Visualization */}
            <div className="space-y-6">
              {/* Completed Tasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FiCheckCircle className="text-green-600" />
                    Completed
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {performance.improvementTasks.completed} / {performance.improvementTasks.total}
                  </span>
                </div>
                <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000 flex items-center justify-center"
                    style={{ width: `${completedTaskPct}%` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {completedTaskPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* In Progress Tasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FiClock className="text-orange-600" />
                    In Progress
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {performance.improvementTasks.inProgress} / {performance.improvementTasks.total}
                  </span>
                </div>
                <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 flex items-center justify-center"
                    style={{ width: `${inProgressTaskPct}%` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {inProgressTaskPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Tasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FiCalendar className="text-blue-600" />
                    Assigned
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {performance.improvementTasks.assigned} / {performance.improvementTasks.total}
                  </span>
                </div>
                <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 flex items-center justify-center"
                    style={{ width: `${assignedTaskPct}%` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {assignedTaskPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Distribution Pie Chart Visualization */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-4">Task Distribution</h4>
              <div className="flex items-center justify-center gap-8">
                {/* Donut Chart */}
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Completed segment */}
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#10b981"
                      strokeWidth="32"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80 * (completedTaskPct / 100)} ${2 * Math.PI * 80}`}
                      strokeDashoffset="0"
                    />
                    {/* In Progress segment */}
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#f97316"
                      strokeWidth="32"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80 * (inProgressTaskPct / 100)} ${2 * Math.PI * 80}`}
                      strokeDashoffset={`${-2 * Math.PI * 80 * (completedTaskPct / 100)}`}
                    />
                    {/* Assigned segment */}
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#3b82f6"
                      strokeWidth="32"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80 * (assignedTaskPct / 100)} ${2 * Math.PI * 80}`}
                      strokeDashoffset={`${-2 * Math.PI * 80 * ((completedTaskPct + inProgressTaskPct) / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className="text-3xl font-bold text-gray-800">{performance.improvementTasks.total}</div>
                    <div className="text-sm text-gray-500">Total Tasks</div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">
                      Completed ({performance.improvementTasks.completed})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-700">
                      In Progress ({performance.improvementTasks.inProgress})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-700">
                      Assigned ({performance.improvementTasks.assigned})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Score Card */}
          {performance.improvementTasks.averageScore > 0 && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Average Improvement Score</h3>
                  <p className="text-purple-100">Based on {performance.improvementTasks.completed} completed tasks</p>
                  <div className="mt-4 flex items-center gap-2">
                    <FiAward size={24} />
                    <span className="text-lg">
                      {performance.improvementTasks.averageScore >= 80 ? 'Excellent Performance!' :
                       performance.improvementTasks.averageScore >= 70 ? 'Good Progress!' :
                       performance.improvementTasks.averageScore >= 60 ? 'Keep Improving!' : 'Need More Practice'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.3)" strokeWidth="12" fill="none" />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="white"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - performance.improvementTasks.averageScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-4xl font-bold">{performance.improvementTasks.averageScore.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <FiCheckCircle className="text-green-600" size={32} />
                <div className="text-3xl font-bold text-green-600">
                  {performance.improvementTasks.completed}
                </div>
              </div>
              <p className="text-gray-700 font-medium">Completed Tasks</p>
              <p className="text-sm text-gray-500 mt-1">Keep up the great work!</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <FiClock className="text-orange-600" size={32} />
                <div className="text-3xl font-bold text-orange-600">
                  {performance.improvementTasks.inProgress}
                </div>
              </div>
              <p className="text-gray-700 font-medium">In Progress</p>
              <p className="text-sm text-gray-500 mt-1">Continue your efforts</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <FiCalendar className="text-blue-600" size={32} />
                <div className="text-3xl font-bold text-blue-600">
                  {performance.improvementTasks.assigned}
                </div>
              </div>
              <p className="text-gray-700 font-medium">Newly Assigned</p>
              <p className="text-sm text-gray-500 mt-1">Start working on these</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
