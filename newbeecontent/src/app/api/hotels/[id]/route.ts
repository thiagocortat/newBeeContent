import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const hotel = await prisma.hotel.findFirst({
      where: {
        id: params.id,
        ownerId: decoded.userId
      }
    })

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Erro ao buscar hotel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
    const data = await req.json()

    // Verificar se o hotel pertence ao usuário
    const existingHotel = await prisma.hotel.findFirst({
      where: {
        id: params.id,
        ownerId: decoded.userId
      }
    })

    if (!existingHotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    // Verificar se o domínio já está em uso por outro hotel
    if (data.customDomain && data.customDomain !== existingHotel.customDomain) {
      const domainInUse = await prisma.hotel.findFirst({
        where: {
          customDomain: data.customDomain,
          NOT: {
            id: params.id
          }
        }
      })

      if (domainInUse) {
        return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 })
      }
    }

    const hotel = await prisma.hotel.update({
      where: {
        id: params.id
      },
      data
    })

    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Erro ao atualizar hotel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Verificar se o hotel pertence ao usuário
    const existingHotel = await prisma.hotel.findFirst({
      where: {
        id: params.id,
        ownerId: decoded.userId
      }
    })

    if (!existingHotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    // Verificar se há posts associados
    const postsCount = await prisma.post.count({
      where: {
        hotelId: params.id
      }
    })

    if (postsCount > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir hotel com posts associados' 
      }, { status: 400 })
    }

    await prisma.hotel.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ message: 'Hotel excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir hotel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}