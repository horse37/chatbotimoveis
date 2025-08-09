const axios = require('axios');

async function checkLocalImoveis() {
  try {
    console.log('🔍 Verificando imóveis na base local...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    console.log('📊 Resposta completa:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar estrutura
    console.log('\n🔍 Análise da estrutura:');
    console.log('Tipo de response.data:', typeof response.data);
    console.log('É array?', Array.isArray(response.data));
    console.log('Tem propriedade data?', response.data.hasOwnProperty('data'));
    console.log('Tem propriedade imoveis?', response.data.hasOwnProperty('imoveis'));
    
    let imoveis = [];
    if (Array.isArray(response.data)) {
      imoveis = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      imoveis = response.data.data;
    } else if (response.data.imoveis && Array.isArray(response.data.imoveis)) {
      imoveis = response.data.imoveis;
    } else {
      console.log('❌ Estrutura inesperada da resposta');
    }
    
    console.log(`\n📋 Total de imóveis: ${imoveis.length}`);
    
    if (imoveis.length > 0) {
      console.log('\n🏠 Primeiros 3 imóveis:');
      imoveis.slice(0, 3).forEach((imovel, index) => {
        console.log(`${index + 1}. ID: ${imovel.id}, Título: ${imovel.titulo || 'Sem título'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.response?.data || error.message);
  }
}

checkLocalImoveis();