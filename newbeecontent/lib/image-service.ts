/**
 * Serviço unificado para geração de imagens
 * Escolhe automaticamente entre Replicate e Runware baseado na configuração
 */

import config from './config'
import { generateImage as generateWithReplicate } from './replicate'
import { generateBlogImage as generateWithRunware } from './runware'

export interface ImageGenerationOptions {
  prompt: string
  optimizeForBlog?: boolean
}

/**
 * Gera uma imagem usando o provedor configurado
 * @param options Opções para geração da imagem
 * @returns URL da imagem gerada
 */
export async function generateImage(options: ImageGenerationOptions): Promise<string> {
  const { prompt, optimizeForBlog = true } = options
  
  try {
    // Verificar se algum provedor está disponível
    if (!config.ai.replicate.enabled && !config.ai.runware.enabled) {
      throw new Error('Nenhum provedor de imagem está configurado. Configure REPLICATE_API_TOKEN ou RUNWARE_API_KEY.')
    }

    const provider = config.ai.imageProvider
    console.log(`🎨 Gerando imagem com ${provider.toUpperCase()}:`, prompt)

    let imageUrl: string

    switch (provider) {
      case 'runware':
        if (!config.ai.runware.enabled) {
          console.warn('⚠️  Runware não está configurada, usando Replicate como fallback')
          if (!config.ai.replicate.enabled) {
            throw new Error('Runware não configurada e Replicate também não está disponível')
          }
          imageUrl = await generateWithReplicate(prompt)
        } else {
          imageUrl = await generateWithRunware(prompt)
        }
        break

      case 'replicate':
      default:
        if (!config.ai.replicate.enabled) {
          console.warn('⚠️  Replicate não está configurada, usando Runware como fallback')
          if (!config.ai.runware.enabled) {
            throw new Error('Replicate não configurada e Runware também não está disponível')
          }
          imageUrl = await generateWithRunware(prompt)
        } else {
          imageUrl = await generateWithReplicate(prompt)
        }
        break
    }

    console.log('✅ Imagem gerada com sucesso:', imageUrl)
    return imageUrl

  } catch (error) {
    console.error('❌ Erro ao gerar imagem:', error)
    throw error
  }
}

/**
 * Gera uma imagem otimizada para posts de blog
 * @param prompt Descrição da imagem desejada
 * @returns URL da imagem gerada
 */
export async function generateBlogImage(prompt: string): Promise<string> {
  const optimizedPrompt = `${prompt}. Professional blog header image, high-quality, modern design, clean composition`
  
  return generateImage({
    prompt: optimizedPrompt,
    optimizeForBlog: true
  })
}

/**
 * Verifica quais provedores de imagem estão disponíveis
 */
export function getAvailableProviders(): {
  replicate: boolean
  runware: boolean
  active: string
  hasAny: boolean
} {
  return {
    replicate: config.ai.replicate.enabled,
    runware: config.ai.runware.enabled,
    active: config.ai.imageProvider,
    hasAny: config.ai.replicate.enabled || config.ai.runware.enabled
  }
}

/**
 * Obtém informações sobre o status dos provedores
 */
export function getProvidersStatus(): string {
  const providers = getAvailableProviders()
  
  if (!providers.hasAny) {
    return 'Nenhum provedor de imagem configurado'
  }
  
  const available = []
  if (providers.replicate) available.push('Replicate')
  if (providers.runware) available.push('Runware')
  
  return `Provedores disponíveis: ${available.join(', ')} | Ativo: ${providers.active.toUpperCase()}`
}