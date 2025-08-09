const axios = require('axios');

async function syncAllImoveis() {
  console.log('🚀 Iniciando sincronização de todos os imóveis...\n');
  
  try {
    console.log('🔍 Buscando imóveis da API local...');
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    // Usar a mesma lógica do check-local-imoveis.js
    let imoveis = [];
    
    if (Array.isArray(response.data)) {
      imoveis = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      imoveis = response.data.data;
    } else if (response.data.imoveis && Array.isArray(response.data.imoveis)) {
      imoveis = response.data.imoveis;
    } else {
      console.log('📊 Debug - estrutura:', JSON.stringify(response.data, null, 2));
      console.log('❌ Não foi possível identificar os imóveis');
      return;
    }
    
    console.log(`✅ Total de imóveis: ${imoveis.length}`);
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado');
      return;
    }

    console.log(`\n📊 Processando ${imoveis.length} imóveis...\n`);
    
    let success = 0;
    let failed = 0;

    // Processar cada imóvel
    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      
      console.log(`${i + 1}/${imoveis.length} - ID: ${imovel.id} - ${imovel.titulo || 'Sem título'}`);
      
      try {
        // Executar sincronização individual
        const result = await axios.post(`http://localhost:3000/api/sync-imoveis/${imovel.id}`);
        console.log(`✅ Sucesso`);
        success++;
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n🎯 RESUMO FINAL:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📊 Total: ${imoveis.length}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

syncAllImoveis();