import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'
import jwt from 'jsonwebtoken'

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

    // Buscar usuário com suas permissões
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        redeRoles: true,
        hotelRoles: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar hotéis baseado nas permissões do usuário
    let userHotels: any[] = []
    
    if (user.role === 'superadmin') {
      // Superadmin pode ver todos os hotéis
      userHotels = await prisma.hotel.findMany({
        include: {
          rede: true
        }
      })
    } else {
      // Buscar hotéis onde o usuário é proprietário
      const ownedHotels = await prisma.hotel.findMany({
        where: { ownerId: userId },
        include: {
          rede: true
        }
      })
      
      // Buscar hotéis onde o usuário tem roles específicos
      const hotelIds = user.hotelRoles.map((role: any) => role.hotelId)
      const roleHotels = hotelIds.length > 0 ? await prisma.hotel.findMany({
        where: { id: { in: hotelIds } },
        include: {
          rede: true
        }
      }) : []
      
      // Combinar hotéis únicos
      const allHotels = [...ownedHotels, ...roleHotels]
      userHotels = allHotels.filter((hotel: any, index: number, self: any[]) => 
        index === self.findIndex((h: any) => h.id === hotel.id)
      )
    }

    if (userHotels.length === 0) {
      return NextResponse.json({ 
        posts: [],
        hotels: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalPosts: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    }

    // Extrair IDs dos hotéis
    const hotelIds = userHotels.map((hotel: any) => hotel.id)

    // Parâmetros de paginação
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = 10
    const skip = (page - 1) * limit

    // Buscar posts de todos os hotéis do usuário com paginação
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where: { 
          hotelId: {
            in: hotelIds
          }
        },
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
          hotel: {
            include: {
              rede: true
            }
          }
        },
      }),
      prisma.post.count({
        where: { 
          hotelId: {
            in: hotelIds
          }
        }
      })
    ])

    const totalPages = Math.ceil(totalPosts / limit)

    return NextResponse.json({
      posts,
      hotels: userHotels,
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