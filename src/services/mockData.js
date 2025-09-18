// Mock Data Service for LearnAID - Simulates database operations with localStorage

class MockDataService {
  constructor() {
    this.initializeData();
  }

  // Initialize mock data if not exists in localStorage
  initializeData() {
    if (typeof window === 'undefined') return;

    // Initialize departments if not exists
    if (!localStorage.getItem('departments')) {
      const departments = [
        {
          _id: 'dept1',
          name: 'Computer Science Engineering',
          code: 'CSE',
          description: 'Computer Science and Engineering Department',
          establishedYear: 2010,
          sections: ['A', 'B', 'C'],
          facilities: ['Computer Lab', 'Software Lab', 'AI Lab'],
          programs: ['B.Tech', 'M.Tech'],
          contactInfo: { email: 'cse@learnaid.edu', phone: '+91-9876543210' },
          status: 'Active',
          hod: { _id: 'user1', name: 'Dr. Rajesh Kumar' }
        },
        {
          _id: 'dept2',
          name: 'Electronics & Communication',
          code: 'ECE',
          description: 'Electronics and Communication Engineering Department',
          establishedYear: 2012,
          sections: ['A', 'B'],
          facilities: ['Electronics Lab', 'Communication Lab', 'VLSI Lab'],
          programs: ['B.Tech', 'M.Tech'],
          contactInfo: { email: 'ece@learnaid.edu', phone: '+91-9876543211' },
          status: 'Active',
          hod: { _id: 'user2', name: 'Dr. Priya Sharma' }
        },
        {
          _id: 'dept3',
          name: 'Mechanical Engineering',
          code: 'MECH',
          description: 'Mechanical Engineering Department',
          establishedYear: 2008,
          sections: ['A', 'B'],
          facilities: ['Workshop', 'CAD Lab', 'Thermal Lab'],
          programs: ['B.Tech', 'M.Tech'],
          contactInfo: { email: 'mech@learnaid.edu', phone: '+91-9876543212' },
          status: 'Active',
          hod: { _id: 'user3', name: 'Dr. Amit Singh' }
        }
      ];
      localStorage.setItem('departments', JSON.stringify(departments));
    }

    // Initialize users if not exists
    if (!localStorage.getItem('users')) {
      const users = [
        // Faculty
        {
          _id: 'user1',
          name: 'Dr. Rajesh Kumar',
          email: 'rajesh@learnaid.edu',
          role: 'Faculty',
          department: { _id: 'dept1', name: 'Computer Science Engineering' },
          employeeId: 'FAC001',
          designation: 'Professor & HOD',
          qualification: 'Ph.D in Computer Science',
          experience: 15,
          specialization: ['Machine Learning', 'Data Structures'],
          status: 'Active',
          createdAt: '2023-01-15T00:00:00.000Z'
        },
        {
          _id: 'user2',
          name: 'Dr. Priya Sharma',
          email: 'priya@learnaid.edu',
          role: 'Faculty',
          department: { _id: 'dept2', name: 'Electronics & Communication' },
          employeeId: 'FAC002',
          designation: 'Associate Professor & HOD',
          qualification: 'Ph.D in Electronics',
          experience: 12,
          specialization: ['Digital Signal Processing', 'VLSI Design'],
          status: 'Active',
          createdAt: '2023-01-20T00:00:00.000Z'
        },
        {
          _id: 'user3',
          name: 'Dr. Amit Singh',
          email: 'amit@learnaid.edu',
          role: 'Faculty',
          department: { _id: 'dept3', name: 'Mechanical Engineering' },
          employeeId: 'FAC003',
          designation: 'Professor & HOD',
          qualification: 'Ph.D in Mechanical Engineering',
          experience: 18,
          specialization: ['Thermal Engineering', 'Manufacturing'],
          status: 'Active',
          createdAt: '2023-01-25T00:00:00.000Z'
        },
        {
          _id: 'user4',
          name: 'Prof. Sarah Johnson',
          email: 'sarah@learnaid.edu',
          role: 'Faculty',
          department: { _id: 'dept1', name: 'Computer Science Engineering' },
          employeeId: 'FAC004',
          designation: 'Assistant Professor',
          qualification: 'M.Tech in Computer Science',
          experience: 8,
          specialization: ['Web Development', 'Database Systems'],
          status: 'Active',
          createdAt: '2023-02-01T00:00:00.000Z'
        },
        // Students
        {
          _id: 'user5',
          name: 'Aarav Patel',
          email: 'aarav@learnaid.edu',
          role: 'Student',
          department: { _id: 'dept1', name: 'Computer Science Engineering' },
          studentId: 'CSE001',
          section: 'A',
          batch: '2024',
          semester: 7,
          gpa: 8.5,
          guardianName: 'Ravi Patel',
          guardianPhone: '+91-9876543220',
          status: 'Active',
          createdAt: '2024-07-15T00:00:00.000Z'
        },
        {
          _id: 'user6',
          name: 'Diya Sharma',
          email: 'diya@learnaid.edu',
          role: 'Student',
          department: { _id: 'dept1', name: 'Computer Science Engineering' },
          studentId: 'CSE002',
          section: 'A',
          batch: '2024',
          semester: 7,
          gpa: 9.0,
          guardianName: 'Suresh Sharma',
          guardianPhone: '+91-9876543221',
          status: 'Active',
          createdAt: '2024-07-15T00:00:00.000Z'
        },
        {
          _id: 'user7',
          name: 'Arjun Kumar',
          email: 'arjun@learnaid.edu',
          role: 'Student',
          department: { _id: 'dept2', name: 'Electronics & Communication' },
          studentId: 'ECE001',
          section: 'A',
          batch: '2024',
          semester: 7,
          gpa: 8.2,
          guardianName: 'Vikram Kumar',
          guardianPhone: '+91-9876543222',
          status: 'Active',
          createdAt: '2024-07-15T00:00:00.000Z'
        }
      ];
      localStorage.setItem('users', JSON.stringify(users));
    }

    // Initialize subjects if not exists
    if (!localStorage.getItem('subjects')) {
      const subjects = [
        {
          _id: 'subj1',
          name: 'Data Structures and Algorithms',
          code: 'CSE301',
          credits: 4,
          description: 'Fundamental data structures and algorithms',
          department: { _id: 'dept1', name: 'Computer Science Engineering' },
          year: '3rd Year',
          section: 'A',
          semester: 5,
          academicYear: '2024-25',
          type: 'Core',
          faculty: [
            {
              user: { _id: 'user1', name: 'Dr. Rajesh Kumar', email: 'rajesh@learnaid.edu', department: { name: 'Computer Science Engineering' } },
              isExternal: false,
              isPrimary: true
            }
          ],
          enrolledStudents: ['user5', 'user6'],
          maxStudents: 65,
          status: 'Active'
        },
        {
          _id: 'subj2',
          name: 'Web Technologies',
          code: 'CSE302',
          credits: 3,
          description: 'Modern web development technologies',
          department: { _id: 'dept1', name: 'Computer Science Engineering' },
          year: '3rd Year',
          section: 'A',
          semester: 5,
          academicYear: '2024-25',
          type: 'Core',
          faculty: [
            {
              user: { _id: 'user4', name: 'Prof. Sarah Johnson', email: 'sarah@learnaid.edu', department: { name: 'Computer Science Engineering' } },
              isExternal: false,
              isPrimary: true
            }
          ],
          enrolledStudents: ['user5', 'user6'],
          maxStudents: 65,
          status: 'Active'
        },
        {
          _id: 'subj3',
          name: 'Digital Signal Processing',
          code: 'ECE301',
          credits: 4,
          description: 'Digital signal processing fundamentals',
          department: { _id: 'dept2', name: 'Electronics & Communication' },
          year: '3rd Year',
          section: 'A',
          semester: 5,
          academicYear: '2024-25',
          type: 'Core',
          faculty: [
            {
              user: { _id: 'user2', name: 'Dr. Priya Sharma', email: 'priya@learnaid.edu', department: { name: 'Electronics & Communication' } },
              isExternal: false,
              isPrimary: true
            }
          ],
          enrolledStudents: ['user7'],
          maxStudents: 60,
          status: 'Active'
        }
      ];
      localStorage.setItem('subjects', JSON.stringify(subjects));
    }
  }

