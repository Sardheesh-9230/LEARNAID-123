export default function Hero() {
  return (
    <section id="home" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="hero-gradient text-white rounded-3xl p-12 shadow-2xl">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-yellow-300">LearnAIA</span>
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Admin-Centric Educational Management Platform
          </p>
          <p className="text-lg mb-10 text-blue-50 max-w-3xl mx-auto">
            Empowering administrators with comprehensive control to add students and faculty, 
            create dynamic courses, and strategically allocate educational resources for 
            optimal institutional performance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl">
              Get Started Today
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
