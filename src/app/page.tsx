import Header from '@/components/Header'
import Hero from '@/components/Hero'
import About from '@/components/About'
import AdminFeatures from '@/components/AdminFeatures'
import DepartmentStructure from '@/components/DepartmentStructure'
import Features from '@/components/Features'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <Hero />
      <About />
      <AdminFeatures />
      <DepartmentStructure />
      <Features />
      <Footer />
    </main>
  )
}
