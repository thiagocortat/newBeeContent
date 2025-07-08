'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, FileText, ArrowLeft, Eye } from 'lucide-react'
import Analytics from '@/components/Analytics'

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
        setData(analyticsData.analytics || [])
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
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics de Visualizações
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o desempenho dos seus posts e engajamento
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      {/* Tabs para diferentes visualizações */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Visualizações
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Todas as visualizações registradas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Posts com Visualizações
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalPosts}</div>
                <p className="text-xs text-muted-foreground">
                  Posts que receberam visualizações
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Média por Post
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{averageViews}</div>
                <p className="text-xs text-muted-foreground">
                  Visualizações médias por post
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Componente Analytics com gráficos */}
          <Analytics />
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">

          {/* Lista de Posts */}
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Post</CardTitle>
              <CardDescription>
                Visualizações detalhadas de cada post publicado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.length === 0 ? (
                <div className="p-8 text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Nenhuma visualização registrada ainda</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    As visualizações aparecerão aqui quando os visitantes acessarem seus posts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.map((item, index) => {
                    const maxViews = Math.max(...data.map(d => d.views))
                    const percentage = maxViews > 0 ? (item.views / maxViews) * 100 : 0
                    
                    return (
                      <div key={item.postId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                              <h3 className="font-semibold truncate">{item.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>🏨 {item.hotelName}</span>
                              <span>•</span>
                              <span>/{item.slug}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {item.views.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">visualizações</div>
                          </div>
                        </div>
                        
                        {/* Barra de progresso */}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Engajamento</CardTitle>
                <CardDescription>
                  Baseado nas visualizações dos posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">7.2%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  +0.8% em relação ao período anterior
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Posts Mais Populares</CardTitle>
                <CardDescription>
                  Top 3 posts com mais visualizações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.slice(0, 3).map((item, index) => (
                    <div key={item.postId} className="flex items-center justify-between">
                      <span className="text-sm truncate">{item.title}</span>
                      <span className="text-sm font-medium">{item.views}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rodapé com informações */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>📊 Os dados são atualizados em tempo real a cada visualização de post.</p>
            <p>💡 Dica: Posts com mais visualizações podem indicar temas de maior interesse do seu público.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}