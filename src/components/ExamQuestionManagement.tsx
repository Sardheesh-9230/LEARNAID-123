import React, { useEffect, useState } from 'react';
import facultyAPI from '../services/facultyAPI';

const ExamQuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newQuestion, setNewQuestion] = useState({ text: '', chapterId: '', marks: '' });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch questions by exam or chapter if available
      const examId = localStorage.getItem('examId');
      const data = examId
        ? await facultyAPI.question.getByExam(examId)
        : [];
      setQuestions(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch questions');
    }
    setLoading(false);
  };

  const handleAddQuestion = async () => {
    setLoading(true);
    try {
      await facultyAPI.question.create(newQuestion);
      setNewQuestion({ text: '', chapterId: '', marks: '' });
      fetchQuestions();
    } catch (err) {
      setError('Failed to add question');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Exam Question Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Question Text"
          value={newQuestion.text}
          onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Chapter ID"
          value={newQuestion.chapterId}
          onChange={e => setNewQuestion({ ...newQuestion, chapterId: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="number"
          placeholder="Marks"
          value={newQuestion.marks}
          onChange={e => setNewQuestion({ ...newQuestion, marks: e.target.value })}
          className="border p-2 mr-2"
        />
        <button onClick={handleAddQuestion} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {questions.map((question: any) => (
            <li key={question._id} className="mb-2">
              <span className="font-medium">{question.text}</span> (Chapter: {question.chapterId}, Marks: {question.marks})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExamQuestionManagement;
