const axios = require('axios');

async function debugApiResponse() {
  try {
    console.log('🔍 Debug completo da resposta da API...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers);
    
    console.log('\n🎯 Estrutura completa do response:');
    console.log('response.data type:', typeof response.data);
    console.log('response.data keys:', Object.keys(response.data));
    
    if (response.data) {
      console.log('\n📦 Conteúdo de response.data:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Tentar diferentes caminhos
      console.log('\n🔍 Tentando diferentes caminhos:');
      
      if (response.data.data) {
        console.log('✅ response.data.data encontrado:', Array.isArray(response.data.data), response.data.data.length);
      }
      
      if (response.data.imoveis) {
        console.log('✅ response.data.imoveis encontrado:', Array.isArray(response.data.imoveis), response.data.imoveis.length);
      }
      
      if (Array.isArray(response.data)) {
        console.log('✅ response.data é array:', response.data.length);
      }
      
      // Verificar se tem pagination
      if (response.data.pagination) {
        console.log('📊 Pagination:', response.data.pagination);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

debugApiResponse();