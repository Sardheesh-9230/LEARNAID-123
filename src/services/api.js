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

  // Generic API request handler with retry logic
  async makeRequest(url, options = {}, retries = 3, skipAutoLogin = false) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const config = {
          headers: this.getHeaders(),
          ...options,
        };

        const response = await fetch(`${this.baseURL}${url}`, config);
        
        // Handle different HTTP status codes
        if (response.status === 401) {
          // Skip auto-login if this is already a login request to prevent infinite loop
          if (!skipAutoLogin && attempt === 0 && !url.includes('/auth/login')) {
            this.setToken(null);
            const autoLoginSuccess = await this.autoLogin();
            if (autoLoginSuccess) {
              continue; // Retry with new token
            }
          }
          
          // Don't redirect if this is a login request
          if (typeof window !== 'undefined' && !url.includes('/auth/login')) {
            // Clear token and show error instead of redirecting
            this.setToken(null);
          }
          throw new Error('Unauthorized access - please login again');
        }

        if (response.status === 403) {
          throw new Error('Access forbidden - insufficient permissions');
        }

        if (response.status === 404) {
          throw new Error('Resource not found');
        }

        if (response.status === 409) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Conflict - resource already exists');
        }

        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          // For validation errors, throw the entire error data to preserve error details
          const error = new Error(errorData.message || 'Bad request - validation failed');
          error.response = { data: errorData };
          throw error;
        }

        if (response.status === 429) {
          // Rate limited - wait and retry
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Too many requests - please try again later');
        }

        if (response.status >= 500) {
          // Server error - retry
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Server error - please try again later');
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
        // If it's our last attempt or a non-retryable error, throw it
        if (attempt === retries || 
            error.message.includes('Unauthorized') ||
            error.message.includes('forbidden') ||
            error.message.includes('not found') ||
            error.message.includes('Conflict')) {
          console.error(`API Request Error (attempt ${attempt + 1}):`, error);
          throw error;
        }
        
        // For network errors, wait before retrying
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Auto-login helper method - DISABLED to prevent infinite loops
  async autoLogin() {
    try {
      // Try with existing token first
      const existingToken = localStorage.getItem('authToken');
      if (existingToken) {
        this.setToken(existingToken);
        // Verify token is still valid
        const response = await fetch(`${this.baseURL}/auth/me`, {
          headers: this.getHeaders()
        });
        if (response.ok) {
          return true;
        }
      }

      // Removed auto-login as admin to prevent infinite loop
      // Users must login manually
      return false;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    }
  }

  // Authentication methods
  async login(email, password) {
    console.log('API Service: Making login request for:', email) // Debug log
    
    // Pass skipAutoLogin=true to prevent infinite loop
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, 3, true); // skipAutoLogin = true
    
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

  async changeUserPassword(id, newPassword) {
    return this.makeRequest(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
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

  // Sync student enrollments based on department/year/section matching
  async syncStudentEnrollments() {
    return this.makeRequest('/subjects/sync-enrollments', {
      method: 'POST',
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

  // ========================================
  // CHAPTER APIs
  // ========================================

  // Get chapters by subject
  async getChaptersBySubject(subjectId) {
    return this.makeRequest(`/subjects/${subjectId}/chapters`);
  }

  // Get single chapter
  async getChapter(chapterId) {
    return this.makeRequest(`/subjects/chapters/${chapterId}`);
  }

  // Create chapter
  async createChapter(subjectId, chapterData) {
    return this.makeRequest(`/subjects/${subjectId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(chapterData),
    });
  }

  // Update chapter
  async updateChapter(chapterId, chapterData) {
    return this.makeRequest(`/subjects/chapters/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(chapterData),
    });
  }

  // Delete chapter
  async deleteChapter(chapterId) {
    return this.makeRequest(`/subjects/chapters/${chapterId}`, {
      method: 'DELETE',
    });
  }

  // Reorder chapters
  async reorderChapters(subjectId, chapterOrders) {
    return this.makeRequest(`/subjects/${subjectId}/chapters/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ chapterOrders }),
    });
  }

  // ========================================
  // MATERIAL APIs
  // ========================================

  // Get materials by subject
  async getMaterialsBySubject(subjectId) {
    return this.makeRequest(`/subjects/${subjectId}/materials`);
  }

  // Get materials by chapter
  async getMaterialsByChapter(chapterId) {
    return this.makeRequest(`/subjects/materials/chapters/${chapterId}/materials`);
  }

  // Get single material
  async getMaterial(materialId) {
    return this.makeRequest(`/subjects/materials/${materialId}`);
  }

  // Create material
  async createMaterial(chapterId, materialData) {
    // Check if materialData is FormData (for file uploads) or regular object
    if (materialData instanceof FormData) {
      // For file uploads, don't stringify and remove Content-Type header
      const headers = this.getHeaders();
      delete headers['Content-Type'];

      return fetch(`${this.baseURL}/materials/chapters/${chapterId}/materials`, {
        method: 'POST',
        headers: {
          Authorization: headers.Authorization,
        },
        body: materialData,
      }).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Material creation failed');
        }
        return response.json();
      });
    } else {
      // For regular JSON data
      return this.makeRequest(`/materials/chapters/${chapterId}/materials`, {
        method: 'POST',
        body: JSON.stringify(materialData),
      });
    }
  }

  // Update material
  async updateMaterial(materialId, materialData) {
    return this.makeRequest(`/subjects/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  }

  // Delete material
  async deleteMaterial(materialId) {
    return this.makeRequest(`/subjects/materials/${materialId}`, {
      method: 'DELETE',
    });
  }

  // View material file (returns blob URL for opening in new tab)
  async viewMaterialFile(materialId) {
    const token = this.token || localStorage.getItem('authToken');
    console.log('🔍 Viewing material:', materialId);
    
    const response = await fetch(`${this.baseURL}/subjects/materials/${materialId}/view`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('View response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('View failed:', errorText);
      throw new Error(`Failed to fetch material file: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    console.log('Blob created:', blob.type, blob.size);
    return URL.createObjectURL(blob);
  }

  // Download material file
  async downloadMaterialFile(materialId, filename) {
    const token = this.token || localStorage.getItem('authToken');
    console.log('⬇️ Downloading material:', materialId, filename);
    
    const response = await fetch(`${this.baseURL}/subjects/materials/${materialId}/file`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Download response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Download failed:', errorText);
      throw new Error(`Failed to download material file: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();
    console.log('Download blob created:', blob.type, blob.size);
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Reorder materials
  async reorderMaterials(chapterId, materialOrders) {
    return this.makeRequest(`/subjects/materials/chapters/${chapterId}/materials/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ materialOrders }),
    });
  }

  // Record material download
  async recordMaterialDownload(materialId) {
    return this.makeRequest(`/subjects/materials/${materialId}/download`, {
      method: 'POST',
    });
  }

  // MCQ Generation APIs
  async generateMCQs(materialId, topic, numberOfQuestions = 5, difficulty = 'medium') {
    return this.makeRequest('/mcq/generate', {
      method: 'POST',
      body: JSON.stringify({
        materialId,
        topic,
        numberOfQuestions,
        difficulty
      }),
    });
  }

  async extractTopicsFromMaterial(materialId) {
    return this.makeRequest('/mcq/extract-topics', {
      method: 'POST',
      body: JSON.stringify({ materialId }),
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
      year: user.year,
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

  // Error handling utility with notifications
  handleApiError(error, context = 'API operation') {
    console.error(`${context} failed:`, error);
    
    // Show user-friendly error messages
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message.includes('Unauthorized')) {
      errorMessage = 'Session expired. Please login again.';
    } else if (error.message.includes('forbidden')) {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error.message.includes('not found')) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.message.includes('Conflict')) {
      errorMessage = error.message; // Keep the specific conflict message
    } else if (error.message.includes('Too many requests')) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('Server error')) {
      errorMessage = 'Server is temporarily unavailable. Please try again later.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Show notification
    this.showNotification(errorMessage, 'error');
    
    return null;
  }

  // Notification system
  showNotification(message, type = 'info') {
    if (typeof window !== 'undefined') {
      // Try to use custom notification system if available
      if (window.showNotification) {
        window.showNotification(message, type);
      } else {
        // Fallback to console and alert for errors
        if (type === 'error') {
          console.error('Error:', message);
          // Only show alert for critical errors, not routine ones
          if (message.includes('Server error') || message.includes('Session expired')) {
            alert(`Error: ${message}`);
          }
        } else if (type === 'success') {
          console.log('Success:', message);
        } else {
          console.info('Info:', message);
        }
      }
    }
  }

  // Success notification helper
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  // Error notification helper  
  showError(message) {
    this.showNotification(message, 'error');
  }

  // Health check with better error handling
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Batch operations helper
  async batchOperation(operations, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Cache management
  clearCache() {
    if (typeof window !== 'undefined') {
      // Clear all API-related cache
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  // Data validation helpers
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Format helpers
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  // Chapters
  getChaptersBySubject,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  
  // Materials
  getMaterialsBySubject,
  getMaterialsByChapter,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  reorderMaterials,
  recordMaterialDownload,
  viewMaterialFile,
  downloadMaterialFile,
  
  // MCQ Generation
  generateMCQs,
  extractTopicsFromMaterial,
  
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
