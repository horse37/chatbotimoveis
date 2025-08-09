const axios = require('axios');

async function syncAllProperties() {
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
      console.log('❌ Estrutura inesperada da resposta');
      console.log('📊 Debug - keys:', Object.keys(response.data));
      return;
    }

    console.log(`✅ Encontrados ${imoveis.length} imóveis`);
    console.log(`\n🔄 Processando cada imóvel individualmente...\n`);
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const id = imovel.id;
      const titulo = imovel.titulo || 'Sem título';
      
      console.log(`${i + 1}/${imoveis.length} - ID: ${id} - ${titulo}`);
      
      try {
        // Sincronizar com o endpoint individual
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
      
      // Pausa curta entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
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