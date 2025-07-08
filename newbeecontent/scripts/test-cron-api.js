const axios = require('axios');

// Configuração
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-app.vercel.app/api/cron'
  : 'http://localhost:3000/api/cron';

console.log('🧪 Testando API de Cron via HTTP');
console.log(`📡 URL: ${API_URL}`);
console.log('');

async function testCronAPI() {
  try {
    console.log('🚀 Fazendo requisição para a API de cron...');
    
    const response = await axios.get(API_URL, {
      timeout: 30000, // 30 segundos
      headers: {
        'User-Agent': 'Cron-Test-Script'
      }
    });
    
    console.log('✅ Resposta recebida:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200) {
      console.log('');
      console.log('🎉 API de cron executada com sucesso!');
      console.log('📋 Próximos passos:');
      console.log('   1. Verificar logs de automação no banco de dados');
      console.log('   2. Confirmar se posts foram criados (se aplicável)');
      console.log('   3. Monitorar execução automática do Vercel');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API de cron:');
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('   Erro de rede - sem resposta do servidor');
      console.error(`   Detalhes: ${error.message}`);
    } else {
      console.error(`   Erro: ${error.message}`);
    }
    
    console.log('');
    console.log('🔧 Possíveis soluções:');
    console.log('   1. Verificar se o servidor está rodando');
    console.log('   2. Confirmar a URL da API');
    console.log('   3. Verificar logs do servidor');
    console.log('   4. Testar localmente primeiro');
  }
}

// Executar teste
testCronAPI();