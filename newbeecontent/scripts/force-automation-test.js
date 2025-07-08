#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function forceAutomationTest() {
  console.log('🚀 Forçando Teste de Automação\n')
  
  try {
    // 1. Encontrar hotel com automação
    console.log('1️⃣ Buscando hotel com automação...')
    const hotel = await prisma.hotel.findFirst({
      where: { autoGeneratePosts: true },
      include: {
        rede: true,
        owner: true
      }
    })
    
    if (!hotel) {
      console.log('   ❌ Nenhum hotel com automação encontrado!')
      return
    }
    
    console.log(`   🏨 Hotel encontrado: ${hotel.name}`)
    console.log(`   📅 Último post automático: ${hotel.lastAutoPostAt}`)
    
    // 2. Temporariamente alterar a data do último post para forçar criação
    console.log('\n2️⃣ Alterando data do último post para forçar criação...')
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 8) // 8 dias atrás
    
    await prisma.hotel.update({
      where: { id: hotel.id },
      data: { lastAutoPostAt: oneWeekAgo }
    })
    
    console.log(`   ✅ Data alterada para: ${oneWeekAgo}`)
    
    // 3. Testar a lógica shouldCreatePost
    console.log('\n3️⃣ Testando se deveria criar post agora...')
    const updatedHotel = await prisma.hotel.findUnique({
      where: { id: hotel.id }
    })
    
    const shouldCreate = await shouldCreatePost(updatedHotel)
    console.log(`   Resultado: ${shouldCreate.should ? '✅ DEVERIA CRIAR' : '❌ NÃO DEVERIA CRIAR'}`)
    if (!shouldCreate.should) {
      console.log(`   Motivo: ${shouldCreate.reason}`)
    }
    
    if (shouldCreate.should) {
      console.log('\n4️⃣ Criando post de teste...')
      
      // Criar um post simples para testar
      const testTitle = `Post de Teste Automático - ${hotel.name} - ${new Date().toISOString()}`
      const testContent = `# ${testTitle}\n\nEste é um post de teste criado automaticamente para verificar se a funcionalidade de automação está funcionando.\n\n## Informações do Hotel\n\n- **Nome:** ${hotel.name}\n- **Cidade:** ${hotel.city}, ${hotel.state}\n- **Rede:** ${hotel.rede.name}\n\n## Data de Criação\n\n${new Date().toLocaleString('pt-BR')}\n\n---\n\n*Este post foi criado automaticamente pelo sistema de automação.*`
      
      const post = await prisma.post.create({
        data: {
          title: testTitle,
          content: testContent,
          imageUrl: 'https://via.placeholder.com/800x400/0066cc/ffffff?text=Post+de+Teste',
          slug: testTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 100),
          hotelId: hotel.id,
          authorId: hotel.ownerId,
          publishedAt: new Date()
        }
      })
      
      console.log(`   ✅ Post criado com ID: ${post.id}`)
      console.log(`   📝 Título: ${post.title}`)
      console.log(`   🔗 Slug: ${post.slug}`)
      
      // Atualizar hotel com nova data
      await prisma.hotel.update({
        where: { id: hotel.id },
        data: { lastAutoPostAt: new Date() }
      })
      
      console.log('   🔄 Hotel atualizado com nova data de último post')
      
      console.log('\n🎉 TESTE DE AUTOMAÇÃO CONCLUÍDO COM SUCESSO!')
      console.log('\n📋 PRÓXIMOS PASSOS:')
      console.log('1. Verificar se o post aparece no dashboard')
      console.log('2. Verificar se o cron job do Vercel está configurado corretamente')
      console.log('3. Monitorar logs de automação em produção')
      
    } else {
      console.log('\n❌ Mesmo após alterar a data, o hotel não deveria criar post')
      console.log('   Isso indica um problema na lógica de automação')
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Função auxiliar (copiada da API de cron)
async function shouldCreatePost(hotel) {
  const now = new Date()
  const last = hotel.lastAutoPostAt || new Date(0)
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)

  console.log(`   📊 Análise de frequência:`)
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

if (require.main === module) {
  forceAutomationTest()
}

module.exports = { forceAutomationTest }