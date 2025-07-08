'use client'

import { useEffect, useState } from 'react'
import axios from '../../../lib/axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Hotel {
  id: string
  name: string
  slug: string
  city: string
  state: string
  autoGeneratePosts: boolean
  nextScheduledAt: string | null
  nextSuggestedTitle: string | null
  rede: {
    id: string
    name: string
    slug: string
  }
}

export default function AutomationDashboard() {
  const router = useRouter()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get token from localStorage or cookies
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    } else {
      router.push('/login')
    }
  }, [])

  useEffect(() => {
    if (token) {
      loadHotels()
    }
  }, [token])

  async function loadHotels() {
    try {
      setLoading(true)
      const response = await axios.get('/api/hotels?listAll=true')
      setHotels(response.data)
    } catch (err: any) {
      setError('Erro ao carregar hotéis')
      console.error(err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleAutomation(hotelId: string, currentStatus: boolean) {
    try {
      await axios.put('/api/automation/toggle', {
        hotelId,
        status: !currentStatus
      })
      
      // Atualizar o estado local
      setHotels(prev => 
        prev.map(hotel => 
          hotel.id === hotelId 
            ? { ...hotel, autoGeneratePosts: !currentStatus }
            : hotel
        )
      )
    } catch (err: any) {
      console.error('Erro ao alterar automação:', err)
      setError('Erro ao alterar automação')
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push('/login')
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🤖 Automação IA por Hotel</h1>
        <Link 
          href="/dashboard" 
          className="text-blue-600 hover:underline"
        >
          ← Voltar ao Dashboard
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum hotel encontrado.</p>
          <Link 
            href="/dashboard/hotels/new" 
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Criar primeiro hotel
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rede
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hotel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próximo título sugerido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próxima execução
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hotel.rede.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                      <div className="text-sm text-gray-500">{hotel.city}, {hotel.state}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hotel.autoGeneratePosts 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {hotel.autoGeneratePosts ? '✅ Ativo' : '❌ Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hotel.nextSuggestedTitle || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hotel.nextScheduledAt 
                      ? new Date(hotel.nextScheduledAt).toLocaleString('pt-BR')
                      : '—'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleAutomation(hotel.id, hotel.autoGeneratePosts)}
                      className={`${
                        hotel.autoGeneratePosts
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      } hover:underline`}
                    >
                      {hotel.autoGeneratePosts ? 'Desligar' : 'Ligar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}