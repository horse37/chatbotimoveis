const axios = require('axios');
const { execSync } = require('child_process');

async function getAllImovelIds() {
  try {
    console.log('🔍 Buscando todos os imóveis...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    // Extrair diretamente como no check-local-imoveis.js
    let imoveis = [];
    if (Array.isArray(response.data)) {
      imoveis = response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      imoveis = response.data.data;
    } else if (response.data.imoveis && Array.isArray(response.data.imoveis)) {
      imoveis = response.data.imoveis;
    } else {
      console.log('❌ Estrutura não reconhecida, usando data.data diretamente');
      imoveis = response.data?.data || [];
    }
    
    console.log(`✅ Encontrados ${imoveis.length} imóveis`);
    
    // Extrair apenas os IDs
    const ids = imoveis.map(imovel => imovel.id);
    console.log(`📋 IDs encontrados:`, ids);
    
    return ids;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return [];
  }
}

async function syncAllByIndividual() {
  console.log('🚀 Iniciando sincronização usando método individual...\n');
  
  const ids = await getAllImovelIds();
  
  if (ids.length === 0) {
    console.log('❌ Nenhum imóvel encontrado.');
    return;
  }

  console.log(`📊 Processando ${ids.length} imóveis...\n`);
  
  let success = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    console.log(`\n${i + 1}/${ids.length} - Sincronizando ID: ${id}`);
    
    try {
      const cmd = `node test-sync-real.js ${id}`;
      console.log(`📋 Executando: ${cmd}`);
      
      const output = execSync(cmd, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      console.log(`✅ Sucesso!`);
      console.log(output.trim());
      success++;
      
    } catch (error) {
      console.error(`❌ Falha:`, error.message);
      failed++;
    }
    
    // Pausa de 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 RESUMO FINAL:');
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${ids.length}`);
  
  console.log('\n🎉 Sincronização concluída!');
}

// Executar
syncAllByIndividual().catch(console.error);