'use client'

import React, { useState, useEffect } from 'react';
import { FaBuilding, FaBook, FaUsers, FaChalkboardTeacher, FaUserGraduate, FaPlus, FaEdit, FaTrash, FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import apiService from '@/services/api';

interface Department {
  _id: string;
  name: string;
  code: string;
  hod?: string | { _id: string; name?: string; fullName?: string; email?: string };
  description?: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  type: 'Theory' | 'TCPR' | 'TCPL' | 'Elective' | 'Core';
  department: string;
  year: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  section: 'A' | 'B' | 'C';
  credits: number;
  semester: number;
  description?: string;
}

interface Faculty {
  _id: string;
  name?: string;
  fullName?: string;
  email: string;
  department: string;
  employeeId?: string;
  phone?: string;
  role: string;
}

interface Class {
  _id: string;
  name: string;
  department: string;
  year: number;
  semester: number;
  section: string;
  students?: number;
}

interface Student {
  _id: string;
  name?: string;
  fullName?: string;
  email: string;
  rollNumber?: string;
  department: string;
  year?: number;
  semester?: number;
  phone?: string;
  role: string;
}

type ViewMode = 'list' | 'detail' | 'subjects' | 'faculty' | 'classes' | 'students';

const HierarchicalDepartmentManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Department form states
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: '',
    description: '',
    hod: ''
  });

  // Subject form states
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    type: 'Theory' as 'Theory' | 'TCPR' | 'TCPL' | 'Elective' | 'Core',
    year: '1st Year' as '1st Year' | '2nd Year' | '3rd Year' | '4th Year',
    section: 'A' as 'A' | 'B' | 'C',
    credits: 3,
    semester: 1,
    description: ''
  });

  // Faculty form states
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // Class form states
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classForm, setClassForm] = useState({
    name: '',
    year: 1,
    semester: 1,
    section: 'A'
  });

  // Student form states
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Load departments
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await apiService.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      } else {
        setError(response.message || 'Failed to fetch departments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (departmentId: string) => {
    setLoading(true);
    try {
      const response = await apiService.getSubjects();
      if (response.success) {
        // Filter subjects by department
        const filteredSubjects = response.data.filter((s: Subject) => s.department === departmentId);
        setSubjects(filteredSubjects);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async (departmentId: string) => {
    setLoading(true);
    try {
      const response = await apiService.getUsers();
      if (response.success) {
        // Filter by role (case-insensitive)
        const allFaculty = response.data.filter((u: any) => 
          u.role && u.role.toLowerCase() === 'faculty'
        );
        
        // Filter faculty by department
        const filteredFaculty = allFaculty.filter((u: any) => {
          if (!u.department) return false;
          
          // Handle department as object or string
          const userDeptId = typeof u.department === 'object' && u.department !== null
            ? u.department._id
            : u.department;
          
          return userDeptId === departmentId;
        });
        
        setFaculty(filteredFaculty);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch faculty');
      console.error('Error fetching faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (departmentId: string) => {
    // Classes are derived from subjects, so fetch subjects
    await fetchSubjects(departmentId);
  };

  const fetchStudents = async (departmentId: string) => {
    setLoading(true);
    try {
      const response = await apiService.getUsers();
      if (response.success) {
        // Filter by role (case-insensitive)
        const allStudents = response.data.filter((u: any) => 
          u.role && u.role.toLowerCase() === 'student'
        );
        
        // Filter students by department
        const filteredStudents = allStudents.filter((u: any) => {
          if (!u.department) return false;
          
          // Handle department as object or string
          const userDeptId = typeof u.department === 'object' && u.department !== null
            ? u.department._id
            : u.department;
          
          return userDeptId === departmentId;
        });
        
        setStudents(filteredStudents);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    setViewMode('detail');
  };

  const handleManageSubjects = () => {
    if (selectedDepartment) {
      fetchSubjects(selectedDepartment._id);
      setViewMode('subjects');
    }
  };

  const handleManageFaculty = () => {
    if (selectedDepartment) {
      fetchFaculty(selectedDepartment._id);
      setViewMode('faculty');
    }
  };

  const handleManageClasses = () => {
    if (selectedDepartment) {
      fetchClasses(selectedDepartment._id);
      setViewMode('classes');
    }
  };

  const handleManageStudents = () => {
    if (selectedDepartment) {
      fetchStudents(selectedDepartment._id);
      setViewMode('students');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDepartment(null);
    setError(null);
  };

  const handleBackToDetail = () => {
    setViewMode('detail');
    setShowSubjectForm(false);
    setEditingSubject(null);
    setShowFacultyForm(false);
    setEditingFaculty(null);
    setShowClassForm(false);
    setEditingClass(null);
    setShowStudentForm(false);
    setEditingStudent(null);
    setError(null);
    setSuccess(null);
  };

  // Department CRUD
  const handleCreateDepartment = () => {
    setDepartmentForm({ name: '', code: '', description: '', hod: '' });
    setEditingDepartment(null);
    setShowDepartmentForm(true);
  };

  const handleEditDepartment = (dept: Department) => {
    const hodValue = typeof dept.hod === 'object' && dept.hod !== null 
      ? (dept.hod as any).name || (dept.hod as any).fullName || ''
      : dept.hod || '';
    
    setDepartmentForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      hod: hodValue
    });
    setEditingDepartment(dept);
    setShowDepartmentForm(true);
  };

  const handleSaveDepartment = async () => {
    try {
      if (editingDepartment) {
        const response = await apiService.updateDepartment(editingDepartment._id, departmentForm);
        if (response.success) {
          fetchDepartments();
          setShowDepartmentForm(false);
          setError(null);
        }
      } else {
        const response = await apiService.createDepartment(departmentForm);
        if (response.success) {
          fetchDepartments();
          setShowDepartmentForm(false);
          setError(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save department');
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        const response = await apiService.deleteDepartment(deptId);
        if (response.success) {
          fetchDepartments();
          if (selectedDepartment?._id === deptId) {
            handleBackToList();
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete department');
      }
    }
  };

  // Subject CRUD
  const handleCreateSubject = () => {
    setSubjectForm({ 
      name: '', 
      code: '', 
      type: 'Theory',
      year: '1st Year',
      section: 'A',
      credits: 3, 
      semester: 1, 
      description: '' 
    });
    setEditingSubject(null);
    setShowSubjectForm(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      type: subject.type,
      year: subject.year,
      section: subject.section,
      credits: subject.credits,
      semester: subject.semester,
      description: subject.description || ''
    });
    setEditingSubject(subject);
    setShowSubjectForm(true);
  };

  const handleSaveSubject = async () => {
    if (!selectedDepartment) return;

    try {
      const subjectData = {
        ...subjectForm,
        department: selectedDepartment._id
      };

      if (editingSubject) {
        const response = await apiService.updateSubject(editingSubject._id, subjectData);
        if (response.success) {
          fetchSubjects(selectedDepartment._id);
          setShowSubjectForm(false);
          setError(null);
        }
      } else {
        const response = await apiService.createSubject(subjectData);
        if (response.success) {
          fetchSubjects(selectedDepartment._id);
          setShowSubjectForm(false);
          setError(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save subject');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        const response = await apiService.deleteSubject(subjectId);
        if (response.success && selectedDepartment) {
          fetchSubjects(selectedDepartment._id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete subject');
      }
    }
  };

  // Render Department List View
  const renderDepartmentList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaBuilding className="text-indigo-600" />
            Department Management
          </h2>
          <p className="text-gray-600 mt-1">Manage departments and their associated resources</p>
        </div>
        <button
          onClick={handleCreateDepartment}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <FaPlus /> Add Department
        </button>
      </div>

      {/* Department List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HOD
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((dept) => (
              <tr
                key={dept._id}
                className="hover:bg-gray-50 cursor-pointer transition"
                onClick={() => handleSelectDepartment(dept)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-indigo-600">{dept.code}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FaBuilding className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {typeof dept.hod === 'object' && dept.hod !== null 
                      ? (dept.hod as any).name || (dept.hod as any).fullName || 'Not Assigned'
                      : dept.hod || 'Not Assigned'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{dept.description || '-'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDepartment(dept);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(dept._id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                    <FaChevronRight className="text-gray-400" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {departments.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <FaBuilding className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No departments found. Create your first department.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Department Detail View
  const renderDepartmentDetail = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBackToList}
          className="text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedDepartment?.name}
          </h2>
          <p className="text-gray-600">{selectedDepartment?.code}</p>
        </div>
        <button
          onClick={() => selectedDepartment && handleEditDepartment(selectedDepartment)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FaEdit /> Edit Department
        </button>
      </div>

      {/* Management Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjects */}
        <div
          onClick={handleManageSubjects}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 p-4 rounded-lg">
              <FaBook className="text-indigo-600 text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">Subjects</h3>
              <p className="text-gray-600 text-sm">Manage subjects and courses</p>
            </div>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>

        {/* Faculty */}
        <div
          onClick={handleManageFaculty}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-green-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <FaChalkboardTeacher className="text-green-600 text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">Faculty</h3>
              <p className="text-gray-600 text-sm">Manage faculty assignments</p>
            </div>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>

        {/* Classes */}
        <div
          onClick={handleManageClasses}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-purple-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <FaUsers className="text-purple-600 text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">Classes & Sections</h3>
              <p className="text-gray-600 text-sm">View class sections and schedules</p>
            </div>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>

        {/* Students */}
        <div
          onClick={handleManageStudents}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-orange-500"
        >
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-4 rounded-lg">
              <FaUserGraduate className="text-orange-600 text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">Students</h3>
              <p className="text-gray-600 text-sm">Manage student enrollment</p>
            </div>
            <FaChevronRight className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Department Info */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Department Code</p>
            <p className="font-semibold text-gray-800">{selectedDepartment?.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Head of Department</p>
            <p className="font-semibold text-gray-800">
              {selectedDepartment?.hod 
                ? (typeof selectedDepartment.hod === 'object' 
                    ? (selectedDepartment.hod as any).name || (selectedDepartment.hod as any).fullName || 'Not Assigned'
                    : selectedDepartment.hod)
                : 'Not Assigned'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-gray-800">{selectedDepartment?.description || 'No description available'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Subjects Management View
  const renderSubjectsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDetail}
            className="text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaBook className="text-indigo-600" />
              Subjects - {selectedDepartment?.name}
            </h2>
            <p className="text-gray-600 mt-1">Manage subjects for this department</p>
          </div>
        </div>
        <button
          onClick={handleCreateSubject}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <FaPlus /> Add Subject
        </button>
      </div>

      {/* Subjects List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year/Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.map((subject) => (
              <tr key={subject._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-indigo-600">{subject.code}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {subject.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{subject.year} - Sec {subject.section}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{subject.credits}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">Semester {subject.semester}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleEditSubject(subject)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {subjects.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <FaBook className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No subjects found. Add your first subject.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Faculty View
  const renderFacultyView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDetail}
            className="text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaChalkboardTeacher className="text-green-600" />
              Faculty Management - {selectedDepartment?.name}
            </h2>
            <p className="text-gray-600 mt-1">Manage faculty members in this department</p>
          </div>
        </div>
      </div>

      {/* Faculty List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faculty.map((fac) => (
              <tr key={fac._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-green-600">{fac.employeeId || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{fac.fullName || fac.name || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{fac.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{fac.phone || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {faculty.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <FaChalkboardTeacher className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No faculty members found in this department.</p>
            <p className="text-sm mt-2">Faculty members are assigned through User Management.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Classes View
  const renderClassesView = () => {
    // Group subjects by year and section to show existing classes
    const groupedSubjects = subjects.reduce((acc: any, subject) => {
      const key = `${subject.year}-${subject.section}`;
      if (!acc[key]) {
        acc[key] = {
          year: subject.year,
          section: subject.section,
          subjects: [],
          totalCredits: 0
        };
      }
      acc[key].subjects.push(subject);
      acc[key].totalCredits += subject.credits;
      return acc;
    }, {});

    const classGroups = Object.values(groupedSubjects);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDetail}
              className="text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaUsers className="text-purple-600" />
                Classes & Sections - {selectedDepartment?.name}
              </h2>
              <p className="text-gray-600 mt-1">Manage class sections and their subjects</p>
            </div>
          </div>
          <button
            onClick={() => {
              setClassForm({ name: '', year: 1, semester: 1, section: 'A' });
              setEditingClass(null);
              setShowClassForm(true);
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <FaPlus /> Add Class Section
          </button>
        </div>

        {/* Classes Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subjects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject List
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classGroups.map((group: any, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-purple-600">{group.year}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                      Section {group.section}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{group.subjects.length}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{group.totalCredits}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {group.subjects.slice(0, 3).map((subject: Subject) => (
                        <span 
                          key={subject._id}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          title={subject.name}
                        >
                          {subject.code}
                        </span>
                      ))}
                      {group.subjects.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                          +{group.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          // Navigate to subjects filtered by this class
                          setViewMode('subjects');
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Subjects"
                      >
                        <FaBook />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete all subjects for ${group.year} - Section ${group.section}?`)) {
                            // Delete all subjects in this class
                            group.subjects.forEach((subject: Subject) => {
                              handleDeleteSubject(subject._id);
                            });
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Class"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {classGroups.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <FaUsers className="mx-auto text-4xl mb-2 text-gray-300" />
              <p>No class sections found.</p>
              <p className="text-sm mt-2">Add a class section to get started.</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">How Class Sections Work</h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Each class section is created by adding subjects with specific Year and Section</li>
                <li>Click "Add Class Section" to create subjects for a new year/section combination</li>
                <li>Click the book icon to view and manage subjects for that class</li>
                <li>Deleting a class will remove all its subjects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Students View
  const renderStudentsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDetail}
            className="text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaUserGraduate className="text-orange-600" />
              Student Management - {selectedDepartment?.name}
            </h2>
            <p className="text-gray-600 mt-1">Manage students enrolled in this department</p>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-orange-600">{student.rollNumber || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{student.fullName || student.name || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{student.email}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.year ? `Year ${student.year}` : '-'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.semester ? `Sem ${student.semester}` : '-'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{student.phone || '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <FaUserGraduate className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No students found in this department.</p>
            <p className="text-sm mt-2">Students are enrolled through User Management.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {viewMode === 'list' && renderDepartmentList()}
          {viewMode === 'detail' && renderDepartmentDetail()}
          {viewMode === 'subjects' && renderSubjectsView()}
          {viewMode === 'faculty' && renderFacultyView()}
          {viewMode === 'classes' && renderClassesView()}
          {viewMode === 'students' && renderStudentsView()}
        </>
      )}

      {/* Department Form Modal */}
      {showDepartmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingDepartment ? 'Edit Department' : 'Create Department'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Computer Science Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., CSE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Head of Department
                </label>
                <input
                  type="text"
                  value={departmentForm.hod}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, hod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Brief description of the department"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDepartmentForm(false);
                  setEditingDepartment(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDepartment}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {editingDepartment ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingSubject ? 'Edit Subject' : 'Create Subject'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Data Structures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., CS201"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="TCPR">TCPR</option>
                    <option value="TCPL">TCPL</option>
                    <option value="Elective">Elective</option>
                    <option value="Core">Core</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    value={subjectForm.year}
                    onChange={(e) => setSubjectForm({ ...subjectForm, year: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section *
                  </label>
                  <select
                    value={subjectForm.section}
                    onChange={(e) => setSubjectForm({ ...subjectForm, section: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credits *
                  </label>
                  <input
                    type="number"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester *
                  </label>
                  <input
                    type="number"
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Brief description of the subject"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSubjectForm(false);
                  setEditingSubject(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubject}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {editingSubject ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Form Modal */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaUsers className="text-purple-600" />
              Add New Class Section
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a new class section. You can add subjects to it later.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year *
                </label>
                <select
                  value={classForm.year}
                  onChange={(e) => setClassForm({ ...classForm, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section *
                </label>
                <select
                  value={classForm.section}
                  onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester *
                </label>
                <select
                  value={classForm.semester}
                  onChange={(e) => setClassForm({ ...classForm, semester: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Next Step:</strong> After creating this class section, go to the Subjects tab 
                  to add subjects for this {classForm.year === 1 ? '1st' : classForm.year === 2 ? '2nd' : classForm.year === 3 ? '3rd' : '4th'} Year - Section {classForm.section} combination.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowClassForm(false);
                  setEditingClass(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Close modal and redirect to subjects with pre-filled year/section
                  setShowClassForm(false);
                  setViewMode('subjects');
                  setSuccess(`Class section created! Now add subjects for ${classForm.year === 1 ? '1st' : classForm.year === 2 ? '2nd' : classForm.year === 3 ? '3rd' : '4th'} Year - Section ${classForm.section}`);
                  
                  // Pre-fill the subject form with this class info
                  setSubjectForm({
                    name: '',
                    code: '',
                    type: 'Theory',
                    year: `${classForm.year === 1 ? '1st' : classForm.year === 2 ? '2nd' : classForm.year === 3 ? '3rd' : '4th'} Year` as any,
                    section: classForm.section as any,
                    credits: 3,
                    semester: classForm.semester,
                    description: ''
                  });
                  
                  // Show subject form
                  setTimeout(() => {
                    setShowSubjectForm(true);
                  }, 500);
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Create & Add Subjects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalDepartmentManagement;
