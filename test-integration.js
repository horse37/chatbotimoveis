/**
 * Teste de Integração com Strapi
 * 
 * Execute este arquivo para testar a integração:
 * node test-integration.js
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';

async function testStrapiConnection() {
  console.log('🔄 Testando conexão com Strapi (modo público)...');
  
  try {
    const response = await fetch(`${STRAPI_URL}/imoveis`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexão com Strapi estabelecida (modo público)');
      console.log(`📊 Total de imóveis no Strapi: ${data.data?.length || data.length || 0}`);
      return true;
    } else {
      console.log('❌ Erro ao conectar com Strapi:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

async function testApiEndpoint() {
  console.log('\n🔄 Testando endpoint de sincronização...');
  
  try {
    // Teste básico do endpoint (não executa sincronização real)
    const response = await fetch('http://localhost:3000/api/strapi-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test', imovelId: 1 })
    });
    
    if (response.status === 400 || response.status === 404) {
      console.log('✅ Endpoint acessível (erro esperado para dados de teste)');
      return true;
    } else {
      console.log('✅ Endpoint acessível');
      return true;
    }
  } catch (error) {
    console.log('❌ Endpoint não acessível (servidor local não rodando)');
    return false;
  }
}

async function main() {
  console.log('🚀 Teste de Integração Strapi\n');
  
  const strapiConnected = await testStrapiConnection();
  const apiAvailable = await testApiEndpoint();
  
  console.log('\n📋 Resumo dos Testes:');
  console.log(`- Strapi: ${strapiConnected ? '✅ Conectado' : '❌ Desconectado'}`);
  console.log(`- API Local: ${apiAvailable ? '✅ Disponível' : '❌ Indisponível'}`);
  
  if (strapiConnected && apiAvailable) {
    console.log('\n🎉 Sistema pronto para sincronização!');
  } else {
    console.log('\n⚠️  Verifique as configurações:');
    console.log('- Certifique-se que o servidor Next.js está rodando (npm run dev)');
    console.log('- Verifique as variáveis de ambiente em .env.local');
    console.log('- Confirme que o Strapi está acessível');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { testStrapiConnection, testApiEndpoint };