import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const token = req.cookies.get('token')?.value
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return new Response('Unauthorized', { status: 401 })
    }

    const user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      hotelId: decoded.hotelId,
      redeId: decoded.redeId
    }

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    if (!user.hotelId && user.role !== 'admin' && user.role !== 'superadmin') {
      return new Response('Forbidden', { status: 403 })
    }

    const where = user.role === 'superadmin'
      ? {}
      : user.role === 'admin'
      ? { hotel: { redeId: user.redeId || undefined } }
      : { hotelId: user.hotelId || undefined }

    const logs = await prisma.automationLog.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        hotel: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return Response.json(logs)
  } catch (error) {
    console.error('Error fetching automation logs:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}