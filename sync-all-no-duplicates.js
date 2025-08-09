const axios = require('axios');

// Configurações
const API_BASE = 'http://localhost:4000';

// Função para obter token de autenticação (ajuste conforme necessário)
async function getAuthToken() {
  try {
    const response = await axios.post('http://localhost:4000/api/admin/auth/login', {
      email: 'admin@coopcorretores.com.br',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.log('⚠️  Usando modo público (sem autenticação)');
    return null;
  }
}

async function getAllImoveis() {
  try {
    console.log('🔍 Buscando imóveis da API local...');
    const response = await axios.get(`${API_BASE}/api/imoveis`);
    
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
      return [];
    }
    
    console.log(`✅ Encontrados ${imoveis.length} imóveis`);
    return imoveis;
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
    return [];
  }
}

async function syncAllNoDuplicates() {
  console.log('🚀 Iniciando sincronização sem duplicatas...
');
  
  const token = await getAuthToken();
  const imoveis = await getAllImoveis();
  
  if (imoveis.length === 0) {
    console.log('❌ Nenhum imóvel encontrado.');
    return;
  }
  
  console.log(`📊 Processando ${imoveis.length} imóveis...
`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (let i = 0; i < imoveis.length; i++) {
    const imovel = imoveis[i];
    const id = imovel.id;
    const titulo = imovel.titulo || 'Sem título';
    
    console.log(`${i + 1}/${imoveis.length} - ${id} - ${titulo}`);
    
    try {
      // Usar o endpoint individual que já tem verificação de duplicatas
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.post(
        `${API_BASE}/api/sync-imoveis/${id}`,
        {},
        { headers }
      );
      
      if (response.data.action === 'updated') {
        console.log(`⏭️  Pulado - já existe`);
        skipped++;
      } else if (response.data.action === 'created') {
        console.log(`✅ Criado com sucesso`);
        success++;
      } else {
        console.log(`✅ Sincronizado`);
        success++;
      }
      
    } catch (error) {
      if (error.response?.data?.action === 'updated') {
        console.log(`⏭️  Pulado - já existe`);
        skipped++;
      } else {
        console.log(`❌ Erro: ${error.response?.data?.message || error.message}`);
        failed++;
      }
    }
    
    // Pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  
  console.log('\n🎯 RESUMO FINAL:');
  console.log(`✅ Novos: ${success}`);
  console.log(`⏭️  Pulados: ${skipped}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${imoveis.length}`);
  
  console.log('\n🎉 Sincronização sem duplicatas concluída!');
}

// Executar
syncAllNoDuplicates().catch(console.error);