import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken, isSuperAdmin } from '../../../../../lib/permissions'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas superadmins podem visualizar usuários.' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        redeRoles: {
          include: {
            rede: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        hotelRoles: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true
              }
            }
          }
        },
        _count: {
          select: {
            redes: true,
            hotels: true,
            posts: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(targetUser)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas superadmins podem editar usuários.' }, { status: 403 })
    }

    const { email, password, role } = await req.json()

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (role && !['superadmin', 'admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    if (email && email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Usuário com este email já existe' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas superadmins podem deletar usuários.' }, { status: 403 })
    }

    if (user.id === params.id) {
      return NextResponse.json({ error: 'Você não pode deletar sua própria conta' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            redes: true,
            hotels: true,
            posts: true
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (targetUser._count.redes > 0 || targetUser._count.hotels > 0 || targetUser._count.posts > 0) {
      return NextResponse.json({ 
        error: `Não é possível deletar o usuário. Existem ${targetUser._count.redes} redes, ${targetUser._count.hotels} hotéis e ${targetUser._count.posts} posts associados. Transfira ou delete esses recursos primeiro.` 
      }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}