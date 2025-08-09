const axios = require('axios');

async function debugApi() {
  console.log('🔍 Debug da API Local...');
  
  try {
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    console.log('✅ Resposta recebida:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data type:', typeof response.data);
    console.log('Data keys:', Object.keys(response.data || {}));
    
    if (response.data) {
      console.log('\n📊 Estrutura da resposta:');
      console.log('response.data:', JSON.stringify(response.data, null, 2));
      
      // Tentar encontrar os imóveis
      let imoveis = [];
      if (response.data.data) {
        imoveis = response.data.data;
        console.log('\n✅ Encontrado imoveis em response.data.data');
      } else if (response.data.imoveis) {
        imoveis = response.data.imoveis;
        console.log('\n✅ Encontrado imoveis em response.data.imoveis');
      } else {
        console.log('\n❌ Não encontrado array de imoveis');
      }
      
      console.log(`📋 Total de imoveis encontrados: ${imoveis.length}`);
      
      if (imoveis.length > 0) {
        console.log('\n📋 Primeiro imóvel:');
        console.log(JSON.stringify(imoveis[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na API:', error.message);
    if (error.response) {
      console.error('❌ Status:', error.response.status);
      console.error('❌ Data:', error.response.data);
    }
  }
}

debugApi();