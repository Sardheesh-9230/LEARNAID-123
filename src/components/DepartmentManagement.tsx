'use client'

import { useState } from 'react'

interface Department {
  id: number
  name: string
  description: string
  hod: string // Head of Department
  students: number
  faculty: number
  staff: number
  subjects: number
  sections: string[]
  establishedYear: number
  status: 'Active' | 'Inactive'
}

interface Subject {
  id: number
  name: string
  code: string
  credits: number
  faculty: Faculty[] // Array of faculty assigned to this subject
  department: string // Department where subject is taught
  year: string // Academic year (1st Year, 2nd Year, etc.)
  section: string
  enrolledStudents: string[] // Array of student names
  maxStudents: number // Always 65
}

interface Faculty {
  id: number
  name: string
  email: string
  department: string // Home department of the faculty
  isExternal: boolean // True if faculty is from another department
}

interface User {
  id: number
  name: string
  email: string
  role: 'Student' | 'Faculty' | 'Staff' | 'Admin'
  department: string
  section?: string // Only for students, assigned through allocation
  batch?: string // Only for students - Year of study (e.g., "2024", "2023", "2022", "2021")
  phone: string
  address: string
  dateJoined: string
  status: 'Active' | 'Inactive'
  guardianName?: string // Only for students
  guardianPhone?: string // Only for students
}

