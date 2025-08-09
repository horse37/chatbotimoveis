const axios = require('axios');

async function debugSyncIndividual() {
  try {
    console.log('🔍 Debug: Verificando imóveis locais...');
    
    // Buscar imóveis locais
    const localResponse = await axios.get('http://localhost:4000/api/imoveis');
    const imoveis = localResponse.data;
    
    console.log(`📊 Imóveis encontrados localmente: ${imoveis.length}`);
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel local encontrado');
      return;
    }
    
    // Pegar o primeiro imóvel para teste
    const imovel = imoveis[0];
    console.log('🏠 Primeiro imóvel:', {
      id: imovel.id,
      titulo: imovel.titulo,
      strapiId: imovel.strapiId
    });
    
    // Testar sincronização individual
    console.log(`🔄 Testando sincronização individual para imóvel ID: ${imovel.id}`);
    
    const syncResponse = await axios.post(`http://localhost:4000/api/sync-imoveis/${imovel.id}`);
    
    console.log('✅ Resposta da sincronização:', syncResponse.data);
    
  } catch (error) {
    console.error('❌ Erro no debug:', error.response?.data || error.message);
  }
}

async function debugStrapiConnection() {
  try {
    console.log('🔗 Debug: Verificando conexão com Strapi...');
    
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    
    const response = await axios.get(`${strapiUrl}/api/imoveis?populate=*`);
    console.log(`📊 Imóveis no Strapi: ${response.data.data?.length || 0}`);
    
    if (response.data.data?.length > 0) {
      console.log('🏠 Primeiro imóvel no Strapi:', {
        id: response.data.data[0].id,
        titulo: response.data.data[0].attributes?.titulo
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Strapi:', error.response?.data || error.message);
  }
}

// Executar debug
console.log('=== DEBUG DE SINCRONIZAÇÃO INDIVIDUAL ===\n');
debugStrapiConnection().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  return debugSyncIndividual();
});