  // Simulate API delay
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Department APIs
  async getDepartments() {
    await this.delay(300);
    const departments = JSON.parse(localStorage.getItem('departments') || '[]');
    return {
      success: true,
      data: departments,
      message: 'Departments retrieved successfully'
    };
  }

  async getDepartment(id) {
    await this.delay(200);
    const departments = JSON.parse(localStorage.getItem('departments') || '[]');
    const department = departments.find(d => d._id === id);
    return {
      success: !!department,
      data: department,
      message: department ? 'Department retrieved successfully' : 'Department not found'
    };
  }

  async createDepartment(departmentData) {
    await this.delay(400);
    const departments = JSON.parse(localStorage.getItem('departments') || '[]');
    const newDepartment = {
      _id: 'dept' + Date.now(),
      ...departmentData,
      createdAt: new Date().toISOString()
    };
    departments.push(newDepartment);
    localStorage.setItem('departments', JSON.stringify(departments));
    return {
      success: true,
      data: newDepartment,
      message: 'Department created successfully'
    };
  }

  async updateDepartment(id, departmentData) {
    await this.delay(400);
    const departments = JSON.parse(localStorage.getItem('departments') || '[]');
    const index = departments.findIndex(d => d._id === id);
    if (index !== -1) {
      departments[index] = { ...departments[index], ...departmentData, updatedAt: new Date().toISOString() };
      localStorage.setItem('departments', JSON.stringify(departments));
      return {
        success: true,
        data: departments[index],
        message: 'Department updated successfully'
      };
    }
    return {
      success: false,
      data: null,
      message: 'Department not found'
    };
  }

