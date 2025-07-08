'use client'

import { useState } from 'react'

export default function InitPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const initializeDatabase = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/init-production')
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Inicializar Banco de Produção
          </h1>
          
          <div className="space-y-4">
            <button
              onClick={initializeDatabase}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inicializando...' : 'Inicializar Banco'}
            </button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      {result.success ? 'Sucesso!' : 'Informação'}
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{result.message}</p>
                      
                      {result.credentials && (
                        <div className="mt-4">
                          <h4 className="font-medium">Credenciais de acesso:</h4>
                          <ul className="mt-2 space-y-1">
                            {result.credentials.map((cred: string, index: number) => (
                              <li key={index} className="font-mono text-xs bg-gray-100 p-2 rounded">
                                {cred}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {result.users && (
                        <div className="mt-4">
                          <h4 className="font-medium">Usuários criados:</h4>
                          <ul className="mt-2 space-y-1">
                            {result.users.map((user: any, index: number) => (
                              <li key={index} className="text-xs">
                                {user.email} ({user.role})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <a 
              href="/login" 
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Ir para Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}