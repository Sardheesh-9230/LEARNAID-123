'use client'

import { useState, useEffect } from 'react'
import { 
  FiBook, FiClock, FiTarget, FiCheckCircle, FiPlay,
  FiBarChart, FiTrendingUp, FiAlertTriangle, FiAward,
  FiCalendar, FiRefreshCw, FiEye, FiArrowRight, FiCode, FiEdit3
} from 'react-icons/fi'
import apiService from '../services/api'
import StudentMCQTest from './StudentMCQTest'
import StudentCodingTest from './StudentCodingTest'
import StudentShortAnswerTest from './StudentShortAnswerTest'

interface ImprovementTask {
  _id: string
  student?: {
    _id: string
    name: string
    email: string
    rollNumber: string
  }
  subject: {
    _id: string
    name: string
    code: string
    credits: number
  }
  assignedBy: {
    _id: string
    name: string
    email: string
  }
  taskType: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'Assigned' | 'In Progress' | 'Completed' | 'Overdue'
  dueDate: string
  progressPercentage: number
  isMultiStudent?: boolean
  personalizedData?: {
    weakCOs: Array<{
      courseOutcome: string
      coNumber: number
      performanceGap: number
      topics: string[]
    }>
    questions: any[]
    totalMarks: number
    status: string
    attemptCount: number
    scores: Array<{
      score: number
      percentage: number
      timestamp: string
      attemptNumber: number
    }>
  }
  metadata: {
    currentPerformance: number
    targetPerformance: number
    studyTimeMinutes: number
    studyTimeCompleted?: number
    weakAreas: string[]
    generatedMCQs: any
    teacherSettings?: {
      examType?: string
      totalMarks?: number
      courseOutcomes?: string[]
      maxAttempts?: number
      allowRetake?: boolean
      showResultsImmediately?: boolean
      shuffleQuestions?: boolean
    }
    autoAssigned: boolean
    assignmentReason: string
    mcqScores?: Array<{
      score: number
      timestamp: string
      totalQuestions: number
    }>
    codingQuestions?: Array<{
      id: string
      questionText: string
      programmingLanguage?: string
      starterCode?: string
      sampleInput?: string
      sampleOutput?: string
      testCases?: Array<{
        input: string
        expectedOutput: string
        isHidden?: boolean
        marks?: number
      }>
      constraints?: string[]
      marks?: number
      difficulty?: string
      courseOutcome?: string
      topics?: string[]
    }>
    codingSubmissions?: Array<{
      questionId: string
      code: string
      language: string
      timestamp: string
      testCasesPassed: number
      testCasesTotal: number
      marksAwarded: number
      allPassed: boolean
    }>
  }
  requirements: string[]
  studyMaterials: Array<{
    type: string
    title: string
    content: any
    estimatedTime: number
  }>
  createdAt: string
  completedAt?: string
}

interface StudentImprovementDashboardProps {
  studentId?: string
}

