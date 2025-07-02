import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { hotels: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar visualizações dos posts dos hotéis do usuário
    const hotelIds = user.hotels.map(hotel => hotel.id)
    
    const views = await prisma.postView.groupBy({
      by: ['postId'],
      _count: {
        id: true
      },
      where: {
        post: {
          hotelId: {
            in: hotelIds
          }
        }
      }
    })

    interface ViewData {
      postId: string
      title: string
      slug: string
      hotelName: string
      views: number
    }

    const data: ViewData[] = await Promise.all(
      views.map(async (v: { postId: string; _count: { id: number } }) => {
        const post = await prisma.post.findUnique({
          where: { id: v.postId },
          select: { 
            title: true,
            slug: true,
            hotel: {
              select: {
                name: true
              }
            }
          }
        })
        return {
          postId: v.postId,
          title: post?.title || '',
          slug: post?.slug || '',
          hotelName: post?.hotel.name || '',
          views: v._count.id
        }
      })
    )

    // Ordenar por número de visualizações (decrescente)
    data.sort((a: ViewData, b: ViewData) => b.views - a.views)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}