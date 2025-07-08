#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAutomationLocally() {
  console.log('🧪 Testando Automação Localmente\n')
  
  try {
    // 1. Verificar hotéis com automação
    console.log('1️⃣ Buscando hotéis com automação ativada...')
    const hotels = await prisma.hotel.findMany({
      where: { autoGeneratePosts: true },
      include: {
        rede: true,
        owner: true
      }
    })
    
    console.log(`   📊 Encontrados ${hotels.length} hotéis com automação ativada`)
    
    if (hotels.length === 0) {
      console.log('   ❌ PROBLEMA: Nenhum hotel tem automação ativada!')
      return
    }
    
    // 2. Testar função shouldCreatePost para cada hotel
    console.log('\n2️⃣ Testando lógica de criação de posts...')
    const results = []
    
    for (const hotel of hotels) {
      console.log(`\n   🏨 Testando hotel: ${hotel.name}`)
      console.log(`      - Frequência: ${hotel.postFrequency}`)
      console.log(`      - Último post automático: ${hotel.lastAutoPostAt}`)
      console.log(`      - Limite mensal: ${hotel.maxMonthlyPosts}`)
      
      const shouldCreate = await shouldCreatePost(hotel)
      console.log(`      - Deveria criar post: ${shouldCreate.should ? '✅ SIM' : '❌ NÃO'}`)
      if (!shouldCreate.should) {
        console.log(`      - Motivo: ${shouldCreate.reason}`)
      }
      
      results.push({
        hotelId: hotel.id,
        hotelName: hotel.name,
        shouldCreate: shouldCreate.should,
        reason: shouldCreate.reason
      })
    }
    
    // 3. Testar APIs necessárias
    console.log('\n3️⃣ Testando APIs necessárias...')
    
    // Testar GROQ
    try {
      console.log('   🧠 Testando GROQ API...')
      const { generatePostIdeas } = require('../lib/groq.ts')
      const testIdea = await generatePostIdeas('Teste de conexão com GROQ')
      console.log('   ✅ GROQ funcionando')
      console.log(`      Título de teste: ${testIdea.title}`)
    } catch (error) {
      console.log(`   ❌ Erro no GROQ: ${error.message}`)
    }
    
    // Testar serviço de imagem
    try {
      console.log('   🖼️  Testando serviço de imagem...')
      const { generateBlogImage } = require('../lib/image-service.ts')
      console.log('   ✅ Serviço de imagem disponível')
    } catch (error) {
      console.log(`   ❌ Erro no serviço de imagem: ${error.message}`)
    }
    
    // 4. Simular criação de post para um hotel que deveria criar
    const hotelToTest = results.find(r => r.shouldCreate)
    if (hotelToTest) {
      console.log(`\n4️⃣ Simulando criação de post para ${hotelToTest.hotelName}...`)
      
      try {
        const hotel = hotels.find(h => h.id === hotelToTest.hotelId)
        
        // Buscar informações da rede
        const rede = await prisma.rede.findUnique({
          where: { id: hotel.redeId }
        })
        
        const context = `Hotel ${hotel.name} da rede ${rede?.name || 'N/A'}, localizado em ${hotel.city}, ${hotel.state}, ${hotel.country}. Voltado para ${hotel.travelType}, público ${hotel.audience}, melhor época: ${hotel.season}. Eventos locais: ${hotel.events}. Preferências de tema: ${hotel.themePreferences || 'geral'}`
        
        console.log('   📝 Contexto gerado:')
        console.log(`      ${context}`)
        
        // Testar geração de ideia
        const { generatePostIdeas } = require('../lib/groq.ts')
        const postData = await generatePostIdeas(`Gere uma ideia de post para: ${context}`)
        const title = postData.title || `Descubra ${hotel.city} - ${hotel.name}`
        
        console.log(`   💡 Título gerado: ${title}`)
        
        // Testar geração de conteúdo
        const { generateMarkdownPostFromTitle } = require('../lib/groq.ts')
        const content = await generateMarkdownPostFromTitle(title, hotel)
        
        console.log(`   📄 Conteúdo gerado (${content.length} caracteres)`)
        console.log(`   📄 Primeiros 200 caracteres: ${content.substring(0, 200)}...`)
        
        // Testar geração de imagem
        const { generateBlogImage } = require('../lib/image-service.ts')
        const imageUrl = await generateBlogImage(`${title}, ${hotel.name}, ${hotel.city}, ${rede?.name || 'hotel'}, ${hotel.season}`)
        
        console.log(`   🖼️  Imagem gerada: ${imageUrl}`)
        
        console.log('   ✅ Simulação de criação de post bem-sucedida!')
        
        // Perguntar se deve criar o post de verdade
        console.log('\n❓ Deseja criar este post de verdade? (Pressione Ctrl+C para cancelar ou aguarde 10 segundos para continuar)')
        
        await new Promise(resolve => setTimeout(resolve, 10000))
        
        // Criar o post
        const post = await prisma.post.create({
          data: {
            title,
            content,
            imageUrl,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            hotelId: hotel.id,
            authorId: hotel.ownerId,
            publishedAt: new Date()
          }
        })
        
        // Atualizar hotel
        await prisma.hotel.update({
          where: { id: hotel.id },
          data: { lastAutoPostAt: new Date() }
        })
        
        console.log(`   🎉 Post criado com sucesso! ID: ${post.id}`)
        
      } catch (error) {
        console.log(`   ❌ Erro na simulação: ${error.message}`)
      }
    } else {
      console.log('\n4️⃣ Nenhum hotel deveria criar post no momento')
    }
    
    // 5. Resumo
    console.log('\n📋 RESUMO DO TESTE:')
    console.log('===================')
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.hotelName}: ${result.shouldCreate ? '✅ Deveria criar' : '❌ Não deveria criar'}`)
      if (!result.shouldCreate) {
        console.log(`   Motivo: ${result.reason}`)
      }
    })
    
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

    if (postsThisMonth >= hotel.maxMonthlyPosts) {
      return { should: false, reason: `limite mensal atingido (${postsThisMonth}/${hotel.maxMonthlyPosts})` }
    }
  }

  return { should: true }
}

if (require.main === module) {
  testAutomationLocally()
}

module.exports = { testAutomationLocally }