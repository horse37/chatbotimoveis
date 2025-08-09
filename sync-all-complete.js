const axios = require('axios');

async function syncAllProperties() {
  console.log('🚀 Iniciando sincronização de todos os imóveis...\n');
  
  try {
    console.log('🔍 Buscando imóveis da API local...');
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    // Acessar a estrutura correta: response.data.data
    const imoveis = response.data?.data || [];
    
    if (!Array.isArray(imoveis) || imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado');
      console.log('📊 Debug - Estrutura:', Object.keys(response.data));
      return;
    }

    console.log(`✅ Encontrados ${imoveis.length} imóveis`);
    console.log(`📊 Total na paginação: ${response.data.pagination?.total || 'N/A'}`);
    console.log(`\n🔄 Processando cada imóvel individualmente...\n`);
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const id = imovel.id;
      const titulo = imovel.titulo || 'Sem título';
      
      console.log(`${i + 1}/${imoveis.length} - ${id} - ${titulo}`);
      
      try {
        // Sincronizar individualmente
        const result = await axios.post(`http://localhost:3000/api/sync-imoveis/${id}`);
        
        if (result.status === 200 || result.status === 201) {
          console.log(`✅ Sincronizado com sucesso`);
          success++;
        } else {
          console.log(`❌ Erro HTTP ${result.status}`);
          failed++;
        }
        
      } catch (error) {
        console.log(`❌ Falha: ${error.response?.data?.message || error.message}`);
        failed++;
      }
      
      // Pausa entre requisições para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n🎯 RESUMO FINAL:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📊 Total processado: ${imoveis.length}`);
    
    console.log('\n🎉 Sincronização concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
  }
}

// Executar sincronização
syncAllProperties();