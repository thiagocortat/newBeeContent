import Link from 'next/link'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex font-sans bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-100 border-r border-gray-200 shadow-sm">
        <div className="p-8">
          <div className="mb-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">BeeContent</h1>
            <p className="text-sm text-gray-600">Gestão inteligente de conteúdo</p>
          </div>

          <nav className="space-y-4">
            <Link 
              href="/dashboard" 
              className="flex items-center px-4 py-3 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all duration-150 group"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Meus Posts</span>
            </Link>
            
            <Link 
              href="/dashboard/new-post" 
              className="flex items-center px-4 py-3 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all duration-150 group"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Criar Novo Post</span>
            </Link>
            
            <Link 
              href="/dashboard/settings" 
              className="flex items-center px-4 py-3 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all duration-150 group"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Automação IA</span>
            </Link>
            
            <Link 
              href="/all-posts" 
              className="flex items-center px-4 py-3 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all duration-150 group"
            >
              <svg className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              <span className="font-medium">Posts Públicos</span>
            </Link>
          </nav>
        </div>

        {/* Footer da Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 w-72 p-8 border-t border-gray-200 bg-gray-100">
          <div className="text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">BeeContent Dashboard</p>
            <p>Powered by AI • v1.0</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto bg-white">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}