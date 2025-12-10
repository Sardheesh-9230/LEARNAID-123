'use client'

import React from 'react'
import { CheckCircle, XCircle, Clock, Target, Book } from 'lucide-react'

interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty?: string
  courseOutcome?: string
  bloomsLevel?: string
  estimatedTime?: number
}

interface MCQPreviewModalProps {
  mcqs: MCQQuestion[]
  onApprove: () => void
  onRegenerate: () => void
  onCancel: () => void
  studentInfo?: {
    name: string
    courseOutcome: string
    weakAreas: string[]
    currentPerformance?: number
    threshold?: number
    performanceGap?: number
  }
  loading?: boolean
}

export default function MCQPreviewModal({
  mcqs,
  onApprove,
  onRegenerate,
  onCancel,
  studentInfo,
  loading = false
}: MCQPreviewModalProps) {
  const [expandedQuestions, setExpandedQuestions] = React.useState<Set<number>>(new Set([0]))

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedQuestions(newExpanded)
  }

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, D
  }

  const getDifficultyColor = (difficulty: string = 'Medium') => {
    const colors = {
      Easy: 'bg-green-100 text-green-700 border-green-300',
      Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Hard: 'bg-red-100 text-red-700 border-red-300'
    }
    return colors[difficulty as keyof typeof colors] || colors.Medium
  }

  const totalEstimatedTime = mcqs.reduce((sum, mcq) => sum + (mcq.estimatedTime || 2), 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Book className="w-7 h-7" />
            Review Generated MCQs
          </h2>
          {studentInfo && (
            <div className="mt-3 text-purple-100">
              <p className="text-sm">
                Student: <span className="font-semibold">{studentInfo.name}</span> • 
                CO: <span className="font-semibold">{studentInfo.courseOutcome}</span>
              </p>
              <p className="text-xs mt-1">
                Focus Areas: {studentInfo.weakAreas.join(', ')}
              </p>
              {studentInfo.currentPerformance !== undefined && studentInfo.threshold !== undefined && (
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="bg-red-500 bg-opacity-30 px-2 py-1 rounded">
                    Current: {studentInfo.currentPerformance.toFixed(1)}%
                  </span>
                  <span className="text-white">→</span>
                  <span className="bg-green-500 bg-opacity-30 px-2 py-1 rounded">
                    Target: {studentInfo.threshold}%
                  </span>
                  <span className="bg-orange-500 bg-opacity-30 px-2 py-1 rounded">
                    Gap: {studentInfo.performanceGap?.toFixed(1) || '0'}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  {mcqs.length} Questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  ~{totalEstimatedTime} minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MCQ List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="ml-4 text-gray-600">Generating MCQs from materials...</p>
            </div>
          ) : mcqs.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No MCQs generated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mcqs.map((mcq, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors"
                >
                  {/* Question Header */}
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                            {index + 1}
                          </span>
                          {mcq.difficulty && (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(mcq.difficulty)}`}>
                              {mcq.difficulty}
                            </span>
                          )}
                          {mcq.courseOutcome && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                              {mcq.courseOutcome}
                            </span>
                          )}
                          {mcq.bloomsLevel && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-300">
                              {mcq.bloomsLevel}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 leading-relaxed">
                          {mcq.question}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 ml-4 transition-transform ${
                          expandedQuestions.has(index) ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedQuestions.has(index) && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {/* Options */}
                      <div className="space-y-2 mb-4">
                        {mcq.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                              optIndex === mcq.correctAnswer
                                ? 'bg-green-50 border-green-300'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              optIndex === mcq.correctAnswer
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {getOptionLabel(optIndex)}
                            </span>
                            <span className={`flex-1 ${
                              optIndex === mcq.correctAnswer
                                ? 'font-semibold text-green-900'
                                : 'text-gray-700'
                            }`}>
                              {option}
                            </span>
                            {optIndex === mcq.correctAnswer && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {mcq.explanation && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                          <p className="text-sm text-blue-800">{mcq.explanation}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {mcq.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mcq.estimatedTime} min
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                onClick={onRegenerate}
                disabled={loading}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
              <button
                onClick={onApprove}
                disabled={loading || mcqs.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Assign Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
