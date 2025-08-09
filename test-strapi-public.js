const axios = require('axios');

async function testStrapiPublic() {
  const strapiUrl = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
  
  console.log('🔄 Testando conexão pública com Strapi...');
  console.log('📍 URL:', strapiUrl);
  
  try {
    // Testar GET /imoveis
    console.log('\n1. Testando GET /imoveis...');
    const getResponse = await axios.get(`${strapiUrl}/imoveis`);
    console.log('✅ GET /imoveis - Sucesso');
    console.log(`📊 Total de imóveis: ${getResponse.data?.data?.length || 0}`);
    
    // Testar POST /imoveis (sem autenticação)
    console.log('\n2. Testando POST /imoveis sem autenticação...');
    const testData = {
      data: {
        title: 'Teste de Imóvel',
        description: 'Teste de sincronização',
        price: 100000,
        tipo_contrato: 'venda',
        tipo_imovel: 'apartamento',
        active: true,
        local_id: 99999
      }
    };
    
    try {
      const postResponse = await axios.post(`${strapiUrl}/imoveis`, testData);
      console.log('✅ POST /imoveis - Sucesso');
      console.log('📝 Resposta:', postResponse.data);
    } catch (postError) {
      console.log('❌ POST /imoveis - Falha:', postError.response?.status, postError.response?.statusText);
      console.log('🔍 Verificando se precisa de autenticação...');
      
      // Testar com token Bearer
      const strapiToken = process.env.STRAPI_API_TOKEN;
      if (strapiToken) {
        console.log('\n3. Testando POST com token...');
        try {
          const authResponse = await axios.post(`${strapiUrl}/imoveis`, testData, {
            headers: {
              'Authorization': `Bearer ${strapiToken}`
            }
          });
          console.log('✅ POST com token - Sucesso');
        } catch (authError) {
          console.log('❌ POST com token - Falha:', authError.response?.status, authError.response?.statusText);
        }
      } else {
        console.log('ℹ️  STRAPI_API_TOKEN não configurado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Strapi:', error.response?.status, error.response?.statusText);
    console.error('🔍 Detalhes:', error.message);
  }
}

// Verificar variáveis de ambiente
console.log('🌍 Variáveis de ambiente:');
console.log('STRAPI_URL:', process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host');
console.log('STRAPI_API_TOKEN:', process.env.STRAPI_API_TOKEN ? 'Configurado' : 'Não configurado');

testStrapiPublic();