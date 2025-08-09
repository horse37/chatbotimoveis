const axios = require('axios');
const { execSync } = require('child_process');

const API_BASE = 'http://localhost:4000';

async function getAllImovelIds() {
  try {
    console.log('🔍 Buscando todos os IDs dos imóveis...');
    
    const response = await axios.get(`${API_BASE}/api/imoveis`);
    
    // Verificar estrutura como no check-local-imoveis.js
    let imoveis = [];
    if (Array.isArray(response.data)) {
      imoveis = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      imoveis = response.data.data;
    } else if (response.data.imoveis && Array.isArray(response.data.imoveis)) {
      imoveis = response.data.imoveis;
    } else {
      console.log('❌ Estrutura inesperada:', JSON.stringify(response.data, null, 2));
      return [];
    }
    
    const ids = imoveis.map(imovel => imovel.id);
    console.log(`✅ Encontrados ${ids.length} IDs:`, ids);
    return ids;
    
  } catch (error) {
    console.error('❌ Erro ao buscar IDs:', error.response?.data || error.message);
    return [];
  }
}

async function syncIndividualById(id) {
  try {
    console.log(`\n🔄 Executando sync individual para ID: ${id}`);
    
    const cmd = `node test-sync-real.js ${id}`;
    console.log(`📋 Executando: ${cmd}`);
    
    const output = execSync(cmd, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log(`✅ Sync concluído para ${id}`);
    console.log(`📊 Output:`, output);
    
    return { success: true, id, output };
    
  } catch (error) {
    console.error(`❌ Erro ao sincronizar ${id}:`, error.message);
    return { success: false, id, error: error.message };
  }
}

async function syncAllByIndividual() {
  console.log('🚀 Iniciando sincronização usando o método individual...\n');
  
  const ids = await getAllImovelIds();
  
  if (ids.length === 0) {
    console.log('❌ Nenhum ID encontrado.');
    return;
  }

  console.log(`📊 Processando ${ids.length} imóveis individualmente...\n`);
  
  let success = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    console.log(`\n${i + 1}/${ids.length} - ID: ${id}`);
    
    const result = await syncIndividualById(id);
    
    if (result.success) {
      success++;
      console.log(`✅ Sucesso!`);
    } else {
      failed++;
      console.log(`❌ Falha: ${result.error}`);
    }
    
    // Pausa de 1 segundo entre execuções
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 RESUMO FINAL:');
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${ids.length}`);
  
  console.log('\n🎉 Sincronização concluída!');
}

// Executar
syncAllByIndividual().catch(console.error);