'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalyticsData {
  postId: string
  title: string
  slug: string
  hotelName: string
  views: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics')
        if (response.status === 401) {
          router.push('/login')
          return
        }
        
        if (!response.ok) {
          throw new Error('Erro ao carregar analytics')
        }
        
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        setError('Erro ao carregar dados de analytics')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const totalViews = data.reduce((sum, item) => sum + item.views, 0)
  const totalPosts = data.length
  const averageViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics de Visualizações</h1>
          <p className="text-gray-600 mt-2">Acompanhe o desempenho dos seus posts</p>
        </div>
        <Link 
          href="/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Voltar ao Dashboard
        </Link>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total de Visualizações</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-green-600">{totalPosts}</div>
          <div className="text-sm text-gray-600">Posts com Visualizações</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600">{averageViews}</div>
          <div className="text-sm text-gray-600">Média por Post</div>
        </div>
      </div>

      {/* Lista de Posts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Desempenho por Post</h2>
        </div>
        
        {data.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <p className="text-gray-500 text-lg">Nenhuma visualização registrada ainda.</p>
            <p className="text-gray-400 text-sm mt-2">
              As visualizações aparecerão aqui quando os visitantes acessarem seus posts.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.map((item, index) => {
              const maxViews = Math.max(...data.map(d => d.views))
              const percentage = maxViews > 0 ? (item.views / maxViews) * 100 : 0
              
              return (
                <div key={item.postId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>🏨 {item.hotelName}</span>
                        <span>•</span>
                        <span>/{item.slug}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {item.views.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">visualizações</div>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rodapé com informações */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>📊 Os dados são atualizados em tempo real a cada visualização de post.</p>
        <p className="mt-1">💡 Dica: Posts com mais visualizações podem indicar temas de maior interesse do seu público.</p>
      </div>
    </div>
  )
}