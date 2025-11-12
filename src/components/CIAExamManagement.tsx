import React, { useEffect, useState } from 'react';
import facultyAPI from '../services/facultyAPI';

const CIAExamManagement: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newExam, setNewExam] = useState({ name: '', date: '', courseId: '' });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const courseId = localStorage.getItem('courseId');
      const data = courseId
        ? await facultyAPI.exam.getByCourse(courseId)
        : await facultyAPI.exam.getAll();
      setExams(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to fetch exams');
    }
    setLoading(false);
  };

  const handleAddExam = async () => {
    setLoading(true);
    try {
      await facultyAPI.exam.create(newExam);
      setNewExam({ name: '', date: '', courseId: '' });
      fetchExams();
    } catch (err) {
      setError('Failed to add exam');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">CIA Exam Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Exam Name"
          value={newExam.name}
          onChange={e => setNewExam({ ...newExam, name: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="date"
          placeholder="Exam Date"
          value={newExam.date}
          onChange={e => setNewExam({ ...newExam, date: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Course ID"
          value={newExam.courseId}
          onChange={e => setNewExam({ ...newExam, courseId: e.target.value })}
          className="border p-2 mr-2"
        />
        <button onClick={handleAddExam} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {exams.map((exam: any) => (
            <li key={exam._id} className="mb-2">
              <span className="font-medium">{exam.name}</span> ({exam.date}) - Course: {exam.courseId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CIAExamManagement;
