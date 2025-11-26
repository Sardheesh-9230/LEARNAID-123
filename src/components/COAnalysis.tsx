'use client'

import { useState } from 'react'
import { FiTarget, FiTrendingUp, FiCheckCircle, FiAlertTriangle, FiBook, FiClock } from 'react-icons/fi'
import apiService from '../services/api'

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

interface COAnalysisProps {
  studentId?: string
  subjects: {
    _id: string
    name: string
    code: string
  }[]
  onTasksAssigned?: (count: number) => void
  onNotification?: (message: string) => void
}

export default function COAnalysisComponent({ 
  studentId, 
  subjects, 
  onTasksAssigned, 
  onNotification 
}: COAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<COAnalysisResult | null>(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [showResults, setShowResults] = useState(false)

  const runCOAnalysis = async () => {
    if (!selectedSubject || !studentId) {
      onNotification?.('Please select a subject for CO analysis')
      return
    }

    setLoading(true)
    try {
      const response = await apiService.makeRequest('/co-performance/analyze', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubject,
          academicYear: '2024-2025',
          threshold: 50
        })
      })
      
      if (response.success) {
        setAnalysis(response.data)
        setShowResults(true)
        
        const assignedCount = response.data.tasksAssigned.filter((t: any) => t.status === 'assigned').length
        onTasksAssigned?.(assignedCount)
        
        if (assignedCount > 0) {
          onNotification?.(`CO analysis completed! ${assignedCount} improvement tasks assigned based on Course Outcome performance.`)
        } else {
          onNotification?.('CO analysis completed! Your performance meets the Course Outcome requirements.')
        }
      } else {
        onNotification?.(`CO analysis failed: ${response.message}`)
      }
    } catch (error) {
      console.error('Error performing CO analysis:', error)
      onNotification?.('Error performing CO analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-xl">
          <FiTarget className="text-purple-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Course Outcome (CO) Performance Analysis</h2>
          <p className="text-gray-600 text-sm">Analyze performance by Course Outcomes and auto-assign improvement tasks</p>
        </div>
      </div>

      {/* Subject Selection and Analysis Trigger */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subject for CO Analysis
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Choose a subject...</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={runCOAnalysis}
          disabled={loading || !selectedSubject}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Analyzing...
            </>
          ) : (
            <>
              <FiTarget size={16} />
              Run CO Analysis
            </>
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {showResults && analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalCOs}</div>
                <div className="text-sm text-gray-600">Total COs</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border border-green-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.attainedCOs}</div>
                <div className="text-sm text-gray-600">Attained</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border border-red-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.notAttainedCOs}</div>
                <div className="text-sm text-gray-600">Not Attained</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border border-purple-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analysis.overallPerformance.averagePercentage}%</div>
                <div className="text-sm text-gray-600">Average Performance</div>
              </div>
            </div>
          </div>

          {/* Subject Info */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Analysis Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Subject:</span>
                <div className="font-medium">{analysis.subjectName}</div>
              </div>
              <div>
                <span className="text-gray-600">Subject Code:</span>
                <div className="font-medium">{analysis.subjectCode}</div>
              </div>
              <div>
                <span className="text-gray-600">Academic Year:</span>
                <div className="font-medium">{analysis.academicYear}</div>
              </div>
              <div>
                <span className="text-gray-600">Threshold:</span>
                <div className="font-medium">{analysis.threshold}%</div>
              </div>
            </div>
          </div>

          {/* Individual CO Performance */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CO-wise Performance Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.coPerformance.map((co, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-gray-900">{co.courseOutcome}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      co.attainment === 'Attained' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {co.attainment === 'Attained' ? (
                        <div className="flex items-center gap-1">
                          <FiCheckCircle size={12} />
                          Attained
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <FiAlertTriangle size={12} />
                          Not Attained
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Performance</span>
                      <span className={`font-medium ${
                        co.percentage >= 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {co.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          co.percentage >= 50 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(co.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Questions:</span>
                      <span className="text-gray-900">{co.questionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marks:</span>
                      <span className="text-gray-900">{co.obtainedMarks}/{co.totalMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exams:</span>
                      <span className="text-gray-900">{co.examTypes.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Tasks */}
          {analysis.tasksAssigned.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiBook size={18} />
                Improvement Tasks Assigned
              </h3>
              <div className="space-y-3">
                {analysis.tasksAssigned.map((task, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    task.status === 'assigned' 
                      ? 'bg-green-50 border-green-400'
                      : task.status === 'already_exists'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {task.courseOutcome} Improvement Task
                        </div>
                        <div className="text-sm text-gray-600">{task.message}</div>
                        {task.taskId && (
                          <div className="text-xs text-gray-500 mt-1">
                            Task ID: {task.taskId}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {task.priority && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority} Priority
                          </div>
                        )}
                        {task.studyTime && (
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <FiClock size={12} />
                            {task.studyTime} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Summary */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Tasks Summary:</strong> {analysis.tasksAssigned.filter(t => t.status === 'assigned').length} new tasks assigned, 
                  {analysis.tasksAssigned.filter(t => t.status === 'already_exists').length} existing tasks found
                </div>
              </div>
            </div>
          )}
          
          {analysis.tasksAssigned.length === 0 && (
            <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
              <div className="text-green-600 text-lg font-semibold mb-2">
                🎉 Excellent Performance!
              </div>
              <div className="text-green-700">
                All Course Outcomes have been attained successfully. No improvement tasks needed.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}