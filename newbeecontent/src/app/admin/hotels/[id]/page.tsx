'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Post {
  id: string
  title: string
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
}

interface Hotel {
  id: string
  name: string
  city: string
  state: string
  country: string
  travelType: string
  audience: string
  season: string
  events: string
  customDomain?: string
  autoGeneratePosts: boolean
  owner: {
    id: string
    email: string
    role: string
  }
  posts: Post[]
  _count: {
    posts: number
  }
  createdAt: string
}

export default function AdminHotelDetailPage() {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const hotelId = params.id as string

  useEffect(() => {
    if (hotelId) {
      fetchHotel()
    }
  }, [hotelId])

  const fetchHotel = async () => {
    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 404) {
          setError('Hotel não encontrado')
          return
        }
        throw new Error('Erro ao carregar hotel')
      }
      const data = await response.json()
      setHotel(data)
    } catch (err) {
      setError('Erro ao carregar hotel')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAutomation = async () => {
    if (!hotel) return

    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoGeneratePosts: !hotel.autoGeneratePosts
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao alterar automação')
      }

      setHotel({ ...hotel, autoGeneratePosts: !hotel.autoGeneratePosts })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      alert(errorMessage)
      console.error(err)
    }
  }

  const deleteHotel = async () => {
    if (!hotel) return

    if (!confirm(`Tem certeza que deseja deletar o hotel "${hotel.name}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/hotels/${hotelId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar hotel')
      }

      alert('Hotel deletado com sucesso!')
      router.push('/admin')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      alert(errorMessage)
      console.error(err)
    }
  }

  const getStatusBadge = (post: Post) => {
    if (post.publishedAt) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Publicado</span>
    }
    if (post.scheduledAt && new Date(post.scheduledAt) > new Date()) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Agendado</span>
    }
    if (post.scheduledAt && new Date(post.scheduledAt) <= new Date()) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Publicado</span>
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Rascunho</span>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando detalhes do hotel...</p>
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Hotel não encontrado'}</p>
          <Link 
            href="/admin"
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            ← Voltar ao painel admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Painel Admin
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Detalhes do Hotel</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
          <p className="text-gray-600 mt-1">{hotel.city}, {hotel.state}, {hotel.country}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleAutomation}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hotel.autoGeneratePosts
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {hotel.autoGeneratePosts ? '✅ Automação Ativa' : '❌ Automação Inativa'}
          </button>
          <Link
            href={`/dashboard/settings?hotelId=${hotel.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ⚙️ Configurar
          </Link>
          <button
            onClick={deleteHotel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Deletar Hotel
          </button>
        </div>
      </div>

      {/* Hotel Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600">{hotel._count.posts}</div>
          <div className="text-sm text-gray-600">Total de Posts</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-green-600">
            {hotel.posts.filter(p => p.publishedAt || (p.scheduledAt && new Date(p.scheduledAt) <= new Date())).length}
          </div>
          <div className="text-sm text-gray-600">Posts Publicados</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-blue-600">
            {hotel.posts.filter(p => p.scheduledAt && new Date(p.scheduledAt) > new Date()).length}
          </div>
          <div className="text-sm text-gray-600">Posts Agendados</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-2xl font-bold text-gray-600">
            {hotel.posts.filter(p => !p.publishedAt && !p.scheduledAt).length}
          </div>
          <div className="text-sm text-gray-600">Rascunhos</div>
        </div>
      </div>

      {/* Hotel Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Informações do Hotel</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Nome:</span>
              <p className="text-gray-900">{hotel.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Localização:</span>
              <p className="text-gray-900">{hotel.city}, {hotel.state}, {hotel.country}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Tipo de Viagem:</span>
              <p className="text-gray-900">{hotel.travelType}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Público-alvo:</span>
              <p className="text-gray-900">{hotel.audience}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Temporada:</span>
              <p className="text-gray-900">{hotel.season}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Eventos:</span>
              <p className="text-gray-900">{hotel.events}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Criado em:</span>
              <p className="text-gray-900">{formatDate(hotel.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 Proprietário & Configurações</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{hotel.owner.email}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Role:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                hotel.owner.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {hotel.owner.role}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Domínio Personalizado:</span>
              {hotel.customDomain ? (
                <div>
                  <a 
                    href={`https://${hotel.customDomain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {hotel.customDomain}
                  </a>
                </div>
              ) : (
                <p className="text-gray-400">Não configurado</p>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Automação de Posts:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                hotel.autoGeneratePosts 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {hotel.autoGeneratePosts ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">📝 Posts do Hotel</h2>
        </div>

        {hotel.posts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum post encontrado</h3>
            <p className="text-gray-600">Este hotel ainda não possui posts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publicado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agendado para
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hotel.posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {post.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(post)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(post.scheduledAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        ✏️ Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}