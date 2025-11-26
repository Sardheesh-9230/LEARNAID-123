'use client'

import { useState, useEffect } from 'react'
import { 
  FiBarChart, FiTrendingUp, FiUsers, FiBook, 
  FiTarget, FiAward, FiAlertTriangle, FiCheckCircle,
  FiDownload, FiFilter, FiRefreshCw, FiEye
} from 'react-icons/fi'
import apiService from '../services/api'

interface TotalMarksEntry {
  studentId: string
  studentName: string
  rollNumber: string
  cia1Marks?: number
  cia2Marks?: number
  modelMarks?: number
  totalMarks: number
  totalPossible: number
  percentage: number
  grade: string
  overallPerformance: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Fail'
}

interface MarksDistribution {
  excellent: number // >=90%
  good: number      // 70-89%
  average: number   // 50-69%
  poor: number      // 40-49%
  fail: number      // <40%
}

interface EnhancedMarksEntryProps {
  subjectId: string
  onShowAnalytics?: () => void
}

export default function EnhancedMarksEntry({ subjectId, onShowAnalytics }: EnhancedMarksEntryProps) {
  const [studentMarks, setStudentMarks] = useState<TotalMarksEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pass' | 'fail' | 'excellent' | 'weak'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Statistics
  const [distribution, setDistribution] = useState<MarksDistribution>({
    excellent: 0,
    good: 0,
    average: 0,
    poor: 0,
    fail: 0
  })
  
  const [summary, setSummary] = useState({
    totalStudents: 0,
    averagePercentage: 0,
    passCount: 0,
    highestMarks: 0,
    lowestMarks: 0
  })

  useEffect(() => {
    if (subjectId) {
      loadStudentMarks()
    }
  }, [subjectId])

  const loadStudentMarks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get all exam marks for this subject
      const response = await apiService.makeRequest(
        `/analytics/performance/comprehensive?subjectId=${subjectId}`
      )

      if (response.success) {
        const { studentPerformances, statistics } = response.data
        
        // Transform data for display
        const marksEntries: TotalMarksEntry[] = studentPerformances.map((student: any) => {
          // Aggregate marks by exam type
          const examMarks: any = {}
          student.subjectMarks.forEach((mark: any) => {
            // This would need exam type information - for now using mock data
            if (!examMarks.total) examMarks.total = 0
            examMarks.total += mark.marksObtained
          })

          const percentage = student.percentage
          let overallPerformance: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Fail' = 'Fail'
          
          if (percentage >= 90) overallPerformance = 'Excellent'
          else if (percentage >= 70) overallPerformance = 'Good'
          else if (percentage >= 50) overallPerformance = 'Average'
          else if (percentage >= 40) overallPerformance = 'Poor'

          return {
            studentId: student.studentId,
            studentName: student.studentName,
            rollNumber: student.rollNumber,
            totalMarks: student.totalMarks,
            totalPossible: student.totalPossible,
            percentage: student.percentage,
            grade: student.grade,
            overallPerformance,
            // Mock exam-wise marks - would be calculated from actual data
            cia1Marks: Math.round(student.totalMarks * 0.3),
            cia2Marks: Math.round(student.totalMarks * 0.35),
            modelMarks: Math.round(student.totalMarks * 0.35)
          }
        })

        setStudentMarks(marksEntries)

        // Calculate distribution
        const dist = marksEntries.reduce((acc, student) => {
          if (student.percentage >= 90) acc.excellent++
          else if (student.percentage >= 70) acc.good++
          else if (student.percentage >= 50) acc.average++
          else if (student.percentage >= 40) acc.poor++
          else acc.fail++
          return acc
        }, { excellent: 0, good: 0, average: 0, poor: 0, fail: 0 })

        setDistribution(dist)

        // Calculate summary
        const totalStudents = marksEntries.length
        const averagePercentage = marksEntries.reduce((sum, s) => sum + s.percentage, 0) / totalStudents || 0
        const passCount = marksEntries.filter(s => s.percentage >= 40).length
        const highestMarks = Math.max(...marksEntries.map(s => s.totalMarks))
        const lowestMarks = Math.min(...marksEntries.map(s => s.totalMarks))

        setSummary({
          totalStudents,
          averagePercentage: Math.round(averagePercentage * 100) / 100,
          passCount,
          highestMarks,
          lowestMarks
        })
      }
    } catch (err: any) {
      console.error('Error loading student marks:', err)
      setError(err.message || 'Failed to load student marks')
    } finally {
      setLoading(false)
    }
  }

  // Filter students
  const filteredStudents = studentMarks.filter(student => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Apply performance filter
    switch (selectedFilter) {
      case 'pass':
        return student.percentage >= 40
      case 'fail':
        return student.percentage < 40
      case 'excellent':
        return student.percentage >= 90
      case 'weak':
        return student.percentage < 50
      default:
        return true
    }
  })

  const exportMarksReport = async () => {
    try {
      const reportData = {
        subject: subjectId,
        timestamp: new Date().toISOString(),
        summary,
        distribution,
        studentMarks: filteredStudents,
        statistics: {
          totalStudents: summary.totalStudents,
          passPercentage: (summary.passCount / summary.totalStudents * 100).toFixed(1),
          averagePercentage: summary.averagePercentage
        }
      }
      
      // Create downloadable JSON report
      const dataStr = JSON.stringify(reportData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      const exportFileDefaultName = `student_marks_total_${new Date().toISOString().split('T')[0]}.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      
      setSuccess('Marks report exported successfully')
    } catch (err: any) {
      setError('Failed to export marks report')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900">Loading Student Marks...</h3>
        <p className="text-gray-500 mt-2">Calculating total marks and performance metrics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <FiBarChart size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Total Marks Analysis</h2>
              <p className="text-indigo-100">Comprehensive student performance overview</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadStudentMarks}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <FiRefreshCw size={18} />
              Refresh
            </button>
            {onShowAnalytics && (
              <button
                onClick={onShowAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <FiEye size={18} />
                Analytics
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
          <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-green-900">Success</h3>
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FiUsers className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{summary.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FiCheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{summary.passCount}</div>
              <div className="text-sm text-gray-600">Passed</div>
              <div className="text-xs text-green-600 font-medium">
                {summary.totalStudents > 0 ? ((summary.passCount / summary.totalStudents) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <FiTrendingUp className="text-yellow-600" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{summary.averagePercentage}%</div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FiAward className="text-purple-600" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{summary.highestMarks}</div>
              <div className="text-sm text-gray-600">Highest</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <FiAlertTriangle className="text-red-600" size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{summary.lowestMarks}</div>
              <div className="text-sm text-gray-600">Lowest</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <FiBarChart className="text-indigo-600" />
          Performance Distribution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{distribution.excellent}</div>
            <div className="text-sm text-green-700 font-medium">Excellent</div>
            <div className="text-xs text-green-600">90%+ (O, A+)</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{distribution.good}</div>
            <div className="text-sm text-blue-700 font-medium">Good</div>
            <div className="text-xs text-blue-600">70-89% (A, B+)</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{distribution.average}</div>
            <div className="text-sm text-yellow-700 font-medium">Average</div>
            <div className="text-xs text-yellow-600">50-69% (B, C)</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">{distribution.poor}</div>
            <div className="text-sm text-orange-700 font-medium">Poor</div>
            <div className="text-xs text-orange-600">40-49% (Just Pass)</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{distribution.fail}</div>
            <div className="text-sm text-red-700 font-medium">Fail</div>
            <div className="text-xs text-red-600">&lt;40% (F)</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <FiUsers className="text-indigo-600" />
            Student Total Marks ({filteredStudents.length} students)
          </h3>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" size={18} />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Students</option>
                <option value="pass">Passed Students</option>
                <option value="fail">Failed Students</option>
                <option value="excellent">Excellent Performers</option>
                <option value="weak">Weak Performers</option>
              </select>
            </div>
            
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            
            <button
              onClick={exportMarksReport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiDownload size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Student Marks Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CIA-1
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CIA-2
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
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
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{student.studentName}</div>
                      <div className="text-sm text-gray-500">{student.rollNumber}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-medium text-gray-900">{student.cia1Marks || '-'}</div>
                    <div className="text-xs text-gray-500">/ 60</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-medium text-gray-900">{student.cia2Marks || '-'}</div>
                    <div className="text-xs text-gray-500">/ 60</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-medium text-gray-900">{student.modelMarks || '-'}</div>
                    <div className="text-xs text-gray-500">/ 100</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-bold text-lg text-gray-900">
                      {student.totalMarks}/{student.totalPossible}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`font-bold text-lg ${
                      student.percentage >= 75 ? 'text-green-600' :
                      student.percentage >= 60 ? 'text-blue-600' :
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
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      student.overallPerformance === 'Excellent' ? 'bg-green-100 text-green-800' :
                      student.overallPerformance === 'Good' ? 'bg-blue-100 text-blue-800' :
                      student.overallPerformance === 'Average' ? 'bg-yellow-100 text-yellow-800' :
                      student.overallPerformance === 'Poor' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.overallPerformance}
                    </span>
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
              {searchTerm || selectedFilter !== 'all' 
                ? 'No students match the selected criteria.' 
                : 'No student marks available for this subject.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}