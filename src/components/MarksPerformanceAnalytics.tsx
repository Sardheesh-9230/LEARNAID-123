import React, { useEffect, useState } from 'react';
import facultyAPI from '../services/facultyAPI';

const MarksPerformanceAnalytics: React.FC = () => {
  const [marks, setMarks] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newMark, setNewMark] = useState({ studentId: '', examId: '', marks: '' });

  useEffect(() => {
    fetchMarks();
    fetchPerformance();
  }, []);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const examId = localStorage.getItem('examId');
      const data = examId
        ? await facultyAPI.marks.getByExam(examId)
        : [];
      setMarks(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch marks');
    }
    setLoading(false);
  };

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const courseId = localStorage.getItem('courseId');
      const data = courseId
        ? await facultyAPI.performance.getByCourse(courseId)
        : [];
      setPerformance(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch performance');
    }
    setLoading(false);
  };

  const handleAddMark = async () => {
    setLoading(true);
    try {
  await facultyAPI.marks.enter(newMark);
      setNewMark({ studentId: '', examId: '', marks: '' });
      fetchMarks();
      fetchPerformance();
    } catch (err) {
      setError('Failed to add mark');
    }
  setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Marks & Performance Analytics</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Student ID"
          value={newMark.studentId}
          onChange={e => setNewMark({ ...newMark, studentId: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Exam ID"
          value={newMark.examId}
          onChange={e => setNewMark({ ...newMark, examId: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="number"
          placeholder="Marks"
          value={newMark.marks}
          onChange={e => setNewMark({ ...newMark, marks: e.target.value })}
          className="border p-2 mr-2"
        />
        <button onClick={handleAddMark} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <h3 className="font-semibold">Marks</h3>
          <ul>
            {marks.map((mark: any) => (
              <li key={mark._id} className="mb-2">
                Student: {mark.studentId}, Exam: {mark.examId}, Marks: {mark.marks}
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mt-4">Performance Analytics</h3>
          <ul>
            {performance.map((perf: any) => (
              <li key={perf._id} className="mb-2">
                Student: {perf.studentId}, Performance: {perf.status}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MarksPerformanceAnalytics;
