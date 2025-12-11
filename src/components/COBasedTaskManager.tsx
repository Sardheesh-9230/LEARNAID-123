'use client'

import React, { useState, useEffect } from 'react'
import apiService from '../services/api'
import { 
  Target, 
  Users, 
  TrendingDown,
  CheckCircle, 
  AlertCircle,
  FileText,
  Filter,
  PlayCircle
} from 'lucide-react'

interface Subject {
  _id: string
  name: string
  code: string
}

interface Student {
  _id: string
  name: string
  rollNumber: string
  email: string
}

interface COPerformance {
  courseOutcome: string
  percentage: number
  totalMarks: number
  obtainedMarks: number
  questionCount: number
  isWeak: boolean
}

interface StudentCOAnalysis {
  student: Student
  coPerformance: COPerformance[]
  overallPercentage: number
  weakCOs: string[]
}

export default function COBasedTaskManager() {
  // Selection states
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedExamType, setSelectedExamType] = useState<'CIA1' | 'CIA2' | 'MODEL'>('CIA1')
  const [coThreshold, setCoThreshold] = useState<number>(50)
  
  // Analysis results
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<StudentCOAnalysis[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  
  // Task generation
  const [generatingTasks, setGeneratingTasks] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubjects()
    loadStudents()
  }, [])

  const loadSubjects = async () => {
    try {
      const response = await apiService.getSubjects()
      setSubjects(response.data || [])
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await apiService.getUsersByRole('Student')
      setStudents(response.data || [])
    } catch (err) {
      console.error('Error loading students:', err)
    }
  }

  const analyzeCOPerformance = async () => {
    if (!selectedSubject || !selectedExamType) {
      setError('Please select subject and exam type')
      return
    }

    try {
      setAnalyzing(true)
      setError(null)
      setSuccess(null)

      console.log(`📊 Analyzing CO performance for ${selectedExamType}...`)

      const response = await apiService.makeRequest(
        `/co-performance/analyze-by-exam`,
        {
          method: 'POST',
          body: JSON.stringify({
            subjectId: selectedSubject,
            examType: selectedExamType,
            threshold: coThreshold,
            academicYear: '2024-2025',
            semester: 'Odd'
          })
        }
      )

      if (response.success) {
        setAnalysisResults(response.data.studentsAnalysis || [])
        setSuccess(`Analysis complete! Found ${response.data.totalStudentsWithWeakCOs || 0} students with weak COs`)
        console.log(`✅ Analysis complete:`, response.data)
      } else {
        setError(response.message || 'Analysis failed')
      }
    } catch (err: any) {
      console.error('Error analyzing CO performance:', err)
      setError(err.message || 'Failed to analyze CO performance')
    } finally {
      setAnalyzing(false)
    }
  }

  const generateTasksForSelected = async () => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student')
      return
    }

    try {
      setGeneratingTasks(true)
      setError(null)
      setSuccess(null)

      const selectedStudentData = analysisResults.filter(result => 
        selectedStudents.has(result.student._id)
      )

      console.log(`📝 Generating tasks for ${selectedStudentData.length} students...`)

      const response = await apiService.makeRequest(
        `/co-performance/bulk-assign-tasks`,
        {
          method: 'POST',
          body: JSON.stringify({
            subjectId: selectedSubject,
            examType: selectedExamType,
            studentsData: selectedStudentData.map(data => ({
              studentId: data.student._id,
              weakCOs: data.weakCOs,
              coPerformance: data.coPerformance
            })),
            threshold: coThreshold,
            academicYear: '2024-2025',
            semester: 'Odd'
          })
        }
      )

      if (response.success) {
        const tasksCreated = response.data?.tasksCreated || 0
        setSuccess(`✅ Successfully assigned ${tasksCreated} improvement tasks!`)
        setSelectedStudents(new Set())
        console.log(`✅ Tasks assigned:`, response.data)
        // Re-analyze to refresh data
        await analyzeCOPerformance()
      } else {
        setError(response.message || 'Task generation failed')
      }
    } catch (err: any) {
      console.error('Error generating tasks:', err)
      setError(err.message || 'Failed to generate tasks')
    } finally {
      setGeneratingTasks(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAllWeakStudents = () => {
    const weakStudents = analysisResults
      .filter(result => result.weakCOs.length > 0)
      .map(result => result.student._id)
    setSelectedStudents(new Set(weakStudents))
  }

  const selectedSubjectDetails = subjects.find(s => s._id === selectedSubject)
  const weakStudentsCount = analysisResults.filter(r => r.weakCOs.length > 0).length

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center gap-4">
          <Target className="w-12 h-12" />
          <div>
            <h1 className="text-3xl font-bold">CO-Based Task Manager</h1>
            <p className="text-indigo-100 mt-2">
              Analyze student CO performance by exam and assign targeted improvement tasks
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Filter className="w-6 h-6 text-indigo-600" />
          Analysis Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value as any)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="CIA1">CIA 1 (CO1, CO2)</option>
              <option value="CIA2">CIA 2 (CO3, CO4)</option>
              <option value="MODEL">Model Exam (All COs)</option>
            </select>
          </div>

          {/* CO Threshold */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CO Threshold (%)
            </label>
            <input
              type="number"
              value={coThreshold}
              onChange={(e) => setCoThreshold(parseInt(e.target.value) || 50)}
              min="0"
              max="100"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Students below this will get tasks</p>
          </div>

          {/* Analyze Button */}
          <div className="flex items-end">
            <button
              onClick={analyzeCOPerformance}
              disabled={!selectedSubject || !selectedExamType || analyzing}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {selectedSubjectDetails && (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-800">
              📚 <strong>{selectedSubjectDetails.name}</strong> - 
              Analyzing <strong>{selectedExamType}</strong> marks to find students with CO performance below <strong>{coThreshold}%</strong>
            </p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Analysis Results ({analysisResults.length} students)
            </h2>
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Weak Students:</span>
                <span className="ml-2 font-bold text-red-600">{weakStudentsCount}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Selected:</span>
                <span className="ml-2 font-bold text-indigo-600">{selectedStudents.size}</span>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {weakStudentsCount > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <button
                onClick={selectAllWeakStudents}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Select All Weak Students ({weakStudentsCount})
              </button>
              <button
                onClick={generateTasksForSelected}
                disabled={selectedStudents.size === 0 || generatingTasks}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generatingTasks ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Assign Tasks ({selectedStudents.size})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllWeakStudents()
                        } else {
                          setSelectedStudents(new Set())
                        }
                      }}
                      checked={selectedStudents.size === weakStudentsCount && weakStudentsCount > 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Overall
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    CO Performance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Weak COs
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analysisResults.map((result) => (
                  <tr key={result.student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(result.student._id)}
                        onChange={() => toggleStudentSelection(result.student._id)}
                        disabled={result.weakCOs.length === 0}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{result.student.name}</div>
                        <div className="text-sm text-gray-500">{result.student.rollNumber}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-gray-900">
                          {result.overallPercentage.toFixed(1)}%
                        </div>
                        {result.overallPercentage >= coThreshold ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {result.coPerformance.map((co) => (
                          <div
                            key={co.courseOutcome}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              co.isWeak
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {co.courseOutcome}: {co.percentage.toFixed(0)}%
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {result.weakCOs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {result.weakCOs.map((co) => (
                            <span
                              key={co}
                              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"
                            >
                              {co}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">All COs Attained ✓</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {result.weakCOs.length > 0 ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Needs Improvement
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Good Performance
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
