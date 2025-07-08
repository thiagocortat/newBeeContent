'use client'

import { useState } from 'react'
import axios from '@/lib/axios'

interface CronResult {
  hotelId: string
  status: 'success' | 'error' | 'skipped'
  title?: string
  reason?: string
  error?: string
}

interface CronResponse {
  status: string
  processed: number
  results: CronResult[]
}

export default function TestAutomation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CronResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runAutomation() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.get('/api/cron')
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao executar automação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Teste de Automação</h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Use esta página para testar a funcionalidade de automação de posts. 
            Clique no botão abaixo para executar o processo de geração automática manualmente.
          </p>
          
          <button
            onClick={runAutomation}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Executando...' : 'Executar Automação'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">❌ Erro</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Resultado</h3>
              <p className="text-green-700">
                Status: {result.status} | Hotéis processados: {result.processed}
              </p>
            </div>

            {result.results.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Detalhes por Hotel</h3>
                <div className="space-y-3">
                  {result.results.map((item, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Hotel ID: {item.hotelId}</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          item.status === 'success' ? 'bg-green-100 text-green-800' :
                          item.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'success' ? 'Sucesso' :
                           item.status === 'error' ? 'Erro' : 'Ignorado'}
                        </span>
                      </div>
                      
                      {item.title && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Título:</strong> {item.title}
                        </p>
                      )}
                      
                      {item.reason && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Motivo:</strong> {item.reason}
                        </p>
                      )}
                      
                      {item.error && (
                        <p className="text-sm text-red-600">
                          <strong>Erro:</strong> {item.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Informações Importantes</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• A automação só funciona para hotéis com <code>autoGeneratePosts = true</code></li>
            <li>• A frequência de posts é respeitada (diária, semanal, quinzenal)</li>
            <li>• Posts são criados com <code>publishedAt</code> para o dia seguinte</li>
            <li>• Para ver os posts imediatamente, altere o código para publicar hoje</li>
            <li>• Em produção, configure um cron job no Vercel para executar automaticamente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}