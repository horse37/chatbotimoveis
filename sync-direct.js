const axios = require('axios');

async function getAllImoveis() {
  try {
    console.log('🔍 Buscando imóveis da API local...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    console.log('📊 Resposta recebida:', typeof response.data);
    
    // Verificar a estrutura exata
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log(`✅ Encontrados ${response.data.data.length} imóveis em data.data`);
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      console.log(`✅ Encontrados ${response.data.length} imóveis no array principal`);
      return response.data;
    } else {
      console.log('📊 Estrutura completa:', JSON.stringify(response.data, null, 2));
      return [];
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
    return [];
  }
}

async function syncIndividual(id) {
  try {
    console.log(`\n🔄 Sincronizando imóvel ID: ${id}`);
    
    // Usar o endpoint de sincronização individual
    const response = await axios.post(`http://localhost:3000/api/sync-imoveis/${id}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Imóvel ${id} sincronizado com sucesso!`);
      return { success: true, id };
    } else {
      console.error(`❌ Erro ao sincronizar ${id}:`, response.status);
      return { success: false, id, error: response.status };
    }
    
  } catch (error) {
    console.error(`❌ Erro ao sincronizar ${id}:`, error.message);
    return { success: false, id, error: error.message };
  }
}

async function syncAllImoveis() {
  console.log('🚀 Iniciando sincronização de todos os imóveis...\n');
  
  const imoveis = await getAllImoveis();
  
  if (imoveis.length === 0) {
    console.log('❌ Nenhum imóvel encontrado.');
    return;
  }

  console.log(`📊 Processando ${imoveis.length} imóveis...\n`);
  
  let success = 0;
  let failed = 0;

  for (let i = 0; i < imoveis.length; i++) {
    const imovel = imoveis[i];
    const id = imovel.id;
    
    console.log(`\n${i + 1}/${imoveis.length} - ID: ${id} - ${imovel.titulo || 'Sem título'}`);
    
    const result = await syncIndividual(id);
    
    if (result.success) {
      success++;
      console.log(`✅ Sucesso!`);
    } else {
      failed++;
      console.log(`❌ Falha: ${result.error}`);
    }
    
    // Pausa de 500ms entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 RESUMO FINAL:');
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${imoveis.length}`);
  
  console.log('\n🎉 Sincronização concluída!');
}

// Executar
syncAllImoveis().catch(console.error);