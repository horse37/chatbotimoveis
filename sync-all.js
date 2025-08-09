const axios = require('axios');

async function syncAll() {
  console.log('🚀 Iniciando sincronização de todos os imóveis...\n');
  
  try {
    console.log('🔍 Buscando imóveis da API local...');
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    // Acessar diretamente a estrutura correta
    const imoveis = response.data?.data || [];
    
    if (!Array.isArray(imoveis) || imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado ou estrutura inválida');
      console.log('📊 Debug - keys:', Object.keys(response.data));
      return;
    }

    console.log(`✅ Encontrados ${imoveis.length} imóveis`);
    console.log(`\n📊 Processando cada imóvel individualmente...\n`);
    
    let success = 0;
    let failed = 0;

    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const id = imovel.id;
      
      console.log(`${i + 1}/${imoveis.length} - ${id} - ${imovel.titulo || 'Sem título'}`);
      
      try {
        // Usar o endpoint de sincronização individual
        const result = await axios.post(`http://localhost:3000/api/sync-imoveis/${id}`);
        console.log(`✅ Sucesso`);
        success++;
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        failed++;
      }
      
      // Pausa curta entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n🎯 RESUMO FINAL:');
    console.log(`✅ Sucesso: ${success}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📊 Total: ${imoveis.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

syncAll();