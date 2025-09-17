// API Service Layer for LearnAID Frontend-Backend Integration
// This service handles all HTTP requests with authentication, error handling, and data persistence

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = null;
    this.init();
  }

  init() {
    // Get token from localStorage if it exists (only in browser)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request handler
  async makeRequest(url, options = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        ...options,
      };

      const response = await fetch(`${this.baseURL}${url}`, config);
      
      // Handle different HTTP status codes
      if (response.status === 401) {
        // Unauthorized - clear token and redirect to login
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized access');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (like DELETE operations)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return { success: true };
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    console.log('API Service: Making login request for:', email) // Debug log
    
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    console.log('API Service: Raw response:', response) // Debug log
    
    // Flatten the response structure for easier access in components
    if (response.success && response.data) {
      const flatResponse = {
        success: response.success,
        message: response.message,
        user: response.data.user,
        token: response.data.token
      };
      
      console.log('API Service: Flattened response:', flatResponse) // Debug log
      
      if (flatResponse.token) {
        this.setToken(flatResponse.token);
      }
      
      return flatResponse;
    }
    
    console.log('API Service: Returning original response:', response) // Debug log
    return response;
  }

  async logout() {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  // Department Management APIs
  async getDepartments() {
    return this.makeRequest('/departments');
  }

  async getDepartment(id) {
    return this.makeRequest(`/departments/${id}`);
  }

  async createDepartment(departmentData) {
    return this.makeRequest('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
  }

  async updateDepartment(id, departmentData) {
    return this.makeRequest(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
  }

  async deleteDepartment(id) {
    return this.makeRequest(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  // User Management APIs
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    return this.makeRequest(url);
  }

  async getUser(id) {
    return this.makeRequest(`/users/${id}`);
  }

  async createUser(userData) {
    return this.makeRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.makeRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.makeRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Get users by role
  async getUsersByRole(role) {
    return this.getUsers({ role });
  }

  // Get students by department
  async getStudentsByDepartment(departmentId) {
    return this.getUsers({ role: 'Student', department: departmentId });
  }

  // Get faculty by department
  async getFacultyByDepartment(departmentId) {
    return this.getUsers({ role: 'Faculty', department: departmentId });
  }

  // Subject Management APIs
  async getSubjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/subjects?${queryString}` : '/subjects';
    return this.makeRequest(url);
  }

  async getSubject(id) {
    return this.makeRequest(`/subjects/${id}`);
  }

  async createSubject(subjectData) {
    return this.makeRequest('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
  }

  async updateSubject(id, subjectData) {
    return this.makeRequest(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subjectData),
    });
  }

  async deleteSubject(id) {
    return this.makeRequest(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // Get subjects by department
  async getSubjectsByDepartment(departmentId) {
    return this.getSubjects({ department: departmentId });
  }

  // Assign faculty to subject
  async assignFacultyToSubject(subjectId, facultyData) {
    return this.makeRequest(`/subjects/${subjectId}/faculty`, {
      method: 'POST',
      body: JSON.stringify(facultyData),
    });
  }

  // Remove faculty from subject
  async removeFacultyFromSubject(subjectId, facultyId) {
    return this.makeRequest(`/subjects/${subjectId}/faculty/${facultyId}`, {
      method: 'DELETE',
    });
  }

  // Enroll students in subject
  async enrollStudentsInSubject(subjectId, studentIds) {
    return this.makeRequest(`/subjects/${subjectId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }

  // Remove students from subject
  async removeStudentsFromSubject(subjectId, studentIds) {
    return this.makeRequest(`/subjects/${subjectId}/students`, {
      method: 'DELETE',
      body: JSON.stringify({ studentIds }),
    });
  }

  // Analytics APIs
  async getDashboardStats() {
    return this.makeRequest('/analytics/dashboard');
  }

  async getDepartmentStats(departmentId) {
    return this.makeRequest(`/analytics/departments/${departmentId}`);
  }

  async getEnrollmentStats() {
    return this.makeRequest('/analytics/enrollment');
  }

  async getFacultyWorkload() {
    return this.makeRequest('/analytics/faculty-workload');
  }

  // File Upload APIs
  async uploadFile(formData) {
    // Remove Content-Type header for file uploads to let browser set it
    const headers = this.getHeaders();
    delete headers['Content-Type'];

    return fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: headers.Authorization,
      },
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }
      return response.json();
    });
  }

  // Utility methods for data transformation
  transformDepartmentData(department) {
    return {
      id: department._id,
      name: department.name,
      code: department.code,
      description: department.description,
      hod: department.hod?.name || 'Not Assigned',
      hodId: department.hod?._id,
      establishedYear: department.establishedYear,
      sections: department.sections || [],
      facilities: department.facilities || [],
      programs: department.programs || [],
      contactInfo: department.contactInfo || {},
      status: department.status || 'Active',
      students: 0, // Will be calculated from user count
      faculty: 0, // Will be calculated from user count
      staff: 0, // Will be calculated from user count
      subjects: 0, // Will be calculated from subject count
    };
  }

  transformUserData(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department?.name || user.department,
      departmentId: user.department?._id || user.department,
      section: user.section,
      batch: user.batch,
      phone: user.phone,
      address: user.address,
      status: user.status || 'Active',
      dateJoined: user.createdAt || new Date().toISOString(),
      // Student-specific fields
      studentId: user.studentId,
      semester: user.semester,
      gpa: user.gpa,
      guardianName: user.guardianName,
      guardianPhone: user.guardianPhone,
      // Faculty-specific fields
      employeeId: user.employeeId,
      designation: user.designation,
      qualification: user.qualification,
      experience: user.experience,
      specialization: user.specialization || [],
    };
  }

  transformSubjectData(subject) {
    return {
      id: subject._id,
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      description: subject.description,
      department: subject.department?.name || subject.department,
      departmentId: subject.department?._id || subject.department,
      year: subject.year,
      section: subject.section,
      semester: subject.semester,
      academicYear: subject.academicYear,
      type: subject.type || 'Core',
      faculty: (subject.faculty || []).map(f => ({
        id: f.user?._id || f.user,
        name: f.user?.name || 'Unknown',
        email: f.user?.email || '',
        department: f.user?.department?.name || '',
        isExternal: f.isExternal || false,
        isPrimary: f.isPrimary || false,
      })),
      enrolledStudents: subject.enrolledStudents || [],
      maxStudents: subject.maxStudents || 65,
      status: subject.status || 'Active',
    };
  }

  // Error handling utility
  handleApiError(error, context = 'API operation') {
    console.error(`${context} failed:`, error);
    
    // Show user-friendly error messages
    const errorMessage = error.message || 'An unexpected error occurred';
    
    // You can integrate with a toast notification system here
    if (typeof window !== 'undefined') {
      if (window.showNotification) {
        window.showNotification(errorMessage, 'error');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
    
    return null;
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Named exports for convenience
export const {
  // Auth
  login,
  logout,
  getCurrentUser,
  
  // Departments
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  
  // Users
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getStudentsByDepartment,
  getFacultyByDepartment,
  
  // Subjects
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByDepartment,
  assignFacultyToSubject,
  removeFacultyFromSubject,
  enrollStudentsInSubject,
  removeStudentsFromSubject,
  
  // Analytics
  getDashboardStats,
  getDepartmentStats,
  getEnrollmentStats,
  getFacultyWorkload,
  
  // Upload
  uploadFile,
  
  // Utilities
  transformDepartmentData,
  transformUserData,
  transformSubjectData,
  handleApiError,
  checkHealth,
} = apiService;
