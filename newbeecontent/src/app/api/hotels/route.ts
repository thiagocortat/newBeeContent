import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const hotels = await prisma.hotel.findMany({
      where: {
        ownerId: decoded.userId
      },
      select: {
        id: true,
        name: true,
        customDomain: true,
        city: true,
        state: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(hotels)
  } catch (error) {
    console.error('Erro ao buscar hotéis:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { name, city, state, country, travelType, audience, season, events, customDomain } = await req.json()

    // Verificar se o domínio já está em uso
    if (customDomain) {
      const existingHotel = await prisma.hotel.findFirst({
        where: {
          customDomain,
          NOT: {
            ownerId: decoded.userId
          }
        }
      })

      if (existingHotel) {
        return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 })
      }
    }

    const hotel = await prisma.hotel.create({
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
        ownerId: decoded.userId
      }
    })

    return NextResponse.json(hotel, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar hotel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}