import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()

function isAdmin(req: NextRequest): boolean {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return false
    
    const payload = verify(token, process.env.JWT_SECRET!) as any
    return payload && (payload.role === 'admin' || payload.role === 'superadmin')
  } catch {
    return false
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 401 })
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        posts: {
          select: {
            id: true,
            title: true,
            publishedAt: true,
            scheduledAt: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Erro ao buscar hotel (admin):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 401 })
    }

    const { name, city, state, country, travelType, audience, season, events, customDomain, autoGeneratePosts, ownerId } = await req.json()

    // Verificar se o hotel existe
    const existingHotel = await prisma.hotel.findUnique({
      where: { id: params.id }
    })

    if (!existingHotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    // Verificar se o novo proprietário existe (se fornecido)
    if (ownerId && ownerId !== existingHotel.ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId }
      })

      if (!owner) {
        return NextResponse.json({ error: 'Proprietário não encontrado' }, { status: 400 })
      }
    }

    // Verificar se o domínio já está em uso por outro hotel
    if (customDomain && customDomain !== existingHotel.customDomain) {
      const domainInUse = await prisma.hotel.findFirst({
        where: {
          customDomain,
          id: { not: params.id }
        }
      })

      if (domainInUse) {
        return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 })
      }
    }

    const hotel = await prisma.hotel.update({
      where: { id: params.id },
      data: {
        name,
        city,
        state,
        country,
        travelType,
        audience,
        season,
        events,
        customDomain,
        autoGeneratePosts,
        ownerId
      },
      include: {
        owner: {
          select: {
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Erro ao atualizar hotel (admin):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 401 })
    }

    // Verificar se o hotel existe
    const hotel = await prisma.hotel.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    // Verificar se há posts associados
    if (hotel._count.posts > 0) {
      return NextResponse.json({ 
        error: `Não é possível deletar o hotel. Existem ${hotel._count.posts} posts associados. Delete os posts primeiro.` 
      }, { status: 400 })
    }

    await prisma.hotel.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Hotel deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar hotel (admin):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}