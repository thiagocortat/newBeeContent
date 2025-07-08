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

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 401 })
    }

    const hotels = await prisma.hotel.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(hotels)
  } catch (error) {
    console.error('Erro ao buscar hotéis (admin):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 401 })
    }

    const { name, city, state, country, travelType, audience, season, events, customDomain, ownerId, redeId } = await req.json()

    // Verificar se o proprietário existe
    const owner = await prisma.user.findUnique({
      where: { id: ownerId }
    })

    if (!owner) {
      return NextResponse.json({ error: 'Proprietário não encontrado' }, { status: 400 })
    }

    // Verificar se a rede existe
    const rede = await prisma.rede.findUnique({
      where: { id: redeId }
    })

    if (!rede) {
      return NextResponse.json({ error: 'Rede não encontrada' }, { status: 400 })
    }

    // Gerar slug único baseado no nome
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    let slug = baseSlug
    let counter = 1
    
    // Verificar se o slug já existe na rede
    while (await prisma.hotel.findFirst({ where: { slug, redeId } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Verificar se o domínio já está em uso
    if (customDomain) {
      const existingHotel = await prisma.hotel.findFirst({
        where: { customDomain }
      })

      if (existingHotel) {
        return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 })
      }
    }

    const hotel = await prisma.hotel.create({
      data: {
        name,
        slug,
        city,
        state,
        country,
        travelType,
        audience,
        season,
        events,
        customDomain,
        ownerId,
        redeId
      },
      include: {
        owner: {
          select: {
            email: true,
            role: true
          }
        },
        rede: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            posts: true
          }
        }
      }
    })

    return NextResponse.json(hotel, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar hotel (admin):', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}