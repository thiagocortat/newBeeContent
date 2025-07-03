/**
 * Biblioteca para integração com Runware API
 * Geração de imagens com IA
 */

import { randomUUID } from 'crypto'

export interface RunwareImageOptions {
  prompt: string
  width?: number
  height?: number
  steps?: number
  seed?: number
  model?: string
}

export interface RunwareResponse {
  success: boolean
  imageUrl?: string
  error?: string
}

/**
 * Gera uma imagem com IA usando Runware API
 * @param options Opções para geração da imagem
 * @returns URL da imagem gerada
 */
export async function generateImage(options: RunwareImageOptions): Promise<string> {
  try {
    const apiKey = process.env.RUNWARE_API_KEY
    
    if (!apiKey) {
      throw new Error('RUNWARE_API_KEY não configurada')
    }

    console.log('Gerando imagem com Runware:', options.prompt)

    const requestBody = {
      taskType: "imageInference",
      taskUUID: randomUUID(),
      positivePrompt: options.prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 20,
      seed: options.seed || Math.floor(Math.random() * 1000000),
      model: options.model || "runware:100@1",
      outputFormat: "WEBP",
      outputType: "URL"
    }

    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([requestBody])
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API Runware: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Resposta completa da Runware:', JSON.stringify(data, null, 2))

    // Verificar se a resposta tem a estrutura esperada
    if (!data) {
      throw new Error('Resposta vazia da API Runware')
    }

    // A API Runware retorna { data: [...] } ou array direto
    let result
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      // Estrutura: { data: [{ imageURL: "..." }] }
      result = data.data[0]
    } else if (Array.isArray(data) && data.length > 0) {
      // Estrutura: [{ imageURL: "..." }]
      result = data[0]
    } else {
      console.error('Estrutura de resposta inesperada:', data)
      throw new Error(`Resposta inválida da API Runware: ${JSON.stringify(data)}`)
    }
    
    if (result.error) {
      throw new Error(`Erro da Runware: ${result.error}`)
    }

    if (!result.imageURL) {
      console.error('Resultado sem imageURL:', result)
      throw new Error(`URL da imagem não encontrada na resposta: ${JSON.stringify(result)}`)
    }

    console.log('Imagem gerada com sucesso:', result.imageURL)
    return result.imageURL

  } catch (error) {
    console.error('Erro ao gerar imagem com Runware:', error)
    throw error
  }
}

/**
 * Verifica se a API Runware está configurada e disponível
 */
export function isRunwareAvailable(): boolean {
  return !!process.env.RUNWARE_API_KEY
}

/**
 * Gera uma imagem com configurações padrão otimizadas para blog posts
 * @param prompt Descrição da imagem desejada
 * @returns URL da imagem gerada
 */
export async function generateBlogImage(prompt: string): Promise<string> {
  return generateImage({
    prompt: `${prompt}. Professional, high-quality, blog header style, clean composition, modern aesthetic`,
    width: 512,
    height: 512, // Proporção ideal para redes sociais e blog headers
    steps: 25,
    model: "runware:100@1"
  })
}