import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const season = searchParams.get('season')
    const hotelId = searchParams.get('hotelId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10
    const skip = (page - 1) * limit

    // Se não há hotelId, buscar o hotel padrão (primeiro hotel)
    let targetHotelId = hotelId
    if (!targetHotelId) {
      const defaultHotel = await prisma.hotel.findFirst()
      if (!defaultHotel) {
        return NextResponse.json({ error: 'Nenhum hotel encontrado' }, { status: 404 })
      }
      targetHotelId = defaultHotel.id
    }

    // Buscar posts publicados com paginação
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: {
           hotelId: targetHotelId,
           publishedAt: {
             not: null
           },
          hotel: {
            city: city || undefined,
            season: season || undefined
          }
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          hotel: {
            select: {
              name: true,
              city: true,
              customDomain: true
            }
          },
          author: {
            select: {
              email: true
            }
          }
        }
      }),
      prisma.post.count({
        where: {
           hotelId: targetHotelId,
           publishedAt: {
             not: null
           },
          hotel: {
            city: city || undefined,
            season: season || undefined
          }
        }
      })
    ])

    const totalPages = Math.ceil(totalPosts / limit)

    return NextResponse.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Erro ao buscar posts públicos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Criar novo post
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    let userId: string
    try {
      const jwt = require('jsonwebtoken')
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
    const { title, content, slug, imageUrl, scheduledAt } = body

    // Validação básica
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    const authorId = userId
    const hotelId = userHotel.id

    // Determinar se deve publicar imediatamente ou agendar
    const now = new Date()
    const scheduleDate = scheduledAt ? new Date(scheduledAt) : null
    const shouldPublishNow = !scheduleDate || scheduleDate <= now

    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        imageUrl,
        authorId,
        hotelId,
        publishedAt: shouldPublishNow ? now : undefined,
        scheduledAt: scheduleDate
      },
      include: {
        author: {
          select: {
            email: true
          }
        },
        hotel: {
          select: {
            name: true,
            city: true
          }
        }
      }
    })

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}