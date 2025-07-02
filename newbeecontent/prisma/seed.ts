import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')
  
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@beecontent.com' },
    update: {},
    create: {
      email: 'admin@beecontent.com',
      password: hashedPassword,
      role: 'admin'
    }
  })

  console.log('✅ Admin criado/atualizado:')
  console.log('   Email: admin@beecontent.com')
  console.log('   Senha: admin123')
  console.log('   ID:', admin.id)
  
  // Criar hotel de exemplo (se necessário)
  const hotel = await prisma.hotel.upsert({
    where: { customDomain: 'localhost:3000' },
    update: {},
    create: {
      name: 'Hotel Exemplo BeeContent',
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
      ownerId: admin.id
    }
  })

  console.log('✅ Hotel de exemplo criado/atualizado:')
  console.log('   Nome:', hotel.name)
  console.log('   ID:', hotel.id)
  
  console.log('\n🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })