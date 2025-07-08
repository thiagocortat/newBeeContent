#!/usr/bin/env npx tsx

/**
 * Script de seed para ambiente de produção
 * Popula o banco PostgreSQL com usuários de teste
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de produção...')

  // Verificar se é ambiente de produção
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Este script deve ser executado apenas em produção')
    return
  }

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL não configurada')
    return
  }

  try {
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
    
    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`✅ Usuário ${userData.email} já existe - atualizando senha`)
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            password: userData.password,
            role: userData.role
          }
        })
      } else {
        console.log(`➕ Criando usuário ${userData.email}`)
        await prisma.user.create({
          data: userData
        })
      }
    }

    // Criar rede e hotel de exemplo se não existirem
    console.log('🏨 Verificando rede e hotel de exemplo...')
    
    const superadminUser = await prisma.user.findUnique({
      where: { email: 'superadmin@beecontent.com' }
    })

    if (!superadminUser) {
      console.log('❌ Usuário superadmin não encontrado')
      return
    }
    
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
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@beecontent.com' }
    })

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

    console.log('\n🎉 Seed de produção concluído com sucesso!')
    console.log('\n📋 Credenciais de acesso:')
    console.log('- superadmin@beecontent.com / superadmin123')
    console.log('- admin@beecontent.com / admin123')
    console.log('- editor@beecontent.com / editor123')
    console.log('- viewer@beecontent.com / viewer123')
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })