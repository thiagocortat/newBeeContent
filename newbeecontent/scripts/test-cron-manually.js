#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Simular a função shouldCreatePost
async function shouldCreatePost(hotel) {
  const now = new Date()
  const last = hotel.lastAutoPostAt || new Date(0)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  console.log(`   📊 Análise de frequência para ${hotel.name}:`)
  console.log(`      - Frequência configurada: ${hotel.postFrequency}`)
  console.log(`      - Dias desde último post: ${diffDays.toFixed(1)}`)
  console.log(`      - Limite mensal: ${hotel.maxMonthlyPosts || 'sem limite'}`)

  // Verifica frequência
  let frequencyMet = false
  if (hotel.postFrequency === 'daily' && diffDays >= 1) frequencyMet = true
  if (hotel.postFrequency === 'weekly' && diffDays >= 7) frequencyMet = true
  if (hotel.postFrequency === 'biweekly' && diffDays >= 14) frequencyMet = true

  if (!frequencyMet) {
    return { should: false, reason: `frequência não atendida (${diffDays.toFixed(1)} dias desde último post, precisa ${hotel.postFrequency === 'daily' ? '1' : hotel.postFrequency === 'weekly' ? '7' : '14'} dias)` }
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

    console.log(`      - Posts este mês: ${postsThisMonth}/${hotel.maxMonthlyPosts}`)

    if (postsThisMonth >= hotel.maxMonthlyPosts) {
      return { should: false, reason: `limite mensal atingido (${postsThisMonth}/${hotel.maxMonthlyPosts})` }
    }
  }

  return { should: true }
}

async function testCronManually() {
  console.log('🧪 Testando Cron Job Manualmente\n')
  
  try {
    console.log('🤖 Iniciando processo de automação de posts...')
    
    // Log de início da automação
    const firstHotel = await prisma.hotel.findFirst({ where: { autoGeneratePosts: true } })
    if (firstHotel) {
      await prisma.automationLog.create({
        data: {
          hotelId: firstHotel.id,
          status: 'success',
          message: 'Processo de automação iniciado manualmente para teste'
        }
      })
    }
    
    const hotels = await prisma.hotel.findMany({
      where: { autoGeneratePosts: true },
      include: {
        rede: true
      }
    })

    console.log(`📊 Encontrados ${hotels.length} hotéis com automação ativada`)
    const results = []

    for (const hotel of hotels) {
      console.log(`\n🏨 Processando hotel: ${hotel.name}`)
      
      const shouldCreate = await shouldCreatePost(hotel)
      if (!shouldCreate.should) {
        console.log(`   ⏭️ Pulando: ${shouldCreate.reason}`)
        
        await prisma.automationLog.create({
          data: {
            hotelId: hotel.id,
            status: 'success',
            message: `Post pulado para hotel ${hotel.name}. Motivo: ${shouldCreate.reason || 'unknown'}`
          }
        })
        
        results.push({ hotelId: hotel.id, status: 'skipped', reason: shouldCreate.reason || 'unknown' })
        continue
      }

      console.log(`   ✅ Hotel deveria criar post!`)
      
      try {
        console.log(`   🏨 Gerando post para hotel ${hotel.name} da rede ${hotel.rede?.name || 'N/A'}...`)
        
        // Criar um post simples para teste
        const title = `Post Automático de Teste - ${hotel.name} - ${new Date().toISOString()}`
        const content = `# ${title}\n\nEste é um post de teste criado automaticamente.\n\n## Informações do Hotel\n\n- **Nome:** ${hotel.name}\n- **Cidade:** ${hotel.city}, ${hotel.state}\n- **Rede:** ${hotel.rede?.name || 'N/A'}\n\n## Data de Criação\n\n${new Date().toLocaleString('pt-BR')}\n\n---\n\n*Este post foi criado automaticamente pelo sistema de automação.*`
        const imageUrl = 'https://via.placeholder.com/800x400/0066cc/ffffff?text=Post+Automatico'
        
        console.log(`   💡 Título: ${title}`)
        console.log(`   📄 Conteúdo: ${content.length} caracteres`)
        console.log(`   🖼️ Imagem: ${imageUrl}`)

        const post = await prisma.post.create({
          data: {
            title,
            content,
            imageUrl,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 100),
            hotelId: hotel.id,
            authorId: hotel.ownerId,
            publishedAt: new Date()
          }
        })
        
        console.log(`   ✅ Post criado com ID: ${post.id}`)

        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { lastAutoPostAt: new Date() }
        })
        
        console.log(`   🔄 Hotel ${hotel.id} atualizado com lastAutoPostAt`)

        await prisma.automationLog.create({
          data: {
            hotelId: hotel.id,
            postId: post.id,
            status: 'success',
            message: `Post criado com sucesso: "${title}"`
          }
        })
        
        results.push({ hotelId: hotel.id, status: 'success', title, postId: post.id })
        
      } catch (error) {
        console.error(`   ❌ Erro ao gerar post para hotel ${hotel.id}:`, error)
        
        await prisma.automationLog.create({
          data: {
            hotelId: hotel.id,
            status: 'error',
            message: `Erro ao gerar post para hotel ${hotel.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }
        })
        
        results.push({ hotelId: hotel.id, status: 'error', error: error instanceof Error ? error.message : 'Erro desconhecido' })
      }
    }

    // Log de conclusão da automação
    if (firstHotel) {
      await prisma.automationLog.create({
        data: {
          hotelId: firstHotel.id,
          status: 'success',
          message: `Processados ${results.length} hotéis. Resultados: ${JSON.stringify(results)}`
        }
      })
    }
    
    console.log('\n🎉 TESTE MANUAL DO CRON CONCLUÍDO!')
    console.log('\n📊 RESULTADOS:')
    results.forEach((result, index) => {
      console.log(`${index + 1}. Hotel ${result.hotelId}: ${result.status}`)
      if (result.status === 'success') {
        console.log(`   ✅ Post criado: "${result.title}" (ID: ${result.postId})`)
      } else if (result.status === 'skipped') {
        console.log(`   ⏭️ Motivo: ${result.reason}`)
      } else if (result.status === 'error') {
        console.log(`   ❌ Erro: ${result.error}`)
      }
    })
    
    console.log('\n📋 PRÓXIMOS PASSOS:')
    console.log('1. Verificar se os logs de automação foram criados')
    console.log('2. Fazer deploy das alterações para produção')
    console.log('3. Monitorar se o cron job do Vercel executará automaticamente')
    console.log('4. Verificar logs do Vercel Functions em produção')
    
  } catch (error) {
    console.error('❌ Erro durante teste manual:', error)
    
    // Log de erro geral da automação
    try {
      const firstHotel = await prisma.hotel.findFirst({ where: { autoGeneratePosts: true } })
      if (firstHotel) {
        await prisma.automationLog.create({
          data: {
            hotelId: firstHotel.id,
            status: 'error',
            message: `Erro geral na execução manual do cron job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          }
        })
      }
    } catch (logError) {
      console.error('Erro ao criar log de automação:', logError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  testCronManually()
}

module.exports = { testCronManually }