import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generatePostIdeas } from '../../../../lib/groq'
import { generateBlogImage } from '../../../../lib/image-service'

const prisma = new PrismaClient()

// Função para gerar conteúdo completo do post usando Groq
async function generatePostFromGroq(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    const data = await response.json()
    console.error('Groq', data.choices[0]?.message?.content)
    return data.choices[0]?.message?.content || 'Conteúdo gerado automaticamente'
  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error)
    return 'Conteúdo gerado automaticamente'
  }
}

function shouldCreatePost(hotel: any): boolean {
  const now = new Date()
  const last = hotel.lastAutoPostAt || new Date(0)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  if (hotel.postFrequency === 'daily' && diffDays >= 1) return true
  if (hotel.postFrequency === 'weekly' && diffDays >= 7) return true
  if (hotel.postFrequency === 'biweekly' && diffDays >= 14) return true

  return false
}

export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { autoGeneratePosts: true }
    })

    const results = []

    for (const hotel of hotels) {
      if (!shouldCreatePost(hotel)) {
        results.push({ hotelId: hotel.id, status: 'skipped', reason: 'frequency not met' })
        continue
      }

      try {
        const context = `Hotel em ${hotel.city}, estado ${hotel.state}, voltado para ${hotel.travelType}, estação ${hotel.season}, eventos: ${hotel.events}`
        const postData = await generatePostIdeas(`Gere uma ideia de post para: ${context}`)
        const title = postData.title || 'Post automático'

        const content = await generatePostFromGroq(`Escreva um post de blog de 400 palavras com o título: ${title}`)
        const imageUrl = await generateBlogImage(`${title}, contexto: hotel em ${hotel.city}, ${hotel.season}`)

        await prisma.post.create({
          data: {
            title,
            content,
            imageUrl,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            hotelId: hotel.id,
            authorId: hotel.ownerId,
            publishedAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // publica amanhã
          }
        })

        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { lastAutoPostAt: new Date() }
        })

        results.push({ hotelId: hotel.id, status: 'success', title })
      } catch (error) {
        console.error(`Erro ao gerar post para hotel ${hotel.id}:`, error)
        results.push({ hotelId: hotel.id, status: 'error', error: error instanceof Error ? error.message : 'Erro desconhecido' })
      }
    }

    return NextResponse.json({ 
      status: 'completed', 
      processed: results.length,
      results 
    })
  } catch (error) {
    console.error('Erro na função cron:', error)
    return NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}