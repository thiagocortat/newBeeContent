'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Hotel, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface AutomationLog {
  id: string
  status: string
  message: string | null
  createdAt: string
  hotel: {
    id: string
    name: string
  }
  post: {
    id: string
    title: string
    slug: string
  } | null
}

export default function AutomationHistoryPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/automation/history')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Falha ao carregar histórico')
        }
        return res.json()
      })
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'pending':
        return <Loader className="w-4 h-4 text-yellow-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando histórico...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar histórico</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📜 Histórico da Automação IA</h1>
        <p className="text-gray-600">
          Acompanhe todas as execuções da automação de conteúdo por IA
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum histórico encontrado</h3>
              <p className="text-gray-600">
                Ainda não há registros de automação para exibir.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Hotel className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{log.hotel.name}</span>
                    </div>
                    
                    {log.message && (
                      <p className="text-gray-700 mb-3">{log.message}</p>
                    )}
                  </div>
                  
                  {log.post && (
                    <div className="ml-4">
                      <Link
                        href={`/blog/${log.post.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        Ver Post
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}