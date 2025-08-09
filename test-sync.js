const https = require('https');

// Função para testar a sincronização
async function testSync() {
  try {
    console.log('🧪 Testando sincronização de imóveis...');
    
    // Buscar imóveis diretamente do banco
    const { query } = require('./src/lib/db');
    
    const imoveis = await query('SELECT COUNT(*) as total FROM imoveis');
    console.log(`📊 Total de imóveis no banco: ${imoveis[0]?.total || 0}`);
    
    if (imoveis[0]?.total > 0) {
      const sample = await query('SELECT id, titulo FROM imoveis LIMIT 3');
      console.log('📋 Amostra de imóveis:', sample);
    }
    
    // Verificar variáveis de ambiente
    console.log('🔧 Variáveis de ambiente:');
    console.log('STRAPI_URL:', process.env.STRAPI_URL || 'Não definido');
    console.log('NEXT_PUBLIC_STRAPI_URL:', process.env.NEXT_PUBLIC_STRAPI_URL || 'Não definido');
    console.log('STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN ? 'Definido' : 'Não definido');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Testar conexão com Strapi
async function testStrapiConnection() {
  try {
    const strapiUrl = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
    const apiToken = process.env.STRAPI_API_TOKEN;
    
    console.log('🔗 Testando conexão com Strapi...');
    console.log('URL:', strapiUrl);
    
    const response = await fetch(`${strapiUrl}/imoveis?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexão com Strapi OK');
      console.log('Imóveis no Strapi:', data.length || 0);
    } else {
      console.error('❌ Erro na conexão:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('=== INICIANDO TESTES ===');
  await testSync();
  await testStrapiConnection();
  console.log('=== TESTES CONCLUÍDOS ===');
}

if (require.main === module) {
  runTests();
}

module.exports = { testSync, testStrapiConnection };