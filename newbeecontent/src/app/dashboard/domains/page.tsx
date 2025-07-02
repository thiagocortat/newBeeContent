'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Hotel {
  id: string
  name: string
  customDomain: string | null
}

export default function DomainsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    try {
      const response = await fetch('/api/hotels')
      if (response.ok) {
        const data = await response.json()
        setHotels(data)
      }
    } catch (error) {
      console.error('Erro ao carregar hotéis:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateDomain = async (hotelId: string, customDomain: string) => {
    setSaving(hotelId)
    try {
      const response = await fetch(`/api/hotels/${hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customDomain: customDomain || null }),
      })

      if (response.ok) {
        setHotels(hotels.map(hotel => 
          hotel.id === hotelId 
            ? { ...hotel, customDomain: customDomain || null }
            : hotel
        ))
        alert('Domínio atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar domínio')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar domínio')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando hotéis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Configuração de Domínios</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Voltar ao Dashboard
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Como configurar seu domínio próprio:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Configure o domínio abaixo (ex: blog.seuhotel.com.br)</li>
              <li>2. No seu provedor de DNS, crie um CNAME:</li>
              <li className="ml-4">• Subdomínio: <code className="bg-blue-100 px-1 rounded">blog</code></li>
              <li className="ml-4">• Tipo: <code className="bg-blue-100 px-1 rounded">CNAME</code></li>
              <li className="ml-4">• Valor: <code className="bg-blue-100 px-1 rounded">newbeecontent.vercel.app</code></li>
              <li>3. Aguarde até 24h para propagação do DNS</li>
            </ol>
          </div>

          <div className="space-y-4">
            {hotels.map((hotel) => (
              <div key={hotel.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    hotel.customDomain 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hotel.customDomain ? 'Configurado' : 'Sem domínio'}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="blog.seuhotel.com.br"
                    defaultValue={hotel.customDomain || ''}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement
                        updateDomain(hotel.id, target.value)
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      updateDomain(hotel.id, input.value)
                    }}
                    disabled={saving === hotel.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === hotel.id ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
                
                {hotel.customDomain && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">
                      🌐 Seu blog estará disponível em: 
                      <a 
                        href={`https://${hotel.customDomain}/blog`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        https://{hotel.customDomain}/blog
                      </a>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hotels.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum hotel encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}