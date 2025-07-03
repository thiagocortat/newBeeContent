#!/usr/bin/env node

/**
 * Script para testar os provedores de geração de imagens
 * Uso: node scripts/test-image-providers.js
 */

require('dotenv').config()

// Como estamos em um script Node.js puro, vamos importar diretamente as funções necessárias
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Função para gerar UUID v4
function generateUUID() {
  return crypto.randomUUID()
}

// Função para verificar configuração
function checkConfig() {
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN
  const hasRunware = !!process.env.RUNWARE_API_KEY
  const imageProvider = process.env.IMAGE_PROVIDER || 'replicate'
  
  return {
    hasReplicate,
    hasRunware,
    imageProvider,
    hasAny: hasReplicate || hasRunware,
    active: (imageProvider === 'runware' && hasRunware) ? 'runware' : 
            (hasReplicate ? 'replicate' : 'none')
  }
}

// Função para gerar imagem usando fetch
async function generateImageTest(prompt) {
  const config = checkConfig()
  
  if (config.active === 'replicate' && config.hasReplicate) {
    // Teste com Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
        input: { prompt }
      })
    })
    
    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`)
    }
    
    const prediction = await response.json()
    
    // Aguardar conclusão
    let result = prediction
    while (result.status === 'starting' || result.status === 'processing') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`
        }
      })
      result = await statusResponse.json()
    }
    
    if (result.status === 'succeeded') {
      return result.output[0]
    } else {
      throw new Error(`Replicate generation failed: ${result.error || result.status}`)
    }
  } else if (config.active === 'runware' && config.hasRunware) {
    // Teste com Runware
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWARE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
         taskType: 'imageInference',
         taskUUID: generateUUID(),
         model: 'runware:100@1',
         positivePrompt: prompt,
         width: 1024,
         height: 1024,
         numberResults: 1
       }])
    })
    
    if (!response.ok) {
       const errorText = await response.text()
       throw new Error(`Runware API error: ${response.status} - ${errorText}`)
     }
     
     const result = await response.json()
     if (result.data && result.data[0] && result.data[0].imageURL) {
       return result.data[0].imageURL
     } else {
       throw new Error(`Runware generation failed: ${JSON.stringify(result)}`)
     }
  } else {
    throw new Error('Nenhum provedor de imagem configurado ou disponível')
  }
}

async function testImageProviders() {
  console.log('🎨 Teste de Provedores de Imagem - BeeContent\n')
  
  // Verificar status dos provedores
  const config = checkConfig()
  
  console.log('📋 Status dos Provedores:')
  console.log(`   - Replicate: ${config.hasReplicate ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   - Runware: ${config.hasRunware ? '✅ Configurado' : '❌ Não configurado'}`)
  console.log(`   - Provedor ativo: ${config.active.toUpperCase()}`)
  console.log()
  
  if (!config.hasAny) {
    console.log('❌ Nenhum provedor de imagem configurado!')
    console.log('📝 Configure REPLICATE_API_TOKEN ou RUNWARE_API_KEY no arquivo .env')
    return
  }
  
  console.log(`✅ Provedor ativo: ${config.active.toUpperCase()}`)
  console.log(`📊 Provedores disponíveis:`)
  console.log(`   - Replicate: ${config.hasReplicate ? '✅' : '❌'}`)
  console.log(`   - Runware: ${config.hasRunware ? '✅' : '❌'}`)
  console.log()
  
  // Teste de geração de imagem
  const testPrompt = 'A beautiful hotel room with ocean view, modern design, luxury interior'
  
  console.log('🖼️  Testando geração de imagem...')
  console.log(`📝 Prompt: ${testPrompt}`)
  console.log()
  
  // Testar provedor ativo primeiro
  try {
    console.log(`⏳ Testando ${config.active.toUpperCase()}...`)
    const startTime = Date.now()
    
    const imageUrl = await generateImageTest(testPrompt)
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    console.log('✅ Imagem gerada com sucesso!')
    console.log(`🔗 URL: ${imageUrl}`)
    console.log(`⏱️  Tempo: ${duration}s`)
    console.log(`🎯 Provedor usado: ${config.active.toUpperCase()}`)
    
  } catch (error) {
    console.error(`❌ Erro com ${config.active.toUpperCase()}:`)
    console.error(`   ${error.message}`)
    
    // Tentar o outro provedor se disponível
    const alternativeProvider = config.active === 'replicate' ? 'runware' : 'replicate'
    const hasAlternative = alternativeProvider === 'replicate' ? config.hasReplicate : config.hasRunware
    
    if (hasAlternative) {
      console.log(`\n🔄 Tentando com ${alternativeProvider.toUpperCase()}...`)
      
      // Temporariamente mudar o provedor
      const originalProvider = process.env.IMAGE_PROVIDER
      process.env.IMAGE_PROVIDER = alternativeProvider
      
      try {
        const startTime = Date.now()
        const imageUrl = await generateImageTest(testPrompt)
        const endTime = Date.now()
        const duration = ((endTime - startTime) / 1000).toFixed(2)
        
        console.log('✅ Imagem gerada com sucesso!')
        console.log(`🔗 URL: ${imageUrl}`)
        console.log(`⏱️  Tempo: ${duration}s`)
        console.log(`🎯 Provedor usado: ${alternativeProvider.toUpperCase()}`)
        
      } catch (altError) {
        console.error(`❌ Erro com ${alternativeProvider.toUpperCase()}:`)
        console.error(`   ${altError.message}`)
        
        console.log('\n💡 Diagnóstico dos Erros:')
         
         if (error.message.includes('402')) {
           console.log('   🔴 Replicate: Erro 402 - Pagamento necessário (sem créditos)')
         } else if (error.message.includes('401')) {
           console.log('   🔴 API Key inválida ou expirada')
         } else if (error.message.includes('invalidTaskUUID')) {
           console.log('   🔴 Runware: Problema com UUID (corrigido nesta versão)')
         }
         
         if (altError.message.includes('402')) {
           console.log('   🔴 Replicate: Erro 402 - Pagamento necessário (sem créditos)')
         } else if (altError.message.includes('401')) {
           console.log('   🔴 API Key inválida ou expirada')
         }
         
         console.log('\n💡 Soluções:')
         console.log('   1. Verifique se as API keys estão corretas no .env')
         console.log('   2. Para Replicate: Adicione créditos na conta')
         console.log('   3. Para Runware: Verifique se a conta está ativa')
         console.log('   4. Teste a conectividade com a internet')
      } finally {
        // Restaurar provedor original
        if (originalProvider) {
          process.env.IMAGE_PROVIDER = originalProvider
        } else {
          delete process.env.IMAGE_PROVIDER
        }
      }
    } else {
      console.log('\n💡 Dicas:')
      console.log('   1. Verifique se as API keys estão corretas no .env')
      console.log('   2. Teste a conectividade com a internet')
      console.log('   3. Verifique se o provedor está funcionando')
      console.log('   4. Para Replicate: REPLICATE_API_TOKEN')
      console.log('   5. Para Runware: RUNWARE_API_KEY')
    }
  }
}

// Executar teste
testImageProviders().catch(console.error)