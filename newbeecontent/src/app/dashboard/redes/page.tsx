'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Building2, Globe } from 'lucide-react'

interface Rede {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string
  _count: {
    hotels: number
  }
}

interface Hotel {
  id: string
  name: string
  slug: string
  city: string
  state: string
  redeId: string
  rede: {
    name: string
    slug: string
  }
}

export default function RedesPage() {
  const [redes, setRedes] = useState<Rede[]>([])
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRede, setNewRede] = useState({ name: '', slug: '' })
  const [selectedRede, setSelectedRede] = useState<string | null>(null)
  const [showAddHotelForm, setShowAddHotelForm] = useState<string | null>(null)
  const [newHotel, setNewHotel] = useState({
    name: '',
    city: '',
    state: '',
    country: 'Brasil',
    travelType: '',
    audience: '',
    season: '',
    events: '',
    customDomain: ''
  })
  const [deletingRede, setDeletingRede] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    fetchData()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    }
  }

  const fetchData = async () => {
    try {
      const [redesResponse, hotelsResponse] = await Promise.all([
        fetch('/api/redes'),
        fetch('/api/my-posts')
      ])
      
      if (redesResponse.ok) {
        const redesData = await redesResponse.json()
        setRedes(redesData)
      }
      
      if (hotelsResponse.ok) {
        const hotelsData = await hotelsResponse.json()
        setHotels(hotelsData.hotels || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRede = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/redes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRede)
      })
      
      if (response.ok) {
        setNewRede({ name: '', slug: '' })
        setShowCreateForm(false)
        fetchData()
      }
    } catch (error) {
      console.error('Erro ao criar rede:', error)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setNewRede({
      name,
      slug: generateSlug(name)
    })
  }

  const getHotelsByRede = (redeId: string) => {
    return hotels.filter(hotel => hotel.redeId === redeId)
  }

  const createHotel = async (e: React.FormEvent, redeId: string) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newHotel, redeId })
      })
      
      if (response.ok) {
        setNewHotel({
          name: '',
          city: '',
          state: '',
          country: 'Brasil',
          travelType: '',
          audience: '',
          season: '',
          events: '',
          customDomain: ''
        })
        setShowAddHotelForm(null)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar hotel')
      }
    } catch (error) {
      console.error('Erro ao criar hotel:', error)
      alert('Erro ao criar hotel')
    }
  }

  const deleteRede = async (redeId: string, redeName: string, hotelCount: number) => {
    const confirmMessage = hotelCount > 0 
      ? `Tem certeza que deseja deletar a rede "${redeName}"?\n\nEsta ação irá deletar permanentemente:\n• A rede\n• ${hotelCount} ${hotelCount === 1 ? 'hotel' : 'hotéis'}\n• Todos os posts dos hotéis\n\nEsta ação não pode ser desfeita.`
      : `Tem certeza que deseja deletar a rede "${redeName}"?\n\nEsta ação não pode ser desfeita.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setDeletingRede(redeId)
    try {
      const response = await fetch(`/api/redes/${redeId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchData()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao deletar rede')
      }
    } catch (error) {
      console.error('Erro ao deletar rede:', error)
      alert('Erro ao deletar rede')
    } finally {
      setDeletingRede(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Redes</h1>
          <p className="text-gray-600">Organize seus hotéis em redes para melhor gestão</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Rede
        </button>
      </div>

      {/* Formulário de Criação */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Criar Nova Rede</h2>
          <form onSubmit={createRede} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Rede
              </label>
              <input
                type="text"
                value={newRede.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Rede Hoteleira ABC"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                value={newRede.slug}
                onChange={(e) => setNewRede({ ...newRede, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="rede-hoteleira-abc"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL será: /{newRede.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Criar Rede
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Redes */}
      <div className="grid gap-6">
        {redes.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rede encontrada</h3>
            <p className="text-gray-600 mb-4">Crie sua primeira rede para organizar seus hotéis</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Primeira Rede
            </button>
          </div>
        ) : (
          redes.map((rede) => {
            const redeHotels = getHotelsByRede(rede.id)
            const isExpanded = selectedRede === rede.id
            
            return (
              <div key={rede.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rede.name}</h3>
                        <p className="text-gray-600">/{rede.slug}</p>
                        <p className="text-sm text-gray-500">
                          {rede._count?.hotels || redeHotels.length} {(rede._count?.hotels || redeHotels.length) === 1 ? 'hotel' : 'hotéis'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/${rede.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md border border-blue-200 hover:bg-blue-50 text-sm"
                      >
                        Ver Site
                      </a>
                      <button
                        onClick={() => setShowAddHotelForm(showAddHotelForm === rede.id ? null : rede.id)}
                        className="text-green-600 hover:text-green-700 px-3 py-1 rounded-md border border-green-200 hover:bg-green-50 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Hotel
                      </button>
                      <button
                        onClick={() => setSelectedRede(isExpanded ? null : rede.id)}
                        className="text-gray-600 hover:text-gray-700 px-3 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
                      >
                        {isExpanded ? 'Ocultar' : 'Ver'} Hotéis
                      </button>
                      {currentUser?.role === 'superadmin' && (
                        <button
                          onClick={() => deleteRede(rede.id, rede.name, rede._count?.hotels || redeHotels.length)}
                          disabled={deletingRede === rede.id}
                          className="text-red-600 hover:text-red-700 px-3 py-1 rounded-md border border-red-200 hover:bg-red-50 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingRede === rede.id ? (
                            <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          {deletingRede === rede.id ? 'Deletando...' : 'Deletar'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Formulário de Adicionar Hotel */}
                  {showAddHotelForm === rede.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Adicionar Novo Hotel</h4>
                      <form onSubmit={(e) => createHotel(e, rede.id)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Hotel</label>
                          <input
                            type="text"
                            value={newHotel.name}
                            onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Hotel Paraíso"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                          <input
                            type="text"
                            value={newHotel.city}
                            onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Rio de Janeiro"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                          <input
                            type="text"
                            value={newHotel.state}
                            onChange={(e) => setNewHotel({ ...newHotel, state: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: RJ"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                          <input
                            type="text"
                            value={newHotel.country}
                            onChange={(e) => setNewHotel({ ...newHotel, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Brasil"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Viagem</label>
                          <select
                            value={newHotel.travelType}
                            onChange={(e) => setNewHotel({ ...newHotel, travelType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Selecione...</option>
                            <option value="romântica">Romântica</option>
                            <option value="família">Família</option>
                            <option value="negócios">Negócios</option>
                            <option value="aventura">Aventura</option>
                            <option value="relaxamento">Relaxamento</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
                          <input
                            type="text"
                            value={newHotel.audience}
                            onChange={(e) => setNewHotel({ ...newHotel, audience: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Casais, Famílias, Executivos"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Melhor Estação</label>
                          <select
                            value={newHotel.season}
                            onChange={(e) => setNewHotel({ ...newHotel, season: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Selecione...</option>
                            <option value="verão">Verão</option>
                            <option value="inverno">Inverno</option>
                            <option value="primavera">Primavera</option>
                            <option value="outono">Outono</option>
                            <option value="ano todo">Ano Todo</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Eventos Locais</label>
                          <input
                            type="text"
                            value={newHotel.events}
                            onChange={(e) => setNewHotel({ ...newHotel, events: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Carnaval, Rock in Rio, Reveillon"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Domínio Personalizado (Opcional)</label>
                          <input
                            type="text"
                            value={newHotel.customDomain}
                            onChange={(e) => setNewHotel({ ...newHotel, customDomain: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: blog.meuhotel.com.br"
                          />
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                          >
                            Criar Hotel
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddHotelForm(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Lista de Hotéis da Rede */}
                  {isExpanded && redeHotels.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Hotéis desta rede:</h4>
                      <div className="grid gap-3">
                        {redeHotels.map((hotel) => (
                          <div key={hotel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h5 className="font-medium text-gray-900">{hotel.name}</h5>
                              <p className="text-sm text-gray-600">{hotel.city}, {hotel.state}</p>
                              <p className="text-xs text-gray-500">/{rede.slug}/{hotel.slug}</p>
                            </div>
                            <a
                              href={`/${rede.slug}/${hotel.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Ver Blog →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {isExpanded && redeHotels.length === 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                      <p className="text-gray-500">Nenhum hotel nesta rede ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}