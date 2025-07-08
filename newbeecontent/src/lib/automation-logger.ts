import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AutomationLogData {
  hotelId: string
  status: 'success' | 'error' | 'pending'
  message?: string
  postId?: string
}

export async function logAutomationExecution(data: AutomationLogData) {
  try {
    const log = await prisma.automationLog.create({
      data: {
        hotelId: data.hotelId,
        status: data.status,
        message: data.message || null,
        postId: data.postId || null
      }
    })
    
    console.log(`Automation log created: ${log.id} - ${data.status}`)
    return log
  } catch (error) {
    console.error('Failed to create automation log:', error)
    throw error
  }
}

// Exemplo de uso em uma função de automação IA
export async function exampleAutomationFunction(hotelId: string) {
  // Log de início
  await logAutomationExecution({
    hotelId,
    status: 'pending',
    message: 'Iniciando geração de conteúdo via IA'
  })

  try {
    // Simular geração de post com IA
    const generatedPost = await generatePostWithAI(hotelId)
    
    // Log de sucesso
    await logAutomationExecution({
      hotelId,
      status: 'success',
      message: 'Post gerado com sucesso via IA',
      postId: generatedPost.id
    })
    
    return generatedPost
  } catch (error) {
    // Log de erro
    await logAutomationExecution({
      hotelId,
      status: 'error',
      message: `Falha ao gerar conteúdo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    })
    
    throw error
  }
}

// Função simulada para demonstração
async function generatePostWithAI(hotelId: string) {
  // Esta seria a implementação real da geração de post com IA
  // Por enquanto, apenas retorna um objeto simulado
  return {
    id: 'post_' + Date.now(),
    title: 'Post gerado por IA',
    content: 'Conteúdo gerado automaticamente',
    hotelId
  }
}