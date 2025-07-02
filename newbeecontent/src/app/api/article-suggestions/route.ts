import { NextRequest, NextResponse } from 'next/server'
import { generateArticleSuggestions } from '../../../../lib/groq'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { hotelId } = await req.json()

    if (!hotelId) {
      return NextResponse.json(
        { error: 'ID do hotel é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do hotel
    const hotel = await prisma.hotel.findFirst({
      where: {
        id: hotelId,
        ownerId: userId // Garantir que o usuário é dono do hotel
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel não encontrado ou acesso negado' },
        { status: 404 }
      )
    }

    // Gerar sugestões baseadas nos dados do hotel
    const suggestions = await generateArticleSuggestions({
      name: hotel.name,
      city: hotel.city,
      state: hotel.state,
      country: hotel.country,
      travelType: hotel.travelType,
      audience: hotel.audience,
      season: hotel.season,
      events: hotel.events
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Erro ao gerar sugestões de artigos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}