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

    const updatedPost = await prisma.post.update({
      where: {
        id: params.id
      },
      data: {
        title,
        content,
        slug,
        imageUrl,
        publishedAt: shouldPublishNow ? now : undefined,
        scheduledAt: scheduleDate
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

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Erro ao atualizar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}