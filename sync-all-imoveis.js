const axios = require('axios');

console.log('🚀 Iniciando sincronização de todos os imóveis...\n');

async function syncAllImoveis() {
  try {
    console.log('🔍 Buscando imóveis da API local...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    // Extrair imóveis da estrutura correta
    const imoveis = response.data?.data || [];
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado.');
      return;
    }

    console.log(`✅ Encontrados ${imoveis.length} imóveis`);
    console.log(`📊 Processando cada imóvel individualmente...\n`);
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const id = imovel.id;
      
      console.log(`\n${i + 1}/${imoveis.length} - Sincronizando ID: ${id}`);
      console.log(`🏠 Título: ${imovel.titulo || 'Sem título'}`);
      
      try {
        // Usar o endpoint de sincronização individual
        const syncResponse = await axios.post(`http://localhost:3000/api/sync-imoveis/${id}`);
        
        if (syncResponse.status === 200 || syncResponse.status === 201) {
          console.log(`✅ Imóvel ${id} sincronizado com sucesso!`);
          success++;
        } else {
          console.log(`❌ Erro ao sincronizar ${id}: Status ${syncResponse.status}`);
          failed++;
        }
        
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${id}:`, error.response?.data?.message || error.message);
        failed++;
      }
      
      // Pausa de 500ms entre requisições
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

// Executar
syncAllImoveis();