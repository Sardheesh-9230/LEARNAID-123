import React, { useEffect, useState } from 'react';
import facultyAPI from '../services/facultyAPI';

const TaskAssignmentManagement: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const facultyId = localStorage.getItem('facultyId');
      const data = facultyId
        ? await facultyAPI.task.getByFaculty(facultyId)
        : [];
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Task Assignment Management</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {tasks.map((task: any) => (
            <li key={task._id} className="mb-2">
              <span className="font-medium">{task.title}</span> - Student: {task.studentId}, Status: {task.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskAssignmentManagement;
