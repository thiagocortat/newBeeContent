import { useState, useCallback } from 'react'
import type { ImageUploadConfig, ImageUploadResponse, ImageUploadError } from '../types/image'

/**
 * Default configuration for image uploads
 */
const DEFAULT_CONFIG: ImageUploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg'],
  uploadEndpoint: '/api/upload'
}

/**
 * Custom hook for handling image uploads
 * 
 * @param config - Upload configuration options
 * @returns Object with upload state and handlers
 */
export function useImageUpload(config: Partial<ImageUploadConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<ImageUploadError | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /**
   * Validates a file before upload
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: ImageUploadError; message?: string } => {
    // Check file size
    if (file.size > finalConfig.maxSize) {
      return {
        valid: false,
        error: 'FILE_TOO_LARGE',
        message: `Arquivo muito grande. Tamanho máximo: ${(finalConfig.maxSize / 1024 / 1024).toFixed(1)}MB`
      }
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'INVALID_FORMAT',
        message: 'Por favor, selecione apenas arquivos de imagem'
      }
    }

    return { valid: true }
  }, [finalConfig.maxSize])

  /**
   * Uploads a file to the server
   */
  const uploadFile = useCallback(async (file: File): Promise<ImageUploadResponse | null> => {
    // Validate file first
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error!)
      setErrorMessage(validation.message!)
      return null
    }

    setUploading(true)
    setError(null)
    setErrorMessage(null)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(finalConfig.uploadEndpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data: ImageUploadResponse = await response.json()
      setProgress(100)
      
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError('UPLOAD_FAILED')
      setErrorMessage(`Erro ao fazer upload: ${errorMsg}`)
      return null
    } finally {
      setUploading(false)
    }
  }, [finalConfig.uploadEndpoint, validateFile])

  /**
   * Resets the upload state
   */
  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
    setErrorMessage(null)
  }, [])

  return {
    // State
    uploading,
    progress,
    error,
    errorMessage,
    
    // Actions
    uploadFile,
    validateFile,
    reset,
    
    // Config
    config: finalConfig
  }
}