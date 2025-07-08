const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Configuração específica para seed que bypassa o Accelerate
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function populateDatabase() {
  console.log('🌱 Populando banco de dados PostgreSQL...');
  
  try {
    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@beecontent.com' },
      update: {},
      create: {
        email: 'admin@beecontent.com',
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ Admin criado/atualizado:');
    console.log('   Email: admin@beecontent.com');
    console.log('   Senha: admin123');
    console.log('   ID:', admin.id);
    
    // Criar rede de exemplo
    const rede = await prisma.rede.upsert({
      where: { slug: 'rede-exemplo' },
      update: {},
      create: {
        name: 'Rede Exemplo BeeContent',
        slug: 'rede-exemplo',
        ownerId: admin.id
      }
    });

    console.log('✅ Rede criada/atualizada:');
    console.log('   Nome:', rede.name);
    console.log('   ID:', rede.id);
    
    // Criar hotel de exemplo
    const hotel = await prisma.hotel.upsert({
      where: { customDomain: 'localhost:3000' },
      update: {},
      create: {
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
    });

    console.log('✅ Hotel de exemplo criado/atualizado:');
    console.log('   Nome:', hotel.name);
    console.log('   ID:', hotel.id);
    
    console.log('\n🎉 Banco populado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });