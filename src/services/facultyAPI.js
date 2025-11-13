// Faculty Module API Service
// Handles all API calls for the faculty module

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Helper to get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// ==================== COURSES ====================

export const courseAPI = {
  // Get all courses
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${BASE_URL}/courses?${params}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get single course
  getById: async (id) => {
    const response = await axios.get(`${BASE_URL}/courses/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get courses by faculty
  getByFaculty: async (facultyId) => {
    const response = await axios.get(`${BASE_URL}/courses/faculty/${facultyId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get course statistics
  getStats: async (id) => {
    const response = await axios.get(`${BASE_URL}/courses/${id}/stats`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Create course
  create: async (courseData) => {
    const response = await axios.post(`${BASE_URL}/courses`, courseData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Update course
  update: async (id, courseData) => {
    const response = await axios.put(`${BASE_URL}/courses/${id}`, courseData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Update course status
  updateStatus: async (id, status) => {
    const response = await axios.patch(`${BASE_URL}/courses/${id}/status`, 
      { status }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Delete course
  delete: async (id) => {
    const response = await axios.delete(`${BASE_URL}/courses/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// ==================== CHAPTERS ====================

export const chapterAPI = {
  // Get all chapters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${BASE_URL}/chapters?${params}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get chapters by course
  getByCourse: async (courseId) => {
    const response = await axios.get(`${BASE_URL}/chapters/course/${courseId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get single chapter
  getById: async (id) => {
    const response = await axios.get(`${BASE_URL}/chapters/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Create chapter
  create: async (chapterData) => {
    const response = await axios.post(`${BASE_URL}/chapters`, chapterData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Upload chapter PDF
  uploadPDF: async (chapterId, pdfFile) => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);

    const response = await axios.post(
      `${BASE_URL}/chapters/${chapterId}/upload-pdf`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${getAuthToken()}`
        }
      }
    );
    return response.data;
  },

  // Add resource
  addResource: async (chapterId, resourceData, file = null) => {
    const formData = new FormData();
    Object.keys(resourceData).forEach(key => {
      formData.append(key, resourceData[key]);
    });
    if (file) {
      formData.append('file', file);
    }

    const response = await axios.post(
      `${BASE_URL}/chapters/${chapterId}/resources`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${getAuthToken()}`
        }
      }
    );
    return response.data;
  },

  // Update chapter
  update: async (id, chapterData) => {
    const response = await axios.put(`${BASE_URL}/chapters/${id}`, chapterData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Reorder chapters
  reorder: async (courseId, chapterOrders) => {
    const response = await axios.put(
      `${BASE_URL}/chapters/reorder`,
      { courseId, chapterOrders },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Update status
  updateStatus: async (id, status) => {
    const response = await axios.patch(
      `${BASE_URL}/chapters/${id}/status`,
      { status },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Delete chapter
  delete: async (id) => {
    const response = await axios.delete(`${BASE_URL}/chapters/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// ==================== EXAMS ====================

export const examAPI = {
  // Get all exams
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${BASE_URL}/exams?${params}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get upcoming exams
  getUpcoming: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${BASE_URL}/exams/upcoming?${params}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get exams by course
  getByCourse: async (courseId) => {
    const response = await axios.get(`${BASE_URL}/exams/course/${courseId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get single exam
  getById: async (id) => {
    const response = await axios.get(`${BASE_URL}/exams/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get exam statistics
  getStatistics: async (id) => {
    const response = await axios.get(`${BASE_URL}/exams/${id}/statistics`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Create exam
  create: async (examData) => {
    const response = await axios.post(`${BASE_URL}/exams`, examData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Update exam
  update: async (id, examData) => {
    const response = await axios.put(`${BASE_URL}/exams/${id}`, examData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Update status
  updateStatus: async (id, status) => {
    const response = await axios.patch(
      `${BASE_URL}/exams/${id}/status`,
      { status },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Delete exam
  delete: async (id) => {
    const response = await axios.delete(`${BASE_URL}/exams/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// ==================== QUESTIONS ====================

export const questionAPI = {
  // Get questions by exam
  getByExam: async (examId) => {
    const response = await axios.get(`${BASE_URL}/questions/exam/${examId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get chapter distribution
  getChapterDistribution: async (examId) => {
    const response = await axios.get(
      `${BASE_URL}/questions/exam/${examId}/chapter-distribution`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get questions by chapter
  getByChapter: async (chapterId) => {
    const response = await axios.get(`${BASE_URL}/questions/chapter/${chapterId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Create question
  create: async (questionData) => {
    const response = await axios.post(`${BASE_URL}/questions`, questionData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Bulk create questions
  bulkCreate: async (exam, questions) => {
    const response = await axios.post(
      `${BASE_URL}/questions/bulk`,
      { exam, questions },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Update question
  update: async (id, questionData) => {
    const response = await axios.put(`${BASE_URL}/questions/${id}`, questionData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Reorder questions
  reorder: async (examId, questionOrders) => {
    const response = await axios.put(
      `${BASE_URL}/questions/exam/${examId}/reorder`,
      { questionOrders },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Delete question
  delete: async (id) => {
    const response = await axios.delete(`${BASE_URL}/questions/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// ==================== MARKS ====================

export const marksAPI = {
  // Enter marks
  enter: async (marksData) => {
    const response = await axios.post(`${BASE_URL}/marks`, marksData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Bulk enter marks
  bulkEnter: async (exam, marksData) => {
    const response = await axios.post(
      `${BASE_URL}/marks/bulk`,
      { exam, marksData },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get marks by exam
  getByExam: async (examId) => {
    const response = await axios.get(`${BASE_URL}/marks/exam/${examId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get marks by student
  getByStudent: async (studentId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${BASE_URL}/marks/student/${studentId}?${params}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get chapter-wise performance
  getChapterPerformance: async (examId) => {
    const response = await axios.get(
      `${BASE_URL}/marks/exam/${examId}/chapter-performance`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get weak students by chapter
  getWeakStudents: async (examId, threshold = 50) => {
    const response = await axios.get(
      `${BASE_URL}/marks/exam/${examId}/weak-students?threshold=${threshold}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get exam performance
  getExamPerformance: async (examId) => {
    const response = await axios.get(
      `${BASE_URL}/marks/exam/${examId}/performance`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Update marks
  update: async (id, marksData) => {
    const response = await axios.put(`${BASE_URL}/marks/${id}`, marksData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Delete marks
  delete: async (id) => {
    const response = await axios.delete(`${BASE_URL}/marks/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// ==================== PERFORMANCE ====================

export const performanceAPI = {
  // Get performance by student
  getByStudent: async (studentId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${BASE_URL}/performance/student/${studentId}?${params}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get performance by course
  getByCourse: async (courseId) => {
    const response = await axios.get(`${BASE_URL}/performance/course/${courseId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get weak students
  getWeakStudents: async (courseId, threshold = 50) => {
    const response = await axios.get(
      `${BASE_URL}/performance/course/${courseId}/weak-students?threshold=${threshold}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get weak students by chapter
  getWeakStudentsByChapter: async (courseId, chapterId, threshold = 50) => {
    const response = await axios.get(
      `${BASE_URL}/performance/course/${courseId}/chapter/${chapterId}/weak-students?threshold=${threshold}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get top performers
  getTopPerformers: async (courseId, limit = 10) => {
    const response = await axios.get(
      `${BASE_URL}/performance/course/${courseId}/top-performers?limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get course statistics
  getCourseStatistics: async (courseId) => {
    const response = await axios.get(
      `${BASE_URL}/performance/course/${courseId}/statistics`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Recalculate performance
  recalculate: async (id) => {
    const response = await axios.post(
      `${BASE_URL}/performance/${id}/recalculate`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  }
};

// ==================== TASKS ====================

export const taskAPI = {
  // Get tasks by student
  getByStudent: async (studentId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${BASE_URL}/tasks/student/${studentId}?${params}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get tasks by faculty
  getByFaculty: async (facultyId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(
      `${BASE_URL}/tasks/faculty/${facultyId}?${params}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get single task
  getById: async (id) => {
    const response = await axios.get(`${BASE_URL}/tasks/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get task statistics
  getStatistics: async (courseId) => {
    const response = await axios.get(
      `${BASE_URL}/tasks/course/${courseId}/statistics`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get overdue tasks
  getOverdue: async (courseId) => {
    const response = await axios.get(
      `${BASE_URL}/tasks/course/${courseId}/overdue`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Create task
  create: async (taskData) => {
    const response = await axios.post(`${BASE_URL}/tasks`, taskData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Auto-generate tasks
  autoGenerate: async (generateData) => {
    const response = await axios.post(
      `${BASE_URL}/tasks/auto-generate`,
      generateData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Submit task (student)
  submit: async (id, answers) => {
    const response = await axios.post(
      `${BASE_URL}/tasks/${id}/submit`,
      { answers },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Update task
  update: async (id, taskData) => {
    const response = await axios.put(`${BASE_URL}/tasks/${id}`, taskData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Delete task
  delete: async (id) => {
    const response = await axios.delete(`${BASE_URL}/tasks/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// ==================== MCQ GENERATOR V3 ====================

export const mcqGeneratorAPI = {
  // Get subjects for faculty
  getSubjects: async () => {
    const response = await axios.get(`${BASE_URL}/mcq-generator/subjects`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Get chapters by subject
  getChapters: async (subjectId) => {
    const response = await axios.get(
      `${BASE_URL}/mcq-generator/subjects/${subjectId}/chapters`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Get materials by chapter (only PDFs)
  getMaterials: async (chapterId) => {
    const response = await axios.get(
      `${BASE_URL}/mcq-generator/chapters/${chapterId}/materials`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Generate MCQs from material
  generate: async (generateData) => {
    const response = await axios.post(
      `${BASE_URL}/mcq-generator/generate`,
      generateData,
      { 
        headers: getAuthHeaders(),
        timeout: 60000 // 60 second timeout for AI generation
      }
    );
    return response.data;
  }
};

// Export all APIs
export default {
  course: courseAPI,
  chapter: chapterAPI,
  exam: examAPI,
  question: questionAPI,
  marks: marksAPI,
  performance: performanceAPI,
  task: taskAPI,
  mcqGenerator: mcqGeneratorAPI
};
