'use client'

import { useState, useEffect } from 'react'
import { FiClock, FiCheck, FiX, FiAward, FiRefreshCw } from 'react-icons/fi'
import apiService from '../services/api'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number | string
  explanation: string
  difficulty: string
  marks: number
  topics: string
  courseOutcome: string
}

interface MCQTestProps {
  task: any
  onComplete: () => void
  onClose: () => void
}

export default function StudentMCQTest({ task, onComplete, onClose }: MCQTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [startTime] = useState(Date.now())

  const questions: Question[] = task.metadata?.generatedMCQs?.questions || []
  const totalTime = task.metadata?.studyTimeMinutes || task.metadata?.generatedMCQs?.estimatedTime || 30
  const maxAttempts = task.metadata?.teacherSettings?.maxAttempts || 3
  const attemptNumber = (task.metadata?.mcqScores?.length || 0) + 1

  useEffect(() => {
    setTimeRemaining(totalTime * 60) // Convert to seconds
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleAutoSubmit = async () => {
    if (!submitting) {
      await handleSubmit()
    }
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const timeTaken = Math.round((Date.now() - startTime) / 60000) // minutes

      const response = await apiService.makeRequest(
        `/improvement-tasks/${task._id}/submit-mcq`,
        {
          method: 'POST',
          body: JSON.stringify({
            answers: answers,
            timeTaken: timeTaken
          })
        }
      )

      if (response.success) {
        setResults(response.results)
        setShowResults(true)
      } else {
        alert(response.message || 'Failed to submit quiz')
      }
    } catch (error: any) {
      console.error('Error submitting quiz:', error)
      alert(error.message || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 text-center">
          <FiX className="mx-auto text-red-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">This task does not have any questions yet.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (showResults && results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
          <div className={`p-8 text-center ${results.passed ? 'bg-green-50' : 'bg-orange-50'} rounded-t-xl`}>
            {results.passed ? (
              <FiAward className="mx-auto text-green-600 mb-4" size={64} />
            ) : (
              <FiRefreshCw className="mx-auto text-orange-600 mb-4" size={64} />
            )}
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {results.passed ? '🎉 Congratulations!' : 'Keep Trying!'}
            </h2>
            <p className="text-xl text-gray-700 mb-4">
              You scored {results.percentage.toFixed(1)}%
            </p>
            <div className="flex justify-center gap-8 text-lg">
              <div>
                <span className="font-bold">{results.correctAnswers}</span>
                <span className="text-gray-600"> / {results.totalQuestions}</span>
                <span className="text-gray-500 text-sm block">Correct</span>
              </div>
              <div>
                <span className="font-bold">{results.obtainedMarks}</span>
                <span className="text-gray-600"> / {results.totalMarks}</span>
                <span className="text-gray-500 text-sm block">Marks</span>
              </div>
              <div>
                <span className="font-bold">{results.attemptNumber}</span>
                <span className="text-gray-600"> / {maxAttempts}</span>
                <span className="text-gray-500 text-sm block">Attempt</span>
              </div>
            </div>
          </div>

          {/* CO-wise Performance */}
          {results.coWiseResults && Object.keys(results.coWiseResults).length > 0 && (
            <div className="p-6 bg-blue-50 border-b">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">📊 CO-wise Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results.coWiseResults).map(([co, data]: [string, any]) => {
                  const coPercentage = data.totalMarks > 0 ? (data.obtainedMarks / data.totalMarks) * 100 : 0
                  return (
                    <div key={co} className="bg-white rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-blue-900">{co}</span>
                        <span className={`font-semibold ${coPercentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {coPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{data.correctAnswers}/{data.totalQuestions} correct</span>
                        <span>{data.obtainedMarks}/{data.totalMarks} marks</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${coPercentage >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${coPercentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="p-6 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
            <div className="space-y-4">
              {results.detailedResults.map((result: any, index: number) => (
                <div 
                  key={result.questionId} 
                  className={`p-4 rounded-lg border-2 ${result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {result.isCorrect ? (
                      <FiCheck className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    ) : (
                      <FiX className="text-red-600 mt-1 flex-shrink-0" size={20} />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-gray-900">
                          Q{index + 1}. {result.question}
                        </p>
                        {result.courseOutcome && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {result.courseOutcome}
                          </span>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Your Answer:</span>{' '}
                          <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                            {typeof result.studentAnswer === 'number' 
                              ? questions[index]?.options[result.studentAnswer]
                              : result.studentAnswer || 'Not answered'}
                          </span>
                        </p>
                        {!result.isCorrect && (
                          <p>
                            <span className="font-medium">Correct Answer:</span>{' '}
                            <span className="text-green-700">
                              {typeof result.correctAnswer === 'number'
                                ? questions[index]?.options[result.correctAnswer]
                                : result.correctAnswer}
                            </span>
                          </p>
                        )}
                        {result.explanation && (
                          <p className="text-gray-600 italic mt-2">
                            💡 {result.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t flex justify-center gap-4">
            {!results.passed && results.remainingAttempts > 0 && (
              <button
                onClick={() => {
                  setShowResults(false)
                  setAnswers({})
                  setCurrentQuestionIndex(0)
                  setTimeRemaining(totalTime * 60)
                  onComplete() // Reload task data
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Try Again ({results.remainingAttempts} attempts left)
              </button>
            )}
            <button
              onClick={() => {
                onComplete()
                onClose()
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {results.passed ? 'Complete Task' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">{task.title}</h2>
            <p className="text-blue-100">Attempt {attemptNumber} of {maxAttempts}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <FiClock />
              <span className={timeRemaining < 300 ? 'text-red-300' : ''}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-sm text-blue-100">Time Remaining</p>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{answeredCount} / {questions.length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentQuestion.courseOutcome}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {currentQuestion.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  answers[currentQuestion.id] === index
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    answers[currentQuestion.id] === index
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion.id] === index && (
                      <FiCheck className="text-white" size={16} />
                    )}
                  </div>
                  <span className="flex-1 text-gray-800">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t flex justify-between items-center bg-gray-50 rounded-b-xl">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-600">
            {allAnswered ? (
              <span className="text-green-600 font-medium">✓ All questions answered</span>
            ) : (
              <span>{questions.length - answeredCount} questions remaining</span>
            )}
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
