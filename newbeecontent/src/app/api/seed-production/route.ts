import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verificar se é ambiente de produção
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'Este endpoint só funciona em produção' },
        { status: 403 }
      )
    }

    console.log('🌱 Iniciando seed do banco de produção...')

    // Criar usuários de teste
    const users = [
      {
        email: 'superadmin@beecontent.com',
        password: await bcrypt.hash('superadmin123', 10),
        role: 'superadmin'
      },
      {
        email: 'admin@beecontent.com', 
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      },
      {
        email: 'editor@beecontent.com',
        password: await bcrypt.hash('editor123', 10),
        role: 'editor'
      },
      {
        email: 'viewer@beecontent.com',
        password: await bcrypt.hash('viewer123', 10),
        role: 'viewer'
      }
    ]

    console.log('👥 Criando usuários de teste...')
    
    const createdUsers = []
    
    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`✅ Usuário ${userData.email} já existe - atualizando senha`)
        const updatedUser = await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: userData.password,
            role: userData.role
          }
        })
        createdUsers.push(updatedUser)
      } else {
        console.log(`➕ Criando usuário ${userData.email}`)
        const newUser = await prisma.user.create({
          data: userData
        })
        createdUsers.push(newUser)
      }
    }

    // Buscar o superadmin
    const superadminUser = createdUsers.find(u => u.email === 'superadmin@beecontent.com')
    
    if (!superadminUser) {
      return NextResponse.json(
        { error: 'Usuário superadmin não encontrado' },
        { status: 500 }
      )
    }

    // Criar rede e hotel de exemplo se não existirem
    console.log('🏨 Verificando rede e hotel de exemplo...')
    
    let rede = await prisma.rede.findFirst({
      where: { name: 'Rede Exemplo' }
    })

    if (!rede) {
      console.log('➕ Criando rede de exemplo')
      rede = await prisma.rede.create({
        data: {
          name: 'Rede Exemplo',
          slug: 'rede-exemplo',
          ownerId: superadminUser.id
        }
      })
    }

    let hotel = await prisma.hotel.findFirst({
      where: { name: 'Hotel Exemplo' }
    })

    if (!hotel) {
      console.log('➕ Criando hotel de exemplo')
      hotel = await prisma.hotel.create({
        data: {
          name: 'Hotel Exemplo',
          slug: 'hotel-exemplo',
          city: 'São Paulo',
          state: 'SP',
          country: 'Brasil',
          travelType: 'business',
          audience: 'business',
          season: 'year-round',
          events: 'Eventos corporativos, feiras de negócios',
          redeId: rede.id,
          ownerId: superadminUser.id
        }
      })
    }

    // Atribuir roles aos usuários
    console.log('🔐 Configurando permissões...')
    
    const admin = createdUsers.find(u => u.email === 'admin@beecontent.com')

    if (superadminUser && admin) {
      // Verificar se já existem roles
      const existingRoles = await prisma.userRedeRole.findMany({
        where: {
          OR: [
            { userId: superadminUser.id },
            { userId: admin.id }
          ]
        }
      })

      if (existingRoles.length === 0) {
        await prisma.userRedeRole.createMany({
          data: [
            {
              userId: superadminUser.id,
              redeId: rede.id,
              role: 'admin'
            },
            {
              userId: admin.id,
              redeId: rede.id,
              role: 'admin'
            }
          ]
        })
        console.log('✅ Roles atribuídas aos usuários')
      } else {
        console.log('✅ Roles já existem')
      }
    }

    console.log('🎉 Seed de produção concluído com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Seed de produção executado com sucesso',
      users: createdUsers.map(u => ({ email: u.email, role: u.role })),
      credentials: [
        'superadmin@beecontent.com / superadmin123',
        'admin@beecontent.com / admin123',
        'editor@beecontent.com / editor123',
        'viewer@beecontent.com / viewer123'
      ]
    })
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}