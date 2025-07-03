#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente no Vercel
 * Execute: node scripts/setup-vercel-env.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} - Sucesso`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} - Erro: ${error.message}`, 'red');
    return null;
  }
}

function readEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ Arquivo .env não encontrado', 'red');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
  });

  return envVars;
}

function setupVercelEnv() {
  log('🚀 Configurando variáveis de ambiente no Vercel...', 'cyan');
  
  // Verificar se o Vercel CLI está instalado
  const vercelVersion = execCommand('npx vercel --version', 'Verificando Vercel CLI');
  if (!vercelVersion) {
    log('❌ Vercel CLI não encontrado. Instale com: npm i -g vercel', 'red');
    return;
  }

  // Ler variáveis do arquivo .env
  const envVars = readEnvFile();
  if (Object.keys(envVars).length === 0) {
    log('❌ Nenhuma variável de ambiente encontrada no .env', 'red');
    return;
  }

  log(`\n📋 Variáveis encontradas no .env:`, 'yellow');
  Object.keys(envVars).forEach(key => {
    const value = envVars[key];
    const displayValue = key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD') 
      ? '*'.repeat(Math.min(value.length, 20))
      : value.length > 50 ? value.substring(0, 50) + '...' : value;
    log(`  ${key}=${displayValue}`, 'yellow');
  });

  // Variáveis críticas que devem estar presentes
  const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
  const missingVars = criticalVars.filter(key => !envVars[key]);
  
  if (missingVars.length > 0) {
    log(`\n❌ Variáveis críticas ausentes: ${missingVars.join(', ')}`, 'red');
    return;
  }

  // Configurar cada variável no Vercel
  log('\n🔧 Configurando variáveis no Vercel...', 'blue');
  
  Object.entries(envVars).forEach(([key, value]) => {
    // Configurar para produção
    const prodCommand = `echo "${value}" | npx vercel env add ${key} production`;
    execCommand(prodCommand, `Configurando ${key} para produção`);
    
    // Configurar para preview
    const previewCommand = `echo "${value}" | npx vercel env add ${key} preview`;
    execCommand(previewCommand, `Configurando ${key} para preview`);
  });

  log('\n✅ Configuração concluída!', 'green');
  log('\n📝 Próximos passos:', 'cyan');
  log('1. Faça um novo deploy: npx vercel --prod', 'cyan');
  log('2. Teste o login na aplicação', 'cyan');
  log('3. Verifique os logs no dashboard do Vercel', 'cyan');
}

if (require.main === module) {
  setupVercelEnv();
}

module.exports = { setupVercelEnv };