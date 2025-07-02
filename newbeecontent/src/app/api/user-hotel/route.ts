import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

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
        country: true,
        travelType: true,
        audience: true,
        season: true,
        events: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Nenhum hotel encontrado para este usuário' },
        { status: 404 }
      )
    }

    return NextResponse.json({ hotel })
  } catch (error) {
    console.error('Erro ao buscar hotel do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}