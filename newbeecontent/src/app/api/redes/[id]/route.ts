import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken, isSuperAdmin } from '../../../../../lib/permissions'

const prisma = new PrismaClient()

// DELETE - Deletar uma rede e todos os hotéis relacionados
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }

    // Apenas superadmin pode deletar redes
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Acesso negado. Apenas superadministradores podem deletar redes.' }, { status: 403 })
    }

    const redeId = params.id

    // Verificar se a rede existe
    const rede = await prisma.rede.findUnique({
      where: { id: redeId },
      include: {
        _count: {
          select: {
            hotels: true
          }
        }
      }
    })

    if (!rede) {
      return NextResponse.json({ error: 'Rede não encontrada' }, { status: 404 })
    }

    // Usar transação para garantir que tudo seja deletado corretamente
    await prisma.$transaction(async (tx) => {
      // 1. Deletar todos os posts dos hotéis da rede
      await tx.post.deleteMany({
        where: {
          hotel: {
            redeId: redeId
          }
        }
      })

      // 2. Deletar todos os hotéis da rede
      await tx.hotel.deleteMany({
        where: {
          redeId: redeId
        }
      })

      // 3. Deletar todas as roles de usuários relacionadas à rede
      await tx.userRedeRole.deleteMany({
        where: {
          redeId: redeId
        }
      })

      // 4. Finalmente, deletar a rede
      await tx.rede.delete({
        where: {
          id: redeId
        }
      })
    })

    return NextResponse.json({ 
      message: `Rede "${rede.name}" e todos os ${rede._count.hotels} hotéis relacionados foram deletados com sucesso.` 
    })
  } catch (error) {
    console.error('Erro ao deletar rede:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}