export default function StudentImprovementDashboard({ studentId }: StudentImprovementDashboardProps) {
  const [tasks, setTasks] = useState<ImprovementTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<ImprovementTask | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('active')
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'CO_IMPROVEMENT' | 'CO_ASSESSMENT'>('all')
  const [takingTest, setTakingTest] = useState(false)
  const [takingCodingTest, setTakingCodingTest] = useState(false)
  const [takingShortAnswerTest, setTakingShortAnswerTest] = useState(false)

  useEffect(() => {
    loadImprovementTasks()
  }, [studentId])

  const loadImprovementTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current student if not provided
      const currentUser = await apiService.getCurrentUser()
      if (!currentUser.success || !currentUser.data) {
        throw new Error('Failed to get user information')
      }

      // Handle both user structure formats
      const userData = currentUser.data.user || currentUser.data
      const actualStudentId = studentId || userData._id || userData.id

      console.log('🔍 Loading improvement tasks for student:', actualStudentId)
      const response = await apiService.makeRequest(`/improvement-tasks/student/${actualStudentId}/improvement`)

      console.log('📊 API Response:', response)

      if (response.success) {
        const tasksData = response.data || []
        console.log(`✅ Loaded ${tasksData.length} improvement tasks`)
        
        tasksData.forEach((task: ImprovementTask, index: number) => {
          console.log(`\n📋 Task ${index + 1}: ${task.title}`)
          console.log('   - ID:', task._id)
          console.log('   - Type:', task.taskType)
          console.log('   - Status:', task.status)
          console.log('   - Is Multi-Student:', task.isMultiStudent)
          console.log('   - Subject:', task.subject?.name)
          console.log('   - Due Date:', task.dueDate)
          
          if (task.isMultiStudent && task.personalizedData) {
            console.log('   - Personalized Data:')
            console.log('     • Weak COs:', task.personalizedData.weakCOs.map(co => co.courseOutcome).join(', '))
            console.log('     • Questions:', task.personalizedData.questions.length)
            console.log('     • Total Marks:', task.personalizedData.totalMarks)
            console.log('     • Attempt Count:', task.personalizedData.attemptCount)
          }
          
          if (task.metadata?.generatedMCQs) {
            console.log('   - MCQ Data:')
            console.log('     • Total Questions:', task.metadata.generatedMCQs.totalQuestions)
            console.log('     • Has Questions Array:', !!task.metadata.generatedMCQs.questions)
            console.log('     • Questions Count:', task.metadata.generatedMCQs.questions?.length || 0)
            console.log('     • Needs Generation:', task.metadata.generatedMCQs.needsGeneration)
          }
          
          if (task.metadata?.teacherSettings) {
            console.log('   - Teacher Settings:')
            console.log('     • Exam Type:', task.metadata.teacherSettings.examType)
            console.log('     • Total Marks:', task.metadata.teacherSettings.totalMarks)
            console.log('     • COs:', task.metadata.teacherSettings.courseOutcomes?.join(', '))
          }
        })
        
        setTasks(tasksData)
      } else {
        throw new Error(response.message || 'Failed to load improvement tasks')
      }
    } catch (err: any) {
      console.error('❌ Error loading improvement tasks:', err)
      setError(err.message || 'Failed to load improvement tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const updateTaskProgress = async (taskId: string, updates: any) => {
    try {
      console.log('📤 Updating task progress:', { taskId, updates })
      
      const response = await apiService.makeRequest(`/improvement-tasks/${taskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      console.log('📥 Progress update response:', response)

      if (response.success) {
        console.log('✅ Progress updated, reloading tasks...')
        // Reload fresh data — DO NOT use response.data directly as it's un-transformed
        // (multi-student tasks need the personalizedData / isMultiStudent transformation)
        await loadImprovementTasks()
      } else {
        console.error('❌ Progress update failed:', response)
        throw new Error(response.message || 'Failed to update progress')
      }
    } catch (error) {
      console.error('❌ Error updating task progress:', error)
      throw error
    }
  }

  const startTask = async (task: ImprovementTask) => {
    console.log('🚀 Starting task:', task._id, task.title)
    console.log('Task details:', { 
      isMultiStudent: task.isMultiStudent, 
      status: task.status,
      personalizedStatus: task.personalizedData?.status 
    })
    
    try {
      await updateTaskProgress(task._id, { 
        status: 'In Progress',
        progressPercentage: 10
      })
      console.log('✅ Task started successfully')
    } catch (error) {
      console.error('❌ Error starting task:', error)
      alert('Failed to start task. Please check console for details.')
    }
  }

  const completeStudySession = async (task: ImprovementTask, minutesStudied: number) => {
    await updateTaskProgress(task._id, {
      studyTimeCompleted: minutesStudied,
      progressPercentage: Math.min(task.progressPercentage + 25, 90)
    })
  }

  const submitMCQScore = async (task: ImprovementTask, score: number, totalQuestions: number) => {
    const newProgressPercentage = score >= 70 ? 100 : Math.min(task.progressPercentage + 30, 90)
    const newStatus = score >= 70 && 
      (task.metadata.studyTimeCompleted || 0) >= task.metadata.studyTimeMinutes 
      ? 'Completed' : 'In Progress'

    await updateTaskProgress(task._id, {
      mcqScore: score,
      totalQuestions,
      progressPercentage: newProgressPercentage,
      status: newStatus
    })
  }

  const filteredTasks = tasks.filter(task => {
    // Filter by status
    const statusMatch = (() => {
      switch (activeTab) {
        case 'active':
          return ['Assigned', 'In Progress'].includes(task.status)
        case 'completed':
          return task.status === 'Completed'
        default:
          return true
      }
    })()
    
    // Filter by task type
    const typeMatch = taskTypeFilter === 'all' || task.taskType === taskTypeFilter
    
    return statusMatch && typeMatch
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100'
      case 'MEDIUM': return 'text-orange-600 bg-orange-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100'
      case 'In Progress': return 'text-blue-600 bg-blue-100'
      case 'Assigned': return 'text-yellow-600 bg-yellow-100'
      case 'Overdue': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900">Loading Improvement Tasks...</h3>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Tasks</h3>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadImprovementTasks}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <FiRefreshCw className="inline mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <FiTarget size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Improvement Tasks</h1>
              <p className="text-purple-100 mt-2">
                Complete these tasks to improve your Course Outcome performance
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">{filteredTasks.filter(t => t.status === 'Completed').length}</div>
            <div className="text-purple-200 text-sm">Tasks Completed</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiBook className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <FiClock className="text-orange-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => ['Assigned', 'In Progress'].includes(t.status)).length}
              </div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'Completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>



      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1">
            {[
              { key: 'active', label: 'Active Tasks', count: tasks.filter(t => ['Assigned', 'In Progress'].includes(t.status)).length },
              { key: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'Completed').length },
              { key: 'all', label: 'All Tasks', count: tasks.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          
          {/* Task Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">Type:</span>
            <select
              value={taskTypeFilter}
              onChange={(e) => setTaskTypeFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types ({tasks.length})</option>
              <option value="CO_ASSESSMENT">Assessment Tasks ({tasks.filter(t => t.taskType === 'CO_ASSESSMENT').length})</option>
              <option value="CO_IMPROVEMENT">Improvement Tasks ({tasks.filter(t => t.taskType === 'CO_IMPROVEMENT').length})</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <FiTarget className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'active' ? 'No Active Tasks' : 
                 activeTab === 'completed' ? 'No Completed Tasks' : 'No Tasks Found'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'active' 
                  ? 'Great job! You don\'t have any pending improvement tasks.'
                  : activeTab === 'completed'
                  ? 'Complete some tasks to see them here.'
                  : 'Tasks will appear here when assigned based on your performance.'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      
                      {/* Task Type Badge */}
                      {task.taskType === 'CO_ASSESSMENT' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                          <FiTarget size={12} />
                          Assessment Task
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                          <FiTrendingUp size={12} />
                          Improvement Task
                        </span>
                      )}
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {/* MCQ Availability Badge */}
                      {task.metadata?.generatedMCQs && (
                        task.metadata.generatedMCQs.needsGeneration ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                            <FiRefreshCw size={12} />
                            MCQs Generating
                          </span>
                        ) : task.metadata.generatedMCQs.totalQuestions > 0 ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                            <FiCheckCircle size={12} />
                            {task.metadata.generatedMCQs.totalQuestions} MCQs Ready
                          </span>
                        ) : null
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    {/* Show Personalized CO Info for Multi-Student Tasks */}
                    {task.isMultiStudent && task.personalizedData && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Your Personalized Assessment</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-blue-700">
                            <FiTarget size={14} />
                            <span className="font-medium">
                              Weak COs: {(task.personalizedData?.weakCOs || []).map((co: any) => co.courseOutcome).join(', ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-700">
                            <FiCheckCircle size={14} />
                            <span className="font-medium">
                              {task.personalizedData?.questions?.length || 0} Questions
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-700">
                            <FiAward size={14} />
                            <span className="font-medium">
                              {task.personalizedData.totalMarks} Marks
                            </span>
                          </div>
                          {task.personalizedData.attemptCount > 0 && (
                            <div className="flex items-center gap-1 text-blue-700">
                              <FiRefreshCw size={14} />
                              <span className="font-medium">
                                Attempts: {task.personalizedData.attemptCount}
                              </span>
                            </div>
                          )}
                        </div>
                        {(task.personalizedData?.scores?.length || 0) > 0 && (
                          <div className="mt-2 text-sm text-blue-800">
                            Latest Score: <span className="font-bold">
                              {(task.personalizedData?.scores?.[task.personalizedData.scores.length - 1]?.percentage ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show Assessment-specific info */}
                    {task.taskType === 'CO_ASSESSMENT' && task.metadata?.teacherSettings && (
                      <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex flex-wrap gap-4 text-sm">
                          {task.metadata.teacherSettings.examType && (
                            <div className="flex items-center gap-1 text-purple-700">
                              <FiTarget size={14} />
                              <span className="font-medium">{task.metadata.teacherSettings.examType}</span>
                            </div>
                          )}
                          {task.metadata.teacherSettings.totalMarks && (
                            <div className="flex items-center gap-1 text-purple-700">
                              <FiAward size={14} />
                              <span className="font-medium">{task.metadata.teacherSettings.totalMarks} Marks</span>
                            </div>
                          )}
                          {task.metadata.teacherSettings.courseOutcomes && (
                            <div className="flex items-center gap-1 text-purple-700">
                              <FiBook size={14} />
                              <span className="font-medium">COs: {task.metadata.teacherSettings.courseOutcomes.join(', ')}</span>
                            </div>
                          )}
                          {task.metadata.teacherSettings.maxAttempts && (
                            <div className="flex items-center gap-1 text-purple-700">
                              <FiRefreshCw size={14} />
                              <span className="font-medium">{task.metadata.teacherSettings.maxAttempts} Attempt(s)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiBook size={16} />
                        {task.subject.name} ({task.subject.code})
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock size={16} />
                        {task.metadata.studyTimeMinutes} min study time
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar size={16} />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {task.progressPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">Progress</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progressPercentage}%` }}
                  ></div>
                </div>

                {/* Performance Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{task.metadata.currentPerformance.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{task.metadata.targetPerformance}%</div>
                    <div className="text-xs text-gray-500">Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {task.metadata.studyTimeCompleted || 0}/{task.metadata.studyTimeMinutes}
                    </div>
                    <div className="text-xs text-gray-500">Study Time (min)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {task.isMultiStudent 
                        ? (task.personalizedData?.scores && task.personalizedData.scores.length > 0
                          ? Math.max(...task.personalizedData.scores.map((s: any) => s.percentage || 0)).toFixed(1)
                          : 0)
                        : (task.metadata.mcqScores && task.metadata.mcqScores.length > 0
                          ? Math.max(...task.metadata.mcqScores.map(s => s.score))
                          : 0)
                      }%
                    </div>
                    <div className="text-xs text-gray-500">Best MCQ Score</div>
                  </div>
                </div>

                {/* Previous Attempts History */}
                {((task.isMultiStudent && task.personalizedData?.scores && task.personalizedData.scores.length > 0) ||
                  (!task.isMultiStudent && task.metadata.mcqScores && task.metadata.mcqScores.length > 0)) && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <FiTarget size={16} />
                      Previous Attempts ({task.isMultiStudent ? task.personalizedData?.attemptCount || 0 : task.metadata.mcqScores?.length || 0}/{task.metadata?.teacherSettings?.maxAttempts || 3})
                    </h4>
                    <div className="space-y-2">
                      {task.isMultiStudent 
                        ? task.personalizedData?.scores?.slice(-3).reverse().map((attempt: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Attempt {(task.personalizedData?.attemptCount || 0) - index}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(attempt.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold ${attempt.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {attempt.percentage.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-600">
                                  {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                </span>
                                {attempt.passed && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    ✓ Passed
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        : task.metadata.mcqScores?.slice(-3).reverse().map((attempt: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                  Attempt {(task.metadata?.mcqScores?.length || 0) - index}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(attempt.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {attempt.score}%
                                </span>
                                <span className="text-xs text-gray-600">
                                  {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                </span>
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    // Get the correct status for multi-student or single-student tasks
                    const currentStatus = task.isMultiStudent 
                      ? (task.personalizedData?.status || task.status)
                      : task.status
                    
                    console.log('🔘 Button rendering for task:', task.title, {
                      isMultiStudent: task.isMultiStudent,
                      taskStatus: task.status,
                      personalizedStatus: task.personalizedData?.status,
                      currentStatus: currentStatus
                    })
                    
                    if (currentStatus === 'Assigned') {
                      console.log('✅ Rendering "Start Task" button')
                      return (
                        <button
                          onClick={() => {
                            console.log('🖱️ Start Task button clicked!')
                            startTask(task)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiPlay size={16} />
                          Start Task
                        </button>
                      )
                    }
                    
                    if (currentStatus === 'In Progress') {
                      // Gather all questions (personalizedData takes priority for multi-student tasks)
                      const _pdQs = task.personalizedData?.questions
                      const allQs: any[] = (
                        (_pdQs && _pdQs.length > 0)
                          ? _pdQs
                          : task.metadata?.generatedMCQs?.questions
                      ) || []

                      // Separate question types
                      const mcqQs = allQs.filter((q: any) => !q.questionType || q.questionType === 'MCQ')
                      const saQs = allQs.filter((q: any) => q.questionType === 'Short Answer')
                      const codingQs = [
                        ...(task.metadata?.codingQuestions || []),
                        ...allQs.filter((q: any) => q.questionType === 'Coding')
                      ]
                      // Deduplicate coding questions by id
                      const uniqueCodingQs = codingQs.filter(
                        (q: any, i: number, arr: any[]) =>
                          arr.findIndex((x: any) => x.id === q.id) === i
                      )

                      const attemptCount = task.isMultiStudent
                        ? (task.personalizedData?.attemptCount || 0)
                        : (task.metadata?.mcqScores?.length || 0)
                      const maxAttempts = task.metadata?.teacherSettings?.maxAttempts || 3
                      const canRetake = attemptCount < maxAttempts
                      const hasAttempted = attemptCount > 0

                      return (
                        <>
                          {/* MCQ button – only when there are real MCQ questions */}
                          {mcqQs.length > 0 && (
                            canRetake ? (
                              <button
                                onClick={() => { setSelectedTask(task); setTakingTest(true) }}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                <FiTarget size={16} />
                                {hasAttempted
                                  ? `Retake Quiz (${attemptCount}/${maxAttempts})`
                                  : `Take MCQ Quiz (${mcqQs.length} Questions)`}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                                <FiTarget size={16} />
                                Max Attempts Reached ({maxAttempts}/{maxAttempts})
                              </div>
                            )
                          )}

                          {/* Coding button – shows whenever any coding question exists */}
                          {uniqueCodingQs.length > 0 && (
                            <button
                              onClick={() => { setSelectedTask(task); setTakingCodingTest(true) }}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <FiCode size={16} />
                              Solve Coding ({uniqueCodingQs.length} Problem{uniqueCodingQs.length !== 1 ? 's' : ''})
                            </button>
                          )}

                          {/* Short Answer button */}
                          {saQs.length > 0 && (
                            <button
                              onClick={() => { setSelectedTask(task); setTakingShortAnswerTest(true) }}
                              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            >
                              <FiEdit3 size={16} />
                              Answer Short Questions ({saQs.length})
                            </button>
                          )}
                        </>
                      )
                    }
                    
                    return null
                  })()}
                  
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FiEye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MCQ Test Modal */}
      {takingTest && selectedTask && (
        <>
          <StudentMCQTest
            task={selectedTask}
            onComplete={() => {
              loadImprovementTasks()
              setTakingTest(false)
            }}
            onClose={() => setTakingTest(false)}
          />
        </>
      )}

      {/* Short Answer Test */}
      {takingShortAnswerTest && selectedTask && (
        <StudentShortAnswerTest
          task={selectedTask}
          onComplete={() => {
            setTakingShortAnswerTest(false)
            loadImprovementTasks()
          }}
          onClose={() => {
            setTakingShortAnswerTest(false)
          }}
        />
      )}

      {/* Coding Test Environment */}
      {takingCodingTest && selectedTask && (
        <StudentCodingTest
          task={selectedTask}
          onComplete={() => {
            loadImprovementTasks()
          }}
          onClose={() => {
            setTakingCodingTest(false)
            loadImprovementTasks()
          }}
        />
      )}

      {/* Task Detail Modal - Only show when NOT taking any test */}
      {selectedTask && !takingTest && !takingShortAnswerTest && !takingCodingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTask.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedTask.subject.name}</p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <ul className="space-y-2">
                    {selectedTask.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Focus Areas — derived from personalizedData.weakCOs (multi-student) or metadata.weakAreas */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // For multi-student tasks use the rich CO data
                      if (selectedTask.isMultiStudent && selectedTask.personalizedData?.weakCOs?.length) {
                        return selectedTask.personalizedData.weakCOs.flatMap((co: any) =>
                          (co.topics?.length ? co.topics : [co.courseOutcome])
                            .map((t: string, i: number) => (
                              <span key={`${co.courseOutcome}-${i}`}
                                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                                {t}
                              </span>
                            ))
                        )
                      }
                      // Fallback: plain weakAreas, filter out generic placeholder
                      const areas = (selectedTask.metadata.weakAreas || [])
                        .filter((a: string) => a && a !== 'General Topics')
                      if (areas.length === 0) {
                        return <span className="text-sm text-gray-500 italic">Topics not specified</span>
                      }
                      return areas.map((area: string, index: number) => (
                        <span key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {area}
                        </span>
                      ))
                    })()}
                  </div>
                </div>
              </div>

              {/* MCQ Section */}
              {selectedTask.metadata?.generatedMCQs && (() => {
                const allDetailQs: any[] = selectedTask.metadata.generatedMCQs.questions || []
                const mcqDetailQs = allDetailQs.filter((q: any) => !q.questionType || q.questionType === 'MCQ')
                const saDetailQs = allDetailQs.filter((q: any) => q.questionType === 'Short Answer')
                const codingDetailQs = allDetailQs.filter((q: any) => q.questionType === 'Coding')

                return (
                  <>
                    {/* MCQ quiz launcher */}
                    {mcqDetailQs.length > 0 && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <FiTarget className="text-blue-600" />
                          MCQ Practice ({mcqDetailQs.length} Questions)
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">Target Score: 70% or higher</p>
                        <button
                          onClick={() => setTakingTest(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiPlay size={16} />
                          Start MCQ Quiz ({mcqDetailQs.length} Questions)
                        </button>
                      </div>
                    )}

                    {/* Short Answer — read-only question list */}
                    {saDetailQs.length > 0 && (
                      <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-teal-900">
                          <FiEdit3 className="text-teal-600" />
                          Short Answer Questions ({saDetailQs.length})
                        </h3>
                        <p className="text-xs text-teal-700 mb-4">Review these questions and prepare your written answers.</p>
                        <div className="space-y-4">
                          {saDetailQs.map((q: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-lg border border-teal-200">
                              <p className="font-medium text-gray-900 mb-2">Q{i + 1}. {q.question || q.questionText}</p>
                              {q.marks && <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded">{q.marks} marks</span>}
                              {q.expectedAnswer && (
                                <details className="mt-3">
                                  <summary className="text-xs font-semibold text-teal-700 cursor-pointer">Show Model Answer</summary>
                                  <p className="mt-2 text-sm text-teal-800 p-2 bg-teal-50 rounded">{q.expectedAnswer}</p>
                                  {q.keyPoints?.length > 0 && (
                                    <ul className="mt-2 list-disc list-inside text-xs text-teal-700 space-y-0.5">
                                      {q.keyPoints.map((pt: string, j: number) => <li key={j}>{pt}</li>)}
                                    </ul>
                                  )}
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coding problems launcher from detail modal */}
                    {codingDetailQs.length > 0 && (
                      <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-indigo-900">
                          <FiCode className="text-indigo-600" />
                          Coding Problems ({codingDetailQs.length})
                        </h3>
                        <button
                          onClick={() => { setTakingCodingTest(true) }}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <FiCode size={16} />
                          Open Coding Environment
                        </button>
                      </div>
                    )}

                    {/* Fallback if no specific question types */}
                    {mcqDetailQs.length === 0 && saDetailQs.length === 0 && codingDetailQs.length === 0 && allDetailQs.length === 0 && (
                      <div className="mt-6 flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-gray-600">
                        <FiAlertTriangle size={20} />
                        <span>No questions available yet. Please contact your instructor.</span>
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Test Results Section */}
              {((selectedTask.isMultiStudent && selectedTask.personalizedData?.scores && selectedTask.personalizedData.scores.length > 0) ||
                (!selectedTask.isMultiStudent && selectedTask.metadata.mcqScores && selectedTask.metadata.mcqScores.length > 0)) && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-green-600" />
                    Test Results History
                  </h3>
                  <div className="space-y-4">
                    {selectedTask.isMultiStudent 
                      ? selectedTask.personalizedData?.scores?.map((attempt: any, index: number) => (
                          <div key={index} className="p-4 bg-white rounded-lg border-2 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="font-bold text-gray-900">Attempt {index + 1}</span>
                                <span className="ml-3 text-sm text-gray-500">
                                  {new Date(attempt.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${attempt.percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {attempt.percentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {attempt.correctAnswers}/{attempt.totalQuestions} correct • {attempt.obtainedMarks}/{attempt.totalMarks} marks
                                </div>
                              </div>
                            </div>
                            
                            {attempt.coWiseResults && Object.keys(attempt.coWiseResults).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-sm font-semibold text-gray-700 mb-2">CO-wise Performance:</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(attempt.coWiseResults).map(([co, data]: [string, any]) => {
                                    const coPercentage = (data.obtainedMarks / data.totalMarks) * 100
                                    return (
                                      <div key={co} className="p-2 bg-gray-50 rounded">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-medium text-gray-700">{co}</span>
                                          <span className={`text-xs font-bold ${coPercentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                            {coPercentage.toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {data.correctAnswers}/{data.totalQuestions} • {data.obtainedMarks}/{data.totalMarks}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {attempt.passed && (
                              <div className="mt-3 flex items-center gap-2 text-green-700">
                                <FiCheckCircle size={16} />
                                <span className="text-sm font-medium">✓ Passed - Target achieved!</span>
                              </div>
                            )}
                          </div>
                        ))
                      : selectedTask.metadata.mcqScores?.map((attempt: any, index: number) => (
                          <div key={index} className="p-4 bg-white rounded-lg border-2 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-bold text-gray-900">Attempt {index + 1}</span>
                                <span className="ml-3 text-sm text-gray-500">
                                  {new Date(attempt.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                  {attempt.score}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}