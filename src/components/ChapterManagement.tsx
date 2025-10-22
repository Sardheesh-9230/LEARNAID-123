import React, { useEffect, useState } from 'react';
import facultyAPI from '../services/facultyAPI';

const ChapterManagement: React.FC = () => {
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newChapter, setNewChapter] = useState<{ name: string; courseId: string; pdf: File | null }>({ name: '', courseId: '', pdf: null });

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    setLoading(true);
    try {
      const courseId = localStorage.getItem('courseId');
      const data = courseId
        ? await facultyAPI.chapter.getByCourse(courseId)
        : await facultyAPI.chapter.getAll();
  setChapters(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to fetch chapters');
    }
    setLoading(false);
  };

  const handleAddChapter = async () => {
    setLoading(true);
    try {
      await facultyAPI.chapter.create(newChapter);
      setNewChapter({ name: '', courseId: '', pdf: null });
      fetchChapters();
    } catch (err) {
      setError('Failed to add chapter');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Chapter Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Chapter Name"
          value={newChapter.name}
          onChange={e => setNewChapter({ ...newChapter, name: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Course ID"
          value={newChapter.courseId}
          onChange={e => setNewChapter({ ...newChapter, courseId: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="file"
          onChange={e => setNewChapter({ ...newChapter, pdf: (e.target.files && e.target.files[0]) ? e.target.files[0] : null })}
          className="border p-2 mr-2"
        />
        <button onClick={handleAddChapter} className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
      {Array.isArray(chapters) && chapters.map((chapter: any) => (
            <li key={chapter._id} className="mb-2">
              <span className="font-medium">{chapter.name}</span> (Course: {chapter.courseId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChapterManagement;
