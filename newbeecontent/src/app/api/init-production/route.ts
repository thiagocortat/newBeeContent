import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verificar se é ambiente de produção
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        { error: 'Este endpoint só funciona em produção' },
        { status: 403 }
      )
    }

    // Verificar se já existem usuários (para evitar execução múltipla)
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Banco já foi inicializado',
        existingUsers,
        credentials: [
          'superadmin@beecontent.com / superadmin123',
          'admin@beecontent.com / admin123',
          'editor@beecontent.com / editor123',
          'viewer@beecontent.com / viewer123'
        ]
      })
    }

    console.log('🌱 Iniciando inicialização do banco de produção...')

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
      console.log(`➕ Criando usuário ${userData.email}`)
      const newUser = await prisma.user.create({
        data: userData
      })
      createdUsers.push(newUser)
    }

    // Buscar o superadmin
    const superadminUser = createdUsers.find(u => u.email === 'superadmin@beecontent.com')
    
    if (!superadminUser) {
      return NextResponse.json(
        { error: 'Usuário superadmin não encontrado' },
        { status: 500 }
      )
    }

    // Criar rede de exemplo
    const rede = await prisma.rede.create({
      data: {
        name: 'Rede Exemplo',
        slug: 'rede-exemplo',
        ownerId: superadminUser.id
      }
    })

    // Criar hotel de exemplo
    const hotel = await prisma.hotel.create({
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
        customDomain: '',
        autoGeneratePosts: false,
        postFrequency: 'weekly',
        redeId: rede.id,
        ownerId: superadminUser.id
      }
    })

    // Atribuir roles aos usuários
    console.log('🔐 Configurando permissões...')
    
    const adminUser = createdUsers.find(u => u.email === 'admin@beecontent.com')
     const editorUser = createdUsers.find(u => u.email === 'editor@beecontent.com')
     const viewerUser = createdUsers.find(u => u.email === 'viewer@beecontent.com')

     if (!adminUser || !editorUser || !viewerUser) {
       throw new Error('Usuários necessários não foram encontrados')
     }

     // Atribuir roles específicos para rede e hotel
     await prisma.userRedeRole.create({
       data: {
         userId: superadminUser.id,
         redeId: rede.id,
         role: 'admin'
       }
     })
     
     await prisma.userRedeRole.create({
       data: {
         userId: adminUser.id,
         redeId: rede.id,
         role: 'admin'
       }
     })

     await prisma.userHotelRole.create({
       data: {
         userId: editorUser.id,
         hotelId: hotel.id,
         role: 'editor'
       }
     })

     await prisma.userHotelRole.create({
       data: {
         userId: viewerUser.id,
         hotelId: hotel.id,
         role: 'viewer'
       }
     })
    
    console.log('✅ Roles atribuídas aos usuários')

    console.log('🎉 Inicialização de produção concluída com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Banco de produção inicializado com sucesso',
      users: createdUsers.map(u => ({ email: u.email, role: u.role })),
      rede: { name: rede.name, slug: rede.slug },
      hotel: { name: hotel.name, slug: hotel.slug },
      credentials: [
        'superadmin@beecontent.com / superadmin123',
        'admin@beecontent.com / admin123',
        'editor@beecontent.com / editor123',
        'viewer@beecontent.com / viewer123'
      ]
    })
    
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}