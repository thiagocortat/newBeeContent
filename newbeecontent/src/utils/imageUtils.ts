import type { SupportedImageFormat } from '../types/image'

/**
 * Image utility functions
 */

/**
 * Checks if a URL is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false
  
  // Check if it's a valid URL format
  const isValidUrl = url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')
  if (!isValidUrl) return false
  
  // Check if it has a valid image extension
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
  return imageExtensions.test(url) || url.startsWith('data:image/')
}

/**
 * Gets the file extension from a filename or URL
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : ''
}

/**
 * Checks if a file extension is supported
 */
export function isSupportedImageFormat(extension: string): extension is SupportedImageFormat {
  const supportedFormats: SupportedImageFormat[] = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg']
  return supportedFormats.includes(extension.toLowerCase() as SupportedImageFormat)
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generates a unique filename with timestamp
 */
export function generateUniqueFilename(originalName: string): string {
  const extension = getFileExtension(originalName)
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`
}

/**
 * Creates a preview URL for a file
 */
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to create preview'))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses an image file (basic implementation)
 */
export function compressImage(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions (max 1920x1080)
      const maxWidth = 1920
      const maxHeight = 1080
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Compression failed'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}