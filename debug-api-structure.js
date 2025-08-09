const axios = require('axios');

async function debugApiStructure() {
  try {
    console.log('🔍 Debug: Verificando estrutura da API local...');
    
    // Buscar imóveis locais com detalhes
    const localResponse = await axios.get('http://localhost:4000/api/imoveis');
    console.log('📊 Resposta completa da API local:');
    console.log(JSON.stringify(localResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis locais:', error.response?.data || error.message);
  }
  
  try {
    console.log('\n🔗 Debug: Verificando variáveis de ambiente...');
    console.log('STRAPI_URL:', process.env.STRAPI_URL || 'http://localhost:1337');
    console.log('STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN ? 'Definido' : 'Não definido');
    
  } catch (error) {
    console.error('❌ Erro ao verificar variáveis:', error.message);
  }
  
  try {
    console.log('\n🔗 Debug: Verificando conexão com Strapi...');
    
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const strapiToken = process.env.STRAPI_API_TOKEN;
    
    const config = {
      headers: {}
    };
    
    if (strapiToken) {
      config.headers['Authorization'] = `Bearer ${strapiToken}`;
    }
    
    const response = await axios.get(`${strapiUrl}/api/imoveis?populate=*`, config);
    console.log('✅ Conexão com Strapi estabelecida');
    console.log(`📊 Imóveis no Strapi: ${response.data.data?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erro detalhado ao conectar com Strapi:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Executar debug
debugApiStructure();