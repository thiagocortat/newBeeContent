import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

    // Buscar o hotel do usuário
    const userHotel = await prisma.hotel.findFirst({
      where: {
        ownerId: userId
      }
    })

    if (!userHotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    // Parâmetros de paginação
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 10
    const skip = (page - 1) * limit

    // Buscar posts do hotel com paginação
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: { hotelId: userHotel.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          publishedAt: true,
          scheduledAt: true,
          createdAt: true,
        },
      }),
      prisma.post.count({
        where: { hotelId: userHotel.id }
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
    console.error('Erro ao buscar posts do hotel:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}