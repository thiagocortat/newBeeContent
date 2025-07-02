#!/usr/bin/env node

/**
 * Script para testar configurações antes do deploy
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Verificando configurações para deploy...\n')

// 1. Verificar se .env existe
const envPath = path.join(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado')
} else {
  console.log('❌ Arquivo .env não encontrado')
  console.log('   Crie um arquivo .env baseado no .env.example')
}

// 2. Verificar vercel.json
const vercelPath = path.join(__dirname, '../vercel.json')
if (fs.existsSync(vercelPath)) {
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'))
    console.log('✅ vercel.json válido')
    
    if (vercelConfig.cron) {
      console.log('⚠️  Propriedade "cron" encontrada no vercel.json')
      console.log('   Esta propriedade não é suportada. Use Vercel Cron Jobs.')
    }
  } catch (error) {
    console.log('❌ vercel.json inválido:', error.message)
  }
} else {
  console.log('✅ vercel.json não encontrado (opcional)')
}

// 3. Verificar package.json
const packagePath = path.join(__dirname, '../package.json')
if (fs.existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    console.log('✅ package.json válido')
    
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('✅ Script de build encontrado')
    } else {
      console.log('❌ Script de build não encontrado')
    }
  } catch (error) {
    console.log('❌ package.json inválido:', error.message)
  }
}

// 4. Verificar middleware
const middlewarePath = path.join(__dirname, '../middleware.ts')
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
  if (middlewareContent.includes('customDomain')) {
    console.log('✅ Middleware configurado para multi-tenant')
  } else {
    console.log('⚠️  Middleware pode não estar configurado para domínios próprios')
  }
} else {
  console.log('❌ middleware.ts não encontrado')
}

// 5. Verificar schema do Prisma
const schemaPath = path.join(__dirname, '../prisma/schema.prisma')
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  if (schemaContent.includes('customDomain')) {
    console.log('✅ Schema do Prisma tem campo customDomain')
  } else {
    console.log('❌ Campo customDomain não encontrado no schema')
  }
} else {
  console.log('❌ Schema do Prisma não encontrado')
}

console.log('\n🚀 Verificação concluída!')
console.log('\n📋 Próximos passos para deploy:')
console.log('1. Configure as variáveis de ambiente no Vercel')
console.log('2. Execute: npx vercel --prod')
console.log('3. Configure os domínios no painel da Vercel')
console.log('4. Teste com: https://seudominio.com.br/blog')