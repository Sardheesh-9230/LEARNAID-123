'use client'

import { useState, useEffect } from 'react'
import { 
  FiTarget, FiAlertTriangle, FiUsers, FiCalendar, 
  FiClock, FiSettings, FiCheckCircle, FiTrendingDown 
} from 'react-icons/fi'
import apiService from '../services/api'
import MCQPreviewModal from './MCQPreviewModal'

interface COPerformance {
  courseOutcome: string
  coNumber: number
  currentPerformance: number
  performanceGap: number
  weakTopics: string[]
  totalMarks: number
  obtainedMarks: number
  questionCount: number
  examTypes: string[]
}

interface LaggingStudent {
  studentId: string
  studentName: string
  rollNumber: string
  threshold: number
  weakCOs: COPerformance[]
  overallPerformance: number
  totalGap: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface COBasedStudentIdentificationProps {
  subjectId: string
  subjectName: string
  facultyId: string
  onClose: () => void
}

export default function COBasedStudentIdentification({ 
  subjectId, 
  subjectName, 
  facultyId,
  onClose 
}: COBasedStudentIdentificationProps) {
  const [laggingStudents, setLaggingStudents] = useState<LaggingStudent[]>([])
  const [examType, setExamType] = useState<string>('ALL')
  const [threshold, setThreshold] = useState<number>(50)
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  // MCQ Preview states
  const [showMCQPreview, setShowMCQPreview] = useState(false)
  const [generatedMCQs, setGeneratedMCQs] = useState<any[]>([])
  const [generatingMCQs, setGeneratingMCQs] = useState(false)
  const [previewStudentInfo, setPreviewStudentInfo] = useState<any>(null)
  
  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }>({ show: false, type: 'info', message: '' })

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ show: true, type, message })
  }

  const closeNotification = () => {
    setNotification({ show: false, type: 'info', message: '' })
  }
  
  // Task configuration
  const [taskConfig, setTaskConfig] = useState({
    difficultyLevel: 'Medium' as 'Easy' | 'Medium' | 'Hard' | 'Mixed',
    numberOfQuestions: 10,
    studyTimeMinutes: 90,
    scheduledStartTime: '',
    scheduledEndTime: '',
    dueDate: '',
    allowRetake: true,
    maxAttempts: 3
  })

  useEffect(() => {
    if (subjectId) {
      identifyLaggingStudents()
    }
  }, [subjectId, examType, threshold])

  const identifyLaggingStudents = async () => {
    try {
      setLoading(true)

      console.log(`🔍 Fetching CO analysis for subject: ${subjectId}, exam: ${examType}, threshold: ${threshold}`)

      // Fetch CO analysis for all students in the subject by exam type
      const response = await apiService.makeRequest(
        `/marks/co-analysis/subject/${subjectId}/exam/${examType}?threshold=${threshold}`
      )

      console.log('📊 API Response:', response)
      console.log('📊 API Response:', response)

      if (response.success && response.data) {
        console.log(`✅ Received ${response.data.length} students`)
        
        // Group students by ID and aggregate their weak COs
        const studentMap = new Map<string, LaggingStudent>()

        response.data.forEach((analysis: any) => {
          const poorCOs = analysis.poorPerformanceCOs || []
          
          if (poorCOs.length === 0) return

          if (!studentMap.has(analysis.studentId)) {
            studentMap.set(analysis.studentId, {
              studentId: analysis.studentId,
              studentName: analysis.studentName,
              rollNumber: analysis.rollNumber || 'N/A',
              threshold: analysis.threshold,
              weakCOs: [],
              overallPerformance: 0,
              totalGap: 0,
              priority: 'MEDIUM'
            })
          }

          const student = studentMap.get(analysis.studentId)!
          
          poorCOs.forEach((co: any) => {
            student.weakCOs.push({
              courseOutcome: co.courseOutcome,
              coNumber: parseInt(co.courseOutcome.replace('CO', '')),
              currentPerformance: co.percentage,
              performanceGap: co.gap,
              weakTopics: co.topics || ['General Topics'],
              totalMarks: co.totalMarks,
              obtainedMarks: co.obtainedMarks,
              questionCount: co.questionCount,
              examTypes: co.examTypes || []
            })
          })

          // Calculate overall metrics
          const totalMarks = student.weakCOs.reduce((sum, co) => sum + co.totalMarks, 0)
          const obtainedMarks = student.weakCOs.reduce((sum, co) => sum + co.obtainedMarks, 0)
          student.overallPerformance = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0
          student.totalGap = student.weakCOs.reduce((sum, co) => sum + co.performanceGap, 0)
          
          // Determine priority
          const avgGap = student.totalGap / student.weakCOs.length
          student.priority = avgGap > 30 ? 'HIGH' : avgGap > 20 ? 'MEDIUM' : 'LOW'
        })

        const allStudents = Array.from(studentMap.values())
        console.log(`📋 Processed ${allStudents.length} unique students with weak COs`)

        // Sort by total gap (worst first)
        allStudents.sort((a, b) => b.totalGap - a.totalGap)
        setLaggingStudents(allStudents)

        if (allStudents.length === 0) {
          showNotification('No students found below the threshold. All students are performing well! 🎉', 'info')
        }
      } else {
        console.warn('⚠️ No data in response or success=false')
        showNotification('No data available for CO analysis. Please ensure marks are entered.', 'warning')
      }
    } catch (error: any) {
      console.error('❌ Error identifying lagging students:', error)
      showNotification(error?.message || 'Failed to identify lagging students. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const selectAllVisible = () => {
    const visibleIds = laggingStudents.map(s => s.studentId)
    setSelectedStudents(visibleIds)
  }

  const clearSelection = () => {
    setSelectedStudents([])
  }

  const generateMCQsPreview = async () => {
    if (selectedStudents.length === 0) {
      showNotification('Please select at least one student to continue', 'warning')
      return
    }

    if (!taskConfig.dueDate) {
      showNotification('Please set a due date for the tasks', 'warning')
      return
    }

    try {
      setGeneratingMCQs(true)

      // Get first selected student for preview
      const firstStudent = laggingStudents.find(s => selectedStudents.includes(s.studentId))
      if (!firstStudent) return

      // Generate MCQs for ALL weak COs
      const allMCQs: any[] = []
      
      for (const co of firstStudent.weakCOs) {
        setPreviewStudentInfo({
          name: firstStudent.studentName,
          courseOutcome: co.courseOutcome,
          weakAreas: co.weakTopics,
          currentPerformance: co.currentPerformance,
          threshold: threshold,
          performanceGap: co.performanceGap
        })

        // Generate MCQs from materials for this CO
        const response = await apiService.makeRequest(
          '/mcq-generator/generate-from-materials',
          {
            method: 'POST',
            body: JSON.stringify({
              subjectId: subjectId,
              courseOutcome: co.courseOutcome,
              topics: co.weakTopics,
              difficulty: taskConfig.difficultyLevel,
              numberOfQuestions: Math.ceil(taskConfig.numberOfQuestions / firstStudent.weakCOs.length),
              threshold: threshold,
              currentPerformance: co.currentPerformance,
              performanceGap: co.performanceGap
            })
          }
        )

        if (response.success && response.questions) {
          allMCQs.push(...response.questions)
        }
      }

      if (allMCQs.length > 0) {
        setGeneratedMCQs(allMCQs)
        setPreviewStudentInfo({
          name: firstStudent.studentName,
          courseOutcome: firstStudent.weakCOs.map(co => co.courseOutcome).join(', '),
          weakAreas: Array.from(new Set(firstStudent.weakCOs.flatMap(co => co.weakTopics))),
          currentPerformance: firstStudent.overallPerformance,
          threshold: threshold,
          performanceGap: firstStudent.totalGap
        })
        setShowMCQPreview(true)
      } else {
        showNotification('Failed to generate MCQs. Please check if materials are uploaded for this subject.', 'error')
      }
    } catch (error: any) {
      console.error('Error generating MCQs:', error)
      showNotification(error?.message || 'Failed to generate MCQs. Please try again.', 'error')
    } finally {
      setGeneratingMCQs(false)
    }
  }

  const assignImprovementTasks = async () => {
    if (selectedStudents.length === 0) {
      showNotification('Please select at least one student to continue', 'warning')
      return
    }

    if (!taskConfig.dueDate) {
      showNotification('Please set a due date for the tasks', 'warning')
      return
    }

    // First, generate MCQs and show preview
    await generateMCQsPreview()
  }

  const handleApproveMCQs = async () => {
    try {
      setAssigning(true)

      const assignmentPromises = []

      // Assign tasks for each selected student with ALL their weak COs
      for (const student of laggingStudents) {
        if (!selectedStudents.includes(student.studentId)) continue

        const taskData = {
          studentId: student.studentId,
          subjectId: subjectId,
          subjectName: subjectName,
          courseOutcomes: student.weakCOs.map(co => co.courseOutcome), // Multiple COs
          coNumbers: student.weakCOs.map(co => co.coNumber),
          currentPerformance: student.overallPerformance,
          taskType: 'CO_IMPROVEMENT',
          priority: student.priority,
          description: `Improve performance in ${student.weakCOs.map(co => co.courseOutcome).join(', ')} - Current: ${student.overallPerformance.toFixed(1)}%, Target: ${threshold}%`,
          dueDate: taskConfig.dueDate,
          generatedMCQs: true,
          approvedMCQs: generatedMCQs, // Include faculty-approved MCQs for ALL COs
          weakAreas: Array.from(new Set(student.weakCOs.flatMap(co => co.weakTopics))),
          studyTimeMinutes: taskConfig.studyTimeMinutes,
          teacherSettings: {
            difficultyLevel: taskConfig.difficultyLevel,
            numberOfQuestions: taskConfig.numberOfQuestions,
            scheduledStartTime: taskConfig.scheduledStartTime,
            scheduledEndTime: taskConfig.scheduledEndTime,
            allowRetake: taskConfig.allowRetake,
            maxAttempts: taskConfig.maxAttempts,
            focusAreas: Array.from(new Set(student.weakCOs.flatMap(co => co.weakTopics))),
            threshold: threshold,
            targetPerformance: threshold
          },
          coWeakAreas: student.weakCOs.map(co => ({
            co: co.courseOutcome,
            topics: co.weakTopics,
            performanceGap: co.performanceGap,
            currentPerformance: co.currentPerformance
          }))
        }

        assignmentPromises.push(
          apiService.makeRequest('/improvement-tasks/assign-co-specific', {
            method: 'POST',
            body: JSON.stringify(taskData)
          })
        )
      }

      const results = await Promise.allSettled(assignmentPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      // Log detailed results
      console.log('📊 Task Assignment Results:')
      console.log(`  ✅ Successful: ${successful}`)
      console.log(`  ❌ Failed: ${failed}`)
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const data = result.value
          console.log(`  Task ${index + 1}:`, data)
          if (data.data?.task?.mcqData) {
            console.log(`    🧠 MCQs: ${data.data.task.mcqData.totalQuestions} questions`)
            console.log(`    📚 Material: ${data.data.task.mcqData.materialUsed || 'N/A'}`)
            console.log(`    ⚠️ Needs Generation: ${data.data.task.mcqData.needsGeneration || false}`)
          }
        } else {
          console.error(`  Task ${index + 1} failed:`, result.reason)
        }
      })

      const successMessage = `Successfully assigned ${successful} improvement task(s)!${failed > 0 ? ` ${failed} assignment(s) failed.` : ''} Faculty-approved MCQs have been assigned to students.`
      showNotification(successMessage, failed > 0 ? 'warning' : 'success')
      
      // Clear selection and close
      clearSelection()
      setShowMCQPreview(false)
      setGeneratedMCQs([])

    } catch (error: any) {
      console.error('❌ Error assigning improvement tasks:', error)
      showNotification(error?.message || 'Failed to assign improvement tasks. Please try again.', 'error')
    } finally {
      setAssigning(false)
    }
  }

  const handleRegenerateMCQs = async () => {
    // Regenerate MCQs with same parameters
    await generateMCQsPreview()
  }

  const handleCancelMCQPreview = () => {
    setShowMCQPreview(false)
    setGeneratedMCQs([])
    setPreviewStudentInfo(null)
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage < 30) return 'text-red-600 bg-red-50'
    if (percentage < 50) return 'text-orange-600 bg-orange-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const getPriorityBadge = (gap: number) => {
    if (gap > 30) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">HIGH</span>
    if (gap > 20) return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">MEDIUM</span>
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">LOW</span>
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiTarget className="text-3xl" />
                CO-Based Student Identification
              </h2>
              <p className="text-blue-100 mt-1">
                {subjectName} - Identify & Assign Improvement Tasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-blue-600 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Exams</option>
                  <option value="CIA1">CIA 1 (CO1-CO2)</option>
                  <option value="CIA2">CIA 2 (CO3-CO4)</option>
                  <option value="MODEL">Model Exam (CO1-CO5)</option>
                  <option value="SEMESTER">Semester Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Threshold (%)
                </label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value) || 50)}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={identifyLaggingStudents}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <FiUsers />
                  {loading ? 'Identifying...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Task Configuration */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiSettings />
              Task Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={taskConfig.difficultyLevel}
                  onChange={(e) => setTaskConfig({...taskConfig, difficultyLevel: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  value={taskConfig.numberOfQuestions}
                  onChange={(e) => setTaskConfig({...taskConfig, numberOfQuestions: parseInt(e.target.value) || 10})}
                  min="5"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Time (minutes)
                </label>
                <input
                  type="number"
                  value={taskConfig.studyTimeMinutes}
                  onChange={(e) => setTaskConfig({...taskConfig, studyTimeMinutes: parseInt(e.target.value) || 90})}
                  min="30"
                  max="300"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiCalendar className="inline mr-1" /> Due Date
                </label>
                <input
                  type="date"
                  value={taskConfig.dueDate}
                  onChange={(e) => setTaskConfig({...taskConfig, dueDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-1" /> Start Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={taskConfig.scheduledStartTime}
                  onChange={(e) => setTaskConfig({...taskConfig, scheduledStartTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiClock className="inline mr-1" /> End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={taskConfig.scheduledEndTime}
                  onChange={(e) => setTaskConfig({...taskConfig, scheduledEndTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowRetake"
                  checked={taskConfig.allowRetake}
                  onChange={(e) => setTaskConfig({...taskConfig, allowRetake: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="allowRetake" className="text-sm text-gray-700">
                  Allow Retake
                </label>
              </div>

              {taskConfig.allowRetake && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    value={taskConfig.maxAttempts}
                    onChange={(e) => setTaskConfig({...taskConfig, maxAttempts: parseInt(e.target.value) || 3})}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FiTrendingDown className="text-orange-600" />
                Lagging Students ({laggingStudents.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllVisible}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Identifying lagging students...</p>
              </div>
            ) : laggingStudents.length === 0 ? (
              <div className="p-12 text-center">
                <FiCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  No lagging students found below {threshold}% threshold!
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  All students are performing well in the selected exam
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedStudents.length === laggingStudents.length}
                          onChange={(e) => e.target.checked ? selectAllVisible() : clearSelection()}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gap</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weak Topics</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Types</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {laggingStudents.map((student, index) => (
                      <tr 
                        key={`${student.studentId}-${student.courseOutcome}-${index}`}
                        className={selectedStudents.includes(student.studentId) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.studentId)}
                            onChange={() => toggleStudentSelection(student.studentId)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-xs text-gray-500">{student.rollNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                            {student.courseOutcome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold px-3 py-1 rounded inline-block ${getPerformanceColor(student.currentPerformance)}`}>
                            {student.currentPerformance.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {student.obtainedMarks}/{student.totalMarks} marks
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-red-600">
                            -{student.performanceGap.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(student.performanceGap)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {student.weakTopics.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {student.weakTopics.slice(0, 3).map((topic, i) => (
                                  <span key={i} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                    {topic}
                                  </span>
                                ))}
                                {student.weakTopics.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                                    +{student.weakTopics.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No specific topics</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {student.examTypes.map((exam, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {exam}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedStudents.length > 0 && (
              <span className="font-semibold text-blue-600">
                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={assignImprovementTasks}
              disabled={selectedStudents.length === 0 || assigning || !taskConfig.dueDate || generatingMCQs}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiCheckCircle />
              {generatingMCQs ? 'Generating MCQs...' : assigning ? 'Assigning Tasks...' : `Assign Improvement Tasks (${selectedStudents.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* MCQ Preview Modal */}
      {showMCQPreview && (
        <MCQPreviewModal
          mcqs={generatedMCQs}
          studentInfo={previewStudentInfo}
          onApprove={handleApproveMCQs}
          onRegenerate={handleRegenerateMCQs}
          onCancel={handleCancelMCQPreview}
          loading={assigning}
        />
      )}

      {/* Custom Notification Dialog */}
      {notification.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            <div className={`p-4 ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-orange-500' :
              'bg-blue-500'
            }`}>
              <div className="flex items-center text-white">
                {notification.type === 'success' && <FiCheckCircle className="w-6 h-6 mr-3" />}
                {notification.type === 'error' && <FiAlertTriangle className="w-6 h-6 mr-3" />}
                {notification.type === 'warning' && <FiAlertTriangle className="w-6 h-6 mr-3" />}
                {notification.type === 'info' && <FiTarget className="w-6 h-6 mr-3" />}
                <h3 className="text-lg font-semibold">
                  {notification.type === 'success' ? 'Success' :
                   notification.type === 'error' ? 'Error' :
                   notification.type === 'warning' ? 'Warning' :
                   'Information'}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">{notification.message}</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  closeNotification()
                  // Close parent modal if this was a success notification after task assignment
                  if (notification.type === 'success' && !showMCQPreview && selectedStudents.length === 0) {
                    onClose()
                  }
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  notification.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                  notification.type === 'warning' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