export default function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showClassForm, setShowClassForm] = useState(false)
  const [showStudentAssignForm, setShowStudentAssignForm] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  
  // New state for enhanced features
  const [subjectFilters, setSubjectFilters] = useState({
    department: '',
    year: ''
  })
  const [searchStudentTerm, setSearchStudentTerm] = useState('')
  const [searchSubjectTerm, setSearchSubjectTerm] = useState('')
  
  // Enhanced filter state for better organization
  const [enhancedFilters, setEnhancedFilters] = useState({
    department: '',
    year: '',
    section: '',
    faculty: '',
    enrollmentStatus: '' // full, partial, empty
  })

  // Enhanced filter state for student allocation
  const [studentFilters, setStudentFilters] = useState({
    department: '',
    year: '',
    section: '',
    status: '' // assigned, unassigned, all
  })

  // Popup state for student actions
  const [showViewStudentPopup, setShowViewStudentPopup] = useState(false)
  const [showReassignPopup, setShowReassignPopup] = useState(false)
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<User | null>(null)

  // Notification and confirmation states
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'warning'>('success')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  // Helper functions for notifications and confirmations
  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotificationMessage(message)
    setNotificationType(type)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  const showConfirmationDialog = (message: string, action: () => void) => {
    console.log('showConfirmationDialog called with message:', message);
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setShowConfirmDialog(true)
    console.log('showConfirmDialog set to true');
  }

  // Sample departments data
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 1,
      name: "Computer Science",
      description: "Department of Computer Science and Engineering",
      hod: "Dr. John Smith",
      students: 120,
      faculty: 8,
      staff: 3,
      subjects: 12,
      sections: ["A", "B", "C"],
      establishedYear: 2010,
      status: "Active"
    },
    {
      id: 2,
      name: "Mechanical Engineering",
      description: "Department of Mechanical Engineering",
      hod: "Dr. Sarah Johnson",
      students: 95,
      faculty: 6,
      staff: 2,
      subjects: 10,
      sections: ["A", "B"],
      establishedYear: 2012,
      status: "Active"
    },
    {
      id: 3,
      name: "Business Administration",
      description: "Department of Business Administration and Management",
      hod: "Dr. Michael Brown",
      students: 150,
      faculty: 10,
      staff: 4,
      subjects: 14,
      sections: ["A", "B", "C"],
      establishedYear: 2008,
      status: "Active"
    }
  ])

  // Sample users data - integrated with department management
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@learnaia.edu",
      role: "Student",
      department: "Computer Science",
      section: "A", // Assigned through allocation
      batch: "2024", // First year student
      phone: "+91 98765 43210",
      address: "123 Main St, City",
      dateJoined: "2024-01-15",
      status: "Active",
      guardianName: "Mr. Michael Doe",
      guardianPhone: "+91 98765 43211"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@learnaia.edu",
      role: "Student",
      department: "Business Administration",
      section: "B", // Assigned through allocation
      batch: "2023", // Second year student
      phone: "+91 96543 21098",
      address: "789 Student Blvd, City",
      dateJoined: "2023-09-01",
      status: "Active",
      guardianName: "Mrs. Susan Smith",
      guardianPhone: "+91 96543 21099"
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "michael.chen@learnaia.edu",
      role: "Student",
      department: "Computer Science",
      // No section assigned yet - needs allocation
      batch: "2022", // Third year student
      phone: "+91 93210 98765",
      address: "987 Campus Rd, City",
      dateJoined: "2024-01-15",
      status: "Active",
      guardianName: "Mr. David Chen",
      guardianPhone: "+91 93210 98766"
    },
    {
      id: 4,
      name: "Priya Sharma",
      email: "priya.sharma@learnaia.edu",
      role: "Student",
      department: "Business Administration",
      // No section assigned yet - needs allocation
      batch: "2024", // First year student
      phone: "+91 92109 87654",
      address: "456 Student Ave, City",
      dateJoined: "2024-08-15",
      status: "Active",
      guardianName: "Mr. Raj Sharma",
      guardianPhone: "+91 92109 87655"
    },
    {
      id: 5,
      name: "Amit Kumar",
      email: "amit.kumar@learnaia.edu",
      role: "Student",
      department: "Mechanical Engineering",
      // No section assigned yet - needs allocation
      batch: "2023", // Second year student
      phone: "+91 91098 76543",
      address: "789 Engineering Block, City",
      dateJoined: "2023-08-20",
      status: "Active",
      guardianName: "Mrs. Sunita Kumar",
      guardianPhone: "+91 91098 76544"
    },
    {
      id: 6,
      name: "Prof. Alice Johnson",
      email: "alice.johnson@learnaia.edu",
      role: "Faculty",
      department: "Computer Science",
      phone: "+91 97654 32109",
      address: "456 Faculty Ave, City",
      dateJoined: "2020-08-01",
      status: "Active"
    },
    {
      id: 7,
      name: "Dr. Robert Brown",
      email: "robert.brown@learnaia.edu",
      role: "Faculty",
      department: "Mechanical Engineering",
      phone: "+91 95432 10987",
      address: "321 University Dr, City",
      dateJoined: "2019-01-15",
      status: "Active"
    }
  ])

  // Sample subjects data - Enhanced with year field and 65 student capacity
  const [subjects, setSubjects] = useState<Subject[]>([
    { 
      id: 1, 
      name: "Data Structures", 
      code: "CS101", 
      credits: 3, 
      faculty: [{ id: 1, name: "Prof. Alice", email: "alice@university.edu", department: "Computer Science", isExternal: false }], 
      department: "Computer Science", 
      year: "1st Year",
      section: "A",
      enrolledStudents: ["John Doe", "Jane Smith", "Bob Johnson"],
      maxStudents: 65
    },
    { 
      id: 2, 
      name: "Programming Fundamentals", 
      code: "CS100", 
      credits: 4, 
      faculty: [{ id: 2, name: "Prof. Bob", email: "bob@university.edu", department: "Computer Science", isExternal: false }], 
      department: "Computer Science", 
      year: "1st Year",
      section: "A",
      enrolledStudents: ["John Doe", "Jane Smith", "Bob Johnson", "David Lee"],
      maxStudents: 65
    },
    { 
      id: 3, 
      name: "Mathematics for CS", 
      code: "CS110", 
      credits: 3, 
      faculty: [{ id: 5, name: "Prof. Frank", email: "frank@university.edu", department: "Mechanical Engineering", isExternal: true }], 
      department: "Computer Science", 
      year: "1st Year",
      section: "A",
      enrolledStudents: ["John Doe", "Jane Smith"],
      maxStudents: 65
    },
    { 
      id: 4, 
      name: "Algorithms", 
      code: "CS102", 
      credits: 3, 
      faculty: [{ id: 3, name: "Prof. Charlie", email: "charlie@university.edu", department: "Computer Science", isExternal: false }], 
      department: "Computer Science", 
      year: "2nd Year",
      section: "B",
      enrolledStudents: ["Alice Brown", "Charlie Wilson"],
      maxStudents: 65
    },
    { 
      id: 5, 
      name: "Object Oriented Programming", 
      code: "CS201", 
      credits: 4, 
      faculty: [{ id: 4, name: "Prof. David", email: "david@university.edu", department: "Computer Science", isExternal: false }], 
      department: "Computer Science", 
      year: "2nd Year",
      section: "B",
      enrolledStudents: ["Alice Brown"],
      maxStudents: 65
    },
    { 
      id: 6, 
      name: "Database Systems", 
      code: "CS301", 
      credits: 4, 
      faculty: [
        { id: 3, name: "Prof. Charlie", email: "charlie@university.edu", department: "Computer Science", isExternal: false },
        { id: 4, name: "Prof. David", email: "david@university.edu", department: "Computer Science", isExternal: false }
      ], 
      department: "Computer Science", 
      year: "3rd Year",
      section: "A",
      enrolledStudents: ["John Doe", "David Lee"],
      maxStudents: 65
    },
    { 
      id: 7, 
      name: "Thermodynamics", 
      code: "ME101", 
      credits: 3, 
      faculty: [{ id: 7, name: "Prof. Emily", email: "emily@university.edu", department: "Mechanical Engineering", isExternal: false }], 
      department: "Mechanical Engineering", 
      year: "2nd Year",
      section: "A",
      enrolledStudents: ["Michael Green", "Sarah Davis"],
      maxStudents: 65
    },
    { 
      id: 8, 
      name: "Fluid Mechanics", 
      code: "ME201", 
      credits: 4, 
      faculty: [{ id: 8, name: "Prof. James", email: "james@university.edu", department: "Mechanical Engineering", isExternal: false }], 
      department: "Mechanical Engineering", 
      year: "2nd Year",
      section: "A",
      enrolledStudents: ["Michael Green"],
      maxStudents: 65
    },
    { 
      id: 9, 
      name: "Marketing", 
      code: "BA101", 
      credits: 3, 
      faculty: [{ id: 9, name: "Prof. Eve", email: "eve@university.edu", department: "Business Administration", isExternal: false }], 
      department: "Business Administration", 
      year: "1st Year",
      section: "A",
      enrolledStudents: ["Emma White", "James Black", "Lisa Gray"],
      maxStudents: 65
    },
    { 
      id: 10, 
      name: "Finance", 
      code: "BA201", 
      credits: 3, 
      faculty: [{ id: 10, name: "Prof. Grace", email: "grace@university.edu", department: "Business Administration", isExternal: false }], 
      department: "Business Administration", 
      year: "2nd Year",
      section: "A",
      enrolledStudents: ["Emma White", "James Black"],
      maxStudents: 65
    },
    { 
      id: 11, 
      name: "Business Analytics", 
      code: "BA301", 
      credits: 3, 
      faculty: [{ id: 1, name: "Prof. Alice", email: "alice@university.edu", department: "Computer Science", isExternal: true }], 
      department: "Business Administration", 
      year: "3rd Year",
      section: "A",
      enrolledStudents: ["Emma White"],
      maxStudents: 65
    },
    { 
      id: 12, 
      name: "Engineering Mathematics", 
      code: "ME301", 
      credits: 4, 
      faculty: [{ id: 5, name: "Prof. Frank", email: "frank@university.edu", department: "Mechanical Engineering", isExternal: true }], 
      department: "Computer Science", 
      year: "3rd Year",
      section: "C",
      enrolledStudents: [],
      maxStudents: 65
    }
  ])

  // Students are managed through UserManagement component
  // No separate student state needed here - using users state instead

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    hod: '',
    establishedYear: new Date().getFullYear(),
    sections: [] as string[]
  })

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    credits: 3,
    department: '',
    year: '', // Academic year (1st Year, 2nd Year, etc.)
    section: '',
    createForAllSections: false // New field to create for all sections
  })

  const [newClass, setNewClass] = useState({
    subjectId: 0,
    section: '',
    faculty: [] as Faculty[],
    schedule: [{ day: '', startTime: '', endTime: '', room: '' }],
    semester: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Completed'
  })

  const [selectedFaculty, setSelectedFaculty] = useState<Faculty[]>([])
  const [showSubjectCreationForm, setShowSubjectCreationForm] = useState(false)
  const [showFacultyAssignmentForm, setShowFacultyAssignmentForm] = useState(false)
  const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState<Subject | null>(null)

  // Helper function to get academic year from batch
  const getAcademicYear = (batch: string): string => {
    const currentYear = 2025;
    const batchYear = parseInt(batch);
    const yearOfStudy = currentYear - batchYear + 1;
    
    switch (yearOfStudy) {
      case 1: return '1st Year';
      case 2: return '2nd Year';
      case 3: return '3rd Year';
      case 4: return '4th Year';
      default: return `${yearOfStudy}th Year`;
    }
  };

  // Student allocation system functions
  const getUnassignedStudents = () => {
    const unassigned = users.filter(user => 
      user.role === 'Student' && 
      user.department && 
      user.batch && 
      !user.section // Only students without section assignment
    );
    console.log('Total unassigned students:', unassigned.length);
    return unassigned;
  };

  const getAssignedStudents = () => {
    return users.filter(user => 
      user.role === 'Student' && 
      user.section // Students with section assignment
    );
  };

  // Get class combinations (Department + Year + Section)
  const getClassCombinations = () => {
    const combinations: { department: string; year: string; section: string; currentCount: number }[] = [];
    const sections = ['A', 'B', 'C']; // Available sections
    
    departments.forEach(dept => {
      const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      years.forEach(year => {
        sections.forEach(section => {
          const currentCount = users.filter(user => 
            user.role === 'Student' && 
            user.department === dept.name && 
            getAcademicYear(user.batch || '') === year && 
            user.section === section
          ).length;
          
          combinations.push({
            department: dept.name,
            year,
            section,
            currentCount
          });
        });
      });
    });
    
    return combinations;
  };

  // Derive class combinations and unassigned students from users state 
  // to ensure they're always in sync with the latest state
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const classCombinations = getClassCombinations();
  const unassignedStudents = getUnassignedStudents();
  
  // Function to force refresh derived data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  const filteredUnassigned = unassignedStudents.filter(student =>
    searchStudentTerm === '' || 
    student.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchStudentTerm.toLowerCase())
  );

  // Group unassigned students by department and year for better organization
  const unassignedByClass = filteredUnassigned.reduce((acc, student) => {
    const year = getAcademicYear(student.batch || '');
    const key = `${student.department}-${year}`;
    
    if (!acc[key]) {
      acc[key] = {
        department: student.department,
        year,
        students: []
      };
    }
    
    acc[key].students.push(student);
    return acc;
  }, {} as Record<string, { department: string; year: string; students: typeof unassignedStudents }>);

  // Student allocation handlers
  const handleAllocateStudent = (studentId: number, department: string, year: string, section: string) => {
    console.log('handleAllocateStudent called:', studentId, department, year, section);
    
    const student = users.find(u => u.id === studentId);
    console.log('Found student:', student);
    
    const updatedUsers = users.map(user =>
      user.id === studentId
        ? { ...user, section }
        : user
    );
    
    console.log('Setting updated users');
    setUsers(updatedUsers);
    
    // Force a UI refresh for the section counts
    setTimeout(() => {
      refreshData();
      console.log("Refreshing data after student allocation");
    }, 50);
    
    if (student) {
      showNotificationMessage(`${student.name} successfully assigned to Section ${section}`, 'success');
    }
  };

  // Student unassign handler
  const handleUnassignStudent = (studentId: number) => {
    const updatedUsers = users.map(user =>
      user.id === studentId
        ? { ...user, section: undefined }
        : user
    );
    setUsers(updatedUsers);
  };

  const handleBulkAllocate = (department: string, year: string) => {
    console.log('=== HANDLE BULK ALLOCATE CALLED ===');
    console.log('handleBulkAllocate called:', department, year);
    
    const eligibleStudents = unassignedStudents.filter(student => 
      student.department === department && getAcademicYear(student.batch || '') === year
    );
    
    console.log('Eligible students found in handleBulkAllocate:', eligibleStudents.length);
    console.log('Eligible students details:', eligibleStudents);

    if (eligibleStudents.length === 0) {
      console.log('No eligible students, showing warning');
      showNotificationMessage(`No unassigned students found for ${department} ${year}.`, 'warning');
      return;
    }

    // Find available sections with capacity
    const availableSections = classCombinations.filter(c => 
      c.department === department && c.year === year && c.currentCount < 65
    ).sort((a, b) => a.currentCount - b.currentCount);
    
    console.log('Available sections found:', availableSections.length);
    console.log('Available sections details:', availableSections);

    if (availableSections.length === 0) {
      console.log('No available sections, showing error');
      showNotificationMessage(`No available sections for ${department} ${year}`, 'error');
      return;
    }

    let sectionIndex = 0;
    const updatedUsers = [...users];
    console.log('Starting bulk allocation for', eligibleStudents.length, 'students');
    console.log('Available sections:', availableSections.length);

    let assignedCount = 0;
    
    eligibleStudents.forEach((student, index) => {
      console.log(`Processing student ${index + 1}:`, student.name);
      
      if (sectionIndex < availableSections.length && availableSections[sectionIndex].currentCount < 65) {
        const userIndex = updatedUsers.findIndex(u => u.id === student.id);
        console.log('Processing student:', student.name, 'userIndex:', userIndex);
        
        if (userIndex !== -1) {
          const assignedSection = availableSections[sectionIndex].section;
          console.log('Assigning student', student.name, 'to section:', assignedSection);
          
          updatedUsers[userIndex] = { 
            ...updatedUsers[userIndex], 
            section: assignedSection 
          };
          
          availableSections[sectionIndex].currentCount++;
          assignedCount++;
          
          console.log('Student assigned. Section', assignedSection, 'now has', availableSections[sectionIndex].currentCount, 'students');

          if (availableSections[sectionIndex].currentCount >= 65) {
            console.log('Section full, moving to next section');
            sectionIndex++;
          }
        } else {
          console.log('ERROR: User not found in array for student:', student.name);
        }
      } else {
        console.log('No more available sections or section is full');
      }
    });

    console.log('Setting users state with', assignedCount, 'students assigned');
    console.log('Updated users array:', updatedUsers.filter(u => u.role === 'Student').map(u => ({name: u.name, section: u.section})));
    setUsers(updatedUsers);
    
    showNotificationMessage(`Successfully assigned ${assignedCount} students to sections`, 'success');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newSubject.createForAllSections) {
      // Create subject for all sections (A, B, C)
      const sectionsToCreate = ['A', 'B', 'C']
      const newSubjects: Subject[] = sectionsToCreate.map((section, index) => ({
        id: subjects.length + index + 1,
        name: newSubject.name,
        code: `${newSubject.code}-${section}`, // Add section suffix to code
        credits: newSubject.credits,
        department: newSubject.department,
        year: newSubject.year,
        section: section,
        faculty: [],
        enrolledStudents: [],
        maxStudents: 65
      }))
      setSubjects([...subjects, ...newSubjects])
    } else {
      // Create subject for specific section
      const subject: Subject = {
        id: subjects.length + 1,
        name: newSubject.name,
        code: newSubject.code,
        credits: newSubject.credits,
        department: newSubject.department,
        year: newSubject.year,
        section: newSubject.section,
        faculty: [],
        enrolledStudents: [],
        maxStudents: 65
      }
      setSubjects([...subjects, subject])
    }
    
    setNewSubject({
      name: '',
      code: '',
      credits: 3,
      department: '',
      year: '',
      section: '',
      createForAllSections: false
    })
    setShowSubjectForm(false)
  }

  // removed handleAddClass function

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault()
    const department: Department = {
      id: departments.length + 1,
      ...newDepartment,
      students: 0,
      faculty: 0,
      staff: 0,
      subjects: 0,
      status: 'Active'
    }
    setDepartments([...departments, department])
    setNewDepartment({
      name: '',
      description: '',
      hod: '',
      establishedYear: new Date().getFullYear(),
      sections: []
    })
    setShowAddForm(false)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setNewDepartment({
      name: department.name,
      description: department.description,
      hod: department.hod,
      establishedYear: department.establishedYear,
      sections: department.sections
    })
    setShowAddForm(true)
  }

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDepartment) {
      const updatedDepartments = departments.map(dept =>
        dept.id === editingDepartment.id
          ? { ...dept, ...newDepartment }
          : dept
      )
      setDepartments(updatedDepartments)
      setEditingDepartment(null)
      setShowAddForm(false)
      setNewDepartment({
        name: '',
        description: '',
        hod: '',
        establishedYear: new Date().getFullYear(),
        sections: []
      })
    }
  }

  const handleDeleteDepartment = (id: number) => {
    showConfirmationDialog('Are you sure you want to delete this department?', () => {
      setDepartments(departments.filter(dept => dept.id !== id))
      showNotificationMessage('Department deleted successfully', 'success')
    })
  }

  const handleAddSection = (section: string) => {
    if (section && !newDepartment.sections.includes(section)) {
      setNewDepartment({
        ...newDepartment,
        sections: [...newDepartment.sections, section]
      })
    }
  }

  const handleRemoveSection = (section: string) => {
    setNewDepartment({
      ...newDepartment,
      sections: newDepartment.sections.filter(s => s !== section)
    })
  }

  const handleAssignFaculty = (subjectId: number, facultyList: Faculty[]) => {
    setSubjects(subjects.map(s => 
      s.id === subjectId 
        ? { ...s, faculty: facultyList }
        : s
    ))
  }

  const handleOpenFacultyAssignment = (subject: Subject) => {
    setSelectedSubjectForAssignment(subject)
    // Get faculty from subject's assigned faculty
    setSelectedFaculty(subject.faculty || [])
    setShowFacultyAssignmentForm(true)
  }

  const handleSaveFacultyAssignment = () => {
    if (selectedSubjectForAssignment) {
      handleAssignFaculty(selectedSubjectForAssignment.id, selectedFaculty)
      setShowFacultyAssignmentForm(false)
      setSelectedSubjectForAssignment(null)
      setSelectedFaculty([])
    }
  }

  const handleDeleteSubject = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId)
    if (subject) {
      showConfirmationDialog(
        `Are you sure you want to delete "${subject.name}" (${subject.code})? This action cannot be undone.`,
        () => {
          setSubjects(subjects.filter(s => s.id !== subjectId))
          showNotificationMessage('Subject deleted successfully', 'success')
        }
      )
    }
  }

  const handleAssignStudents = (subject: Subject) => {
    setSelectedSubject(subject)
    setShowStudentAssignForm(true)
  }

  // Removed all class-related student enrollment functions

  const getDepartmentSubjects = (departmentName: string) => {
    return subjects.filter(subject => subject.department === departmentName)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Enhanced Header with Create Button */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Department Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Manage departments, faculty, students, and academic sections</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Department
          </button>
        </div>

        {/* Quick Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {departments.reduce((sum, dept) => sum + dept.students, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Faculty</p>
                <p className="text-2xl font-bold text-purple-600">
                  {departments.reduce((sum, dept) => sum + dept.faculty, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-orange-600">
                  {departments.reduce((sum, dept) => sum + dept.subjects, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Department Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{dept.name}</h3>
                  <p className="text-sm text-gray-500">Est. {dept.establishedYear}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                dept.status === 'Active' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {dept.status}
              </span>
            </div>
            
            {/* Department Description */}
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{dept.description}</p>
            
            {/* Department Statistics */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-gray-600">Head of Department:</span>
                </div>
                <span className="font-semibold text-gray-800 text-sm">{dept.hod}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 font-medium">Students</span>
                    <span className="text-lg font-bold text-blue-700">{dept.students}</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 font-medium">Faculty</span>
                    <span className="text-lg font-bold text-purple-700">{dept.faculty}</span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium">Subjects</span>
                    <span className="text-lg font-bold text-green-700">{dept.subjects}</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-orange-600 font-medium">Staff</span>
                    <span className="text-lg font-bold text-orange-700">{dept.staff}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections Display */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Sections:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {dept.sections.map((section) => (
                  <span key={section} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-200">
                    Section {section}
                  </span>
                ))}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleEditDepartment(dept)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setActiveTab('subject-management')}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Subjects
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDeleteDepartment(dept.id)
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Empty State */}
      {departments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Departments Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Get started by creating your first department. You can manage students, faculty, and subjects within each department.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Create First Department
          </button>
        </div>
      )}
    </div>
  )

  const renderSubjects = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Subject Management</h3>
        <button
          onClick={() => setShowSubjectForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Subject
        </button>
      </div>

      {/* Cross-departmental teaching notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-1">
            <span className="text-blue-600 text-sm">ℹ️</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">Cross-Departmental Teaching</h4>
            <p className="text-sm text-blue-700">
              Faculty can teach subjects in departments other than their home department. 
              Cross-departmental assignments are highlighted in orange.
            </p>
          </div>
        </div>
      </div>

      {/* Subjects by Department */}
      {departments.map((dept) => {
        const deptSubjects = getDepartmentSubjects(dept.name)
        if (deptSubjects.length === 0) return null

        return (
          <div key={dept.id} className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">{dept.name}</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-700">Subject</th>
                    <th className="text-left py-2 text-gray-700">Code</th>
                    <th className="text-left py-2 text-gray-700">Credits</th>
                    <th className="text-left py-2 text-gray-700">Faculty</th>
                    <th className="text-left py-2 text-gray-700">Faculty Dept</th>
                    <th className="text-left py-2 text-gray-700">Section</th>
                    <th className="text-left py-2 text-gray-700">Enrollment</th>
                    <th className="text-left py-2 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deptSubjects.map((subject) => (
                    <tr key={subject.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium">{subject.name}</td>
                      <td className="py-3 text-blue-600">{subject.code}</td>
                      <td className="py-3">{subject.credits}</td>
                      <td className="py-3">
                        {subject.faculty.length > 0 ? (
                          <div className="space-y-1">
                            {subject.faculty.map((faculty, index) => (
                              <div key={index} className="text-sm">
                                {faculty.name}
                                {faculty.isExternal && (
                                  <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                    External
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic">No faculty</span>
                        )}
                      </td>
                      <td className="py-3">
                        {subject.faculty.some(f => f.isExternal) ? (
                          <div className="space-y-1">
                            {subject.faculty.map((faculty, index) => (
                              <div key={index} className="text-xs">
                                {faculty.isExternal ? (
                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                    {faculty.department} (Cross-dept)
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                    {faculty.department}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {subject.department}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {subject.section}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="text-sm">
                          <span className="font-medium">{subject.enrolledStudents.length}/{subject.maxStudents}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(subject.enrolledStudents.length / subject.maxStudents) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleAssignStudents(subject)}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                          >
                            Assign Students
                          </button>
                          <button className="text-blue-600 hover:text-blue-800 text-xs mr-1">Edit</button>
                          <button className="text-red-600 hover:text-red-800 text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderFacultyAssignments = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Faculty Assignments</h3>
            <p className="text-gray-600 mt-1">Manage faculty assignments to subjects</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">�‍🏫</div>
          <h4 className="text-lg font-semibold text-gray-600 mb-2">Faculty Assignment Management</h4>
          <p className="text-gray-500">Faculty can be assigned to subjects through the Subject Management tab.</p>
        </div>
      </div>
    )
  }

  const renderSubjectCreation = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Subject Management</h3>
          <button
            onClick={() => setShowSubjectCreationForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create New Subject
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-blue-800">Subject Management System</p>
              <p className="text-blue-600 text-sm">Subjects are organized by academic year and department (e.g., "1st Year - Computer Science"). Create subjects for specific departments, years, and sections. You can create a subject for all sections at once or for individual sections. Faculty can be assigned to each subject after creation.</p>
            </div>
          </div>
        </div>

        {/* Subject Categories Summary */}
        {subjects.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Subject Categories Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(() => {
                const categories = subjects.reduce((acc, subject) => {
                  const key = `${subject.year} - ${subject.department}`
                  acc[key] = (acc[key] || 0) + 1
                  return acc
                }, {} as Record<string, number>)

                // Sort categories by year then by department
                const sortedCategories = Object.entries(categories).sort(([a], [b]) => {
                  const [yearA, deptA] = a.split(' - ')
                  const [yearB, deptB] = b.split(' - ')
                  
                  const yearOrderA = parseInt(yearA.replace(/\D/g, '')) || 0
                  const yearOrderB = parseInt(yearB.replace(/\D/g, '')) || 0
                  
                  if (yearOrderA !== yearOrderB) {
                    return yearOrderA - yearOrderB
                  }
                  return deptA.localeCompare(deptB)
                })

                return sortedCategories.map(([category, count]) => (
                  <div key={category} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-gray-800">{category}</p>
                    <p className="text-lg font-bold text-blue-600">{count}</p>
                    <p className="text-xs text-gray-500">subject{count !== 1 ? 's' : ''}</p>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-lg font-medium">No subjects created yet</p>
              <p className="text-sm">Click "Create New Subject" to add your first subject</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group subjects by year and department */}
              {(() => {
                // Group subjects by year and department
                const groupedSubjects = subjects.reduce((acc, subject) => {
                  const key = `${subject.year} - ${subject.department}`
                  if (!acc[key]) {
                    acc[key] = []
                  }
                  acc[key].push(subject)
                  return acc
                }, {} as Record<string, typeof subjects>)

                // Sort categories by year (1st, 2nd, 3rd, 4th) then by department
                const sortedCategories = Object.entries(groupedSubjects).sort(([a], [b]) => {
                  const [yearA, deptA] = a.split(' - ')
                  const [yearB, deptB] = b.split(' - ')
                  
                  // Extract year number for proper sorting
                  const yearOrderA = parseInt(yearA.replace(/\D/g, '')) || 0
                  const yearOrderB = parseInt(yearB.replace(/\D/g, '')) || 0
                  
                  if (yearOrderA !== yearOrderB) {
                    return yearOrderA - yearOrderB
                  }
                  return deptA.localeCompare(deptB)
                })

                return sortedCategories.map(([categoryKey, categorySubjects]) => (
                  <div key={categoryKey} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {categoryKey}
                        </span>
                        <span className="text-sm text-gray-600 font-normal">
                          ({categorySubjects.length} subject{categorySubjects.length !== 1 ? 's' : ''})
                        </span>
                      </h4>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Subject Code</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Subject Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Section</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Credits</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Faculty</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Enrollment</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {categorySubjects.map((subject) => (
                            <tr key={subject.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 font-mono text-blue-600 font-medium">{subject.code}</td>
                              <td className="py-3 px-4 font-medium text-gray-800">{subject.name}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                                  {subject.section}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                  {subject.credits}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {subject.faculty && subject.faculty.length > 0 ? (
                                  <div className="space-y-1">
                                    {subject.faculty.map((faculty, index) => (
                                      <div key={index} className="text-sm">
                                        <span className="font-medium">{faculty.name}</span>
                                        {faculty.isExternal && (
                                          <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                                            External
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic text-sm">No faculty assigned</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {subject.enrolledStudents?.length || 0}/{subject.maxStudents || 65}
                                  </span>
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        (subject.enrolledStudents?.length || 0) / (subject.maxStudents || 65) > 0.8 
                                          ? 'bg-red-500' 
                                          : (subject.enrolledStudents?.length || 0) / (subject.maxStudents || 65) > 0.6 
                                          ? 'bg-yellow-500' 
                                          : 'bg-green-500'
                                      }`} 
                                      style={{ width: `${((subject.enrolledStudents?.length || 0) / (subject.maxStudents || 65)) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleOpenFacultyAssignment(subject)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Assign Faculty
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteSubject(subject.id)
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFacultyAssignment = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Faculty Assignment</h3>
      </div>

      {/* Faculty Assignment List */}
      <div className="grid gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">{subject.name}</h4>
                <p className="text-gray-600">{subject.code} - {subject.department} Section {subject.section}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenFacultyAssignment(subject)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Faculty
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteSubject(subject.id)
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Subject
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Assigned Faculty:</h5>
              {subject.faculty.length > 0 ? (
                <div className="space-y-2">
                  {subject.faculty.map((faculty, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{faculty.name}</p>
                        <p className="text-sm text-gray-600">{faculty.email}</p>
                        <p className="text-sm text-gray-500">
                          {faculty.department} 
                          {faculty.isExternal && (
                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              External
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No faculty assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSubjectManagement = () => {
    // Group subjects by Class (Department + Year + Section) for better visibility
    const groupSubjectsByClass = () => {
      const groupedSubjects = subjects.reduce((acc, subject) => {
        const classKey = `${subject.department}|${subject.year}|${subject.section}`
        const displayKey = `${subject.year} ${subject.department} - Section ${subject.section}`
        
        if (!acc[classKey]) {
          acc[classKey] = {
            displayName: displayKey,
            department: subject.department,
            year: subject.year,
            section: subject.section,
            subjects: [],
            totalCredits: 0,
            totalEnrollment: 0,
            maxEnrollment: 0
          }
        }
        
        acc[classKey].subjects.push(subject)
        acc[classKey].totalCredits += subject.credits
        acc[classKey].totalEnrollment += subject.enrolledStudents.length
        acc[classKey].maxEnrollment += subject.maxStudents
        
        return acc
      }, {} as Record<string, any>)

      // Sort classes by year, then department, then section
      return Object.entries(groupedSubjects).sort(([keyA, classA], [keyB, classB]) => {
        const yearOrderA = parseInt(classA.year.replace(/\D/g, '')) || 0
        const yearOrderB = parseInt(classB.year.replace(/\D/g, '')) || 0
        
        if (yearOrderA !== yearOrderB) return yearOrderA - yearOrderB
        if (classA.department !== classB.department) return classA.department.localeCompare(classB.department)
        return classA.section.localeCompare(classB.section)
      })
    }

    // Filter subjects based on enhanced filters
    const getFilteredSubjects = () => {
      return subjects.filter(subject => {
        const matchesDepartment = !enhancedFilters.department || subject.department === enhancedFilters.department
        const matchesYear = !enhancedFilters.year || subject.year === enhancedFilters.year
        const matchesSection = !enhancedFilters.section || subject.section === enhancedFilters.section
        const matchesFaculty = !enhancedFilters.faculty || 
          subject.faculty.some(f => f.name.toLowerCase().includes(enhancedFilters.faculty.toLowerCase()))
        const matchesSearch = !searchSubjectTerm || 
          subject.name.toLowerCase().includes(searchSubjectTerm.toLowerCase()) ||
          subject.code.toLowerCase().includes(searchSubjectTerm.toLowerCase())
        
        let matchesEnrollment = true
        if (enhancedFilters.enrollmentStatus) {
          const enrollmentRatio = subject.enrolledStudents.length / subject.maxStudents
          switch (enhancedFilters.enrollmentStatus) {
            case 'full': matchesEnrollment = enrollmentRatio >= 0.9; break
            case 'partial': matchesEnrollment = enrollmentRatio > 0 && enrollmentRatio < 0.9; break
            case 'empty': matchesEnrollment = enrollmentRatio === 0; break
          }
        }
        
        return matchesDepartment && matchesYear && matchesSection && matchesFaculty && matchesSearch && matchesEnrollment
      })
    }

    const filteredSubjects = getFilteredSubjects()
    const groupedClasses = groupSubjectsByClass()

    // Filter grouped classes based on current filters
    const filteredGroupedClasses = groupedClasses.filter(([key, classData]) => {
      return classData.subjects.some((subject: any) => filteredSubjects.includes(subject))
    })

    return (
      <div className="space-y-6">
        {/* Enhanced Header with Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Subject Management System</h3>
              <p className="text-sm text-gray-600 mt-1">Organized by Class → Department → Year → Section for better visibility</p>
            </div>
            <button
              onClick={() => setShowSubjectForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              + Create New Subject
            </button>
          </div>

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-blue-600">{groupedClasses.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-2xl font-bold text-green-600">{subjects.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Active Departments</p>
              <p className="text-2xl font-bold text-purple-600">{departments.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-orange-600">
                {subjects.reduce((sum, s) => sum + s.enrolledStudents.length, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Advanced Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={enhancedFilters.department}
                onChange={(e) => setEnhancedFilters({ ...enhancedFilters, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={enhancedFilters.year}
                onChange={(e) => setEnhancedFilters({ ...enhancedFilters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={enhancedFilters.section}
                onChange={(e) => setEnhancedFilters({ ...enhancedFilters, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Search</label>
              <input
                type="text"
                placeholder="Faculty name..."
                value={enhancedFilters.faculty}
                onChange={(e) => setEnhancedFilters({ ...enhancedFilters, faculty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Status</label>
              <select
                value={enhancedFilters.enrollmentStatus}
                onChange={(e) => setEnhancedFilters({ ...enhancedFilters, enrollmentStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="full">Nearly Full (90%+)</option>
                <option value="partial">Partially Filled</option>
                <option value="empty">Empty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Search</label>
              <input
                type="text"
                placeholder="Name or code..."
                value={searchSubjectTerm}
                onChange={(e) => setSearchSubjectTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={() => {
                setEnhancedFilters({ department: '', year: '', section: '', faculty: '', enrollmentStatus: '' })
                setSearchSubjectTerm('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Class-wise Subject Organization */}
        <div className="space-y-6">
          {filteredGroupedClasses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-lg font-medium text-gray-600">No classes match the current filters</p>
              <p className="text-sm text-gray-400">Try adjusting your filter criteria</p>
            </div>
          ) : (
            filteredGroupedClasses.map(([classKey, classData]) => {
              const classSubjects = classData.subjects.filter((subject: any) => filteredSubjects.includes(subject))
              if (classSubjects.length === 0) return null

              return (
                <div key={classKey} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Class Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {classData.displayName}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {classSubjects.length} subject{classSubjects.length !== 1 ? 's' : ''} • 
                          {classData.totalCredits} total credits • 
                          {classData.totalEnrollment}/{classData.maxEnrollment} students enrolled
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {((classData.totalEnrollment / classData.maxEnrollment) * 100).toFixed(1)}% filled
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (classData.totalEnrollment / classData.maxEnrollment) > 0.8 
                                ? 'bg-red-500' 
                                : (classData.totalEnrollment / classData.maxEnrollment) > 0.6 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`} 
                            style={{ width: `${(classData.totalEnrollment / classData.maxEnrollment) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject Details</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Credits</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Faculty Assignment</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Enrollment</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {classSubjects.map((subject: any) => (
                          <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-semibold text-gray-800">{subject.name}</p>
                                <p className="text-sm text-blue-600 font-mono">{subject.code}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                {subject.credits}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {subject.faculty && subject.faculty.length > 0 ? (
                                <div className="space-y-1">
                                  {subject.faculty.map((faculty: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-800">{faculty.name}</span>
                                      {faculty.isExternal && (
                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                                          External
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-red-500 text-sm italic">No faculty assigned</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {subject.enrolledStudents?.length || 0}/{subject.maxStudents || 65}
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      (subject.enrolledStudents?.length || 0) / (subject.maxStudents || 65) > 0.8 
                                        ? 'bg-red-500' 
                                        : (subject.enrolledStudents?.length || 0) / (subject.maxStudents || 65) > 0.6 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                    }`} 
                                    style={{ width: `${((subject.enrolledStudents?.length || 0) / (subject.maxStudents || 65)) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedSubject(subject);
                                    setShowStudentAssignForm(true);
                                  }}
                                  className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                                >
                                  Students
                                </button>
                                <button
                                  onClick={() => handleOpenFacultyAssignment(subject)}
                                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                >
                                  Faculty
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteSubject(subject.id)
                                  }}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Removed renderClassManagement function

  const renderStudentAllocation = () => {
    // Group assigned students by Class (Department + Year + Section) for better visibility
    const groupStudentsByClass = () => {
      const assignedStudents = getAssignedStudents()
      const groupedStudents = assignedStudents.reduce((acc, student) => {
        const year = getAcademicYear(student.batch || '')
        const classKey = `${student.department}|${year}|${student.section}`
        const displayKey = `${year} ${student.department} - Section ${student.section}`
        
        if (!acc[classKey]) {
          acc[classKey] = {
            displayName: displayKey,
            department: student.department,
            year: year,
            section: student.section,
            students: [],
            capacity: 65
          }
        }
        
        acc[classKey].students.push(student)
        return acc
      }, {} as Record<string, any>)

      // Sort classes by year, then department, then section
      return Object.entries(groupedStudents).sort(([keyA, classA], [keyB, classB]) => {
        const yearOrderA = parseInt(classA.year.replace(/\D/g, '')) || 0
        const yearOrderB = parseInt(classB.year.replace(/\D/g, '')) || 0
        
        if (yearOrderA !== yearOrderB) return yearOrderA - yearOrderB
        if (classA.department !== classB.department) return classA.department.localeCompare(classB.department)
        return classA.section.localeCompare(classB.section)
      })
    }

    // Filter students based on enhanced filters
    const getFilteredStudents = () => {
      let studentsToFilter = []
      if (studentFilters.status === 'assigned') {
        studentsToFilter = getAssignedStudents()
      } else if (studentFilters.status === 'unassigned') {
        studentsToFilter = getUnassignedStudents()
      } else {
        studentsToFilter = users.filter(user => user.role === 'Student')
      }

      return studentsToFilter.filter(student => {
        const year = getAcademicYear(student.batch || '')
        const matchesDepartment = !studentFilters.department || student.department === studentFilters.department
        const matchesYear = !studentFilters.year || year === studentFilters.year
        const matchesSection = !studentFilters.section || student.section === studentFilters.section
        const matchesSearch = !searchStudentTerm || 
          student.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchStudentTerm.toLowerCase())
        
        return matchesDepartment && matchesYear && matchesSection && matchesSearch
      })
    }

    const filteredStudents = getFilteredStudents()
    const groupedClasses = groupStudentsByClass()

    // Filter grouped classes based on current filters
    const filteredGroupedClasses = groupedClasses.filter(([key, classData]) => {
      return classData.students.some((student: any) => filteredStudents.includes(student))
    })

    return (
      <div className="space-y-6">
        {/* Enhanced Header with Statistics */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Student Allocation System</h3>
              <p className="text-sm text-gray-600 mt-1">Organized by Class → Department → Year → Section for better visibility</p>
            </div>
          </div>

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Assigned Students</p>
              <p className="text-2xl font-bold text-green-600">{getAssignedStudents().length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Pending Assignments</p>
              <p className="text-2xl font-bold text-orange-600">{getUnassignedStudents().length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Active Classes</p>
              <p className="text-2xl font-bold text-blue-600">{groupedClasses.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-purple-600">
                {users.filter(u => u.role === 'Student').length}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Advanced Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={studentFilters.department}
                onChange={(e) => setStudentFilters({ ...studentFilters, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={studentFilters.year}
                onChange={(e) => setStudentFilters({ ...studentFilters, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={studentFilters.section}
                onChange={(e) => setStudentFilters({ ...studentFilters, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Status</label>
              <select
                value={studentFilters.status}
                onChange={(e) => setStudentFilters({ ...studentFilters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Students</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Search</label>
              <input
                type="text"
                placeholder="Name or email..."
                value={searchStudentTerm}
                onChange={(e) => setSearchStudentTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={() => {
                setStudentFilters({ department: '', year: '', section: '', status: '' })
                setSearchStudentTerm('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Unassigned Students Section */}
        {getUnassignedStudents().length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Students Pending Section Assignment ({getUnassignedStudents().length})
              </h4>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <strong>Assignment Process:</strong> Students already have their department and year assigned during registration. 
                You only need to assign them to a section (A, B, C, etc.) within their department and year.
              </div>
              
              {/* Group unassigned students by department and year */}
              <div className="space-y-6">
                {Object.values(unassignedByClass)
                  .sort((a, b) => {
                    if (a.department !== b.department) return a.department.localeCompare(b.department)
                    return a.year.localeCompare(b.year)
                  })
                  .map(({ department, year, students: classStudents }) => (
                    <div key={`${department}-${year}`} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-semibold text-gray-800">
                          {department} - {year} ({classStudents.length} students)
                        </h5>
                        <button
                          type="button"
                          onClick={() => {
                            console.log('=== AUTO-ASSIGN BUTTON CLICKED ===');
                            console.log('Department:', department, 'Year:', year);
                            
                            // Debug current state
                            console.log('Current users state:', users.length);
                            console.log('All users:', users.map(u => ({name: u.name, section: u.section, role: u.role})));
                            
                            const currentUnassignedStudents = getUnassignedStudents();
                            console.log('Current unassigned students:', currentUnassignedStudents.length);
                            console.log('Unassigned students:', currentUnassignedStudents.map(s => ({name: s.name, department: s.department, batch: s.batch})));
                            
                            const eligibleStudents = currentUnassignedStudents.filter(student => 
                              student.department === department && getAcademicYear(student.batch || '') === year
                            );
                            
                            console.log('Eligible students for auto-assign:', eligibleStudents.length);
                            console.log('Eligible students details:', eligibleStudents.map(s => ({name: s.name, department: s.department, year: getAcademicYear(s.batch || '')})));
                            
                            if (eligibleStudents.length === 0) {
                              showNotificationMessage(`No unassigned students found for ${department} ${year}.`, 'warning');
                              return;
                            }
                            
                            // Get available sections
                            const currentClassCombinations = getClassCombinations();
                            const availableSections = currentClassCombinations.filter(c => 
                              c.department === department && c.year === year && c.currentCount < 65
                            );
                            
                            console.log('Available sections:', availableSections);
                            
                            if (availableSections.length === 0) {
                              showNotificationMessage(`No available sections for ${department} ${year}`, 'error');
                              return;
                            }
                            
                            // Direct assignment without confirmation for testing
                            console.log('Starting direct bulk assignment...');
                            handleBulkAllocate(department, year);
                          }}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Auto-assign All
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {classStudents.map(student => (
                          <div key={student.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                            <div className="mb-3">
                              <p className="font-medium text-gray-800">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                              <p className="text-xs text-orange-600 font-medium mt-1">Needs Section Assignment</p>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-gray-700">
                                Assign to Section:
                              </label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const section = e.target.value
                                    handleAllocateStudent(student.id, student.department, year, section)
                                  }
                                }}
                                className="w-full px-2 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                defaultValue=""
                              >
                                <option value="">Select Section...</option>
                                {classCombinations
                                  .filter(c => c.department === student.department && c.year === year && c.currentCount < 65)
                                  .map((classInfo, index) => (
                                    <option 
                                      key={index} 
                                      value={classInfo.section}
                                    >
                                      Section {classInfo.section} ({classInfo.currentCount}/65 slots)
                                    </option>
                                  ))
                                }
                              </select>
                              {classCombinations.filter(c => c.department === student.department && c.year === year && c.currentCount < 65).length === 0 && (
                                <p className="text-xs text-red-600">No available sections</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Class-wise Student Organization */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-800">Assigned Students by Class</h4>
          {filteredGroupedClasses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-lg font-medium text-gray-600">No students match the current filters</p>
              <p className="text-sm text-gray-400">Try adjusting your filter criteria</p>
            </div>
          ) : (
            filteredGroupedClasses.map(([classKey, classData]) => {
              const classStudents = classData.students.filter((student: any) => filteredStudents.includes(student))
              if (classStudents.length === 0) return null

              const fillPercentage = (classStudents.length / classData.capacity) * 100

              return (
                <div key={classKey} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Class Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {classData.displayName}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {classStudents.length} student{classStudents.length !== 1 ? 's' : ''} assigned • 
                          {classData.capacity - classStudents.length} available slot{classData.capacity - classStudents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {fillPercentage.toFixed(1)}% filled
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              fillPercentage > 90 
                                ? 'bg-red-500' 
                                : fillPercentage > 75 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                            }`} 
                            style={{ width: `${fillPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Students Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Student Details</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Guardian</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {classStudents.map((student: any) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-semibold text-gray-800">{student.name}</p>
                                <p className="text-sm text-blue-600">{student.email}</p>
                                <p className="text-xs text-gray-500">ID: {student.id} • Batch: {student.batch}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm text-gray-800">{student.phone}</p>
                                <p className="text-xs text-gray-500">{student.address}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-sm text-gray-800">{student.guardianName}</p>
                                <p className="text-xs text-gray-500">{student.guardianPhone}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                student.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedStudentForAction(student)
                                    setShowViewStudentPopup(true)
                                  }}
                                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedStudentForAction(student)
                                    setShowReassignPopup(true)
                                  }}
                                  className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600 transition-colors"
                                >
                                  Reassign
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Department Management</h2>
        <p className="text-gray-600">Manage departments, sections, and subjects</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Department Overview
        </button>
        <button
          onClick={() => setActiveTab('subject-management')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'subject-management'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📚 Subject Management
        </button>

        <button
          onClick={() => setActiveTab('student-allocation')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'student-allocation'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Student Allocation
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'subject-management' && renderSubjectManagement()}
      {activeTab === 'faculty-assignments' && renderFacultyAssignments()}
      {activeTab === 'student-allocation' && renderStudentAllocation()}

      {/* Add/Edit Department Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto modal-content">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h3>
            
            <form onSubmit={editingDepartment ? handleUpdateDepartment : handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
                <input
                  type="text"
                  value={newDepartment.hod}
                  onChange={(e) => setNewDepartment({...newDepartment, hod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                <input
                  type="number"
                  value={newDepartment.establishedYear}
                  onChange={(e) => setNewDepartment({...newDepartment, establishedYear: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              {/* Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Sections</label>
                <div className="flex gap-2 mb-2">
                  {['A', 'B', 'C', 'D'].map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => handleAddSection(section)}
                      className={`px-3 py-1 rounded text-sm ${
                        newDepartment.sections.includes(section)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {newDepartment.sections.map((section) => (
                    <span
                      key={section}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      {section}
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(section)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDepartment ? 'Update Department' : 'Add Department'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingDepartment(null)
                    setNewDepartment({
                      name: '',
                      description: '',
                      hod: '',
                      establishedYear: new Date().getFullYear(),
                      sections: []
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Creation Modal */}
      {showSubjectCreationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md modal-content">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Subject</h3>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  value={newSubject.credits}
                  onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min="1"
                  max="6"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newSubject.department}
                  onChange={(e) => setNewSubject({...newSubject, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={newSubject.section}
                  onChange={(e) => setNewSubject({...newSubject, section: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Subject
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubjectCreationForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Assignment Modal */}
      {showFacultyAssignmentForm && selectedSubjectForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
            <h3 className="text-xl font-bold mb-4 text-black">
              Assign Faculty to {selectedSubjectForAssignment.name}
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Subject: {selectedSubjectForAssignment.code} - {selectedSubjectForAssignment.department} Section {selectedSubjectForAssignment.section}
                </p>
              </div>

              {/* Available Faculty List */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Available Faculty (Multiple Selection)</h4>
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {/* Sample faculty list - in real app this would come from a faculty database */}
                  {[
                    { id: 1, name: "Prof. Alice", email: "alice@university.edu", department: "Computer Science", isExternal: false },
                    { id: 2, name: "Prof. Bob", email: "bob@university.edu", department: "Computer Science", isExternal: false },
                    { id: 3, name: "Prof. Charlie", email: "charlie@university.edu", department: "Computer Science", isExternal: false },
                    { id: 4, name: "Prof. David", email: "david.me@university.edu", department: "Mechanical Engineering", isExternal: true },
                    { id: 5, name: "Prof. Eve", email: "eve@university.edu", department: "Business Administration", isExternal: true },
                    { id: 6, name: "Prof. Frank", email: "frank@university.edu", department: "Mechanical Engineering", isExternal: true }
                  ].map((faculty) => {
                    const isSelected = selectedFaculty.some(f => f.id === faculty.id)
                    const isExternal = faculty.department !== selectedSubjectForAssignment.department
                    
                    return (
                      <div key={faculty.id} className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedFaculty(selectedFaculty.filter(f => f.id !== faculty.id))
                        } else {
                          setSelectedFaculty([...selectedFaculty, { ...faculty, isExternal }])
                        }
                      }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{faculty.name}</p>
                            <p className="text-sm text-gray-600">{faculty.email}</p>
                            <p className="text-sm text-gray-500">
                              {faculty.department}
                              {isExternal && (
                                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                  External
                                </span>
                              )}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Selected Faculty Preview */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Selected Faculty ({selectedFaculty.length})</h4>
                <div className="space-y-2">
                  {selectedFaculty.map((faculty, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{faculty.name}</p>
                        <p className="text-sm text-gray-600">{faculty.email}</p>
                        <p className="text-sm text-gray-500">
                          {faculty.department}
                          {faculty.isExternal && (
                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                              External
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFaculty(selectedFaculty.filter(f => f.id !== faculty.id))}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {selectedFaculty.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No faculty selected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
              <button
                onClick={() => {
                  setShowFacultyAssignmentForm(false)
                  setSelectedSubjectForAssignment(null)
                  setSelectedFaculty([])
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFacultyAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Assignment Modal */}
      {showStudentAssignForm && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-content">
            <h3 className="text-xl font-bold mb-4 text-black">
              Assign Students to {selectedSubject.name}
            </h3>
            
            <div className="space-y-6">
              {/* Enrolled Students Display */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Enrolled Students ({selectedSubject.enrolledStudents.length}/{selectedSubject.maxStudents})
                </h4>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(selectedSubject.enrolledStudents.length / selectedSubject.maxStudents) * 100}%` }}
                  ></div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedSubject.enrolledStudents.map((studentName, index) => {
                    const student = users.find(u => u.name === studentName && u.role === 'Student')
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{studentName}</p>
                          <p className="text-sm text-gray-600">{student?.email || 'N/A'}</p>
                        </div>
                      </div>
                    )
                  })}
                  {selectedSubject.enrolledStudents.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No students enrolled yet</p>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Student enrollment is managed through the Student Allocation tab.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6 mt-6 border-t">
              <button
                onClick={() => {
                  setShowStudentAssignForm(false)
                  setSelectedSubject(null)
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Creation Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Subject</h3>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., CS101"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <select
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={newSubject.section}
                    onChange={(e) => setNewSubject({...newSubject, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required={!newSubject.createForAllSections}
                    disabled={newSubject.createForAllSections}
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              {/* Create for All Sections Option */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="createForAllSections"
                    checked={newSubject.createForAllSections}
                    onChange={(e) => setNewSubject({
                      ...newSubject, 
                      createForAllSections: e.target.checked,
                      section: e.target.checked ? '' : newSubject.section
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="createForAllSections" className="ml-2 block text-sm text-gray-900">
                    <span className="font-medium">Create for all sections (A, B, C)</span>
                    <p className="text-gray-600 text-xs mt-1">
                      This will create the subject for sections A, B, and C with codes ending in -A, -B, -C
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={newSubject.department}
                  onChange={(e) => setNewSubject({...newSubject, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select
                  value={newSubject.year}
                  onChange={(e) => setNewSubject({...newSubject, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Each subject automatically supports 65 students maximum. 
                  Faculty can be assigned after creation through the Subject Management tab.
                  {newSubject.createForAllSections && (
                    <span className="block mt-1">
                      <strong>Creating for all sections:</strong> This will create 3 separate subjects for sections A, B, and C.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {newSubject.createForAllSections ? 'Create Subject for All Sections' : 'Create Subject'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectForm(false)
                    setNewSubject({
                      name: '',
                      code: '',
                      credits: 3,
                      department: '',
                      year: '',
                      section: '',
                      createForAllSections: false
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Assignment Form */}
      {showFacultyAssignmentForm && selectedSubjectForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Assign Faculty to {selectedSubjectForAssignment.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Faculty</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {/* Sample faculty list - replace with actual faculty data */}
                    {[
                      { id: 1, name: "Prof. Alice Johnson", email: "alice.johnson@learnaia.edu", department: "Computer Science", isExternal: false },
                      { id: 2, name: "Prof. Bob Smith", email: "bob.smith@learnaia.edu", department: "Computer Science", isExternal: false },
                      { id: 3, name: "Prof. Charlie Brown", email: "charlie.brown@learnaia.edu", department: "Computer Science", isExternal: false },
                      { id: 4, name: "Prof. David Wilson", email: "david.wilson@learnaia.edu", department: "Computer Science", isExternal: false },
                      { id: 5, name: "Prof. Frank Miller", email: "frank.miller@learnaia.edu", department: "Mechanical Engineering", isExternal: true },
                      { id: 6, name: "Prof. Grace Lee", email: "grace.lee@learnaia.edu", department: "Business Administration", isExternal: true }
                    ].map((faculty) => (
                      <div key={faculty.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`faculty-${faculty.id}`}
                          checked={selectedFaculty.some(f => f.id === faculty.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFaculty([...selectedFaculty, faculty])
                            } else {
                              setSelectedFaculty(selectedFaculty.filter(f => f.id !== faculty.id))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`faculty-${faculty.id}`} className="ml-2 text-sm text-gray-700">
                          {faculty.name} - {faculty.department}
                          {faculty.isExternal && (
                            <span className="ml-1 px-1 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                              External
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSaveFacultyAssignment}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Assignment
                  </button>
                  <button
                    onClick={() => {
                      setShowFacultyAssignmentForm(false)
                      setSelectedSubjectForAssignment(null)
                      setSelectedFaculty([])
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )

  // Main component render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Department Overview
            </button>
            <button
              onClick={() => setActiveTab('subject-management')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'subject-management'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Subject Management
            </button>
            <button
              onClick={() => setActiveTab('student-allocation')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'student-allocation'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Student Allocation
            </button>
            <button
              onClick={() => setActiveTab('faculty-assignments')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'faculty-assignments'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Faculty Assignments
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'subject-management' && renderSubjectManagement()}
        {activeTab === 'student-allocation' && renderStudentAllocation()}
        {activeTab === 'faculty-assignments' && renderFacultyAssignments()}

        {/* Department Add/Edit Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h3>
                <form onSubmit={editingDepartment ? handleUpdateDepartment : handleAddDepartment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                    <input
                      type="text"
                      value={newDepartment.name}
                      onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
                    <input
                      type="text"
                      value={newDepartment.hod}
                      onChange={(e) => setNewDepartment({...newDepartment, hod: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                    <input
                      type="number"
                      value={newDepartment.establishedYear}
                      onChange={(e) => setNewDepartment({...newDepartment, establishedYear: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sections</label>
                    <div className="flex gap-2 mb-2">
                      {['A', 'B', 'C', 'D'].map((section) => (
                        <button
                          key={section}
                          type="button"
                          onClick={() => handleAddSection(section)}
                          disabled={newDepartment.sections.includes(section)}
                          className={`px-3 py-1 rounded text-sm ${
                            newDepartment.sections.includes(section)
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          Add {section}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {newDepartment.sections.map((section) => (
                        <span
                          key={section}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                        >
                          Section {section}
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(section)}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingDepartment ? 'Update Department' : 'Add Department'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingDepartment(null)
                        setNewDepartment({
                          name: '',
                          description: '',
                          hod: '',
                          establishedYear: new Date().getFullYear(),
                          sections: []
                        })
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Student View Popup */}
        {showViewStudentPopup && selectedStudentForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
                  <button
                    onClick={() => {
                      setShowViewStudentPopup(false)
                      setSelectedStudentForAction(null)
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">{selectedStudentForAction?.name}</h4>
                        <p className="text-gray-600">{selectedStudentForAction?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Academic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-800">Academic Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium">{selectedStudentForAction?.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Batch:</span>
                          <span className="font-medium">{selectedStudentForAction?.batch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Academic Year:</span>
                          <span className="font-medium">{getAcademicYear(selectedStudentForAction?.batch || '')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Section:</span>
                          <span className="font-medium">
                            {selectedStudentForAction?.section ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                Section {selectedStudentForAction?.section}
                              </span>
                            ) : (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                                Not Assigned
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            selectedStudentForAction?.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedStudentForAction?.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-800">Contact Information</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{selectedStudentForAction?.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right">{selectedStudentForAction?.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date Joined:</span>
                          <span className="font-medium">{selectedStudentForAction?.dateJoined}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guardian Information */}
                  {selectedStudentForAction?.guardianName && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-3">Guardian Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guardian Name:</span>
                          <span className="font-medium">{selectedStudentForAction?.guardianName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guardian Phone:</span>
                          <span className="font-medium">{selectedStudentForAction?.guardianPhone}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowViewStudentPopup(false)
                      setSelectedStudentForAction(null)
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Reassign Popup */}
        {showReassignPopup && selectedStudentForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Reassign Student</h3>
                  <button
                    onClick={() => {
                      setShowReassignPopup(false)
                      setSelectedStudentForAction(null)
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Student Information</h4>
                    <p className="text-gray-700"><strong>Name:</strong> {selectedStudentForAction?.name}</p>
                    <p className="text-gray-700"><strong>Current Section:</strong> {selectedStudentForAction?.section || 'Not Assigned'}</p>
                    <p className="text-gray-700"><strong>Department:</strong> {selectedStudentForAction?.department}</p>
                    <p className="text-gray-700"><strong>Academic Year:</strong> {getAcademicYear(selectedStudentForAction?.batch || '')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select New Section</label>
                    {(() => {
                      const year = getAcademicYear(selectedStudentForAction?.batch || '')
                      const availableSections = classCombinations.filter(c => 
                        c.department === selectedStudentForAction?.department && 
                        c.year === year && 
                        c.section !== selectedStudentForAction?.section && 
                        c.currentCount < 65
                      )

                      if (availableSections.length === 0) {
                        return (
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <p className="text-yellow-800">No available sections for reassignment. All sections are either full or this is the student's current section.</p>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={() => {
                                  setShowReassignPopup(false)
                                  setSelectedStudentForAction(null)
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-2">
                          {availableSections.map((section) => (
                            <button
                              type="button"
                              key={section.section}
                              onClick={() => {
                                console.log('=== SECTION SELECTION CLICKED ===');
                                console.log('Section selection button clicked:', section.section);
                                console.log('Selected student:', selectedStudentForAction?.name);
                                
                                if (selectedStudentForAction) {
                                  console.log('Before assignment - student:', selectedStudentForAction.name, 'current section:', selectedStudentForAction.section, 'new section:', section.section);
                                  console.log('Current users state before assignment:', users.filter(u => u.role === 'Student').map(u => ({name: u.name, section: u.section})));
                                  
                                  // Direct assignment for testing
                                  const updatedUsers = users.map(user =>
                                    user.id === selectedStudentForAction.id
                                      ? { ...user, section: section.section }
                                      : user
                                  );
                                  
                                  console.log('Updated users after assignment:', updatedUsers.filter(u => u.role === 'Student').map(u => ({name: u.name, section: u.section})));
                                  
                                  setUsers(updatedUsers);
                                  showNotificationMessage(`${selectedStudentForAction.name} successfully assigned to Section ${section.section}`, 'success');
                                  
                                  // Close popup immediately
                                  setShowReassignPopup(false);
                                  setSelectedStudentForAction(null);
                                  
                                  // Force refresh after a delay
                                  setTimeout(() => {
                                    console.log('Forcing refresh...');
                                    refreshData();
                                  }, 100);
                                } else {
                                  console.log('No student selected for action');
                                  setShowReassignPopup(false);
                                  setSelectedStudentForAction(null);
                                }
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Section {section.section}</span>
                                <span className="text-sm text-gray-600">
                                  {section.currentCount}/65 students
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(section.currentCount / 65) * 100}%` }}
                                ></div>
                              </div>
                            </button>
                          ))}
                          <div className="flex justify-end gap-3 mt-4">
                            <button
                              onClick={() => {
                                setShowReassignPopup(false)
                                setSelectedStudentForAction(null)
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`p-4 rounded-lg shadow-lg ${
              notificationType === 'success' ? 'bg-green-500 text-white' :
              notificationType === 'error' ? 'bg-red-500 text-white' :
              'bg-yellow-500 text-white'
            }`}>
              <div className="flex items-center gap-2">
                {notificationType === 'success' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {notificationType === 'error' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {notificationType === 'warning' && (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <span>{notificationMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Confirm Action</h3>
                </div>
                
                <p className="text-gray-600 mb-6">{confirmMessage}</p>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmDialog(false)
                      setConfirmAction(null)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Confirm dialog OK button clicked');
                      if (confirmAction) {
                        console.log('Executing confirmAction');
                        confirmAction();
                      } else {
                        console.log('No confirmAction found');
                      }
                      setShowConfirmDialog(false);
                      setConfirmAction(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
