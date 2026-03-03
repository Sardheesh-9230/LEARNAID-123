'use client'

import { useState } from 'react'
import { FiEdit3, FiCheckCircle, FiX, FiChevronLeft, FiChevronRight, FiSend } from 'react-icons/fi'
import apiService from '../services/api'

interface SATestProps {
  task: any
  onComplete: () => void
  onClose: () => void
}

export default function StudentShortAnswerTest({ task, onComplete, onClose }: SATestProps) {
  // Gather SA questions from all possible sources
  const allQs: any[] = (() => {
    const pdQs = task.personalizedData?.questions
    const raw = (pdQs && pdQs.length > 0)
      ? pdQs
      : (task.metadata?.generatedMCQs?.questions || [])
    return raw.filter((q: any) => q.questionType === 'Short Answer')
  })()

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showModelAnswers, setShowModelAnswers] = useState<Record<number, boolean>>({})
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const totalQuestions = allQs.length
  const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length
  const currentQ = allQs[currentIndex]

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Mark task progress. SA answers are stored client-side for review; only status is updated.
      const taskId = task._id
      if (task.isMultiStudent) {
        await apiService.makeRequest(`/improvement-tasks/${taskId}/progress`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'In Progress',
            shortAnswerAttempt: {
              answers: Object.entries(answers).map(([idx, text]) => ({
                questionText: allQs[parseInt(idx)]?.question || allQs[parseInt(idx)]?.questionText || '',
                studentAnswer: text
              })),
              submittedAt: new Date().toISOString()
            }
          })
        })
      }
    } catch (_) {
      // Non-blocking — show results even if API call fails
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  if (allQs.length === 0) return null

  // ── Results screen ──
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center border-b border-gray-200">
            <FiCheckCircle className="text-green-500 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Answers Submitted!</h2>
            <p className="text-gray-600">You answered {answeredCount} of {totalQuestions} questions.</p>
          </div>

          <div className="p-6 space-y-4">
            {allQs.map((q: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50">
                  <p className="font-medium text-gray-900">Q{i + 1}. {q.question || q.questionText}</p>
                  {q.marks && <span className="text-xs text-gray-500">{q.marks} marks</span>}
                </div>
                <div className="p-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Your Answer:</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {answers[i]?.trim() || <span className="italic text-gray-400">Not answered</span>}
                  </p>
                </div>
                {q.expectedAnswer && (
                  <div className="p-4 border-t border-teal-100 bg-teal-50">
                    <p className="text-xs font-semibold text-teal-800 mb-1">Model Answer:</p>
                    <p className="text-sm text-teal-700 whitespace-pre-wrap">{q.expectedAnswer}</p>
                    {Array.isArray(q.keyPoints) && q.keyPoints.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-teal-800 mb-1">Key Points:</p>
                        <ul className="list-disc list-inside text-xs text-teal-700 space-y-0.5">
                          {q.keyPoints.map((pt: string, j: number) => <li key={j}>{pt}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Question screen ──
  return (
    <>
    {showExitConfirm && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Submit & Finish?</h3>
          <p className="text-gray-600 mb-1">
            Your written answers will be submitted for review.
          </p>
          <p className="text-gray-800 font-medium mb-5">
            You answered <strong>{answeredCount} of {totalQuestions}</strong> questions.
            Unanswered questions will be left blank.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Keep Going
            </button>
            <button
              onClick={() => { setShowExitConfirm(false); handleSubmit() }}
              disabled={submitting}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit & Finish'}
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-5 rounded-t-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{task.title}</h2>
            <p className="text-teal-100 text-sm mt-0.5">Short Answer Questions</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-teal-100 text-sm">
              {answeredCount} / {totalQuestions} answered
            </span>
            <button onClick={() => setShowExitConfirm(true)} className="text-white hover:text-teal-200 transition-colors">
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200">
          <div
            className="h-1.5 bg-teal-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
              Short Answer
            </span>
            {currentQ?.difficulty && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                currentQ.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                currentQ.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {currentQ.difficulty}
              </span>
            )}
            {currentQ?.marks && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}
              </span>
            )}
            <span className="ml-auto text-sm text-gray-500 font-medium">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-5">
            {currentQ?.question || currentQ?.questionText}
          </h3>

          {currentQ?.maxWords && (
            <p className="text-xs text-gray-400 mb-2">Maximum {currentQ.maxWords} words</p>
          )}

          <textarea
            value={answers[currentIndex] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [currentIndex]: e.target.value }))}
            placeholder="Write your answer here..."
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none text-gray-900 text-sm leading-relaxed"
          />

          {/* Word count */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">
              {(answers[currentIndex] || '').trim().split(/\s+/).filter(Boolean).length} words
            </span>
            {currentQ?.maxWords && (
              <span className={`text-xs font-medium ${
                (answers[currentIndex] || '').trim().split(/\s+/).filter(Boolean).length > currentQ.maxWords
                  ? 'text-red-500' : 'text-gray-400'
              }`}>
                / {currentQ.maxWords} max
              </span>
            )}
          </div>

          {/* Hint: toggle model answer */}
          {currentQ?.expectedAnswer && (
            <div className="mt-4">
              <button
                onClick={() => setShowModelAnswers(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }))}
                className="text-xs text-teal-600 hover:text-teal-800 underline"
              >
                {showModelAnswers[currentIndex] ? 'Hide' : 'Show'} model answer (hint)
              </button>
              {showModelAnswers[currentIndex] && (
                <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-xs font-semibold text-teal-900 mb-1">Model Answer:</p>
                  <p className="text-sm text-teal-800">{currentQ.expectedAnswer}</p>
                  {Array.isArray(currentQ.keyPoints) && currentQ.keyPoints.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs text-teal-700 space-y-0.5">
                      {currentQ.keyPoints.map((pt: string, j: number) => <li key={j}>{pt}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="p-5 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronLeft size={16} />
            Previous
          </button>

          {/* Question dots */}
          <div className="flex gap-1.5">
            {allQs.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? 'bg-teal-600 text-white'
                    : (answers[i]?.trim() ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-600')
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(prev => Math.min(prev + 1, totalQuestions - 1))}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Next
              <FiChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <FiSend size={16} />
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
