'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import ImageUpload from '@/components/ImageUpload'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  imageUrl?: string
  publishedAt?: string
  scheduledAt?: string
}

export default function EditPostPage() {
  const { id } = useParams()
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      const res = await axios.get(`/api/posts/${id}`)
      setPost(res.data)
      setLoading(false)
    }
    fetchPost()
  }, [id])

  async function handleSave() {
    setSaving(true)
    await axios.put(`/api/posts/${id}`, post)
    setSaving(false)
    alert('Post atualizado com sucesso!')
    router.push('/dashboard')
  }

  async function handleDeletePost() {
    setDeleteModal(true)
  }

  async function confirmDeletePost() {
    setDeleting(true)
    try {
      await axios.delete(`/api/posts/${id}`)
      alert('Post deletado com sucesso!')
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error('Erro ao deletar post:', error)
      const errorMessage = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : 'Erro ao deletar post'
      alert(errorMessage)
    } finally {
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!post) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Post não encontrado</h3>
        <p className="text-gray-600 mb-6">O post que você está procurando não existe</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Post</h1>
          <p className="text-gray-600">Modifique o conteúdo e configurações do seu post</p>
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

      {/* Layout em 2 colunas */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Coluna Esquerda - Detalhes do Post */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                <p className="text-sm text-gray-600">Título, slug e metadados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Post
                </label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  value={post.title}
                  onChange={(e) => setPost({ ...post, title: e.target.value })}
                  placeholder="Digite o título do post"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  value={post.slug}
                  onChange={(e) => setPost({ ...post, slug: e.target.value })}
                  placeholder="slug-do-post"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agendar Publicação
                </label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
                  value={post.scheduledAt?.slice(0, 16) || ''}
                  onChange={(e) => setPost({ ...post, scheduledAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Status do Post */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                <p className="text-sm text-gray-600">Estado atual do post</p>
              </div>
            </div>

            <div className="space-y-3">
              {post.publishedAt ? (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Publicado</p>
                    <p className="text-xs text-green-600">
                      {new Date(post.publishedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ) : post.scheduledAt ? (
                new Date(post.scheduledAt) > new Date() ? (
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-orange-800">Agendado</p>
                      <p className="text-xs text-orange-600">
                        Para {new Date(post.scheduledAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Publicado Automaticamente</p>
                      <p className="text-xs text-green-600">Agendamento executado</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Rascunho</p>
                    <p className="text-xs text-gray-600">Não publicado</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Conteúdo e Imagem */}
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
                  value={post.content}
                  onChange={(e) => setPost({ ...post, content: e.target.value })}
                  placeholder="Conteúdo completo do post em markdown..."
                />
              </div>

              {post.content && (
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
                      <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upload de Imagem */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Imagem do Post</h3>
                <p className="text-sm text-gray-600">Imagem de destaque</p>
              </div>
            </div>
            
            <ImageUpload
              value={post.imageUrl || ''}
              onChange={(url) => setPost({ ...post, imageUrl: url })}
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {!post.title || !post.content ? (
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
                Post pronto para atualização
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
              onClick={handleDeletePost}
              className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Deletar Post
            </button>
            
            <button
              onClick={handleSave}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || !post.title || !post.content}
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
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Tem certeza que deseja deletar o post <strong>&quot;{post?.title}&quot;</strong>?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-150"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePost}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Deletando...
                  </>
                ) : (
                  'Deletar Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}