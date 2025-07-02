import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// GET - Buscar dados do hotel atual
export async function GET(req: NextRequest) {
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

    // Buscar o primeiro hotel do usuário
    const hotel = await prisma.hotel.findFirst({
      where: {
        ownerId: userId
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        travelType: true,
        season: true,
        events: true,
        autoGeneratePosts: true,
        postFrequency: true,
        themePreferences: true,
        maxMonthlyPosts: true,
        lastAutoPostAt: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Erro ao buscar hotel:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações do hotel
export async function PUT(req: NextRequest) {
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

    // Buscar o hotel do usuário
    const userHotel = await prisma.hotel.findFirst({
      where: {
        ownerId: userId
      }
    })

    if (!userHotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    const body = await req.json()

    // Validar dados recebidos
    const {
      autoGeneratePosts,
      postFrequency,
      themePreferences,
      maxMonthlyPosts
    } = body

    // Validações básicas
    if (autoGeneratePosts && !postFrequency) {
      return NextResponse.json(
        { error: 'Frequência é obrigatória quando automação está ativada' },
        { status: 400 }
      )
    }

    if (postFrequency && !['daily', 'weekly', 'biweekly'].includes(postFrequency)) {
      return NextResponse.json(
        { error: 'Frequência inválida' },
        { status: 400 }
      )
    }

    if (maxMonthlyPosts && (maxMonthlyPosts < 1 || maxMonthlyPosts > 31)) {
      return NextResponse.json(
        { error: 'Máximo de posts deve estar entre 1 e 31' },
        { status: 400 }
      )
    }

    // Atualizar hotel
    const updatedHotel = await prisma.hotel.update({
      where: { id: userHotel.id },
      data: {
        autoGeneratePosts: Boolean(autoGeneratePosts),
        postFrequency: autoGeneratePosts ? postFrequency : null,
        themePreferences: themePreferences || null,
        maxMonthlyPosts: maxMonthlyPosts || null
      },
      select: {
        id: true,
        name: true,
        autoGeneratePosts: true,
        postFrequency: true,
        themePreferences: true,
        maxMonthlyPosts: true,
        lastAutoPostAt: true
      }
    })

    return NextResponse.json({
      message: 'Configurações atualizadas com sucesso',
      hotel: updatedHotel
    })
  } catch (error) {
    console.error('Erro ao atualizar hotel:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}