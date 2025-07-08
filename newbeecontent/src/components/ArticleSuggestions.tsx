'use client'

import { useState } from 'react'
import axios from '@/lib/axios'

interface ArticleSuggestion {
  title: string
  description: string
  keywords: string[]
  estimatedReadTime: string
}

interface Hotel {
  id: string
  name: string
  city: string
  state: string
}

interface ArticleSuggestionsProps {
  onSelectSuggestion: (suggestion: ArticleSuggestion) => void
}

export default function ArticleSuggestions({ onSelectSuggestion }: ArticleSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ArticleSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [userHotel, setUserHotel] = useState<Hotel | null>(null)

  async function handleGenerateSuggestions() {
    setLoading(true)
    try {
      // Buscar hotel do usuário se ainda não foi carregado
      let hotelToUse = userHotel
      if (!hotelToUse) {
        const hotelResponse = await axios.get('/api/user-hotel')
        hotelToUse = hotelResponse.data.hotel
        setUserHotel(hotelToUse)
      }

      if (!hotelToUse) {
        alert('Nenhum hotel encontrado. Configure um hotel primeiro.')
        return
      }

      // Gerar sugestões baseadas no hotel do usuário
      const response = await axios.post('/api/article-suggestions', {
        hotelId: hotelToUse.id
      })
      
      setSuggestions(response.data.suggestions)
      setShowSuggestions(true)
    } catch (error: unknown) {
      console.error('Erro ao gerar sugestões:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 404) {
          alert('Nenhum hotel encontrado. Configure um hotel primeiro na seção de configurações.')
        } else {
          alert('Erro ao gerar sugestões de artigos. Tente novamente.')
        }
      } else {
        alert('Erro ao gerar sugestões de artigos. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSelectSuggestion(suggestion: ArticleSuggestion) {
    onSelectSuggestion(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-2">
        <button
           onClick={handleGenerateSuggestions}
           className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
           disabled={loading}
         >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Gerando sugestões...
            </>
          ) : (
            <>
              ✨ Sugestão de Artigos com IA
            </>
          )}
        </button>
        
        {userHotel && (
          <p className="text-sm text-gray-600">
            🏨 Sugestões baseadas em: <span className="font-semibold">{userHotel.name}</span> - {userHotel.city}, {userHotel.state}
          </p>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              🎯 Sugestões de Artigos Personalizadas
            </h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                    {suggestion.title}
                  </h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                    📖 {suggestion.estimatedReadTime}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">
                  {suggestion.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {suggestion.keywords.map((keyword, keyIndex) => (
                    <span
                      key={keyIndex}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              💡 Clique em uma sugestão para gerar o artigo completo
            </p>
          </div>
        </div>
      )}
    </div>
  )
}