#!/usr/bin/env node

const https = require('https')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCronProduction() {
  console.log('🔍 Testando Cron Job em Produção\n')
  
  try {
    // 1. Verificar logs de automação recentes
    console.log('1️⃣ Verificando logs de automação recentes...')
    const recentLogs = await prisma.automationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        hotel: {
          select: { name: true }
        }
      }
    })
    
    if (recentLogs.length === 0) {
      console.log('   ❌ Nenhum log de automação encontrado!')
      console.log('   🔍 Isso indica que o cron job nunca foi executado em produção')
    } else {
      console.log(`   📊 ${recentLogs.length} logs encontrados:`)
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.createdAt.toISOString()} - ${log.hotel?.name || 'Hotel não encontrado'} - ${log.status}`)
        if (log.message) {
          console.log(`      📝 Mensagem: ${log.message}`)
        }
      })
    }
    
    // 2. Verificar configuração do hotel
    console.log('\n2️⃣ Verificando configuração atual do hotel...')
    const hotel = await prisma.hotel.findFirst({
      where: { autoGeneratePosts: true }
    })
    
    if (hotel) {
      console.log(`   🏨 Hotel: ${hotel.name}`)
      console.log(`   🔄 Automação ativa: ${hotel.autoGeneratePosts ? '✅' : '❌'}`)
      console.log(`   📅 Último post automático: ${hotel.lastAutoPostAt || 'Nunca'}`)
      console.log(`   📊 Frequência: ${hotel.postFrequency}`)
      console.log(`   📈 Limite mensal: ${hotel.maxMonthlyPosts || 'Sem limite'}`)
      console.log(`   ⏰ Próximo agendamento: ${hotel.nextScheduledAt || 'Não definido'}`)
    }
    
    // 3. Verificar posts criados hoje
    console.log('\n3️⃣ Verificando posts criados hoje...')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const postsToday = await prisma.post.findMany({
      where: {
        publishedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        hotel: {
          select: { name: true }
        },
        author: {
          select: { email: true }
        }
      },
      orderBy: { publishedAt: 'desc' }
    })
    
    console.log(`   📝 ${postsToday.length} posts criados hoje:`)
    postsToday.forEach((post, index) => {
      console.log(`   ${index + 1}. "${post.title}" - ${post.hotel?.name} - ${post.publishedAt.toLocaleTimeString('pt-BR')}`)
    })
    
    // 4. Verificar variáveis de ambiente críticas
    console.log('\n4️⃣ Verificando variáveis de ambiente...')
    const requiredEnvs = ['DATABASE_URL', 'GROQ_API_KEY', 'RUNWARE_API_KEY']
    requiredEnvs.forEach(env => {
      const value = process.env[env]
      if (value) {
        console.log(`   ✅ ${env}: Configurada (${value.substring(0, 20)}...)`)
      } else {
        console.log(`   ❌ ${env}: NÃO CONFIGURADA`)
      }
    })
    
    // 5. Análise e recomendações
    console.log('\n📋 ANÁLISE E RECOMENDAÇÕES:')
    
    if (recentLogs.length === 0) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: Cron job nunca foi executado')
      console.log('\n🔧 POSSÍVEIS CAUSAS:')
      console.log('1. Cron job não está configurado corretamente no Vercel')
      console.log('2. Função de cron está falhando silenciosamente')
      console.log('3. Timezone do cron job pode estar incorreto')
      console.log('4. Função pode estar sendo bloqueada por timeout')
      
      console.log('\n✅ SOLUÇÕES RECOMENDADAS:')
      console.log('1. Verificar configuração do vercel.json')
      console.log('2. Verificar logs do Vercel Functions')
      console.log('3. Testar manualmente a API /api/cron')
      console.log('4. Adicionar logs de debug na função de cron')
      console.log('5. Verificar se o deploy incluiu o vercel.json')
    } else {
      const lastLog = recentLogs[0]
      const hoursSinceLastRun = (new Date() - lastLog.createdAt) / (1000 * 60 * 60)
      
      if (hoursSinceLastRun > 25) { // Mais de 25 horas (deveria rodar diariamente)
        console.log(`\n⚠️ ATENÇÃO: Última execução foi há ${hoursSinceLastRun.toFixed(1)} horas`)
        console.log('   O cron job deveria executar diariamente às 9h')
      } else {
        console.log('\n✅ Cron job está executando regularmente')
      }
      
      const errorLogs = recentLogs.filter(log => log.status === 'error')
      if (errorLogs.length > 0) {
        console.log(`\n❌ ${errorLogs.length} erros encontrados nos logs recentes`)
        errorLogs.forEach(log => {
          console.log(`   - ${log.message}`)
        })
      }
    }
    
    // 6. Status final
    console.log('\n🎯 STATUS FINAL DA AUTOMAÇÃO:')
    if (recentLogs.length > 0 && hotel && hotel.autoGeneratePosts) {
      console.log('✅ Automação está configurada e executando')
    } else if (hotel && hotel.autoGeneratePosts && recentLogs.length === 0) {
      console.log('⚠️ Automação está configurada mas nunca executou')
    } else {
      console.log('❌ Automação não está funcionando corretamente')
    }
    
  } catch (error) {
    console.error('❌ Erro durante análise:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testCronProduction()
}

module.exports = { testCronProduction }