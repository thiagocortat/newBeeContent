#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Função para verificar o banco de dados em produção
async function debugProductionDatabase() {
  console.log('🔍 Iniciando diagnóstico do banco de dados em produção...');
  
  // Verificar variáveis de ambiente
  console.log('\n📋 Variáveis de ambiente:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida');
  
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.startsWith('file:')) {
      console.log('⚠️  Usando SQLite:', dbUrl);
    } else if (dbUrl.startsWith('postgresql:') || dbUrl.startsWith('postgres:')) {
      console.log('✅ Usando PostgreSQL');
    } else if (dbUrl.startsWith('prisma+postgres:')) {
      console.log('✅ Usando PostgreSQL via Prisma Accelerate');
    } else {
      console.log('❓ Tipo de banco desconhecido:', dbUrl.substring(0, 20) + '...');
    }
  }
  
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔌 Testando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar se a tabela Hotel existe
    console.log('\n🏨 Verificando tabela Hotel...');
    try {
      const hotelCount = await prisma.hotel.count();
      console.log(`✅ Tabela Hotel encontrada com ${hotelCount} registros`);
      
      // Tentar buscar um hotel para verificar as colunas
      console.log('\n🔍 Verificando estrutura da tabela Hotel...');
      const firstHotel = await prisma.hotel.findFirst({
        select: {
          id: true,
          name: true,
          nextScheduledAt: true // Esta é a coluna que está causando problema
        }
      });
      
      if (firstHotel) {
        console.log('✅ Coluna nextScheduledAt encontrada!');
        console.log('Hotel exemplo:', {
          id: firstHotel.id,
          name: firstHotel.name,
          nextScheduledAt: firstHotel.nextScheduledAt
        });
      } else {
        console.log('⚠️  Nenhum hotel encontrado na base de dados');
      }
      
    } catch (error) {
      if (error.code === 'P2022') {
        console.log('❌ ERRO: Coluna nextScheduledAt não existe!');
        console.log('Detalhes do erro:', error.message);
        
        // Tentar verificar quais colunas existem
        console.log('\n🔍 Tentando verificar colunas existentes...');
        try {
          const basicHotel = await prisma.hotel.findFirst({
            select: {
              id: true,
              name: true,
              city: true
            }
          });
          console.log('✅ Colunas básicas funcionam:', Object.keys(basicHotel || {}));
        } catch (basicError) {
          console.log('❌ Erro mesmo com colunas básicas:', basicError.message);
        }
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    }
    
    // Verificar informações do banco
    console.log('\n📊 Informações do banco:');
    try {
      const result = await prisma.$queryRaw`SELECT version()`;
      console.log('Versão do banco:', result);
    } catch (error) {
      console.log('Não foi possível obter versão do banco:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão fechada.');
  }
}

// Executar diagnóstico
debugProductionDatabase()
  .then(() => {
    console.log('\n✅ Diagnóstico concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro durante diagnóstico:', error);
    process.exit(1);
  });