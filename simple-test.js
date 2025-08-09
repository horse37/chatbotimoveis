const axios = require('axios');

async function simpleTest() {
  try {
    console.log('🔍 Teste simples de API...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    console.log('📊 Status:', response.status);
    console.log('📦 Tipo:', typeof response.data);
    console.log('🗝️  Chaves:', Object.keys(response.data || {}));
    
    // Mostrar os primeiros 500 caracteres
    const dataStr = JSON.stringify(response.data).substring(0, 500);
    console.log('📋 Primeiros 500 chars:', dataStr + '...');
    
    // Encontrar os imóveis
    let imoveis = [];
    
    if (response.data) {
      if (response.data.imoveis) {
        imoveis = response.data.imoveis;
        console.log('✅ Encontrado em response.data.imoveis:', imoveis.length);
      } else if (response.data.data) {
        imoveis = response.data.data;
        console.log('✅ Encontrado em response.data.data:', imoveis.length);
      } else if (Array.isArray(response.data)) {
        imoveis = response.data;
        console.log('✅ Array direto:', imoveis.length);
      } else {
        console.log('❌ Não encontrado em nenhum lugar esperado');
      }
    }
    
    if (imoveis.length > 0) {
      console.log('🏠 Primeiro imóvel:', imoveis[0]?.id, imoveis[0]?.titulo);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

simpleTest();