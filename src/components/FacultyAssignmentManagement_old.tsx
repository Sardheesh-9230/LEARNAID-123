'use client'

import { useState } from 'react'

interface Faculty {
  id: number
  name: string
  department: string
  designation: string
  specialization: string[]
  experience: number
  email: string
  phone: string
}

interface Assignment {
  id: number
  facultyId: number
  facultyName: string
  facultyDepartment: string
  subjectName: string
  subjectCode: string
  teachingDepartment: string
  section: string
  credits: number
  semester: string
  academicYear: string
}

export default function FacultyAssignmentManagement() {
  const [activeTab, setActiveTab] = useState('assignments')
  const [showAssignForm, setShowAssignForm] = useState(false)

  // Sample faculty data
  const [faculty] = useState<Faculty[]>([
    {
      id: 1,
      name: "Prof. Alice Johnson",
      department: "Computer Science",
      designation: "Associate Professor",
      specialization: ["Data Science", "Machine Learning", "Database Systems"],
      experience: 8,
      email: "alice.johnson@learnaia.edu",
      phone: "+91 98765 43210"
    },
    {
      id: 2,
      name: "Dr. Robert Brown",
      department: "Mechanical Engineering",
      designation: "Professor",
      specialization: ["Thermodynamics", "Fluid Mechanics", "Heat Transfer"],
      experience: 15,
      email: "robert.brown@learnaia.edu",
      phone: "+91 97654 32109"
    },
    {
      id: 3,
      name: "Prof. Sarah Wilson",
      department: "Business Administration",
      designation: "Assistant Professor",
      specialization: ["Marketing", "Business Analytics", "Digital Marketing"],
      experience: 5,
      email: "sarah.wilson@learnaia.edu",
      phone: "+91 96543 21098"
    },
    {
      id: 4,
      name: "Dr. Michael Chen",
      department: "Computer Science",
      designation: "Professor",
      specialization: ["Software Engineering", "System Design", "Project Management"],
      experience: 12,
      email: "michael.chen@learnaia.edu",
      phone: "+91 95432 10987"
    }
  ])

  // Sample assignments data
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 1,
      facultyId: 1,
      facultyName: "Prof. Alice Johnson",
      facultyDepartment: "Computer Science",
      subjectName: "Business Analytics",
      subjectCode: "BA201",
      teachingDepartment: "Business Administration",
      section: "A",
      credits: 3,
      semester: "Fall",
      academicYear: "2024-25"
    },
    {
      id: 2,
      facultyId: 4,
      facultyName: "Dr. Michael Chen",
      facultyDepartment: "Computer Science",
      subjectName: "Project Management",
      subjectCode: "BA301",
      teachingDepartment: "Business Administration",
      section: "B",
      credits: 3,
      semester: "Spring",
      academicYear: "2024-25"
    },
    {
      id: 3,
      facultyId: 3,
      facultyName: "Prof. Sarah Wilson",
      facultyDepartment: "Business Administration",
      subjectName: "Digital Marketing for Engineers",
      subjectCode: "ME401",
      teachingDepartment: "Mechanical Engineering",
      section: "A",
      credits: 2,
      semester: "Fall",
      academicYear: "2024-25"
    }
  ])

  const [newAssignment, setNewAssignment] = useState({
    facultyId: 0,
    subjectName: '',
    subjectCode: '',
    teachingDepartment: '',
    section: '',
    credits: 3,
    semester: 'Fall',
    academicYear: '2024-25'
  })

  const departments = ["Computer Science", "Mechanical Engineering", "Business Administration", "Electrical Engineering"]
  const sections = ["A", "B", "C"]
  const semesters = ["Fall", "Spring", "Summer"]

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedFaculty = faculty.find(f => f.id === newAssignment.facultyId)
    if (selectedFaculty) {
      const assignment: Assignment = {
        id: assignments.length + 1,
        facultyId: newAssignment.facultyId,
        facultyName: selectedFaculty.name,
        facultyDepartment: selectedFaculty.department,
        subjectName: newAssignment.subjectName,
        subjectCode: newAssignment.subjectCode,
        teachingDepartment: newAssignment.teachingDepartment,
        section: newAssignment.section,
        credits: newAssignment.credits,
        semester: newAssignment.semester,
        academicYear: newAssignment.academicYear
      }
      setAssignments([...assignments, assignment])
      resetForm()
      setShowAssignForm(false)
    }
  }

  const resetForm = () => {
    setNewAssignment({
      facultyId: 0,
      subjectName: '',
      subjectCode: '',
      teachingDepartment: '',
      section: '',
      credits: 3,
      semester: 'Fall',
      academicYear: '2024-25'
    })
  }

  const getCrossDepartmentalAssignments = () => {
    return assignments.filter(assignment => 
      assignment.facultyDepartment !== assignment.teachingDepartment
    )
  }

  const getFacultyAssignmentCount = (facultyId: number) => {
    return assignments.filter(assignment => assignment.facultyId === facultyId).length
  }

  const renderAssignments = () => {
    const crossDeptAssignments = getCrossDepartmentalAssignments()

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Faculty Assignment Overview</h3>
            <p className="text-gray-600">Manage cross-departmental teaching assignments</p>
          </div>
          <button
            onClick={() => setShowAssignForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Assignment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <h4 className="text-lg font-semibold text-gray-800">Total Assignments</h4>
            <p className="text-3xl font-bold text-blue-600">{assignments.length}</p>
            <p className="text-sm text-gray-500">All faculty assignments</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <h4 className="text-lg font-semibold text-gray-800">Cross-Department</h4>
            <p className="text-3xl font-bold text-orange-600">{crossDeptAssignments.length}</p>
            <p className="text-sm text-gray-500">Inter-departmental teaching</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <h4 className="text-lg font-semibold text-gray-800">Active Faculty</h4>
            <p className="text-3xl font-bold text-green-600">{new Set(assignments.map(a => a.facultyId)).size}</p>
            <p className="text-sm text-gray-500">Faculty with assignments</p>
          </div>
        </div>

        {/* Cross-Departmental Assignments Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Cross-Departmental Teaching Assignments</h4>
          {crossDeptAssignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🔄</div>
              <p className="text-gray-500">No cross-departmental assignments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-gray-700">Faculty</th>
                    <th className="text-left py-3 text-gray-700">Home Dept</th>
                    <th className="text-left py-3 text-gray-700">Subject</th>
                    <th className="text-left py-3 text-gray-700">Teaching Dept</th>
                    <th className="text-left py-3 text-gray-700">Section</th>
                    <th className="text-left py-3 text-gray-700">Credits</th>
                    <th className="text-left py-3 text-gray-700">Semester</th>
                    <th className="text-left py-3 text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crossDeptAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-800">{assignment.facultyName}</p>
                          <p className="text-sm text-gray-500">{faculty.find(f => f.id === assignment.facultyId)?.designation}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {assignment.facultyDepartment}
                        </span>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-800">{assignment.subjectName}</p>
                          <p className="text-sm text-blue-600">{assignment.subjectCode}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                          {assignment.teachingDepartment}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {assignment.section}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{assignment.credits}</td>
                      <td className="py-3">
                        <div className="text-sm">
                          <p className="font-medium">{assignment.semester}</p>
                          <p className="text-gray-500">{assignment.academicYear}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">
                            Edit
                          </button>
                          <button className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFacultyProfiles = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Faculty Profiles & Specializations</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {faculty.map((member) => {
          const assignmentCount = getFacultyAssignmentCount(member.id)
          const crossDeptCount = assignments.filter(a => 
            a.facultyId === member.id && a.facultyDepartment !== a.teachingDepartment
          ).length

          return (
            <div key={member.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.designation}</p>
                  <p className="text-sm text-blue-600">{member.department}</p>
                </div>
                <div className="text-right">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mb-1">
                    {assignmentCount} assignments
                  </div>
                  {crossDeptCount > 0 && (
                    <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                      {crossDeptCount} cross-dept
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Experience</p>
                  <p className="text-sm text-gray-600">{member.experience} years</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialization.map((spec, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Contact</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-sm text-gray-600">{member.phone}</p>
                </div>

                {/* Show current assignments */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Current Assignments</p>
                  {assignments.filter(a => a.facultyId === member.id).length === 0 ? (
                    <p className="text-sm text-gray-500">No current assignments</p>
                  ) : (
                    <div className="space-y-1">
                      {assignments.filter(a => a.facultyId === member.id).map((assignment) => (
                        <div key={assignment.id} className="text-xs">
                          <span className="font-medium">{assignment.subjectName}</span>
                          <span className="text-gray-500"> in </span>
                          <span className={`font-medium ${
                            assignment.facultyDepartment !== assignment.teachingDepartment
                              ? 'text-orange-600'
                              : 'text-green-600'
                          }`}>
                            {assignment.teachingDepartment}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Faculty Assignment Management</h2>
        <p className="text-gray-600">Manage cross-departmental faculty teaching assignments and expertise sharing</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'assignments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Assignments
        </button>
        <button
          onClick={() => setActiveTab('faculty')}
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === 'faculty'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          👨‍🏫 Faculty Profiles
        </button>
      </div>

      {/* Content */}
      {activeTab === 'assignments' && renderAssignments()}
      {activeTab === 'faculty' && renderFacultyProfiles()}

      {/* Add Assignment Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-black">Create New Faculty Assignment</h3>
            
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Faculty</label>
                <select
                  value={newAssignment.facultyId}
                  onChange={(e) => setNewAssignment({...newAssignment, facultyId: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value={0}>Choose Faculty Member</option>
                  {faculty.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newAssignment.subjectName}
                  onChange={(e) => setNewAssignment({...newAssignment, subjectName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., Business Analytics"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newAssignment.subjectCode}
                  onChange={(e) => setNewAssignment({...newAssignment, subjectCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., BA201"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Department</label>
                <select
                  value={newAssignment.teachingDepartment}
                  onChange={(e) => setNewAssignment({...newAssignment, teachingDepartment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={newAssignment.section}
                    onChange={(e) => setNewAssignment({...newAssignment, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input
                    type="number"
                    value={newAssignment.credits}
                    onChange={(e) => setNewAssignment({...newAssignment, credits: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    min="1"
                    max="6"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    value={newAssignment.semester}
                    onChange={(e) => setNewAssignment({...newAssignment, semester: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    {semesters.map((semester) => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={newAssignment.academicYear}
                    onChange={(e) => setNewAssignment({...newAssignment, academicYear: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="e.g., 2024-25"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Assignment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(false)
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
