'use client'

import { useState, useEffect } from 'react'

/**
 * Props for the ImageUpload component
 */
interface ImageUploadProps {
  /** Current image URL value */
  value: string
  /** Callback function called when image URL changes */
  onChange: (url: string) => void
  /** Additional CSS classes */
  className?: string
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number
}

/**
 * ImageUpload Component
 * 
 * A reusable component for uploading and displaying images with support for:
 * - Drag & drop functionality
 * - File validation (type and size)
 * - Loading states and error handling
 * - WEBP, JPG, PNG, GIF, SVG support
 * - Lazy loading for performance
 * 
 * @param props - The component props
 * @returns JSX element for image upload interface
 */
export default function ImageUpload({ 
  value, 
  onChange, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Usar diretamente a prop value sem estado interno
  const preview = value
  
  console.log('ImageUpload renderizado com value:', value)

  // Reset error state when preview changes
  useEffect(() => {
    console.log('ImageUpload: preview mudou para:', preview)
    setImageError(false)
    setImageLoaded(false)
  }, [preview])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize) {
      alert(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      onChange(data.url)
    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    onChange('')
  }

  return (
    <div className={`mb-4 ${className}`} role="region" aria-label="Upload de imagem">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Imagem do Post
      </label>
      
      {preview && (
        <div className="relative mb-4">
          <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600 break-all">
            <strong>URL da imagem:</strong> {preview}
          </div>
          <div className="relative">
            <img 
              src={preview} 
              alt="Imagem carregada" 
              loading="lazy"
              className="w-full max-h-64 object-cover rounded-lg shadow-sm transition-opacity duration-200" 
              style={{ opacity: imageLoaded ? 1 : 0.7 }}
              onLoad={() => {
                console.log('Imagem carregada com sucesso:', preview)
                setImageLoaded(true)
                setImageError(false)
              }}
              onError={(e) => {
                console.error('Erro ao carregar imagem:', preview, e)
                setImageError(true)
                setImageLoaded(false)
              }}
            />
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 text-center px-4">
                  ❌ Erro ao carregar a imagem<br/>
                  <span className="text-xs">Verifique se a URL está acessível</span>
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
            aria-label="Remover imagem"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : (
              <>
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, JPEG ou WEBP (MAX. 5MB)</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*,.webp,.jpg,.jpeg,.png,.gif,.svg" 
            onChange={handleUpload}
            disabled={uploading}
            aria-label="Selecionar arquivo de imagem"
          />
        </label>
      </div>
    </div>
  )
}