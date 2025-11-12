
import React from 'react'

export default function DepartmentStructure() {
  const departments = [
    {
      name: "Computer Science",
      icon: "💻",
      color: "from-blue-500 to-blue-600",
      classes: [
        { name: "1st Year - Section A", students: 30 },
        { name: "1st Year - Section B", students: 28 },
        { name: "2nd Year - Section A", students: 32 },
        { name: "3rd Year - Section A", students: 30 }
      ],
      subjects: [
        { name: "Programming Fundamentals", code: "CS101", faculty: "Dr. Smith" },
        { name: "Data Structures", code: "CS201", faculty: "Prof. Johnson" },
        { name: "Algorithms", code: "CS301", faculty: "Dr. Brown" },
        { name: "Database Systems", code: "CS202", faculty: "Prof. Davis" }
      ],
      totalStudents: 120,
      faculty: 8,
      staff: 3
    },
    {
      name: "Mechanical Engineering",
      icon: "⚙️",
      color: "from-gray-500 to-gray-600",
      classes: [
        { name: "1st Year - Section A", students: 25 },
        { name: "1st Year - Section B", students: 23 },
        { name: "2nd Year - Section A", students: 24 },
        { name: "3rd Year - Section A", students: 23 }
      ],
      subjects: [
        { name: "Engineering Mechanics", code: "ME101", faculty: "Dr. Wilson" },
        { name: "Thermodynamics", code: "ME201", faculty: "Prof. Miller" },
        { name: "Machine Design", code: "ME301", faculty: "Dr. Taylor" },
        { name: "Fluid Mechanics", code: "ME202", faculty: "Prof. Anderson" }
      ],
      totalStudents: 95,
      faculty: 6,
      staff: 2
    },
    {
      name: "Business Administration",
      icon: "📊",
      color: "from-green-500 to-green-600",
      classes: [
        { name: "1st Year - Section A", students: 40 },
        { name: "1st Year - Section B", students: 38 },
        { name: "2nd Year - Section A", students: 36 },
        { name: "2nd Year - Section B", students: 36 }
      ],
      subjects: [
        { name: "Business Fundamentals", code: "BA101", faculty: "Prof. Garcia" },
        { name: "Marketing Management", code: "BA201", faculty: "Dr. Martinez" },
        { name: "Strategic Management", code: "BA301", faculty: "Prof. Rodriguez" },
        { name: "Financial Accounting", code: "BA102", faculty: "Dr. Lopez" }
      ],
      totalStudents: 150,
      faculty: 10,
      staff: 4
    },
    {
      name: "Electrical Engineering",
      icon: "⚡",
      color: "from-yellow-500 to-yellow-600",
      classes: [
        { name: "1st Year - Section A", students: 22 },
        { name: "1st Year - Section B", students: 21 },
        { name: "2nd Year - Section A", students: 21 },
        { name: "3rd Year - Section A", students: 21 }
      ],
      subjects: [
        { name: "Circuit Analysis", code: "EE101", faculty: "Dr. White" },
        { name: "Electronics", code: "EE201", faculty: "Prof. Clark" },
        { name: "Power Systems", code: "EE301", faculty: "Dr. Lewis" },
        { name: "Control Systems", code: "EE302", faculty: "Prof. Walker" }
      ],
      totalStudents: 85,
      faculty: 7,
      staff: 2
    }
  ]

  return (
    <section id="departments" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Department Structure
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive departmental organization with classes, students, faculty, and staff management
          </p>
        </div>

        {/* Department Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {departments.map((dept, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
              <div className={`w-16 h-16 bg-gradient-to-r ${dept.color} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                <span className="text-2xl">{dept.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
                {dept.name}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Students:</span>
                  <span className="font-semibold text-blue-600">{dept.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Faculty:</span>
                  <span className="font-semibold text-purple-600">{dept.faculty}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Staff:</span>
                  <span className="font-semibold text-green-600">{dept.staff}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-2">Class Sections:</h4>
                <ul className="space-y-1">
                  {dept.classes.map((classItem, classIndex) => (
                    <li key={classIndex} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded flex justify-between">
                      <span>{classItem.name}</span>
                      <span className="text-blue-600 font-medium">{classItem.students} students</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-2">Subjects:</h4>
                <ul className="space-y-1">
                  {dept.subjects.map((subject, subjectIndex) => (
                    <li key={subjectIndex} className="text-xs text-gray-600 bg-green-50 px-2 py-1 rounded">
                      <div className="font-medium text-green-800">{subject.code} - {subject.name}</div>
                      <div className="text-purple-600 mt-1">Faculty: {subject.faculty}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Management Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Administrative Management Controls
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Student Management */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-3">Student Assignment</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Assign students to departments</li>
                <li>✓ Enroll in specific classes</li>
                <li>✓ Transfer between departments</li>
                <li>✓ Track academic progress</li>
              </ul>
            </div>

            {/* Faculty Management */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H8a2 2 0 00-2-2V6m8 0H8m0 0v-.5A1.5 1.5 0 009.5 4h5A1.5 1.5 0 0116 5.5V6m-8 0h8" />
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-3">Faculty Assignment</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Assign to multiple classes</li>
                <li>✓ Cross-department teaching</li>
                <li>✓ Manage teaching loads</li>
                <li>✓ Schedule coordination</li>
              </ul>
            </div>

            {/* Staff Management */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="font-bold text-lg mb-3">Staff Assignment</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Assign to departments</li>
                <li>✓ Administrative roles</li>
                <li>✓ Support functions</li>
                <li>✓ Resource management</li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-8">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-lg">
              Manage Departments
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
