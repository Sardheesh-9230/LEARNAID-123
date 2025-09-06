'use client'

import { useState } from 'react'

interface Subject {
  id: number
  name: string
  code: string
  description: string
  credits: number
  semester: number
  department: string
  section: string
  faculty: string
  status: 'Active' | 'Inactive'
  prerequisite?: string
  syllabus?: string
  maxStudents: number
  enrolledStudents: number
}

interface Faculty {
  id: number
  name: string
  department: string
  email: string
}

export default function SubjectManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [showAssignForm, setShowAssignForm] = useState(false)

  // Sample subjects data
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: 1,
      name: "Data Structures and Algorithms",
      code: "CS101",
      description: "Fundamental data structures and algorithmic techniques",
      credits: 4,
      semester: 3,
      department: "Computer Science",
      section: "A",
      faculty: "Prof. Alice Johnson",
      status: "Active",
      prerequisite: "Programming Fundamentals",
      syllabus: "Arrays, Linked Lists, Stacks, Queues, Trees, Graphs",
      maxStudents: 50,
      enrolledStudents: 45
    },
    {
      id: 2,
      name: "Database Management Systems",
      code: "CS201",
      description: "Database design, SQL, and database administration",
      credits: 3,
      semester: 4,
      department: "Computer Science",
      section: "B",
      faculty: "Prof. Bob Smith",
      status: "Active",
      prerequisite: "Data Structures",
      syllabus: "SQL, Normalization, Transactions, Indexing",
      maxStudents: 45,
      enrolledStudents: 42
    },
    {
      id: 3,
      name: "Thermodynamics",
      code: "ME101",
      description: "Heat transfer and energy conversion principles",
      credits: 3,
      semester: 2,
      department: "Mechanical Engineering",
      section: "A",
      faculty: "Prof. Charlie Brown",
      status: "Active",
      prerequisite: "Physics I",
      syllabus: "Heat engines, Refrigeration, Energy balance",
      maxStudents: 40,
      enrolledStudents: 38
    },
    {
      id: 4,
      name: "Marketing Management",
      code: "BA101",
      description: "Marketing strategies and consumer behavior",
      credits: 3,
      semester: 1,
      department: "Business Administration",
      section: "A",
      faculty: "Prof. Diana Green",
      status: "Active",
      prerequisite: "None",
      syllabus: "4Ps of Marketing, Consumer behavior, Market research",
      maxStudents: 60,
      enrolledStudents: 55
    },
    {
      id: 5,
      name: "Machine Learning",
      code: "CS301",
      description: "Introduction to machine learning algorithms",
      credits: 4,
      semester: 6,
      department: "Computer Science",
      section: "A",
      faculty: "Prof. Eve Wilson",
      status: "Inactive",
      prerequisite: "Statistics, Programming",
      syllabus: "Supervised learning, Unsupervised learning, Neural networks",
      maxStudents: 35,
      enrolledStudents: 0
    }
  ])

  // Sample faculty data
  const [faculty] = useState<Faculty[]>([
    { id: 1, name: "Prof. Alice Johnson", department: "Computer Science", email: "alice@learnaia.edu" },
    { id: 2, name: "Prof. Bob Smith", department: "Computer Science", email: "bob@learnaia.edu" },
    { id: 3, name: "Prof. Charlie Brown", department: "Mechanical Engineering", email: "charlie@learnaia.edu" },
    { id: 4, name: "Prof. Diana Green", department: "Business Administration", email: "diana@learnaia.edu" },
    { id: 5, name: "Prof. Eve Wilson", department: "Computer Science", email: "eve@learnaia.edu" },
    { id: 6, name: "Prof. Frank Davis", department: "Electrical Engineering", email: "frank@learnaia.edu" }
  ])

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    semester: 1,
    department: '',
    section: '',
    faculty: '',
    prerequisite: '',
    syllabus: '',
    maxStudents: 50
  })

  const departments = ["Computer Science", "Mechanical Engineering", "Business Administration", "Electrical Engineering"]
  const sections = ["A", "B", "C"]

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault()
    const subject: Subject = {
      id: subjects.length + 1,
      ...newSubject,
      status: 'Active',
      enrolledStudents: 0
    }
    setSubjects([...subjects, subject])
    resetForm()
    setShowAddForm(false)
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setNewSubject({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      credits: subject.credits,
      semester: subject.semester,
      department: subject.department,
      section: subject.section,
      faculty: subject.faculty,
      prerequisite: subject.prerequisite || '',
      syllabus: subject.syllabus || '',
      maxStudents: subject.maxStudents
    })
    setShowAddForm(true)
  }

  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingSubject) {
      const updatedSubjects = subjects.map(subject =>
        subject.id === editingSubject.id
          ? { ...subject, ...newSubject }
          : subject
      )
      setSubjects(updatedSubjects)
      setEditingSubject(null)
      resetForm()
      setShowAddForm(false)
    }
  }

  const handleDeleteSubject = (id: number) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      setSubjects(subjects.filter(subject => subject.id !== id))
    }
  }

  const handleToggleStatus = (id: number) => {
    setSubjects(subjects.map(subject =>
      subject.id === id
        ? { ...subject, status: subject.status === 'Active' ? 'Inactive' : 'Active' }
        : subject
    ))
  }

  const resetForm = () => {
    setNewSubject({
      name: '',
      code: '',
      description: '',
      credits: 3,
      semester: 1,
      department: '',
      section: '',
      faculty: '',
      prerequisite: '',
      syllabus: '',
      maxStudents: 50
    })
  }

  const getSubjectsByDepartment = () => {
    const subjectsByDept: { [key: string]: Subject[] } = {}
    subjects.forEach(subject => {
      if (!subjectsByDept[subject.department]) {
        subjectsByDept[subject.department] = []
      }
      subjectsByDept[subject.department].push(subject)
    })
    return subjectsByDept
  }

  const getFacultyByDepartment = (department: string) => {
    return faculty.filter(f => f.department === department)
  }

  const renderOverview = () => {
    const subjectsByDept = getSubjectsByDepartment()

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Subjects</h3>
            <p className="text-3xl font-bold text-blue-600">{subjects.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Active Subjects</h3>
            <p className="text-3xl font-bold text-green-600">
              {subjects.filter(s => s.status === 'Active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Enrollment</h3>
            <p className="text-3xl font-bold text-purple-600">
              {subjects.reduce((acc, s) => acc + s.enrolledStudents, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-800">Available Capacity</h3>
            <p className="text-3xl font-bold text-orange-600">
              {subjects.reduce((acc, s) => acc + (s.maxStudents - s.enrolledStudents), 0)}
            </p>
          </div>
        </div>

        {/* Subjects by Department */}
        {Object.entries(subjectsByDept).map(([deptName, deptSubjects]) => (
          <div key={deptName} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{deptName}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-700">Subject</th>
                    <th className="text-left py-3 text-gray-700">Code</th>
                    <th className="text-left py-3 text-gray-700">Credits</th>
                    <th className="text-left py-3 text-gray-700">Faculty</th>
                    <th className="text-left py-3 text-gray-700">Section</th>
                    <th className="text-left py-3 text-gray-700">Enrollment</th>
                    <th className="text-left py-3 text-gray-700">Status</th>
                    <th className="text-left py-3 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deptSubjects.map((subject) => (
                    <tr key={subject.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-800">{subject.name}</td>
                      <td className="py-3 text-blue-600 font-mono">{subject.code}</td>
                      <td className="py-3">{subject.credits}</td>
                      <td className="py-3">{subject.faculty}</td>
                      <td className="py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {subject.section}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm">
                          {subject.enrolledStudents}/{subject.maxStudents}
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(subject.enrolledStudents / subject.maxStudents) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subject.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subject.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(subject.id)}
                            className={`px-2 py-1 rounded text-xs ${
                              subject.status === 'Active'
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {subject.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
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
        ))}

        {/* Add Subject Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New Subject
        </button>
      </div>
    )
  }

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Faculty-Subject Assignments</h3>
        
        <div className="grid gap-6">
          {departments.map(dept => {
            const deptFaculty = getFacultyByDepartment(dept)
            const deptSubjects = subjects.filter(s => s.department === dept)
            
            return (
              <div key={dept} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg text-gray-800 mb-3">{dept}</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Faculty Members</h5>
                    <div className="space-y-2">
                      {deptFaculty.map(f => (
                        <div key={f.id} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">{f.name}</p>
                          <p className="text-sm text-gray-600">{f.email}</p>
                          <p className="text-xs text-blue-600">
                            Assigned: {deptSubjects.filter(s => s.faculty === f.name).length} subjects
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Department Subjects</h5>
                    <div className="space-y-2">
                      {deptSubjects.map(subject => (
                        <div key={subject.id} className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-gray-600">Assigned to: {subject.faculty}</p>
                          <p className="text-xs text-green-600">
                            Section {subject.section} | {subject.credits} credits
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Subject Management</h2>
        <p className="text-gray-600">Manage subjects, assignments, and faculty allocation</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'overview'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📚 Subject Overview
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'assignments'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          👨‍🏫 Faculty Assignments
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'assignments' && renderAssignments()}

      {/* Add/Edit Subject Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-black">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h3>
            
            <form onSubmit={editingSubject ? handleUpdateSubject : handleAddSubject} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                  rows={2}
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input
                    type="number"
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    min="1"
                    max="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    value={newSubject.semester}
                    onChange={(e) => setNewSubject({...newSubject, semester: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  >
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={newSubject.maxStudents}
                    onChange={(e) => setNewSubject({...newSubject, maxStudents: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    min="10"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={newSubject.department}
                    onChange={(e) => setNewSubject({...newSubject, department: e.target.value, faculty: ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={newSubject.section}
                    onChange={(e) => setNewSubject({...newSubject, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
                <select
                  value={newSubject.faculty}
                  onChange={(e) => setNewSubject({...newSubject, faculty: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                  required
                >
                  <option value="">Select Faculty</option>
                  {newSubject.department && getFacultyByDepartment(newSubject.department).map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites</label>
                <input
                  type="text"
                  value={newSubject.prerequisite}
                  onChange={(e) => setNewSubject({...newSubject, prerequisite: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="e.g., Programming Fundamentals, Mathematics I"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus Overview</label>
                <textarea
                  value={newSubject.syllabus}
                  onChange={(e) => setNewSubject({...newSubject, syllabus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                  rows={3}
                  placeholder="Brief overview of topics covered in this subject"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingSubject(null)
                    resetForm()
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
    </div>
  )
}
