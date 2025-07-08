'use client'

import { useState } from 'react'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.message || 'Erro ao popular banco')
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
            🌱 Seed do Banco de Dados
          </h1>
          
          <p className="text-gray-600 mb-6 text-center">
            Clique no botão abaixo para popular o banco de dados com dados iniciais.
          </p>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Populando...' : 'Popular Banco de Dados'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">
                ❌ {error}
              </p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium mb-2">
                ✅ {result.message}
              </p>
              
              {result.data && (
                <div className="text-sm text-green-700">
                  <p><strong>Admin:</strong> {result.data.admin?.email}</p>
                  <p><strong>Rede:</strong> {result.data.rede?.name}</p>
                  <p><strong>Hotel:</strong> {result.data.hotel?.name}</p>
                  
                  {result.data.credentials && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="font-medium text-blue-800">Credenciais de Login:</p>
                      <p className="text-blue-700">Email: {result.data.credentials.email}</p>
                      <p className="text-blue-700">Senha: {result.data.credentials.password}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              ← Voltar para o início
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}