#!/usr/bin/env node

/**
 * Script para deploy em produção
 * Configura o schema para PostgreSQL e aplica migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy para produção...');

// 1. Configurar schema para PostgreSQL
console.log('📝 Configurando schema para PostgreSQL...');
execSync('node scripts/setup-production-schema.js', { stdio: 'inherit' });

// 2. Gerar Prisma Client com Accelerate
console.log('⚡ Gerando Prisma Client com Accelerate...');
execSync('npx prisma generate --accelerate', { stdio: 'inherit' });

// 3. Verificar e corrigir schema (se necessário)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql')) {
  console.log('🔍 Verificando schema do banco de dados...');
  try {
    execSync('node scripts/verify-production-schema.js', { stdio: 'inherit' });
    console.log('✅ Schema verificado e corrigido!');
  } catch (error) {
    console.log('⚠️  Erro na verificação, tentando migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations aplicadas com sucesso!');
    } catch (migrateError) {
      console.log('⚠️  Erro ao aplicar migrations, tentando db push...');
      try {
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ Schema sincronizado com db push!');
      } catch (pushError) {
        console.error('❌ Erro ao sincronizar banco:', pushError.message);
        process.exit(1);
      }
    }
  }
} else {
  console.log('⚠️  DATABASE_URL não configurada ou não é PostgreSQL');
}

// 4. Build da aplicação
console.log('🏗️  Fazendo build da aplicação...');
execSync('next build', { stdio: 'inherit' });

console.log('🎉 Deploy concluído com sucesso!');