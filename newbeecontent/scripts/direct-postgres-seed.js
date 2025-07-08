const { PrismaClient } = require('@prisma/client');
const { withAccelerate } = require('@prisma/extension-accelerate');
const bcrypt = require('bcryptjs');

// Criar cliente Prisma com suporte ao Accelerate
const createPrismaClient = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  // Se estiver usando Prisma Accelerate, aplicar extensão
  if (process.env.DATABASE_URL.startsWith('prisma://') || process.env.DATABASE_URL.startsWith('prisma+postgres://')) {
    return client.$extends(withAccelerate());
  }
  
  return client;
};

const prisma = createPrismaClient();

async function main() {
  try {
    console.log('🌱 Iniciando seed do PostgreSQL...');
    
    // Verificar se já existem dados
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('✅ Banco já possui dados. Seed cancelado.');
      return;
    }

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@beecontent.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('✅ Usuário admin criado:', adminUser.email);

    // Criar rede
    const rede = await prisma.rede.create({
      data: {
        nome: 'Rede Principal',
        descricao: 'Rede principal do sistema',
        userId: adminUser.id
      }
    });
    console.log('✅ Rede criada:', rede.nome);

    // Criar hotel
    const hotel = await prisma.hotel.create({
      data: {
        nome: 'Hotel Exemplo',
        descricao: 'Hotel de exemplo para testes',
        redeId: rede.id,
        userId: adminUser.id
      }
    });
    console.log('✅ Hotel criado:', hotel.nome);

    console.log('🎉 Seed concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });