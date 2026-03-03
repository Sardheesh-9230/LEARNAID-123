'use client'

import { useState, useRef } from 'react'
import {
  FiCode, FiPlay, FiCheck, FiX, FiClock, FiAward,
  FiChevronDown, FiTerminal, FiBookOpen, FiAlertCircle,
  FiRefreshCw, FiMaximize2
} from 'react-icons/fi'
import apiService from '../services/api'

interface TestCase {
  input: string
  expectedOutput: string
  isHidden: boolean
  marks: number
}

interface CodingQuestion {
  id: string
  questionText: string
  programmingLanguage: string
  starterCode: string
  sampleInput: string
  sampleOutput: string
  testCases: TestCase[]
  constraints: string[]
  marks: number
  explanation: string
  difficulty: string
  courseOutcome: string
  topics: string[]
}

interface TestResult {
  testCase: number
  passed: boolean
  input: string
  expectedOutput: string
  yourOutput: string
  marks: number
  error: string | null
  isHidden: boolean
}

interface CodingTestProps {
  task: any
  onComplete: () => void
  onClose: () => void
}

const LANGUAGE_STARTERS: Record<string, string> = {
  Python: `# Write your solution here\n\n`,
  JavaScript: `// Write your solution here\n\n`,
  Java: `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  C: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`
}

export default function StudentCodingTest({ task, onComplete, onClose }: CodingTestProps) {
  // Source 1: metadata.codingQuestions (populated by createAssessmentTask for new tasks)
  // Source 2: personalizedData.questions filtered by questionType === 'Coding' (fallback for tasks
  //           created before the fix, or tasks where coding Qs are stored in the student assignments)
  const codingQuestions: CodingQuestion[] = (() => {
    const fromMeta: any[] = task.metadata?.codingQuestions || []
    if (fromMeta.length > 0) return fromMeta as CodingQuestion[]

    const fromPersonalized: any[] = (task.personalizedData?.questions || []).filter(
      (q: any) => q.questionType === 'Coding' || (Array.isArray(q.testCases) && q.testCases.length > 0)
    )
    if (fromPersonalized.length > 0) {
      return fromPersonalized.map((q: any, idx: number) => ({
        id: q.id || q._id?.toString() || `cq_${idx}`,
        questionText: q.questionText || q.question || '',
        programmingLanguage: q.programmingLanguage || 'Python',
        starterCode: q.starterCode || LANGUAGE_STARTERS[q.programmingLanguage || 'Python'] || '',
        sampleInput: q.sampleInput || '',
        sampleOutput: q.sampleOutput || '',
        testCases: q.testCases || [],
        constraints: q.constraints || [],
        marks: q.marks || 10,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'Medium',
        courseOutcome: q.courseOutcome || '',
        topics: q.topics || []
      } as CodingQuestion))
    }
    return []
  })()
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const currentQ: CodingQuestion | undefined = codingQuestions[currentQIndex]

  const [language, setLanguage] = useState(currentQ?.programmingLanguage || 'Python')
  const [code, setCode] = useState(currentQ?.starterCode || LANGUAGE_STARTERS[language] || '')
  const [submitting, setSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [summary, setSummary] = useState<{
    allPassed: boolean
    passedCount: number
    totalCount: number
    marksAwarded: number
    totalMarks: number
    message: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'problem' | 'results'>('problem')
  const [submissionsByQ, setSubmissionsByQ] = useState<Record<string, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (codingQuestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-10 text-center">
          <FiCode className="mx-auto text-gray-400 mb-4" size={56} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Coding Questions</h2>
          <p className="text-gray-600 mb-6">This task has no coding questions assigned.</p>
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    )
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setCode(currentQ?.starterCode || LANGUAGE_STARTERS[lang] || '')
  }

  const handleQuestionChange = (idx: number) => {
    const q = codingQuestions[idx]
    setCurrentQIndex(idx)
    setLanguage(q.programmingLanguage || 'Python')
    setCode(q.starterCode || LANGUAGE_STARTERS[q.programmingLanguage || 'Python'] || '')
    setResults(null)
    setSummary(null)
    setActiveTab('problem')
  }

  const handleSubmit = async () => {
    if (!currentQ || !code.trim()) return
    setSubmitting(true)
    setActiveTab('results')
    try {
      const response = await apiService.makeRequest(
        `/improvement-tasks/${task._id}/submit-coding`,
        {
          method: 'POST',
          body: JSON.stringify({ questionId: currentQ.id, code, language })
        }
      )

      if (response.success) {
        setResults(response.results || [])
        setSummary({
          allPassed: response.allPassed,
          passedCount: response.passedCount,
          totalCount: response.totalCount,
          marksAwarded: response.marksAwarded,
          totalMarks: response.totalMarks,
          message: response.message
        })
        if (response.allPassed) {
          setSubmissionsByQ(prev => ({ ...prev, [currentQ.id]: true }))
          onComplete()
        }
      } else {
        setSummary({ allPassed: false, passedCount: 0, totalCount: 0, marksAwarded: 0, totalMarks: currentQ.marks, message: response.message || 'Submission failed' })
      }
    } catch (err: any) {
      setSummary({ allPassed: false, passedCount: 0, totalCount: 0, marksAwarded: 0, totalMarks: currentQ.marks, message: err.message || 'Error submitting code' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newCode = code.substring(0, start) + '    ' + code.substring(end)
      setCode(newCode)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    }
  }

  const allQuestionsCompleted = codingQuestions.every(q => submissionsByQ[q.id])

  return (
    <>
    {showExitConfirm && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Finish Coding Test?</h3>
          <p className="text-gray-600 mb-5">
            Any questions you haven't submitted yet will not be scored.
            Make sure you've submitted all your solutions before closing.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowExitConfirm(false)}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Keep Coding
            </button>
            <button
              onClick={() => { setShowExitConfirm(false); onClose() }}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Finish & Close
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiCode className="text-blue-400" size={22} />
          <span className="text-white font-semibold text-lg truncate max-w-xs">{task.title}</span>
          <span className="px-2 py-0.5 rounded text-xs bg-purple-600 text-white">{currentQ?.courseOutcome}</span>
          <span className="px-2 py-0.5 rounded text-xs bg-gray-600 text-gray-200">{currentQ?.difficulty}</span>
        </div>

        {/* Question tabs */}
        <div className="flex items-center gap-1 mx-4">
          {codingQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => handleQuestionChange(idx)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                idx === currentQIndex ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              } ${submissionsByQ[q.id] ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-gray-900' : ''}`}
            >
              Q{idx + 1} {submissionsByQ[q.id] ? '✓' : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {allQuestionsCompleted && (
            <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full font-medium">
              🎉 All Done!
            </span>
          )}
          <button onClick={() => setShowExitConfirm(true)} className="px-4 py-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">
            Close
          </button>
        </div>
      </div>

      {/* Main layout: problem | editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Problem panel */}
        <div className="w-2/5 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          {currentQ && (
            <>
              {/* Mark & difficulty header */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Problem {currentQIndex + 1}</h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium flex items-center gap-1">
                      <FiAward size={14} /> {currentQ.marks} marks
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      currentQ.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      currentQ.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                      {currentQ.difficulty}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(currentQ.topics || []).map(t => (
                    <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{t}</span>
                  ))}
                </div>
              </div>

              {/* Problem statement */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{currentQ.questionText}</p>
              </div>

              {/* Constraints */}
              {(currentQ.constraints || []).length > 0 && (
                <div className="px-6 py-4 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-2">📋 Constraints</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentQ.constraints.map((c, i) => (
                      <li key={i} className="text-sm text-gray-600">{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample I/O */}
              {(currentQ.sampleInput || currentQ.sampleOutput) && (
                <div className="px-6 py-4 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-700 mb-3">📝 Example</h4>
                  {currentQ.sampleInput && (
                    <div className="mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Input</span>
                      <pre className="mt-1 p-3 bg-gray-900 text-green-400 rounded text-sm overflow-x-auto font-mono">{currentQ.sampleInput}</pre>
                    </div>
                  )}
                  {currentQ.sampleOutput && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Output</span>
                      <pre className="mt-1 p-3 bg-gray-900 text-blue-300 rounded text-sm overflow-x-auto font-mono">{currentQ.sampleOutput}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation hint */}
              {currentQ.explanation && (
                <div className="px-6 py-4">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiBookOpen size={16} /> Approach Hint
                  </h4>
                  <p className="text-sm text-gray-600 italic">{currentQ.explanation}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Editor + Results */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {/* Editor toolbar */}
          <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiTerminal className="text-gray-400" size={16} />
              <span className="text-gray-400 text-sm">Code Editor</span>
              <div className="relative">
                <select
                  value={language}
                  onChange={e => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-gray-800 text-gray-200 text-sm px-3 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-blue-500 pr-8"
                >
                  {['Python', 'JavaScript', 'Java', 'C++', 'C'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode(currentQ?.starterCode || LANGUAGE_STARTERS[language] || '')}
                title="Reset to starter code"
                className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded"
              >
                <FiRefreshCw size={16} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !code.trim()}
                className="flex items-center gap-2 px-5 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium text-sm transition-colors"
              >
                <FiPlay size={14} />
                {submitting ? 'Running...' : 'Run & Submit'}
              </button>
            </div>
          </div>

          {/* Code textarea */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={handleTabKey}
              spellCheck={false}
              className="flex-1 bg-gray-950 text-gray-100 font-mono text-sm p-5 resize-none outline-none border-b border-gray-700 leading-6"
              style={{ tabSize: 4 }}
              placeholder={`Write your ${language} solution here...`}
            />

            {/* Results panel */}
            <div className="h-56 bg-gray-900 overflow-hidden flex flex-col border-t border-gray-700">
              <div className="flex items-center gap-0 border-b border-gray-700 px-1">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'problem' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'results' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Output {results && <span className={`ml-1 text-xs ${summary?.allPassed ? 'text-green-400' : 'text-red-400'}`}>({summary?.passedCount}/{summary?.totalCount})</span>}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {activeTab === 'problem' && currentQ && (
                  <div className="space-y-2">
                    {(currentQ.testCases || []).filter(tc => !tc.isHidden).map((tc, i) => (
                      <div key={i} className="bg-gray-800 rounded p-3 text-sm">
                        <span className="text-gray-400 text-xs font-medium">Test {i + 1}</span>
                        <div className="flex gap-6 mt-1">
                          <div>
                            <span className="text-gray-500 text-xs">Input: </span>
                            <span className="text-green-300 font-mono">{tc.input || '(empty)'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Expected: </span>
                            <span className="text-blue-300 font-mono">{tc.expectedOutput}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(currentQ.testCases || []).some(tc => tc.isHidden) && (
                      <p className="text-gray-500 text-xs italic">+ {(currentQ.testCases || []).filter(tc => tc.isHidden).length} hidden test case(s)</p>
                    )}
                  </div>
                )}

                {activeTab === 'results' && (
                  <div>
                    {submitting && (
                      <div className="flex items-center gap-2 text-yellow-400 py-2">
                        <FiRefreshCw className="animate-spin" size={16} />
                        <span className="text-sm">Running your code against test cases...</span>
                      </div>
                    )}
                    {!submitting && summary && (
                      <div className="mb-3">
                        <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${summary.allPassed ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-800'}`}>
                          {summary.allPassed ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
                          <span>{summary.message}</span>
                          {summary.allPassed && (
                            <span className="ml-auto flex items-center gap-1 text-yellow-300">
                              <FiAward size={16} /> {summary.marksAwarded}/{summary.totalMarks} marks
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {!submitting && results && (
                      <div className="space-y-1.5">
                        {results.map(r => (
                          <div key={r.testCase} className={`flex items-center gap-3 p-2 rounded text-xs ${r.passed ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
                            {r.passed ? <FiCheck className="text-green-400 flex-shrink-0" size={14} /> : <FiX className="text-red-400 flex-shrink-0" size={14} />}
                            <span className="text-gray-400 w-16 flex-shrink-0">Test {r.testCase}</span>
                            {!r.isHidden && (
                              <>
                                <span className="text-gray-500">In: <span className="text-gray-200 font-mono">{r.input || '(empty)'}</span></span>
                                <span className="text-gray-500">Expected: <span className="text-blue-300 font-mono">{r.expectedOutput}</span></span>
                                <span className="text-gray-500">Got: <span className={`font-mono ${r.passed ? 'text-green-300' : 'text-red-300'}`}>{r.yourOutput}</span></span>
                              </>
                            )}
                            {r.isHidden && <span className={r.passed ? 'text-green-300' : 'text-red-300'}>{r.yourOutput}</span>}
                            {r.error && <span className="text-orange-400 ml-auto">{r.error}</span>}
                            {r.passed && <span className="ml-auto text-yellow-400 font-medium">+{r.marks}m</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {!submitting && !results && (
                      <p className="text-gray-500 text-sm py-2">Click "Run & Submit" to execute your solution.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
