'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'

export default function BackToDashboardButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        await axios.get('/api/me')
        setIsLoggedIn(true)
      } catch {
        setIsLoggedIn(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading || !isLoggedIn) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Link 
        href="/dashboard"
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg transition-colors duration-200"
      >
        <svg 
          className="w-4 h-4 mr-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
        Voltar ao Dashboard
      </Link>
    </div>
  )
}