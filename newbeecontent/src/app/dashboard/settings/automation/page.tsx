'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Bot, Settings, Save } from 'lucide-react'

interface AutomationSettings {
  autoGeneratePosts: boolean
  postFrequency: string
  maxMonthlyPosts: number
  themePreferences: string
}

interface UserData {
  role: string
  hotelId?: string
  redeId?: string
}

export default function AutomationPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<AutomationSettings>({
    autoGeneratePosts: false,
    postFrequency: 'weekly',
    maxMonthlyPosts: 8,
    themePreferences: ''
  })
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserData()
    fetchSettings()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/automation')
      if (response.status === 401) {
        router.push('/login')
        return
      }
      if (response.status === 403) {
        setError('Você não tem permissão para acessar esta página')
        setLoading(false)
        return
      }
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        setError('Erro ao carregar configurações')
      }
    } catch (err) {
      setError('Erro ao carregar configurações')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    
    try {
      const response = await fetch('/api/settings/automation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        // Sucesso - poderia mostrar uma notificação
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao salvar configurações')
      }
    } catch (err) {
      setError('Erro ao salvar configurações')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Verificar se o usuário tem acesso de leitura apenas
  const isReadOnly = user?.role === 'viewer' || 
    (user?.role === 'editor' && user?.hotelId !== user?.hotelId)

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !settings.autoGeneratePosts && settings.postFrequency === 'weekly') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Automação IA
          </h1>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Automação IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure a geração automática de posts para seu hotel
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Automação
          </CardTitle>
          <CardDescription>
            Defina como a IA deve gerar posts automaticamente para seu hotel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar/Desativar Automação */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Geração Automática</label>
              <p className="text-sm text-muted-foreground">
                Ativar a criação automática de posts pela IA
              </p>
            </div>
            <Switch
              checked={settings.autoGeneratePosts}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoGeneratePosts: checked }))
              }
              disabled={isReadOnly}
            />
          </div>

          {/* Frequência de Posts */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Frequência de Publicação</label>
            <select
              value={settings.postFrequency}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, postFrequency: e.target.value }))
              }
              disabled={isReadOnly || !settings.autoGeneratePosts}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quinzenal</option>
            </select>
          </div>

          {/* Máximo de Posts por Mês */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Máximo de Posts por Mês</label>
            <Input
              type="number"
              min="1"
              max="30"
              value={settings.maxMonthlyPosts}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, maxMonthlyPosts: parseInt(e.target.value) || 8 }))
              }
              disabled={isReadOnly || !settings.autoGeneratePosts}
            />
          </div>

          {/* Preferências de Tema */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Temas Preferenciais</label>
            <Textarea
              placeholder="Ex: gastronomia local, eventos sazonais, atividades de lazer..."
              value={settings.themePreferences}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, themePreferences: e.target.value }))
              }
              disabled={isReadOnly || !settings.autoGeneratePosts}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              Descreva os temas que a IA deve priorizar ao gerar posts
            </p>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saving || isReadOnly}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 mt-2">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona a Automação IA?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">🤖 Geração Inteligente</h4>
              <p className="text-sm text-muted-foreground">
                A IA analisa as características do seu hotel e gera posts relevantes automaticamente.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">📅 Agendamento Automático</h4>
              <p className="text-sm text-muted-foreground">
                Posts são criados e agendados conforme a frequência configurada.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🎯 Conteúdo Personalizado</h4>
              <p className="text-sm text-muted-foreground">
                Baseado nas preferências de tema e características do hotel.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🔍 Controle de Qualidade</h4>
              <p className="text-sm text-muted-foreground">
                Você pode revisar e editar todos os posts antes da publicação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}