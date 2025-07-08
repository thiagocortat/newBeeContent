import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  let prisma: PrismaClient | null = null
  
  try {
    console.log('🌱 Iniciando seed do banco de dados...')
    
    // Criar instância do Prisma sem extensões
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Verificar se já existe dados
    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json({
        message: 'Banco já populado!',
        data: {
          admin: { email: existingUser.email },
          credentials: {
            email: 'admin@beecontent.com',
            password: 'admin123'
          }
        }
      })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@beecontent.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    // Criar rede
    const rede = await prisma.rede.create({
      data: {
        name: 'Rede Exemplo',
        slug: 'rede-exemplo',
        ownerId: admin.id
      }
    })

    // Criar hotel
    const hotel = await prisma.hotel.create({
      data: {
        name: 'Hotel Exemplo',
        slug: 'hotel-exemplo',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        travelType: 'negócios',
        audience: 'executivos',
        season: 'ano todo',
        events: 'feiras e congressos',
        customDomain: 'hotel-exemplo.localhost',
        ownerId: admin.id,
        redeId: rede.id
      }
    })

    return NextResponse.json({
      message: 'Banco populado com sucesso!',
      data: {
        admin,
        rede,
        hotel,
        credentials: {
          email: 'admin@beecontent.com',
          password: 'admin123'
        }
      }
    })

  } catch (error) {
    console.error('Erro no seed:', error)
    return NextResponse.json(
      { 
        message: 'Erro ao popular banco',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}