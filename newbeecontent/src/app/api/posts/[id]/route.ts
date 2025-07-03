import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/posts/[id] - Buscar post por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: params.id
      },
      include: {
        author: {
          select: {
            email: true
          }
        },
        hotel: {
          select: {
            name: true,
            city: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Erro ao buscar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Deletar post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 401 })
    }

    let userId: string
    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se o post existe e se pertence ao usuário
    const post = await prisma.post.findUnique({
      where: {
        id: params.id
      },
      include: {
        author: true
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o autor do post
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar este post' },
        { status: 403 }
      )
    }

    // Deletar o post
    await prisma.post.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json(
      { message: 'Post deletado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Atualizar post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, content, slug, imageUrl, scheduledAt } = body

    // Validação básica
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Determinar se deve publicar imediatamente ou agendar
    const now = new Date()
    const scheduleDate = scheduledAt ? new Date(scheduledAt) : null
    const shouldPublishNow = !scheduleDate || scheduleDate <= now

    const updateData: any = {
      title,
      content,
      slug,
      imageUrl,
      publishedAt: shouldPublishNow ? now : undefined
    }

    if (scheduleDate) {
      updateData.scheduledAt = scheduleDate
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        author: {
          select: {
            email: true
          }
        },
        hotel: {
          select: {
            name: true,
            city: true
          }
        }
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Erro ao atualizar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}