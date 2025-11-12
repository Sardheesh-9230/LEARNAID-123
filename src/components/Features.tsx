export default function Features() {
  const features = [
    {
      title: "Admin Dashboard",
      description: "Comprehensive control center for institutional management, user creation, and course allocation.",
      icon: "�️",
      color: "from-red-500 to-red-600",
      userType: "Admin"
    },
    {
      title: "Faculty Portal",
      description: "Intuitive interface for course management, student interaction, and academic content delivery.",
      icon: "👩‍🏫",
      color: "from-purple-500 to-purple-600",
      userType: "Faculty"
    },
    {
      title: "Student Learning Hub",
      description: "Engaging platform for course access, assignment submission, and collaborative learning.",
      icon: "👨‍🎓",
      color: "from-blue-500 to-blue-600",
      userType: "Student"
    },
    {
      title: "Course Management System",
      description: "Robust tools for creating, organizing, and delivering educational content effectively.",
      icon: "📖",
      color: "from-green-500 to-green-600",
      userType: "All Users"
    },
    {
      title: "Real-time Analytics",
      description: "Live performance tracking, progress monitoring, and institutional insights dashboard.",
      icon: "📈",
      color: "from-orange-500 to-orange-600",
      userType: "Admin & Faculty"
    },
    {
      title: "Secure Authentication",
      description: "Role-based access control ensuring appropriate permissions for each user type.",
      icon: "�",
      color: "from-indigo-500 to-indigo-600",
      userType: "All Users"
    }
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Platform Architecture
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A hierarchical system designed with administrators at the core, empowering effective institutional management
          </p>
        </div>

        {/* Hierarchical Structure Visualization */}
        <div className="mb-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">Department-Based Platform Hierarchy</h3>
          <div className="flex flex-col items-center space-y-6">
            {/* Admin Level */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg max-w-md w-full text-center">
              <div className="text-3xl mb-2">👑</div>
              <h4 className="text-xl font-bold mb-2">ADMINISTRATOR</h4>
              <p className="text-sm opacity-90">Creates departments, manages all users, assigns resources</p>
            </div>
            
            {/* Arrow Down */}
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>

            {/* Department Level */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg max-w-lg w-full text-center">
              <div className="text-3xl mb-2">🏢</div>
              <h4 className="text-xl font-bold mb-2">DEPARTMENTS</h4>
              <p className="text-sm opacity-90">CS, Mechanical, Business, Electrical Engineering...</p>
            </div>

            {/* Arrows */}
            <div className="flex space-x-8">
              <svg className="w-8 h-8 text-gray-400 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <svg className="w-8 h-8 text-gray-400 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Faculty, Classes, and Staff Level */}
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full max-w-6xl">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg flex-1 text-center">
                <div className="text-2xl mb-2">👩‍🏫</div>
                <h4 className="text-lg font-bold mb-1">FACULTY</h4>
                <p className="text-xs opacity-90">Assigned to classes across departments</p>
              </div>
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl p-4 shadow-lg flex-1 text-center">
                <div className="text-2xl mb-2">🏫</div>
                <h4 className="text-lg font-bold mb-1">CLASSES</h4>
                <p className="text-xs opacity-90">Within each department</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg flex-1 text-center">
                <div className="text-2xl mb-2">�</div>
                <h4 className="text-lg font-bold mb-1">STAFF</h4>
                <p className="text-xs opacity-90">Department administrative support</p>
              </div>
            </div>

            {/* Arrow Down to Students */}
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>

            {/* Student Level */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg max-w-lg w-full text-center">
              <div className="text-3xl mb-2">👨‍🎓</div>
              <h4 className="text-xl font-bold mb-2">STUDENTS</h4>
              <p className="text-sm opacity-90">Enrolled in department classes for learning</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 group hover:transform hover:scale-105 transition-transform border border-gray-100">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${feature.color} text-white`}>
                  {feature.userType}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="bg-gradient-to-r from-red-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-red-700 hover:to-purple-700 transition-colors shadow-lg hover:shadow-xl">
            Explore Platform Demo
          </button>
        </div>
      </div>
    </section>
  )
}
