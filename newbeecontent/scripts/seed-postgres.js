const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Usar a URL do Prisma Accelerate diretamente
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  try {
    console.log('🌱 Iniciando seed do PostgreSQL via Prisma Accelerate...')
    console.log('📊 URL do banco:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    // Verificar se já existe dados
    const existingUser = await prisma.user.findFirst()
    if (existingUser) {
      console.log('✅ Banco já populado!')
      console.log('📧 Email:', existingUser.email)
      console.log('🔑 Senha: admin123')
      return
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@beecontent.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN'
      }
    })
    console.log('👤 Usuário admin criado:', admin.email)

    // Criar rede
    const rede = await prisma.rede.create({
      data: {
        name: 'Rede Exemplo',
        description: 'Rede de hotéis de exemplo',
        userId: admin.id
      }
    })
    console.log('🏢 Rede criada:', rede.name)

    // Criar hotel
    const hotel = await prisma.hotel.create({
      data: {
        name: 'Hotel Exemplo',
        description: 'Hotel de exemplo para testes',
        slug: 'hotel-exemplo',
        customDomain: 'hotel-exemplo.localhost',
        userId: admin.id,
        redeId: rede.id
      }
    })
    console.log('🏨 Hotel criado:', hotel.name)

    console.log('\n✅ Seed concluído com sucesso!')
    console.log('📧 Email: admin@beecontent.com')
    console.log('🔑 Senha: admin123')

  } catch (error) {
    console.error('❌ Erro no seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Falha no seed:', e)
    process.exit(1)
  })