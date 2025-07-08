#!/usr/bin/env node

/**
 * Script para verificar e corrigir o schema em produção
 * Executa diagnósticos e aplica correções se necessário
 */

const { execSync } = require('child_process');

async function verifySchema() {
  console.log('🔍 Verificando schema de produção...');
  
  try {
    // Configurar para PostgreSQL
    console.log('📝 Configurando schema para PostgreSQL...');
    execSync('node scripts/setup-production-schema.js', { stdio: 'inherit' });
    
    // Gerar cliente Prisma
    console.log('⚡ Gerando Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Verificar se conseguimos conectar e se a coluna existe
    console.log('🔌 Testando conexão com banco...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Tentar uma query simples primeiro
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Conexão com banco estabelecida!');
      
      // Verificar se a tabela Hotel existe
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Hotel'
      `;
      
      if (tables.length === 0) {
        console.log('❌ Tabela Hotel não encontrada!');
        console.log('🔧 Aplicando migrations...');
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        return;
      }
      
      console.log('✅ Tabela Hotel encontrada!');
      
      // Verificar se a coluna nextScheduledAt existe
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Hotel' AND column_name = 'nextScheduledAt'
      `;
      
      if (columns.length === 0) {
        console.log('❌ Coluna nextScheduledAt não encontrada!');
        console.log('🔧 Aplicando correção...');
        
        // Adicionar a coluna manualmente
        await prisma.$executeRaw`
          ALTER TABLE "Hotel" 
          ADD COLUMN IF NOT EXISTS "nextScheduledAt" TIMESTAMP(3)
        `;
        
        await prisma.$executeRaw`
          ALTER TABLE "Hotel" 
          ADD COLUMN IF NOT EXISTS "nextSuggestedTitle" TEXT
        `;
        
        console.log('✅ Colunas adicionadas com sucesso!');
      } else {
        console.log('✅ Coluna nextScheduledAt encontrada!');
      }
      
      // Testar uma query que usa a coluna
      console.log('🧪 Testando query com nextScheduledAt...');
      const testHotel = await prisma.hotel.findFirst({
        select: {
          id: true,
          name: true,
          nextScheduledAt: true
        }
      });
      
      console.log('✅ Query executada com sucesso!');
      console.log('🎉 Schema verificado e funcionando corretamente!');
      
    } catch (queryError) {
      console.error('❌ Erro ao executar queries:', queryError.message);
      
      if (queryError.message.includes('nextScheduledAt')) {
        console.log('🔧 Problema detectado com nextScheduledAt, aplicando correção...');
        
        try {
          await prisma.$executeRaw`
            ALTER TABLE "Hotel" 
            ADD COLUMN IF NOT EXISTS "nextScheduledAt" TIMESTAMP(3)
          `;
          
          await prisma.$executeRaw`
            ALTER TABLE "Hotel" 
            ADD COLUMN IF NOT EXISTS "nextSuggestedTitle" TEXT
          `;
          
          console.log('✅ Correção aplicada com sucesso!');
        } catch (fixError) {
          console.error('❌ Erro ao aplicar correção:', fixError.message);
          throw fixError;
        }
      } else {
        throw queryError;
      }
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.log('🔧 Tentando aplicar migrations completas...');
    
    try {
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
      console.log('✅ Migrations aplicadas com sucesso!');
    } catch (migrationError) {
      console.error('❌ Erro ao aplicar migrations:', migrationError.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  verifySchema().catch(console.error);
}

module.exports = { verifySchema };