  async deleteDepartment(id) {
    await this.delay(300);
    const departments = JSON.parse(localStorage.getItem('departments') || '[]');
    const filteredDepartments = departments.filter(d => d._id !== id);
    localStorage.setItem('departments', JSON.stringify(filteredDepartments));
    return {
      success: true,
      data: null,
      message: 'Department deleted successfully'
    };
  }

  // User APIs
  async getUsers(params = {}) {
    await this.delay(300);
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Apply filters
    if (params.role) {
      users = users.filter(u => u.role === params.role);
    }
    if (params.department) {
      users = users.filter(u => u.department?.name === params.department || u.department?._id === params.department);
    }
    
    return {
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    };
  }

  async getUser(id) {
    await this.delay(200);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u._id === id);
    return {
      success: !!user,
      data: user,
      message: user ? 'User retrieved successfully' : 'User not found'
    };
  }

  async createUser(userData) {
    await this.delay(400);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      _id: 'user' + Date.now(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    return {
      success: true,
      data: newUser,
      message: 'User created successfully'
    };
  }

  async updateUser(id, userData) {
    await this.delay(400);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u._id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData, updatedAt: new Date().toISOString() };
      localStorage.setItem('users', JSON.stringify(users));
      return {
        success: true,
        data: users[index],
        message: 'User updated successfully'
      };
    }
    return {
      success: false,
      data: null,
      message: 'User not found'
    };
  }

  async deleteUser(id) {
    await this.delay(300);
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const filteredUsers = users.filter(u => u._id !== id);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    return {
      success: true,
      data: null,
      message: 'User deleted successfully'
    };
  }

  // Subject APIs
  async getSubjects(params = {}) {
    await this.delay(300);
    let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    
    // Apply filters
    if (params.department) {
      subjects = subjects.filter(s => s.department?.name === params.department || s.department?._id === params.department);
    }
    
    return {
      success: true,
      data: subjects,
      message: 'Subjects retrieved successfully'
    };
  }

  async getSubject(id) {
    await this.delay(200);
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subject = subjects.find(s => s._id === id);
    return {
      success: !!subject,
      data: subject,
      message: subject ? 'Subject retrieved successfully' : 'Subject not found'
    };
  }

  async createSubject(subjectData) {
    await this.delay(400);
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const newSubject = {
      _id: 'subj' + Date.now(),
      ...subjectData,
      enrolledStudents: [],
      faculty: [],
      createdAt: new Date().toISOString()
    };
    subjects.push(newSubject);
    localStorage.setItem('subjects', JSON.stringify(subjects));
    return {
      success: true,
      data: newSubject,
      message: 'Subject created successfully'
    };
  }

  async updateSubject(id, subjectData) {
    await this.delay(400);
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const index = subjects.findIndex(s => s._id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...subjectData, updatedAt: new Date().toISOString() };
      localStorage.setItem('subjects', JSON.stringify(subjects));
      return {
        success: true,
        data: subjects[index],
        message: 'Subject updated successfully'
      };
    }
    return {
      success: false,
      data: null,
      message: 'Subject not found'
    };
  }

  async deleteSubject(id) {
    await this.delay(300);
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const filteredSubjects = subjects.filter(s => s._id !== id);
    localStorage.setItem('subjects', JSON.stringify(filteredSubjects));
    return {
      success: true,
      data: null,
      message: 'Subject deleted successfully'
    };
  }

  // Faculty assignment to subject
  async assignFacultyToSubject(subjectId, facultyData) {
    await this.delay(400);
    const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    const subjectIndex = subjects.findIndex(s => s._id === subjectId);
    
    if (subjectIndex !== -1) {
      if (!subjects[subjectIndex].faculty) {
        subjects[subjectIndex].faculty = [];
      }
      
      // Check if faculty already assigned
      const existingIndex = subjects[subjectIndex].faculty.findIndex(f => f.user._id === facultyData.facultyId);
      
      if (existingIndex !== -1) {
        // Update existing assignment
        subjects[subjectIndex].faculty[existingIndex] = {
          ...subjects[subjectIndex].faculty[existingIndex],
          ...facultyData
        };
      } else {
        // Get faculty details
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const faculty = users.find(u => u._id === facultyData.facultyId);
        
        if (faculty) {
          subjects[subjectIndex].faculty.push({
            user: {
              _id: faculty._id,
              name: faculty.name,
              email: faculty.email,
              department: faculty.department
            },
            isExternal: facultyData.isExternal || false,
            isPrimary: facultyData.isPrimary || false
          });
        }
      }
      
      localStorage.setItem('subjects', JSON.stringify(subjects));
      return {
        success: true,
        data: subjects[subjectIndex],
        message: 'Faculty assigned successfully'
      };
    }
    
    return {
      success: false,
      data: null,
      message: 'Subject not found'
    };
  }

  // Data transformation methods (same as original API service)
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
}

// Create singleton instance
const mockDataService = new MockDataService();

export default mockDataService;