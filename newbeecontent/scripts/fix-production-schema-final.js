#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para corrigir definitivamente o schema em produção
async function fixProductionSchemaFinal() {
  console.log('🔧 Iniciando correção definitiva do schema em produção...');
  
  try {
    // 1. Verificar se estamos em produção ou se DATABASE_URL aponta para PostgreSQL
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.VERCEL || 
                        (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:'));
    
    console.log('\n📋 Status do ambiente:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL ? 'Sim' : 'Não');
    console.log('DATABASE_URL tipo:', process.env.DATABASE_URL ? 
      (process.env.DATABASE_URL.startsWith('file:') ? 'SQLite' : 'PostgreSQL') : 'Não definida');
    console.log('É produção?', isProduction ? 'Sim' : 'Não');
    
    if (!isProduction) {
      console.log('\n⚠️  Este script deve ser executado apenas em produção!');
      console.log('Para desenvolvimento local, use SQLite normalmente.');
      return;
    }
    
    // 2. Backup do schema atual
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup');
    
    console.log('\n💾 Fazendo backup do schema atual...');
    fs.copyFileSync(schemaPath, backupPath);
    console.log('✅ Backup criado:', backupPath);
    
    // 3. Ler o schema atual
    let schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // 4. Substituir provider para PostgreSQL
    console.log('\n🔄 Atualizando provider para PostgreSQL...');
    schemaContent = schemaContent.replace(
      /provider\s*=\s*["']sqlite["']/g,
      'provider = "postgresql"'
    );
    
    // 5. Escrever o schema atualizado
    fs.writeFileSync(schemaPath, schemaContent);
    console.log('✅ Schema atualizado para PostgreSQL');
    
    // 6. Gerar novo Prisma Client
    console.log('\n🔄 Gerando novo Prisma Client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma Client gerado com sucesso');
    } catch (error) {
      console.log('❌ Erro ao gerar Prisma Client:', error.message);
      throw error;
    }
    
    // 7. Aplicar migrations
    console.log('\n🔄 Aplicando migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations aplicadas com sucesso');
    } catch (error) {
      console.log('⚠️  Erro com migrate deploy, tentando db push...');
      try {
        execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
        console.log('✅ Schema sincronizado com db push');
      } catch (pushError) {
        console.log('❌ Erro com db push:', pushError.message);
        throw pushError;
      }
    }
    
    // 8. Verificar se a correção funcionou
    console.log('\n🔍 Verificando se a correção funcionou...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Conexão com PostgreSQL estabelecida');
      
      // Tentar acessar a coluna nextScheduledAt
      const testQuery = await prisma.hotel.findFirst({
        select: {
          id: true,
          name: true,
          nextScheduledAt: true
        }
      });
      
      console.log('✅ Coluna nextScheduledAt acessível!');
      console.log('✅ Problema resolvido definitivamente!');
      
    } catch (error) {
      if (error.code === 'P2022') {
        console.log('❌ Coluna nextScheduledAt ainda não existe');
        console.log('Tentando criar a coluna manualmente...');
        
        try {
          await prisma.$executeRaw`ALTER TABLE "Hotel" ADD COLUMN "nextScheduledAt" TIMESTAMP(3)`;
          console.log('✅ Coluna nextScheduledAt criada manualmente');
        } catch (alterError) {
          console.log('❌ Erro ao criar coluna:', alterError.message);
        }
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    } finally {
      await prisma.$disconnect();
    }
    
    console.log('\n🎉 Correção concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Faça um novo deploy: npx vercel --prod');
    console.log('2. Teste a funcionalidade de sugestões de artigos');
    console.log('3. Se tudo funcionar, remova o backup: rm prisma/schema.prisma.backup');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    
    // Restaurar backup se algo deu errado
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup');
    
    if (fs.existsSync(backupPath)) {
      console.log('\n🔄 Restaurando backup do schema...');
      fs.copyFileSync(backupPath, schemaPath);
      console.log('✅ Schema restaurado');
    }
    
    throw error;
  }
}

// Executar correção
fixProductionSchemaFinal()
  .then(() => {
    console.log('\n✅ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error.message);
    process.exit(1);
  });