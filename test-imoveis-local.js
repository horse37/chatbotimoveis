// Script para testar se há imóveis na base local
const fetch = require('node-fetch');

async function testImoveisLocal() {
  try {
    console.log('🔍 Testando busca de imóveis locais...');
    
    // Buscar imóveis sem autenticação primeiro
    let response = await fetch('http://localhost:4000/api/imoveis');
    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Resposta completa:', JSON.stringify(data, null, 2));
    
    // Verificar estrutura
    let imoveis = [];
    if (Array.isArray(data)) {
      imoveis = data;
    } else if (data.imoveis) {
      imoveis = data.imoveis;
    } else if (data.data) {
      imoveis = data.data;
    }
    
    console.log(`📊 Total de imóveis encontrados: ${imoveis.length}`);
    
    if (imoveis.length > 0) {
      console.log('✅ Imóveis encontrados:', imoveis.map(i => ({id: i.id, titulo: i.titulo})));
    } else {
      console.log('⚠️ Nenhum imóvel encontrado na base local');
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
  }
}

testImoveisLocal();