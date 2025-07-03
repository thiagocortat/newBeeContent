#!/usr/bin/env node

/**
 * Script para configurar ambiente de desenvolvimento ou produção
 * Uso: node scripts/setup-environment.js [dev|prod]
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupEnvironment() {
  console.log('🔧 Configurador de Ambiente - BeeContent\n')
  
  const envType = process.argv[2] || await question('Escolha o ambiente (dev/prod): ')
  
  if (!['dev', 'prod'].includes(envType)) {
    console.log('❌ Ambiente inválido. Use "dev" ou "prod"')
    process.exit(1)
  }

  console.log(`\n📋 Configurando ambiente: ${envType === 'dev' ? 'Desenvolvimento' : 'Produção'}\n`)

  // Verificar se .env já existe
  const envPath = path.join(__dirname, '../.env')
  const envExamplePath = path.join(__dirname, '../.env.example')
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  Arquivo .env já existe. Sobrescrever? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('✅ Operação cancelada')
      rl.close()
      return
    }
  }

  // Ler template
  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ Arquivo .env.example não encontrado')
    rl.close()
    return
  }

  let envContent = fs.readFileSync(envExamplePath, 'utf8')

  if (envType === 'dev') {
    // Configuração para desenvolvimento
    envContent = envContent.replace('NODE_ENV="development"', 'NODE_ENV="development"')
    envContent = envContent.replace('DATABASE_URL="file:./dev.db"', 'DATABASE_URL="file:./dev.db"')
    
    console.log('📝 Configurando para desenvolvimento...')
    console.log('   - Banco: SQLite (local)')
    console.log('   - Environment: development')
    
    // Gerar JWT_SECRET básico para desenvolvimento
    const devJwtSecret = 'dev-jwt-secret-' + Math.random().toString(36).substring(2, 15)
    envContent = envContent.replace(
      'JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"',
      `JWT_SECRET="${devJwtSecret}"`
    )
    
  } else {
    // Configuração para produção
    console.log('📝 Configurando para produção...')
    
    envContent = envContent.replace('NODE_ENV="development"', 'NODE_ENV="production"')
    
    // Solicitar DATABASE_URL para produção
    const dbUrl = await question('🗄️  Digite a DATABASE_URL do PostgreSQL: ')
    if (dbUrl) {
      envContent = envContent.replace(
        'DATABASE_URL="file:./dev.db"',
        `DATABASE_URL="${dbUrl}"`
      )
      // Comentar a linha de desenvolvimento
      envContent = envContent.replace(
        '# DESENVOLVIMENTO (SQLite - Local)',
        '# DESENVOLVIMENTO (SQLite - Local) - DESABILITADO EM PRODUÇÃO'
      )
    }
    
    // Solicitar JWT_SECRET
    const jwtSecret = await question('🔐 Digite um JWT_SECRET seguro (mín. 32 caracteres): ')
    if (jwtSecret && jwtSecret.length >= 32) {
      envContent = envContent.replace(
        'JWT_SECRET="your-super-secure-jwt-secret-minimum-32-characters"',
        `JWT_SECRET="${jwtSecret}"`
      )
    } else {
      console.log('⚠️  JWT_SECRET deve ter pelo menos 32 caracteres')
    }
    
    // Solicitar API Keys
    const groqKey = await question('🤖 Digite sua GROQ_API_KEY (opcional): ')
    if (groqKey) {
      envContent = envContent.replace('GROQ_API_KEY="your-groq-api-key"', `GROQ_API_KEY="${groqKey}"`)
    }
    
    const replicateToken = await question('🎨 Digite seu REPLICATE_API_TOKEN (opcional): ')
    if (replicateToken) {
      envContent = envContent.replace('REPLICATE_API_TOKEN="your-replicate-api-token"', `REPLICATE_API_TOKEN="${replicateToken}"`)
    }
    
    const runwareKey = await question('🎨 Digite sua RUNWARE_API_KEY (opcional): ')
    if (runwareKey) {
      envContent = envContent.replace('RUNWARE_API_KEY="your-runware-api-key"', `RUNWARE_API_KEY="${runwareKey}"`)
    }
    
    // Escolher provedor de imagens se pelo menos um estiver configurado
    if (replicateToken || runwareKey) {
      const imageProvider = await question('🖼️  Escolha o provedor de imagens (replicate/runware) [replicate]: ')
      if (imageProvider && ['replicate', 'runware'].includes(imageProvider)) {
        envContent = envContent.replace('IMAGE_PROVIDER="replicate"', `IMAGE_PROVIDER="${imageProvider}"`)
      }
    }
    
    const baseUrl = await question('🌐 Digite a URL base da aplicação (ex: https://seudominio.com): ')
    if (baseUrl) {
      envContent = envContent.replace('NEXTAUTH_URL="http://localhost:3000"', `NEXTAUTH_URL="${baseUrl}"`)
    }
  }

  // Escrever arquivo .env
  fs.writeFileSync(envPath, envContent)
  
  console.log('\n✅ Arquivo .env criado com sucesso!')
  
  if (envType === 'dev') {
    console.log('\n📋 Próximos passos para desenvolvimento:')
    console.log('   1. npm install')
    console.log('   2. npx prisma generate')
    console.log('   3. npx prisma db push')
    console.log('   4. npm run seed')
    console.log('   5. npm run dev')
  } else {
    console.log('\n📋 Próximos passos para produção:')
    console.log('   1. Configure as variáveis no painel da Vercel')
    console.log('   2. npx prisma generate')
    console.log('   3. npx prisma db push')
    console.log('   4. npm run seed (se necessário)')
    console.log('   5. Deploy: npx vercel --prod')
    
    console.log('\n🔧 Lembre-se de atualizar o schema.prisma:')
    console.log('   - Altere provider de "sqlite" para "postgresql"')
  }
  
  rl.close()
}

setupEnvironment().catch(console.error)