import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')
  
  // Definir roles disponíveis
  const roles = ['superadmin', 'admin', 'editor', 'viewer']
  const users: any = {}
  
  // Criar usuários para cada role
  for (const role of roles) {
    const hashedPassword = await bcrypt.hash(`${role}123`, 10)
    
    const user = await prisma.user.upsert({
      where: { email: `${role}@beecontent.com` },
      update: {},
      create: {
        email: `${role}@beecontent.com`,
        password: hashedPassword,
        role: role
      }
    })
    
    users[role] = user
    
    console.log(`✅ ${role.charAt(0).toUpperCase() + role.slice(1)} criado/atualizado:`)
    console.log(`   Email: ${role}@beecontent.com`)
    console.log(`   Senha: ${role}123`)
    console.log('   ID:', user.id)
  }
  
  // Criar rede de exemplo (usando superadmin como owner)
  const rede = await prisma.rede.upsert({
    where: { slug: 'rede-exemplo' },
    update: {},
    create: {
      name: 'Rede Exemplo',
      slug: 'rede-exemplo',
      ownerId: users.superadmin.id
    }
  })

  console.log('✅ Rede criada/atualizada:')
  console.log('   Nome:', rede.name)
  console.log('   ID:', rede.id)
  
  // Criar hotel de exemplo (usando superadmin como owner para manter consistência)
  const hotel = await prisma.hotel.upsert({
    where: { customDomain: 'localhost:3000' },
    update: {},
    create: {
      name: 'Hotel Exemplo',
      slug: 'hotel-exemplo',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      travelType: 'business',
      audience: 'business',
      season: 'year-round',
      events: 'Eventos corporativos, feiras de negócios',
      customDomain: 'localhost:3000',
      autoGeneratePosts: false,
      postFrequency: 'weekly',
      redeId: rede.id,
      ownerId: users.superadmin.id
    }
  })

  console.log('✅ Hotel de exemplo criado/atualizado:')
  console.log('   Nome:', hotel.name)
  console.log('   ID:', hotel.id)
  
  // Criar roles específicos para rede e hotel
  await prisma.userRedeRole.upsert({
    where: {
      userId_redeId: {
        userId: users.superadmin.id,
        redeId: rede.id
      }
    },
    update: {},
    create: {
      userId: users.superadmin.id,
      redeId: rede.id,
      role: 'admin'
    }
  })
  
  await prisma.userRedeRole.upsert({
    where: {
      userId_redeId: {
        userId: users.admin.id,
        redeId: rede.id
      }
    },
    update: {},
    create: {
      userId: users.admin.id,
      redeId: rede.id,
      role: 'admin'
    }
  })
  
  await prisma.userHotelRole.upsert({
    where: {
      userId_hotelId: {
        userId: users.editor.id,
        hotelId: hotel.id
      }
    },
    update: {},
    create: {
      userId: users.editor.id,
      hotelId: hotel.id,
      role: 'editor'
    }
  })
  
  await prisma.userHotelRole.upsert({
    where: {
      userId_hotelId: {
        userId: users.viewer.id,
        hotelId: hotel.id
      }
    },
    update: {},
    create: {
      userId: users.viewer.id,
      hotelId: hotel.id,
      role: 'viewer'
    }
  })
  
  console.log('✅ Roles específicos criados/atualizados:')
  console.log('   Superadmin da rede:', users.superadmin.email)
  console.log('   Admin da rede:', users.admin.email)
  console.log('   Editor do hotel:', users.editor.email)
  console.log('   Viewer do hotel:', users.viewer.email)
  
  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Resumo dos usuários criados:')
  console.log('   Superadmin: superadmin@beecontent.com (senha: superadmin123)')
  console.log('   Admin: admin@beecontent.com (senha: admin123)')
  console.log('   Editor: editor@beecontent.com (senha: editor123)')
  console.log('   Viewer: viewer@beecontent.com (senha: viewer123)')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })