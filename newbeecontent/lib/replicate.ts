// Importação dinâmica para evitar problemas de SSR
let Replicate: any

try {
  Replicate = require('replicate')
} catch (error) {
  console.error('Erro ao importar Replicate:', error)
}

/**
 * Gera uma imagem com IA usando Replicate, baseado em um prompt.
 * @param prompt Prompt descritivo da imagem desejada
 * @returns URL da imagem gerada
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    if (!Replicate) {
      throw new Error('Replicate não foi importado corretamente')
    }
    
    console.log('Inicializando Replicate com token:', process.env.REPLICATE_API_TOKEN ? 'Token presente' : 'Token ausente')
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    })

    console.log('Executando modelo Replicate com prompt:', prompt)
    
    const output = await replicate.run(
      "google/imagen-4",
      {
        input: {
          prompt: prompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "jpg",
          output_quality: 80
        }
      }
    ) as string[]

    console.log('Output do Replicate:', output)
    
    if (!output || !output[0]) {
      throw new Error('Nenhuma imagem foi gerada pelo Replicate')
    }

    return output[0]
  } catch (error: any) {
    console.error('Erro na função generateImage:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    throw error
  }
}