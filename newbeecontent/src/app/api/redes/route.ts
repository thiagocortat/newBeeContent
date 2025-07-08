import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken, isSuperAdmin } from '../../../../lib/permissions'

const prisma = new PrismaClient()

// GET - Listar redes do usuário
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    let redes
    
    if (isSuperAdmin(user)) {
      // Superadmin pode ver todas as redes
      redes = await prisma.rede.findMany({
        include: {
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
    } else {
      // Buscar redes onde o usuário é proprietário ou tem role de admin
      redes = await prisma.rede.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            {
              userRoles: {
                some: {
                  userId: user.id,
                  role: 'admin'
                }
              }
            }
          ]
        },
        include: {
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
    }

    return NextResponse.json(redes)
  } catch (error) {
    console.error('Erro ao buscar redes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova rede
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    // Apenas superadmin ou usuários com permissão podem criar redes
    if (!isSuperAdmin(user) && user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Você não tem permissão para criar redes.' }, { status: 403 })
    }

    const { name, slug } = await req.json()

    // Validação
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o slug já existe
    const existingRede = await prisma.rede.findUnique({
      where: { slug }
    })

    if (existingRede) {
      return NextResponse.json(
        { error: 'Este slug já está em uso' },
        { status: 400 }
      )
    }

    // Criar a rede
    const rede = await prisma.rede.create({
      data: {
        name,
        slug,
        ownerId: user.id
      },
      include: {
        _count: {
          select: {
            hotels: true
          }
        }
      }
    })

    return NextResponse.json(rede, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar rede:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}