const axios = require('axios');

async function syncAllProperties() {
  console.log('🚀 Iniciando sincronização de todos os imóveis...\n');
  
  try {
    // Buscar todos os imóveis
    console.log('🔍 Buscando imóveis da API local...');
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    // Extrair imóveis usando a lógica do check-local-imoveis.js
    let imoveis = [];
    if (Array.isArray(response.data)) {
      imoveis = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      imoveis = response.data.data;
    } else if (response.data.imoveis && Array.isArray(response.data.imoveis)) {
      imoveis = response.data.imoveis;
    } else {
      console.log('❌ Estrutura não reconhecida');
      return;
    }
    
    console.log(`✅ Total de imóveis encontrados: ${imoveis.length}`);
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel para sincronizar');
      return;
    }

    console.log(`\n📊 Processando ${imoveis.length} imóveis individualmente...\n`);
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const id = imovel.id;
      
      console.log(`${i + 1}/${imoveis.length} - ${id} - ${imovel.titulo || 'Sem título'}`);
      
      try {
        const syncResponse = await axios.post(`http://localhost:3000/api/sync-imoveis/${id}`);
        
        if (syncResponse.status === 200 || syncResponse.status === 201) {
          console.log(`✅ Sucesso`);
          success++;
        } else {
          console.log(`❌ Erro - Status: ${syncResponse.status}`);
          failed++;
        }
        
      } catch (error) {
        console.error(`❌ Falha: ${error.response?.data?.message || error.message}`);
        failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🎯 RESUMO FINAL:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📊 Total: ${imoveis.length}`);
    
    console.log('\n🎉 Sincronização concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
  }
}

syncAllProperties();