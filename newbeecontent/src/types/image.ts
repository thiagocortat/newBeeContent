/**
 * Image-related type definitions
 */

/**
 * Supported image file formats
 */
export type SupportedImageFormat = 'webp' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'svg'

/**
 * Image upload configuration
 */
export interface ImageUploadConfig {
  /** Maximum file size in bytes */
  maxSize: number
  /** Allowed file formats */
  allowedFormats: SupportedImageFormat[]
  /** Upload endpoint URL */
  uploadEndpoint: string
}

/**
 * Image upload response from API
 */
export interface ImageUploadResponse {
  /** URL of the uploaded image */
  url: string
  /** Original filename */
  filename?: string
  /** File size in bytes */
  size?: number
  /** MIME type */
  mimeType?: string
}

/**
 * Image upload error types
 */
export type ImageUploadError = 
  | 'FILE_TOO_LARGE'
  | 'INVALID_FORMAT'
  | 'UPLOAD_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Image upload state
 */
export interface ImageUploadState {
  /** Whether upload is in progress */
  uploading: boolean
  /** Upload progress percentage (0-100) */
  progress?: number
  /** Error state */
  error?: ImageUploadError
  /** Error message */
  errorMessage?: string
}