const axios = require('axios');

async function main() {
  console.log('🚀 Iniciando sincronização completa...\n');
  
  try {
    // Buscar todos os imóveis
    console.log('🔍 Buscando imóveis...');
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    let imoveis = [];
    
    // Verificar a estrutura exata
    console.log('📊 Analisando estrutura...');
    if (response.data && response.data.data) {
      imoveis = response.data.data;
      console.log(`✅ Encontrados ${imoveis.length} imóveis em data.data`);
    } else {
      console.log('📊 Estrutura alternativa:', Object.keys(response.data));
      if (response.data && Array.isArray(response.data)) {
        imoveis = response.data;
      } else {
        console.log('❌ Não foi possível identificar a estrutura');
        return;
      }
    }
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado');
      return;
    }

    console.log(`\n📋 Processando ${imoveis.length} imóveis...\n`);
    
    // Processar cada imóvel
    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      console.log(`${i + 1}/${imoveis.length} - ${imovel.id} - ${imovel.titulo || 'Sem título'}`);
      
      try {
        const syncResponse = await axios.post(`http://localhost:3000/api/sync-imoveis/${imovel.id}`);
        console.log(`✅ Sucesso`);
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
      }
      
      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n✅ Sincronização concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

main();