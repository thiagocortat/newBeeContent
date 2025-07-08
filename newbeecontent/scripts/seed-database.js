const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Usar a URL direta do PostgreSQL sem Accelerate para seed
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...')
    console.log('📊 URL do banco:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    
    // Verificar se já existe dados
    const existingUser = await prisma.user.findFirst({
      where: { email: 'admin@beecontent.com' }
    })
    
    if (existingUser) {
      console.log('✅ Banco já populado!')
      console.log('📧 Email: admin@beecontent.com')
      console.log('🔑 Senha: admin123')
      return
    }
    
    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const admin = await prisma.user.create({
      data: {
        email: 'admin@beecontent.com',
        password: hashedPassword,
        role: 'admin'
      }
    })

    console.log('✅ Admin criado:', admin.email)
    
    // Criar rede de exemplo
    const rede = await prisma.rede.create({
      data: {
        name: 'Rede Exemplo BeeContent',
        slug: 'rede-exemplo',
        ownerId: admin.id
      }
    })

    console.log('✅ Rede criada:', rede.name)
    
    // Criar hotel de exemplo
    const hotel = await prisma.hotel.create({
      data: {
        name: 'Hotel Exemplo BeeContent',
        slug: 'hotel-exemplo-beecontent',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        travelType: 'negócios',
        audience: 'executivos',
        season: 'Verão',
        events: 'conferências, feiras de negócios',
        customDomain: 'localhost:3000',
        autoGeneratePosts: false,
        postFrequency: 'weekly',
        redeId: rede.id,
        ownerId: admin.id
      }
    })

    console.log('✅ Hotel criado:', hotel.name)
    
    console.log('\n🎉 Seed concluído com sucesso!')
    console.log('📧 Email: admin@beecontent.com')
    console.log('🔑 Senha: admin123')
    
  } catch (error) {
    console.error('❌ Erro durante o seed:')
    console.error(error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })