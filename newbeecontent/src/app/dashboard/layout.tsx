'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [canAccessAutomation, setCanAccessAutomation] = useState(false)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get('/api/me')
        const userData = response.data
        setUser(userData)
        
        const hasAutomationAccess = userData.role === 'superadmin' || userData.role === 'admin' || userData.role === 'editor'
        setCanAccessAutomation(hasAutomationAccess)
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside className="w-72 sidebar-themed border-r shadow-sm flex flex-col">
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>BeeContent</h1>
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Gestão inteligente de conteúdo</p>
          </div>
          
          {/* Theme Toggle */}
          <div className="mb-8">
            <ThemeToggle />
          </div>

          <nav className="space-y-2">
            {/* Seção Posts */}
            <div className="space-y-1">
              <Link 
                href="/dashboard" 
                className="flex items-center px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                style={{ color: 'var(--foreground)' }}
              >
                <svg className="w-5 h-5 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">📝 Meus Posts</span>
              </Link>
              
              <Link 
                href="/dashboard/new-post" 
                className="flex items-center pl-8 pr-4 py-2 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                style={{ color: 'var(--foreground)' }}
              >
                <svg className="w-4 h-4 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm">Criar Novo Post</span>
              </Link>
            </div>
            
            {/* Seção Automação IA */}
            {canAccessAutomation && (
              <div className="space-y-1 pt-2">
                <Link 
                  href="/dashboard/automation" 
                  className="flex items-center px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg className="w-5 h-5 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">🤖 Painel Automação</span>
                </Link>
                
                <Link 
                  href="/dashboard/settings/automation" 
                  className="flex items-center pl-8 pr-4 py-2 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg className="w-4 h-4 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Configurações IA</span>
                </Link>
                
                <Link 
                  href="/dashboard/automation/history" 
                  className="flex items-center pl-8 pr-4 py-2 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg className="w-4 h-4 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">Histórico da IA</span>
                </Link>
                
                <Link 
                  href="/dashboard/test-automation" 
                  className="flex items-center pl-8 pr-4 py-2 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg className="w-4 h-4 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Testar Automação</span>
                </Link>
              </div>
            )}
            
            {/* Separador */}
            <div className="border-t pt-4 mt-4 border-opacity-20" style={{ borderColor: 'var(--sidebar-border)' }}>
              
              {/* Seção Gestão */}
              <div className="space-y-1">
                <Link 
                  href="/dashboard/redes" 
                  className="flex items-center px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg className="w-5 h-5 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">🏢 Redes</span>
                </Link>
                
                {(user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'editor' || user?.role === 'viewer') && (
                  <Link 
                    href="/dashboard/analytics" 
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <svg className="w-5 h-5 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">📊 Analytics</span>
                  </Link>
                )}
                
                <Link 
                  href="/all-posts" 
                  className="flex items-center px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg className="w-5 h-5 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  <span className="font-medium">🌐 Posts Públicos</span>
                </Link>
              </div>
              
              {/* Seção Administração */}
              {user?.role === 'superadmin' && (
                <div className="space-y-1 pt-4">
                  <div className="px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Administração</span>
                  </div>
                  
                  <Link 
                    href="/admin" 
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <svg className="w-5 h-5 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">🔧 Painel Admin</span>
                  </Link>
                  
                  <Link 
                      href="/dashboard/users" 
                      className="flex items-center pl-8 pr-4 py-2 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <svg className="w-4 h-4 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span className="text-sm">Usuários</span>
                    </Link>
                    
                    <Link 
                      href="/dashboard/domains" 
                      className="flex items-center pl-8 pr-4 py-2 rounded-xl hover:bg-opacity-10 hover:bg-blue-500 hover:text-blue-600 transition-all duration-150 group"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <svg className="w-4 h-4 mr-3 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <span className="text-sm">Domínios</span>
                    </Link>
                </div>
              )}
            </div>
           </nav>
           
        </div>
        
        {/* Botão Logout */}
        {user && (
          <div className="px-8 py-4 border-t border-opacity-20" style={{ borderColor: 'var(--sidebar-border)' }}>
            <button 
              onClick={() => {
                fetch('/api/logout', { method: 'POST' })
                  .then(() => window.location.href = '/login')
                  .catch(console.error)
              }}
              className="flex items-center w-full px-4 py-3 rounded-xl hover:bg-opacity-10 hover:bg-red-500 hover:text-red-600 transition-all duration-150 group"
              style={{ color: 'var(--foreground)' }}
            >
              <svg className="w-5 h-5 mr-3 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">🚪 Sair</span>
            </button>
          </div>
        )}
        
        {/* Footer da Sidebar */}
        <div className="px-8 py-4 border-t sidebar-themed" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--foreground)', opacity: 0.8 }}>BeeContent Dashboard</p>
            <p style={{ color: 'var(--foreground)', opacity: 0.6 }}>Powered by AI • v1.0</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto card-themed">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}