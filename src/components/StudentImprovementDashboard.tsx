'use client'

import { useState, useEffect } from 'react'
import { 
  FiBook, FiClock, FiTarget, FiCheckCircle, FiPlay,
  FiBarChart, FiTrendingUp, FiAlertTriangle, FiAward,
  FiCalendar, FiRefreshCw, FiEye, FiArrowRight
} from 'react-icons/fi'
import apiService from '../services/api'
import StudentMCQTest from './StudentMCQTest'

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
      const response = await apiService.makeRequest(`/improvement-tasks/${taskId}/progress`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      if (response.success) {
        // Update local task state
        setTasks(prev => prev.map(task => 
          task._id === taskId ? response.data : task
        ))
        
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(response.data)
        }
      }
    } catch (error) {
      console.error('Error updating task progress:', error)
    }
  }

  const startTask = async (task: ImprovementTask) => {
    await updateTaskProgress(task._id, { 
      status: 'In Progress',
      progressPercentage: 10
    })
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

      {/* Debug Info (remove in production) */}
      {tasks.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <FiAlertTriangle className="text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">Debug Info:</p>
              <p className="text-yellow-800">
                Loaded {tasks.length} task(s) |
                Multi-Student: {tasks.filter(t => t.isMultiStudent).length} |
                Assessment: {tasks.filter(t => t.taskType === 'CO_ASSESSMENT').length} |
                With MCQs: {tasks.filter(t => t.metadata?.generatedMCQs?.questions?.length > 0).length}
              </p>
              <p className="text-yellow-700 mt-1">Check browser console for detailed logs</p>
            </div>
          </div>
        </div>
      )}

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
                              Weak COs: {task.personalizedData.weakCOs.map(co => co.courseOutcome).join(', ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-700">
                            <FiCheckCircle size={14} />
                            <span className="font-medium">
                              {task.personalizedData.questions.length} Questions
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
                        {task.personalizedData.scores.length > 0 && (
                          <div className="mt-2 text-sm text-blue-800">
                            Latest Score: <span className="font-bold">
                              {task.personalizedData.scores[task.personalizedData.scores.length - 1].percentage.toFixed(1)}%
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
                      {task.metadata.mcqScores ? Math.max(...task.metadata.mcqScores.map(s => s.score)) : 0}%
                    </div>
                    <div className="text-xs text-gray-500">Best MCQ Score</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {task.status === 'Assigned' && (
                    <button
                      onClick={() => startTask(task)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FiPlay size={16} />
                      Start Task
                    </button>
                  )}
                  
                  {task.status === 'In Progress' && (
                    <>
                      <button
                        onClick={() => completeStudySession(task, 30)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FiClock size={16} />
                        Log 30min Study
                      </button>
                      
                      {task.metadata.generatedMCQs && task.metadata.generatedMCQs.questions && task.metadata.generatedMCQs.questions.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedTask(task)
                            setTakingTest(true)
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <FiTarget size={16} />
                          Take MCQ Quiz ({task.metadata.generatedMCQs.questions.length} Questions)
                        </button>
                      )}
                    </>
                  )}
                  
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
        <StudentMCQTest
          task={selectedTask}
          onComplete={() => {
            loadImprovementTasks()
            setTakingTest(false)
          }}
          onClose={() => {
            setTakingTest(false)
          }}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
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

                {/* Weak Areas */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.metadata.weakAreas.map((area, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* MCQ Section */}
              {selectedTask.metadata?.generatedMCQs && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FiTarget className="text-blue-600" />
                    Practice Questions Available
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {selectedTask.metadata.generatedMCQs.totalQuestions || 0} questions generated for your weak areas
                    {selectedTask.metadata.generatedMCQs.difficultyLevel && (
                      <span className="ml-2 px-2 py-1 text-sm bg-blue-200 text-blue-800 rounded font-medium">
                        {selectedTask.metadata.generatedMCQs.difficultyLevel}
                      </span>
                    )}
                    {selectedTask.metadata.generatedMCQs.materialUsed && (
                      <span className="ml-2 px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded">
                        📚 {selectedTask.metadata.generatedMCQs.materialUsed}
                      </span>
                    )}
                  </p>
                  {selectedTask.metadata.generatedMCQs.needsGeneration ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-yellow-100 rounded-lg text-yellow-800">
                        <FiRefreshCw size={20} className="animate-spin" />
                        <div>
                          <div className="font-medium">Questions are being generated</div>
                          <div className="text-sm">{selectedTask.metadata.generatedMCQs.message || 'Please check back later.'}</div>
                        </div>
                      </div>
                    </div>
                  ) : selectedTask.metadata.generatedMCQs.questions && selectedTask.metadata.generatedMCQs.questions.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Focus Areas: {selectedTask.metadata.generatedMCQs.areas?.join(', ') || selectedTask.metadata.weakAreas.join(', ')}
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          Target Score: 70% or higher
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setTakingTest(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiPlay size={16} />
                        Start Practice Quiz ({selectedTask.metadata.generatedMCQs.questions.length} Questions)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-gray-600">
                      <FiAlertTriangle size={20} />
                      <span>No questions available yet. Please contact your instructor.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}