'use client'

import { useState, useEffect } from 'react'
import { 
  FiBarChart, FiTrendingUp, FiUsers, FiBook, 
  FiTarget, FiAward, FiAlertTriangle, FiCheckCircle,
  FiDownload, FiFilter, FiRefreshCw
} from 'react-icons/fi'
import apiService from '../services/api'
import { exportComplexDataToExcel } from '../utils/excelExport'

interface StudentPerformance {
  studentId: string
  studentName: string
  rollNumber: string
  totalMarks: number
  totalPossible: number
  percentage: number
  grade: string
  weakChapters: string[]
  strongChapters: string[]
  coPerformance: { [coNumber: string]: number }
}

interface CourseOutcomeAnalysis {
  coNumber: string
  coDescription: string
  averageAttainment: number
  studentsAbove60: number
  studentsBelow40: number
  totalStudents: number
  attainmentLevel: 'Poor' | 'Average' | 'Good' | 'Excellent'
}

interface TotalMarksAnalyticsProps {
  examId?: string
  subjectId?: string
  courseId?: string
}

export default function TotalMarksAnalytics({ examId, subjectId, courseId }: TotalMarksAnalyticsProps) {
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([])
  const [coAnalysis, setCoAnalysis] = useState<CourseOutcomeAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pass' | 'fail' | 'weak'>('all')
  const [selectedCO, setSelectedCO] = useState<string>('all')
  
  // Statistics
  const [stats, setStats] = useState({
    totalStudents: 0,
    passCount: 0,
    failCount: 0,
    averageMarks: 0,
    highestMarks: 0,
    lowestMarks: 0,
    averagePercentage: 0
  })

  useEffect(() => {
    if (examId || subjectId || courseId) {
      loadAnalytics()
    }
  }, [examId, subjectId, courseId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load student performance data
      const performanceResponse = await apiService.makeRequest(
        `/analytics/performance/comprehensive?${new URLSearchParams({
          examId: examId || '',
          subjectId: subjectId || '', 
          courseId: courseId || ''
        }).toString()}`
      )

      if (performanceResponse.success) {
        const data = performanceResponse.data
        setStudentPerformances(data.studentPerformances || [])
        setCoAnalysis(data.coAnalysis || [])
        
        // Calculate statistics
        const performances = data.studentPerformances || []
        const totalStudents = performances.length
        const passCount = performances.filter((p: any) => p.percentage >= 40).length
        const failCount = totalStudents - passCount
        const averageMarks = performances.reduce((sum: number, p: any) => sum + p.totalMarks, 0) / totalStudents || 0
        const averagePercentage = performances.reduce((sum: number, p: any) => sum + p.percentage, 0) / totalStudents || 0
        const highestMarks = Math.max(...performances.map((p: any) => p.totalMarks))
        const lowestMarks = Math.min(...performances.map((p: any) => p.totalMarks))

        setStats({
          totalStudents,
          passCount,
          failCount,
          averageMarks: Math.round(averageMarks * 100) / 100,
          highestMarks,
          lowestMarks,
          averagePercentage: Math.round(averagePercentage * 100) / 100
        })
      }
    } catch (err: any) {
      console.error('Error loading analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Filter students based on selected criteria
  const filteredStudents = studentPerformances.filter(student => {
    switch (selectedFilter) {
      case 'pass':
        return student.percentage >= 40
      case 'fail':
        return student.percentage < 40
      case 'weak':
        return student.weakChapters.length > student.strongChapters.length
      default:
        return true
    }
  })

  // Get performance distribution
  const getPerformanceDistribution = () => {
    const distribution = {
      excellent: studentPerformances.filter(s => s.percentage >= 90).length,
      good: studentPerformances.filter(s => s.percentage >= 70 && s.percentage < 90).length,
      average: studentPerformances.filter(s => s.percentage >= 50 && s.percentage < 70).length,
      poor: studentPerformances.filter(s => s.percentage >= 40 && s.percentage < 50).length,
      fail: studentPerformances.filter(s => s.percentage < 40).length
    }
    return distribution
  }

  const performanceDistribution = getPerformanceDistribution()

  const exportAnalytics = async () => {
    try {
      // This would generate detailed analytics report
      const reportData = {
        statistics: stats,
        studentPerformances: filteredStudents,
        coAnalysis,
        performanceDistribution,
        timestamp: new Date().toISOString()
      }
      
      const filename = `performance_analytics_${new Date().toISOString().split('T')[0]}`
      const success = exportComplexDataToExcel(reportData, filename)
      
      if (success) {
        alert('📊 Analytics exported successfully to Excel!')
      } else {
        setError('Failed to export analytics')
      }
    } catch (err: any) {
      setError('Failed to export analytics')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900">Loading Analytics...</h3>
            <p className="text-gray-500 mt-2">Calculating performance metrics and course outcome analysis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <FiBarChart size={40} />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Total Marks & Performance Analytics</h1>
                <p className="text-blue-100 mt-2">
                  Comprehensive analysis of student performance and course outcome attainment
                </p>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={loadAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <FiRefreshCw size={20} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiUsers className="text-blue-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.passCount}</div>
                <div className="text-sm text-gray-600">Students Passed</div>
                <div className="text-xs text-green-600 font-medium">
                  {stats.totalStudents > 0 ? ((stats.passCount / stats.totalStudents) * 100).toFixed(1) : 0}% Pass Rate
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FiTrendingUp className="text-yellow-600" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.averageMarks}</div>
                <div className="text-sm text-gray-600">Average Marks</div>
                <div className="text-xs text-yellow-600 font-medium">
                  {stats.averagePercentage.toFixed(1)}% Average
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
                <div className="text-2xl font-bold text-gray-900">{stats.highestMarks}</div>
                <div className="text-sm text-gray-600">Highest Marks</div>
                <div className="text-xs text-purple-600 font-medium">
                  Lowest: {stats.lowestMarks}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <FiBarChart className="text-indigo-600" />
            Performance Distribution
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{performanceDistribution.excellent}</div>
              <div className="text-sm text-green-700 font-medium">Excellent (90%+)</div>
              <div className="text-xs text-green-600">Grade O, A+</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{performanceDistribution.good}</div>
              <div className="text-sm text-blue-700 font-medium">Good (70-89%)</div>
              <div className="text-xs text-blue-600">Grade A, B+</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{performanceDistribution.average}</div>
              <div className="text-sm text-yellow-700 font-medium">Average (50-69%)</div>
              <div className="text-xs text-yellow-600">Grade B, C</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{performanceDistribution.poor}</div>
              <div className="text-sm text-orange-700 font-medium">Poor (40-49%)</div>
              <div className="text-xs text-orange-600">Just Pass</div>
            </div>
            
          <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{performanceDistribution.fail}</div>
              <div className="text-sm text-red-700 font-medium">Fail (&lt;40%)</div>
              <div className="text-xs text-red-600">Grade F</div>
            </div>
          </div>
        </div>

        {/* Course Outcome Analysis */}
        {coAnalysis.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <FiTarget className="text-indigo-600" />
              Course Outcome (CO) Attainment Analysis
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Outcome
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Attainment
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students ≥60%
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students &lt;40%
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attainment Level
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coAnalysis.map((co, index) => (
                    <tr key={co.coNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">CO{co.coNumber}</div>
                          <div className="text-sm text-gray-500">{co.coDescription}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-semibold text-lg text-gray-900">
                          {co.averageAttainment.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-green-600">
                          {co.studentsAbove60}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((co.studentsAbove60 / co.totalStudents) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-red-600">
                          {co.studentsBelow40}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((co.studentsBelow40 / co.totalStudents) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                          co.attainmentLevel === 'Excellent' ? 'bg-green-100 text-green-800' :
                          co.attainmentLevel === 'Good' ? 'bg-blue-100 text-blue-800' :
                          co.attainmentLevel === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {co.attainmentLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <FiUsers className="text-indigo-600" />
              Student Performance Details
            </h2>
            
            <div className="flex gap-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Students</option>
                <option value="pass">Passed Students</option>
                <option value="fail">Failed Students</option>
                <option value="weak">Weak Performers</option>
              </select>
              
              <button
                onClick={exportAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiDownload size={20} />
                Export Report
              </button>
            </div>
          </div>

          {/* Student Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Marks
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strong Areas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weak Areas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{student.studentName}</div>
                        <div className="text-sm text-gray-500">{student.rollNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-semibold text-lg text-gray-900">
                        {student.totalMarks}/{student.totalPossible}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`font-semibold text-lg ${
                        student.percentage >= 60 ? 'text-green-600' :
                        student.percentage >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {student.percentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                        student.grade === 'O' || student.grade === 'A+' ? 'bg-green-100 text-green-800' :
                        student.grade === 'A' || student.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                        student.grade === 'B' || student.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.strongChapters.slice(0, 3).map((chapter, idx) => (
                          <span key={idx} className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            {chapter}
                          </span>
                        ))}
                        {student.strongChapters.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{student.strongChapters.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {student.weakChapters.slice(0, 3).map((chapter, idx) => (
                          <span key={idx} className="inline-flex px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            {chapter}
                          </span>
                        ))}
                        {student.weakChapters.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{student.weakChapters.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <FiUsers className="mx-auto text-gray-400" size={64} />
              <h3 className="mt-4 text-xl font-semibold text-gray-900">No Students Found</h3>
              <p className="mt-2 text-gray-500">
                No students match the selected filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}