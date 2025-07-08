import { NextRequest } from 'next/server'
import { prisma } from '../../../../../lib/database'
import jwt from 'jsonwebtoken'

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const { hotelId, status } = await req.json()

    if (!hotelId || typeof status !== 'boolean') {
      return Response.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const updated = await prisma.hotel.update({
      where: { id: hotelId },
      data: { autoGeneratePosts: status },
      include: {
        rede: true
      }
    })

    return Response.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar automação:', error)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}