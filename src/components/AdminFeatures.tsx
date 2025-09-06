export default function AdminFeatures() {
  const adminFeatures = [
    {
      title: "Department Management",
      description: "Create and manage college departments with complete organizational structure control",
      icon: "🏢",
      capabilities: [
        "Create new departments",
        "Define department hierarchy",
        "Set department objectives",
        "Manage department resources"
      ],
      color: "from-indigo-500 to-indigo-600"
    },
    {
      title: "Class Section Management",
      description: "Organize and manage class sections (A, B, C) within each department",
      icon: "🏫",
      capabilities: [
        "Create class sections (1A, 1B, 2A, etc.)",
        "Set class schedules and capacity",
        "Manage section assignments",
        "Track section performance"
      ],
      color: "from-cyan-500 to-cyan-600"
    },
    {
      title: "Subject Management",
      description: "Create and manage subjects within departments with detailed curriculum",
      icon: "📖",
      capabilities: [
        "Create subjects for each department",
        "Assign subject codes and descriptions",
        "Link subjects to class sections",
        "Manage subject prerequisites"
      ],
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "User Management",
      description: "Add, edit, and manage student and faculty accounts with department assignments",
      icon: "👥",
      capabilities: [
        "Add students to departments/classes",
        "Assign staff to departments",
        "Bulk user import/export",
        "User role and department assignment"
      ],
      color: "from-red-500 to-red-600"
    },
    {
      title: "Faculty-Subject Assignment",
      description: "Assign faculty members to teach specific subjects across different class sections",
      icon: "👩‍🏫",
      capabilities: [
        "Assign subjects to faculty",
        "Multi-section teaching allocation", 
        "Cross-department subject assignment",
        "Teaching workload optimization"
      ],
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "System Analytics",
      description: "Monitor department performance and generate comprehensive institutional reports",
      icon: "📊",
      capabilities: [
        "Department-wise analytics",
        "Class performance tracking",
        "Faculty workload reports",
        "Student progress by department"
      ],
      color: "from-green-500 to-green-600"
    }
  ]

  return (
    <section id="admin" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Admin Control Center
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive administrative tools to manage your educational institution efficiently
          </p>
          <div className="mt-6 inline-flex items-center px-6 py-3 bg-red-100 text-red-800 rounded-full font-semibold">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Core Platform Administrator
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {adminFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow p-8 border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.capabilities.map((capability, capIndex) => (
                      <li key={capIndex} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Workflow Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Department-Based Admin Workflow
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Create Departments</h4>
              <p className="text-gray-600 text-sm">Establish college departments with organizational structure</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Setup Classes</h4>
              <p className="text-gray-600 text-sm">Create classes within departments with schedules and capacity</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Add Users</h4>
              <p className="text-gray-600 text-sm">Add students to departments/classes and assign staff to departments</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">4</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Assign Faculty</h4>
              <p className="text-gray-600 text-sm">Assign faculty to teach different classes across departments</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">5</span>
              </div>
              <h4 className="font-bold text-lg mb-2">Monitor Progress</h4>
              <p className="text-gray-600 text-sm">Track department performance and generate comprehensive reports</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button className="bg-gradient-to-r from-red-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-red-700 hover:to-purple-700 transition-colors shadow-lg hover:shadow-xl">
            Start Administrative Setup
          </button>
        </div>
      </div>
    </section>
  )
}
