'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MCQGeneratorV3 from '@/components/MCQGeneratorV3'

export default function MCQGeneratorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('authToken')
    const userRole = localStorage.getItem('userRole')

    if (!authToken || (userRole !== 'Faculty' && userRole !== 'Admin')) {
      router.push('/login')
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return <MCQGeneratorV3 />
}
