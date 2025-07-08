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

    let decoded: { userId: string }
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    // Buscar usuário com suas permissões
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      userHotels = await prisma.hotel.findMany()
    } else {
      // Buscar hotéis onde o usuário é proprietário
      const ownedHotels = await prisma.hotel.findMany({
        where: { ownerId: decoded.userId }
      })
      
      // Buscar hotéis onde o usuário tem roles específicos
       const hotelIds = user.hotelRoles.map((role: any) => role.hotelId)
       const roleHotels = hotelIds.length > 0 ? await prisma.hotel.findMany({
         where: { id: { in: hotelIds } }
       }) : []
       
       // Combinar hotéis únicos
       const allHotels = [...ownedHotels, ...roleHotels]
       userHotels = allHotels.filter((hotel: any, index: number, self: any[]) => 
         index === self.findIndex((h: any) => h.id === hotel.id)
       )
    }

    if (userHotels.length === 0) {
      return NextResponse.json({ 
        analytics: [],
        hotels: []
      })
    }

    // Buscar visualizações dos posts dos hotéis do usuário
    const hotelIds = userHotels.map((hotel: any) => hotel.id)
    
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
            hotelId: true
          }
        })
        
        const hotel = userHotels.find((h: any) => h.id === post?.hotelId)
        
        return {
          postId: v.postId,
          title: post?.title || '',
          slug: post?.slug || '',
          hotelName: hotel?.name || '',
          views: v._count.id
        }
      })
    )

    // Ordenar por número de visualizações (decrescente)
    data.sort((a: ViewData, b: ViewData) => b.views - a.views)

    return NextResponse.json({
      analytics: data,
      hotels: userHotels.map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}