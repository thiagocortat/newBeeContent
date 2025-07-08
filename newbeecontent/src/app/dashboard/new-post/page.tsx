'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import ReactMarkdown from 'react-markdown'
// Removido import direto do groq - agora usa API route
import ImageUpload from '@/components/ImageUpload'
import ArticleSuggestions from '@/components/ArticleSuggestions'

interface ArticleSuggestion {
  title: string
  description: string
  keywords: string[]
  estimatedReadTime: string
}

interface PostContent {
  title?: string
  content?: string
  seoDescription?: string
  slug?: string
}

interface ApiResponse {
  postContent?: PostContent
  imageUrl?: string
}

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [baseContent, setBaseContent] = useState('')
  const [postContent, setPostContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  
  // Debug: Log quando imageUrl muda
  useEffect(() => {
    console.log('Estado imageUrl mudou para:', imageUrl)
  }, [imageUrl])
  const [seo, setSeo] = useState({ description: '', slug: '' })
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)

  // Função para lidar com a seleção de uma sugestão de artigo
  async function handleSelectSuggestion(suggestion: ArticleSuggestion) {
    setLoading(true)
    
    try {
      // Criar prompt detalhado baseado na sugestão
      const detailedPrompt = `Crie um artigo completo e detalhado sobre: "${suggestion.title}"

Descrição: ${suggestion.description}
Palavras-chave: ${suggestion.keywords.join(', ')}
Tempo estimado: ${suggestion.estimatedReadTime}

O artigo deve ter:
- Introdução envolvente
- Desenvolvimento com subtópicos bem estruturados
- Conclusão que agregue valor
- Uso natural das palavras-chave fornecidas
- Formatação em markdown
- Mínimo de 500 palavras`

      // Gerar conteúdo completo usando a API
      const response = await axios.post<ApiResponse>('/api/generate-ideas', { prompt: detailedPrompt })
      
      if (response.data && response.data.postContent) {
        const result = response.data.postContent
        
        // Preencher todos os campos diretamente
        setTitle(result.title || suggestion.title)
        setPostContent(result.content || '')
        setSeo({
          description: result.seoDescription || suggestion.description,
          slug: result.slug || suggestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        })
        
        // Limpar o campo base já que preenchemos os campos finais
        setBaseContent('')
      }
    } catch (error) {
      console.error('Erro ao gerar artigo:', error)
      alert('Erro ao gerar artigo completo. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateFromIA() {
    if (!baseContent.trim()) {
      alert('Digite um conteúdo base para gerar o post completo')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post<ApiResponse>('/api/generate-ideas', { prompt: baseContent })
      
      // Verificar se a resposta tem a estrutura esperada
      if (!response.data || !response.data.postContent) {
        console.error('Resposta inválida da API:', response.data)
        throw new Error('Resposta inválida da API')
      }
      
      const result = response.data.postContent

      // Verificar se o resultado tem os campos necessários
      if (!result || typeof result !== 'object') {
        console.error('Resultado inválido:', result)
        throw new Error('Resultado inválido da IA')
      }

      setTitle(result.title || '')
      setPostContent(result.content || '')
      setSeo({
        description: result.seoDescription || '',
        slug: result.slug || ''
      })
      
      // Verificar se pelo menos o título foi gerado
      if (!result.title && !result.content) {
        alert('A IA não conseguiu gerar conteúdo. Tente reformular sua ideia base.')
      }
      
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error)
      
      // Mensagem de erro mais específica
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert('Erro de autenticação. Faça login novamente.')
        } else if (error.response?.status === 500) {
          alert('Erro interno do servidor. Tente novamente em alguns minutos.')
        } else {
          alert('Erro ao gerar conteúdo com IA. Verifique sua conexão e tente novamente.')
        }
      } else if (error instanceof Error && error.message?.includes('inválida')) {
        alert('Erro na resposta da IA: ' + error.message)
      } else {
        alert('Erro ao gerar conteúdo com IA. Verifique sua conexão e tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateImage() {
    if (!title && !postContent) {
      alert('Gere o conteúdo do post primeiro ou digite um título para criar uma imagem relacionada')
      return
    }

    setGeneratingImage(true)
    try {
      const imagePrompt = `Create a professional blog post header image for: ${title || postContent.slice(0, 100)}. Modern, clean, high-quality, suitable for a blog article.`
      
      console.log('Gerando imagem com prompt:', imagePrompt)
      const response = await axios.post<ApiResponse>('/api/generate-image', { prompt: imagePrompt })
      console.log('Resposta da API:', response.data)
      
      if (response.data.imageUrl) {
        console.log('URL da imagem recebida:', response.data.imageUrl)
        setImageUrl(response.data.imageUrl)
        console.log('Estado imageUrl atualizado para:', response.data.imageUrl)
      } else {
        console.error('imageUrl não encontrada na resposta:', response.data)
        alert('Erro: URL da imagem não foi retornada pela API')
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error)
      alert('Erro ao gerar imagem com IA. Verifique sua conexão.')
    } finally {
      setGeneratingImage(false)
    }
  }

  async function handleSave() {
    if (!title || !postContent) {
      alert('Título e conteúdo do post são obrigatórios')
      return
    }

    setSaving(true)
    try {
      await axios.post('/api/posts', {
        title,
        content: postContent,
        slug: seo.slug,
        imageUrl,
        scheduledAt: scheduledAt || null
      })
      
      alert('Post criado com sucesso!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao criar post:', error)
      alert('Erro ao criar post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Novo Post</h1>
          <p className="text-gray-600">Use IA para gerar conteúdo profissional para seu blog</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-150"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Sugestões de Artigos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ArticleSuggestions onSelectSuggestion={handleSelectSuggestion} />
      </div>

      {/* Layout em 2 colunas */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda - Geração de Conteúdo */}
        <div className="space-y-6">
          {/* Geração com IA */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Geração com IA</h3>
                <p className="text-sm text-gray-600">Transforme ideias em posts completos</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo Base
                </label>
                <textarea
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 resize-none"
                  placeholder="Digite uma ideia, tópico ou rascunho que será expandido pela IA em um post completo..."
                  value={baseContent}
                  onChange={(e) => setBaseContent(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerateFromIA}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !baseContent.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gerando post completo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Gerar Post Completo com IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Campos do Post */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalhes do Post</h3>
                <p className="text-sm text-gray-600">Configure título, conteúdo e metadados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Post
                </label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  placeholder="Digite o título do post"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  placeholder="slug-do-post"
                  value={seo.slug}
                  onChange={(e) => setSeo({ ...seo, slug: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição SEO
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 resize-none"
                  rows={3}
                  placeholder="Descrição para SEO e redes sociais"
                  value={seo.description}
                  onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agendar Publicação
                </label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Conteúdo e Preview */}
        <div className="space-y-6">
          {/* Editor de Conteúdo */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conteúdo</h3>
                <p className="text-sm text-gray-600">Editor Markdown com preview</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo do Post (Markdown)
                </label>
                <textarea
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 resize-none"
                  placeholder="Conteúdo completo do post em markdown..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </div>

              {postContent && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview do Conteúdo
                    </p>
                  </div>
                  <div className="p-4 bg-white max-h-64 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{postContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload de Imagem */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Imagem do Post</h3>
                  <p className="text-sm text-gray-600">Upload ou geração com IA</p>
                </div>
              </div>
              
              <button
                onClick={handleGenerateImage}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={generatingImage}
              >
                {generatingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h8a2 2 0 002-2V8M7 8h10M7 8l4 4 4-4" />
                    </svg>
                    Gerar com IA
                  </>
                )}
              </button>
            </div>
            
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              className="mb-4"
            /></div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {!title || !postContent ? (
              <span className="flex items-center text-amber-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Título e conteúdo são obrigatórios
              </span>
            ) : (
              <span className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Post pronto para publicação
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-all duration-150"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || !title || !postContent}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Criar Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}