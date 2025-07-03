'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface Hotel {
  autoGeneratePosts: boolean
  postFrequency?: string
  themePreferences?: string
  maxMonthlyPosts?: number
  lastAutoPostAt?: string
}

export default function HotelAutomationSettings() {
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await axios.get('/api/hotel/me')
        setHotel(res.data)
      } catch (error) {
        console.error('Erro ao carregar dados do hotel:', error)
        alert('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }
    fetchHotel()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await axios.put('/api/hotel/me', hotel)
      alert('Configuração salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Carregando...</p>
    </div>
  )

  if (!hotel) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-red-600">Erro ao carregar dados do hotel</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Automação de Conteúdo por IA</h1>
        
        <div className="space-y-6">
          {/* Ativar Automação */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Ativar automação?</label>
            <select
              value={hotel.autoGeneratePosts ? 'yes' : 'no'}
              onChange={(e) =>
                setHotel({ ...hotel, autoGeneratePosts: e.target.value === 'yes' })
              }
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="no">Não</option>
              <option value="yes">Sim</option>
            </select>
          </div>

          {/* Frequência */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Frequência de publicação</label>
            <select
              value={hotel.postFrequency || ''}
              onChange={(e) => setHotel({ ...hotel, postFrequency: e.target.value })}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!hotel.autoGeneratePosts}
            >
              <option value="">Selecione uma frequência</option>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quinzenal</option>
            </select>
          </div>

          {/* Temas Preferenciais */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Temas preferenciais</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: gastronomia, natureza, família, aventura"
              value={hotel.themePreferences || ''}
              onChange={(e) =>
                setHotel({ ...hotel, themePreferences: e.target.value })
              }
              disabled={!hotel.autoGeneratePosts}
            />
            <p className="text-sm text-gray-500 mt-1">Separe os temas por vírgula</p>
          </div>

          {/* Máximo de Posts */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Máximo de posts por mês</label>
            <input
              type="number"
              min="1"
              max="31"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 10"
              value={hotel.maxMonthlyPosts || ''}
              onChange={(e) =>
                setHotel({ ...hotel, maxMonthlyPosts: Number(e.target.value) })
              }
              disabled={!hotel.autoGeneratePosts}
            />
            <p className="text-sm text-gray-500 mt-1">Limite de segurança para evitar spam</p>
          </div>

          {/* Status da Última Geração */}
          {hotel.lastAutoPostAt && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Última geração automática</h3>
              <p className="text-sm text-gray-600">
                {new Date(hotel.lastAutoPostAt).toLocaleString('pt-BR')}
              </p>
            </div>
          )}

          {/* Botão Salvar */}
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Como funciona</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• A IA gera conteúdo baseado no perfil do seu hotel</li>
            <li>• Posts são criados automaticamente na frequência escolhida</li>
            <li>• Temas preferenciais direcionam o tipo de conteúdo</li>
            <li>• O limite mensal evita excesso de publicações</li>
          </ul>
        </div>
      </div>
    </div>
  )
}