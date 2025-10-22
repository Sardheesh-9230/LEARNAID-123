import React, { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiBarChart2, FiX, FiSave, FiBook } from 'react-icons/fi';
import facultyAPI from '../services/facultyAPI';

interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  semester?: string;
  status?: string;
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: '',
    semester: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const facultyId = localStorage.getItem('userId');
      const data = facultyId
        ? await facultyAPI.course.getByFaculty(facultyId)
        : await facultyAPI.course.getAll();
      setCourses(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError('Failed to fetch courses: ' + (err.response?.data?.message || err.message));
      setCourses([]);
    }
    setLoading(false);
  };

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditMode(true);
      setSelectedCourse(course);
      setFormData({
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
        credits: course.credits?.toString() || '',
        semester: course.semester || '',
        status: course.status || 'active'
      });
    } else {
      setEditMode(false);
      setSelectedCourse(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        credits: '',
        semester: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedCourse(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: '',
      semester: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const courseData = {
        ...formData,
        credits: formData.credits ? parseInt(formData.credits) : undefined
      };

      if (editMode && selectedCourse) {
        await facultyAPI.course.update(selectedCourse._id, courseData);
      } else {
        await facultyAPI.course.create(courseData);
      }
      
      handleCloseModal();
      fetchCourses();
      setError('');
    } catch (err: any) {
      setError('Failed to save course: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    setLoading(true);
    try {
      await facultyAPI.course.delete(id);
      fetchCourses();
      setError('');
    } catch (err: any) {
      setError('Failed to delete course: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const handleStatusToggle = async (course: Course) => {
    setLoading(true);
    try {
      const newStatus = course.status === 'active' ? 'inactive' : 'active';
      await facultyAPI.course.updateStatus(course._id, newStatus);
      fetchCourses();
      setError('');
    } catch (err: any) {
      setError('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Course Management</h2>
          <p className="text-gray-600 mt-1">Manage all your courses</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
        >
          <FiPlus size={20} />
          <span>Add New Course</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {loading && courses.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <FiBook size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Courses Yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first course</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <FiPlus size={20} />
            <span>Add First Course</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4 border-indigo-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{course.name}</h3>
                  <p className="text-sm text-gray-600">{course.code}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {course.status || 'Active'}
                </span>
              </div>

              {course.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                {course.credits && <span>Credits: {course.credits}</span>}
                {course.semester && <span>Sem: {course.semester}</span>}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenModal(course)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <FiEdit2 size={16} />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => handleStatusToggle(course)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg transition-colors"
                  title="Toggle Status"
                >
                  <FiBarChart2 size={16} />
                  <span className="text-sm font-medium">Status</span>
                </button>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {editMode ? 'Edit Course' : 'Add New Course'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Data Structures"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., CS101"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of the course"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Fall 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <FiSave size={18} />
                  <span>{loading ? 'Saving...' : editMode ? 'Update Course' : 'Create Course'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;

