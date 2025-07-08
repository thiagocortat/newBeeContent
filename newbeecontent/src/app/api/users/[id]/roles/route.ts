import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken, isSuperAdmin } from '../../../../../../lib/permissions'

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas superadmins podem gerenciar roles.' }, { status: 403 })
    }

    const { type, entityId, role } = await req.json()

    if (!type || !entityId || !role) {
      return NextResponse.json({ error: 'Tipo, ID da entidade e role são obrigatórios' }, { status: 400 })
    }

    if (!['rede', 'hotel'].includes(type)) {
      return NextResponse.json({ error: 'Tipo deve ser "rede" ou "hotel"' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (type === 'rede') {
      if (!['admin'].includes(role)) {
        return NextResponse.json({ error: 'Role inválido para rede. Use: admin' }, { status: 400 })
      }

      const rede = await prisma.rede.findUnique({
        where: { id: entityId }
      })

      if (!rede) {
        return NextResponse.json({ error: 'Rede não encontrada' }, { status: 404 })
      }

      const existingRole = await prisma.userRedeRole.findUnique({
        where: {
          userId_redeId: {
            userId: params.id,
            redeId: entityId
          }
        }
      })

      if (existingRole) {
        return NextResponse.json({ error: 'Usuário já possui role nesta rede' }, { status: 400 })
      }

      const newRole = await prisma.userRedeRole.create({
        data: {
          userId: params.id,
          redeId: entityId,
          role
        },
        include: {
          rede: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      return NextResponse.json(newRole, { status: 201 })
    } else {
      if (!['editor', 'viewer'].includes(role)) {
        return NextResponse.json({ error: 'Role inválido para hotel. Use: editor, viewer' }, { status: 400 })
      }

      const hotel = await prisma.hotel.findUnique({
        where: { id: entityId }
      })

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
      }

      const existingRole = await prisma.userHotelRole.findUnique({
        where: {
          userId_hotelId: {
            userId: params.id,
            hotelId: entityId
          }
        }
      })

      if (existingRole) {
        return NextResponse.json({ error: 'Usuário já possui role neste hotel' }, { status: 400 })
      }

      const newRole = await prisma.userHotelRole.create({
        data: {
          userId: params.id,
          hotelId: entityId,
          role
        },
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
      })

      return NextResponse.json(newRole, { status: 201 })
    }
  } catch (error) {
    console.error('Erro ao criar role:', error)
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
      return NextResponse.json({ error: 'Acesso negado. Apenas superadmins podem gerenciar roles.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const entityId = searchParams.get('entityId')

    if (!type || !entityId) {
      return NextResponse.json({ error: 'Tipo e ID da entidade são obrigatórios' }, { status: 400 })
    }

    if (!['rede', 'hotel'].includes(type)) {
      return NextResponse.json({ error: 'Tipo deve ser "rede" ou "hotel"' }, { status: 400 })
    }

    if (type === 'rede') {
      const existingRole = await prisma.userRedeRole.findUnique({
        where: {
          userId_redeId: {
            userId: params.id,
            redeId: entityId
          }
        }
      })

      if (!existingRole) {
        return NextResponse.json({ error: 'Role não encontrado' }, { status: 404 })
      }

      await prisma.userRedeRole.delete({
        where: {
          userId_redeId: {
            userId: params.id,
            redeId: entityId
          }
        }
      })
    } else {
      const existingRole = await prisma.userHotelRole.findUnique({
        where: {
          userId_hotelId: {
            userId: params.id,
            hotelId: entityId
          }
        }
      })

      if (!existingRole) {
        return NextResponse.json({ error: 'Role não encontrado' }, { status: 404 })
      }

      await prisma.userHotelRole.delete({
        where: {
          userId_hotelId: {
            userId: params.id,
            hotelId: entityId
          }
        }
      })
    }

    return NextResponse.json({ message: 'Role removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover role:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}