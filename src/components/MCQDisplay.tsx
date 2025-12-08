'use client'

import { useState } from 'react';
import { FiCheck, FiX, FiDownload, FiCopy, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { exportToExcel } from '../utils/excelExport';

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  topic: string;
}

interface MCQDisplayProps {
  mcqs: MCQ[];
  onClose: () => void;
  metadata?: {
    materialTitle?: string;
    topic: string;
    difficulty: string;
    chapterTitle?: string;
    subjectName?: string;
  };
}

export default function MCQDisplay({ mcqs, onClose, metadata }: MCQDisplayProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (!showResults) {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex]: optionIndex
      });
    }
  };

  const calculateScore = () => {
    let correct = 0;
    mcqs.forEach((mcq, index) => {
      if (selectedAnswers[index] === mcq.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleShowResults = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  const exportToJSON = () => {
    const filename = `mcqs-${metadata?.topic || 'questions'}-${Date.now()}`;
    const success = exportToExcel(mcqs, filename, 'MCQ Questions');
    
    if (success) {
      alert('📊 MCQs exported successfully to Excel!');
    } else {
      alert('❌ Failed to export MCQs');
    }
  };

  const copyToClipboard = () => {
    const text = mcqs.map((mcq, i) => `
Question ${i + 1}: ${mcq.question}
A) ${mcq.options[0]}
B) ${mcq.options[1]}
C) ${mcq.options[2]}
D) ${mcq.options[3]}
Correct Answer: ${String.fromCharCode(65 + mcq.correctAnswer)}) ${mcq.options[mcq.correctAnswer]}
Explanation: ${mcq.explanation}
---
    `).join('\n');
    
    navigator.clipboard.writeText(text);
    alert('MCQs copied to clipboard!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const score = calculateScore();
  const percentage = mcqs.length > 0 ? (score / mcqs.length) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">Generated MCQs</h2>
              {metadata && (
                <div className="space-y-1">
                  <p className="text-purple-100">📚 {metadata.materialTitle}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      📝 Topic: {metadata.topic}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(metadata.difficulty)}`}>
                      {metadata.difficulty.charAt(0).toUpperCase() + metadata.difficulty.slice(1)}
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      {mcqs.length} Questions
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex gap-3 flex-wrap">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            <FiCopy /> Copy All
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all"
          >
            <FiDownload /> Export JSON
          </button>
          {!showResults && Object.keys(selectedAnswers).length === mcqs.length && (
            <button
              onClick={handleShowResults}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all ml-auto"
            >
              Show Results
            </button>
          )}
          {showResults && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all ml-auto"
            >
              Reset Quiz
            </button>
          )}
        </div>

        {/* Score Display */}
        {showResults && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Score</h3>
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {score} / {mcqs.length}
              </div>
              <div className="text-xl text-gray-600">
                {percentage.toFixed(1)}% • {percentage >= 70 ? '🎉 Great Job!' : percentage >= 50 ? '👍 Good Effort!' : '💪 Keep Practicing!'}
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mcqs.map((mcq, questionIndex) => {
            const isAnswered = selectedAnswers[questionIndex] !== undefined;
            const selectedOption = selectedAnswers[questionIndex];
            const isCorrect = selectedOption === mcq.correctAnswer;

            return (
              <div
                key={questionIndex}
                className={`bg-white border-2 rounded-xl p-6 transition-all ${
                  showResults
                    ? isCorrect
                      ? 'border-green-300 bg-green-50'
                      : isAnswered
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    {questionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {mcq.question}
                    </h4>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(mcq.difficulty)}`}>
                        {mcq.difficulty}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {mcq.topic}
                      </span>
                    </div>
                  </div>
                  {showResults && (
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <div className="bg-green-500 text-white rounded-full p-2">
                          <FiCheck size={20} />
                        </div>
                      ) : isAnswered ? (
                        <div className="bg-red-500 text-white rounded-full p-2">
                          <FiX size={20} />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-3 ml-11">
                  {mcq.options.map((option, optionIndex) => {
                    const isSelected = selectedOption === optionIndex;
                    const isCorrectOption = optionIndex === mcq.correctAnswer;
                    const optionLetter = String.fromCharCode(65 + optionIndex);

                    let optionClass = 'bg-gray-50 border-gray-200 hover:border-purple-300';
                    if (showResults) {
                      if (isCorrectOption) {
                        optionClass = 'bg-green-100 border-green-400';
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'bg-red-100 border-red-400';
                      } else {
                        optionClass = 'bg-gray-50 border-gray-200';
                      }
                    } else if (isSelected) {
                      optionClass = 'bg-purple-100 border-purple-400';
                    }

                    return (
                      <button
                        key={optionIndex}
                        onClick={() => handleOptionSelect(questionIndex, optionIndex)}
                        disabled={showResults}
                        className={`w-full text-left p-4 border-2 rounded-lg transition-all ${optionClass} ${
                          !showResults ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-700">{optionLetter}.</span>
                          <span className="flex-1">{option}</span>
                          {showResults && isCorrectOption && (
                            <FiCheck className="text-green-600" size={20} />
                          )}
                          {showResults && isSelected && !isCorrect && (
                            <FiX className="text-red-600" size={20} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResults && (
                  <div className="mt-4 ml-11 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-1">💡 Explanation:</p>
                    <p className="text-sm text-blue-800">{mcq.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {showResults ? (
              <span>Quiz completed • Score: {score}/{mcqs.length}</span>
            ) : (
              <span>Answered: {Object.keys(selectedAnswers).length}/{mcqs.length}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
