const axios = require('axios');

async function syncAllWithIndividualEndpoint() {
  console.log('🚀 Iniciando sincronização via endpoint individual...\n');
  
  try {
    // 1. Buscar todos os imóveis
    console.log('🔍 Buscando todos os imóveis...');
    const response = await axios.get('http://localhost:3000/api/imoveis');
    
    // Pegar os imóveis da estrutura correta
    const imoveis = response.data?.data || [];
    
    if (!Array.isArray(imoveis) || imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado');
      return;
    }

    console.log(`✅ Encontrados ${imoveis.length} imóveis\n`);
    
    let success = 0;
    let failed = 0;
    
    // 2. Loop através de cada imóvel
    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const id = imovel.id;
      
      console.log(`${i + 1}/${imoveis.length} - ${id} - ${imovel.titulo || 'Sem título'}`);
      
      try {
        // 3. Chamar o endpoint individual para este imóvel
        const result = await axios.post(`http://localhost:4000/api/sync-imoveis/${id}`);
        
        if (result.data.action === 'created') {
          console.log(`✅ Criado`);
        } else if (result.data.action === 'updated') {
          console.log(`✅ Atualizado`);
        } else {
          console.log(`✅ Processado`);
        }
        
        success++;
        
      } catch (error) {
        console.log(`❌ Erro: ${error.response?.data?.message || error.message}`);
        failed++;
      }
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📊 Total: ${imoveis.length}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar
syncAllWithIndividualEndpoint();