const { testStrapiConnection, getSyncStats } = require('./src/lib/imovel-service-wrapper');

async function testStrapiIntegration() {
  console.log('🧪 Testando Integração com Strapi...\n');

  try {
    // Teste 1: Conexão
    console.log('1. Testando conexão com Strapi...');
    const isConnected = await testStrapiConnection();
    console.log(`   ✅ Conexão: ${isConnected ? 'OK' : 'FALHA'}\n`);

    // Teste 2: Estatísticas
    console.log('2. Obtendo estatísticas...');
    const stats = await getSyncStats();
    console.log(`   📊 Total Local: ${stats.totalLocal}`);
    console.log(`   📊 Total Strapi: ${stats.totalStrapi}`);
    console.log(`   📊 Pendentes: ${stats.pendingSync}\n`);

    // Teste 3: Verificar endpoints
    console.log('3. Verificando endpoints da API...');
    const response = await fetch('http://localhost:3000/api/strapi-sync');
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Endpoint disponível: ${data.message}\n`);
    } else {
      console.log(`   ❌ Endpoint não disponível: ${response.status}\n`);
    }

    console.log('✅ Testes concluídos!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Configure o token de API no .env.local');
    console.log('   2. Teste com um imóvel real');
    console.log('   3. Monitore os logs para verificar sincronização');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

// Executa os testes
if (require.main === module) {
  testStrapiIntegration();
}

module.exports = { testStrapiIntegration };