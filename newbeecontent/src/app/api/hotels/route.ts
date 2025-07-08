import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromToken, canManageRede } from '../../../../lib/permissions'

const prisma = new PrismaClient()

// Função para gerar slug único
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const redeId = searchParams.get('redeId')
    const listAll = searchParams.get('listAll')

    // Se listAll=true, retorna todos os hotéis para o dashboard de automação
    if (listAll === 'true') {
      const user = await getUserFromToken(req)
      if (!user) {
        return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
      }

      const hotels = await prisma.hotel.findMany({
        include: {
          rede: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json(hotels)
    }

    // Funcionalidade original para buscar hotel específico
    if (!slug || !redeId) {
      return NextResponse.json({ error: 'Slug e redeId são obrigatórios' }, { status: 400 })
    }

    const hotel = await prisma.hotel.findFirst({
      where: {
        slug: slug,
        redeId: redeId
      }
    })

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel não encontrado' }, { status: 404 })
    }

    return NextResponse.json(hotel)
  } catch (error) {
    console.error('Erro ao buscar hotel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const user = await getUserFromToken(req)
    if (!user) {
      return NextResponse.json({ error: 'Token não fornecido ou inválido' }, { status: 401 })
    }
    
    const body = await req.json()
    const { name, city, state, country, travelType, audience, season, events, customDomain, redeId } = body

    // Validar campos obrigatórios
    if (!name || !city || !state || !country || !redeId) {
      return NextResponse.json({ error: 'Nome, cidade, estado, país e redeId são obrigatórios' }, { status: 400 })
    }

    // Verificar se o usuário pode gerenciar a rede
    if (!canManageRede(user, redeId)) {
      return NextResponse.json({ error: 'Acesso negado. Você não tem permissão para criar hotéis nesta rede.' }, { status: 403 })
    }

    // Verificar se a rede existe
    const rede = await prisma.rede.findUnique({
      where: { id: redeId }
    })

    if (!rede) {
      return NextResponse.json({ error: 'Rede não encontrada' }, { status: 404 })
    }

    // Gerar slug único
    let slug = generateSlug(name)
    let counter = 1
    
    // Verificar se o slug já existe e gerar um único
    while (await prisma.hotel.findFirst({ where: { slug } })) {
      slug = `${generateSlug(name)}-${counter}`
      counter++
    }

    // Criar o hotel
    const hotel = await prisma.hotel.create({
      data: {
        name,
        slug,
        city,
        state,
        country,
        travelType,
        audience,
        season,
        events,
        customDomain,
        redeId,
        ownerId: user.id
      }
    })

    return NextResponse.json(hotel, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar hotel:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}