import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken, isSuperAdmin } from '../../../../../lib/permissions'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    // Apenas superadmin pode acessar todas as redes
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas superadministradores podem acessar esta funcionalidade.' }, { status: 403 })
    }

    // Buscar todas as redes do sistema
    const redes = await prisma.rede.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        hotels: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            country: true,
            slug: true,
            _count: {
              select: {
                posts: true
              }
            }
          }
        },
        _count: {
          select: {
            hotels: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(redes)
  } catch (error) {
    console.error('Erro ao buscar redes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}