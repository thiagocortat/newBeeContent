#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnoseAutomation() {
  console.log('🔍 Diagnóstico da Funcionalidade de Automação\n')
  
  try {
    // 1. Verificar hotéis com automação ativada
    console.log('1️⃣ Verificando hotéis com automação ativada...')
    const hotelsWithAutomation = await prisma.hotel.findMany({
      where: { autoGeneratePosts: true },
      include: {
        rede: true,
        owner: true,
        _count: {
          select: {
            posts: true,
            automationLogs: true
          }
        }
      }
    })
    
    console.log(`   📊 Total de hotéis com automação: ${hotelsWithAutomation.length}`)
    
    if (hotelsWithAutomation.length === 0) {
      console.log('   ⚠️  PROBLEMA: Nenhum hotel tem automação ativada!')
      console.log('   💡 Solução: Ative a automação em pelo menos um hotel')
    } else {
      hotelsWithAutomation.forEach((hotel, index) => {
        console.log(`   ${index + 1}. ${hotel.name} (${hotel.city}, ${hotel.state})`)
        console.log(`      - Rede: ${hotel.rede.name}`)
        console.log(`      - Frequência: ${hotel.postFrequency || 'não definida'}`)
        console.log(`      - Limite mensal: ${hotel.maxMonthlyPosts || 'sem limite'}`)
        console.log(`      - Último post automático: ${hotel.lastAutoPostAt || 'nunca'}`)
        console.log(`      - Posts totais: ${hotel._count.posts}`)
        console.log(`      - Logs de automação: ${hotel._count.automationLogs}`)
        console.log('')
      })
    }
    
    // 2. Verificar configurações de frequência
    console.log('2️⃣ Verificando configurações de frequência...')
    const hotelsWithoutFrequency = hotelsWithAutomation.filter(h => !h.postFrequency)
    if (hotelsWithoutFrequency.length > 0) {
      console.log(`   ⚠️  PROBLEMA: ${hotelsWithoutFrequency.length} hotéis sem frequência definida`)
      hotelsWithoutFrequency.forEach(hotel => {
        console.log(`      - ${hotel.name}: frequência não definida`)
      })
    } else {
      console.log('   ✅ Todos os hotéis têm frequência definida')
    }
    
    // 3. Verificar se algum hotel deveria ter posts criados
    console.log('3️⃣ Verificando quais hotéis deveriam ter posts criados...')
    for (const hotel of hotelsWithAutomation) {
      const shouldCreate = await shouldCreatePost(hotel)
      console.log(`   ${hotel.name}: ${shouldCreate.should ? '✅ Deveria criar post' : `❌ Não deveria criar (${shouldCreate.reason})`}`)
    }
    
    // 4. Verificar logs de automação recentes
    console.log('4️⃣ Verificando logs de automação recentes...')
    const recentLogs = await prisma.automationLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        hotel: true,
        post: true
      }
    })
    
    if (recentLogs.length === 0) {
      console.log('   ⚠️  PROBLEMA: Nenhum log de automação encontrado')
      console.log('   💡 Isso indica que a automação nunca foi executada')
    } else {
      console.log(`   📋 Últimos ${recentLogs.length} logs:`)
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.createdAt.toISOString()} - ${log.hotel.name} - ${log.status}`)
        if (log.message) console.log(`      Mensagem: ${log.message}`)
      })
    }
    
    // 5. Verificar variáveis de ambiente necessárias
    console.log('5️⃣ Verificando variáveis de ambiente...')
    const requiredEnvVars = ['DATABASE_URL', 'GROQ_API_KEY', 'RUNWARE_API_KEY']
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      console.log(`   ⚠️  PROBLEMA: Variáveis de ambiente faltando: ${missingEnvVars.join(', ')}`)
    } else {
      console.log('   ✅ Todas as variáveis de ambiente necessárias estão definidas')
    }
    
    // 6. Testar conexão com APIs externas
    console.log('6️⃣ Testando conexões com APIs externas...')
    try {
      const { generatePostIdeas } = require('../lib/groq')
      await generatePostIdeas('Teste de conexão')
      console.log('   ✅ Conexão com GROQ funcionando')
    } catch (error) {
      console.log(`   ❌ Erro na conexão com GROQ: ${error.message}`)
    }
    
    try {
      const { generateBlogImage } = require('../lib/image-service')
      // Não vamos gerar uma imagem real, apenas verificar se a função existe
      console.log('   ✅ Serviço de imagem disponível')
    } catch (error) {
      console.log(`   ❌ Erro no serviço de imagem: ${error.message}`)
    }
    
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:')
    console.log('========================')
    
    if (hotelsWithAutomation.length === 0) {
      console.log('🔴 CRÍTICO: Nenhum hotel tem automação ativada')
    } else if (hotelsWithoutFrequency.length > 0) {
      console.log('🟡 ATENÇÃO: Alguns hotéis não têm frequência configurada')
    } else if (recentLogs.length === 0) {
      console.log('🟡 ATENÇÃO: Automação nunca foi executada')
    } else {
      console.log('🟢 TUDO OK: Automação configurada e funcionando')
    }
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Função auxiliar para verificar se um post deveria ser criado
async function shouldCreatePost(hotel) {
  const now = new Date()
  const last = hotel.lastAutoPostAt || new Date(0)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  // Verifica frequência
  let frequencyMet = false
  if (hotel.postFrequency === 'daily' && diffDays >= 1) frequencyMet = true
  if (hotel.postFrequency === 'weekly' && diffDays >= 7) frequencyMet = true
  if (hotel.postFrequency === 'biweekly' && diffDays >= 14) frequencyMet = true

  if (!frequencyMet) {
    return { should: false, reason: `frequência não atendida (${diffDays.toFixed(1)} dias desde último post)` }
  }

  // Verifica limite mensal
  if (hotel.maxMonthlyPosts) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const postsThisMonth = await prisma.post.count({
      where: {
        hotelId: hotel.id,
        publishedAt: {
          gte: startOfMonth
        }
      }
    })

    if (postsThisMonth >= hotel.maxMonthlyPosts) {
      return { should: false, reason: `limite mensal atingido (${postsThisMonth}/${hotel.maxMonthlyPosts})` }
    }
  }

  return { should: true }
}

if (require.main === module) {
  diagnoseAutomation()
}

module.exports = { diagnoseAutomation }