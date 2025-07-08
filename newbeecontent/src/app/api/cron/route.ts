import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'
import { generatePostIdeas, generateMarkdownPostFromTitle } from '../../../../lib/groq'
import { generateBlogImage } from '../../../../lib/image-service'



async function shouldCreatePost(hotel: any): Promise<{ should: boolean, reason?: string }> {
  const now = new Date()
  const last = hotel.lastAutoPostAt || new Date(0)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  // Verifica frequência
  let frequencyMet = false
  if (hotel.postFrequency === 'daily' && diffDays >= 1) frequencyMet = true
  if (hotel.postFrequency === 'weekly' && diffDays >= 7) frequencyMet = true
  if (hotel.postFrequency === 'biweekly' && diffDays >= 14) frequencyMet = true

  if (!frequencyMet) {
    return { should: false, reason: 'frequency not met' }
  }

  // Verifica limite mensal
  if (hotel.maxMonthlyPosts) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const postsThisMonth = await prisma.post.count({
      where: {
        hotelId: hotel.id,
        publishedAt: {
          gte: startOfMonth
        }
      }
    })

    if (postsThisMonth >= hotel.maxMonthlyPosts) {
      return { should: false, reason: 'monthly limit reached' }
    }
  }

  return { should: true }
}

export async function GET() {
  try {
    console.log('🤖 Iniciando processo de automação de posts...')
    
    // Log de início da automação
    const firstHotel = await prisma.hotel.findFirst({ where: { autoGeneratePosts: true } })
    if (firstHotel) {
      await prisma.automationLog.create({
        data: {
          hotelId: firstHotel.id,
          status: 'success',
          message: 'Processo de automação iniciado'
        }
      })
    }
    
    const hotels = await prisma.hotel.findMany({
      where: { autoGeneratePosts: true }
    })

    console.log(`📊 Encontrados ${hotels.length} hotéis com automação ativada`)
    const results = []

    for (const hotel of hotels) {
      const shouldCreate = await shouldCreatePost(hotel)
      if (!shouldCreate.should) {
        await prisma.automationLog.create({
          data: {
            hotelId: hotel.id,
            status: 'success',
            message: `Post pulado para hotel ${hotel.name}. Motivo: ${shouldCreate.reason || 'unknown'}`
          }
        })
        results.push({ hotelId: hotel.id, status: 'skipped', reason: shouldCreate.reason || 'unknown' })
        continue
      }

      try {
        // Buscar informações da rede
         const rede = await prisma.rede.findUnique({
           where: { id: hotel.redeId }
         })
        
        console.log(`🏨 Gerando post para hotel ${hotel.name} da rede ${rede?.name || 'N/A'}...`)
        
        const context = `Hotel ${hotel.name} da rede ${rede?.name || 'N/A'}, localizado em ${hotel.city}, ${hotel.state}, ${hotel.country}. Voltado para ${hotel.travelType}, público ${hotel.audience}, melhor época: ${hotel.season}. Eventos locais: ${hotel.events}. Preferências de tema: ${hotel.themePreferences || 'geral'}`
        console.log(`📝 Contexto: ${context}`)
        
        const postData = await generatePostIdeas(`Gere uma ideia de post para: ${context}`)
        const title = postData.title || `Descubra ${hotel.city} - ${hotel.name}`
        console.log(`💡 Título gerado: ${title}`)

        const content = await generateMarkdownPostFromTitle(title, hotel)
        console.log(`📄 Conteúdo gerado (${content.length} caracteres)`)
        
        const imageUrl = await generateBlogImage(`${title}, ${hotel.name}, ${hotel.city}, ${rede?.name || 'hotel'}, ${hotel.season}`)
        console.log(`🖼️ Imagem gerada: ${imageUrl}`)

        const post = await prisma.post.create({
          data: {
            title,
            content,
            imageUrl,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            hotelId: hotel.id,
            authorId: hotel.ownerId,
            publishedAt: new Date() // publica imediatamente
          }
        })
        console.log(`✅ Post criado com ID: ${post.id}`)

        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { lastAutoPostAt: new Date() }
        })
        console.log(`🔄 Hotel ${hotel.id} atualizado com lastAutoPostAt`)

        await prisma.automationLog.create({
          data: {
            hotelId: hotel.id,
            postId: post.id,
            status: 'success',
            message: `Post criado com sucesso: "${title}"`
          }
        })
        
        results.push({ hotelId: hotel.id, status: 'success', title })
      } catch (error) {
        console.error(`❌ Erro ao gerar post para hotel ${hotel.id}:`, error)
        
        await prisma.automationLog.create({
          data: {
            hotelId: hotel.id,
            status: 'error',
            message: `Erro ao gerar post para hotel ${hotel.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }
        })
        
        results.push({ hotelId: hotel.id, status: 'error', error: error instanceof Error ? error.message : 'Erro desconhecido' })
      }
    }

    // Log de conclusão da automação
    if (firstHotel) {
      await prisma.automationLog.create({
        data: {
          hotelId: firstHotel.id,
          status: 'success',
          message: `Processados ${results.length} hotéis. Resultados: ${JSON.stringify(results)}`
        }
      })
    }
    
    return NextResponse.json({ 
      status: 'completed', 
      processed: results.length,
      results 
    })
  } catch (error) {
    console.error('Erro na função cron:', error)
    
    // Log de erro geral da automação
    try {
      const firstHotel = await prisma.hotel.findFirst({ where: { autoGeneratePosts: true } })
      if (firstHotel) {
        await prisma.automationLog.create({
          data: {
            hotelId: firstHotel.id,
            status: 'error',
            message: `Erro geral na execução do cron job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }
        })
      }
    } catch (logError) {
      console.error('Erro ao criar log de automação:', logError)
    }
    
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}