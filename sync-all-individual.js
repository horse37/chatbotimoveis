const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

async function getAllImoveis() {
  try {
    console.log('🔍 Buscando todos os imóveis da API local...');
    const response = await axios.get(`${API_BASE}/api/imoveis?limit=100`);
    
    if (response.data?.data?.imoveis) {
      return response.data.data.imoveis;
    } else {
      console.error('❌ Estrutura de resposta inesperada:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
    return [];
  }
}

async function syncImovelIndividual(imovel) {
  try {
    console.log(`\n🔄 Sincronizando imóvel: ${imovel.titulo || 'Sem título'} (ID: ${imovel.id})`);
    
    // Preparar dados para o Strapi
    const caracteristicas = [];
    if (imovel.area_construida && imovel.area_construida !== 0) caracteristicas.push(`area_construida ${String(imovel.area_construida)}`);
    if (imovel.area_total && imovel.area_total !== 0) caracteristicas.push(`area_total ${String(imovel.area_total)}`);
    if (imovel.banheiros && imovel.banheiros !== 0) caracteristicas.push(`banheiros ${String(imovel.banheiros)}`);
    if (imovel.quartos && imovel.quartos !== 0) caracteristicas.push(`quartos ${String(imovel.quartos)}`);
    if (imovel.vagas_garagem && imovel.vagas_garagem !== 0) caracteristicas.push(`vagas_garagem ${String(imovel.vagas_garagem)}`);
    const tipologia = caracteristicas.join(', ');

    const strapiData = {
      title: imovel.titulo || 'Imóvel sem título',
      description: imovel.descricao || '',
      price: Number(imovel.preco || 0),
      tipo_contrato: imovel.finalidade || 'venda',
      tipo_imovel: imovel.tipo || 'apartamento',
      active: Boolean(imovel.ativo),
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      tipologia: tipologia,
      url: `https://coopcorretores.com.br/imoveis/${imovel.id}`,
      id_integracao: imovel.id
    };

    // Verificar se já existe no Strapi
    const checkResponse = await axios.get(`${STRAPI_URL}/imoveis`);
    const imoveisExistentes = checkResponse.data?.data || [];
    const existingImovel = imoveisExistentes.find(item => item.attributes?.id_integracao === imovel.id);

    let response;
    if (existingImovel) {
      console.log(`✅ Atualizando imóvel existente (ID Strapi: ${existingImovel.id})`);
      response = await axios.put(`${STRAPI_URL}/imoveis/${existingImovel.id}`, {
        data: strapiData
      });
    } else {
      console.log(`🆕 Criando novo imóvel...`);
      response = await axios.post(`${STRAPI_URL}/imoveis`, {
        data: strapiData
      });
    }

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Imóvel sincronizado com sucesso!`);
      return { success: true, action: existingImovel ? 'updated' : 'created' };
    } else {
      console.error(`❌ Erro na sincronização:`, response.status);
      return { success: false, error: response.status };
    }

  } catch (error) {
    console.error(`❌ Erro ao sincronizar imóvel ${imovel.id}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function syncAllImoveis() {
  console.log('🚀 Iniciando sincronização de todos os imóveis...\n');
  
  const imoveis = await getAllImoveis();
  
  if (imoveis.length === 0) {
    console.log('❌ Nenhum imóvel encontrado para sincronizar.');
    return;
  }

  console.log(`📊 Encontrados ${imoveis.length} imóveis para sincronizar\n`);
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < imoveis.length; i++) {
    const imovel = imoveis[i];
    console.log(`\n${i + 1}/${imoveis.length} - Processando...`);
    
    const result = await syncImovelIndividual(imovel);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    results.details.push({
      id: imovel.id,
      titulo: imovel.titulo,
      status: result.success ? 'success' : 'failed',
      error: result.error
    });
  }

  console.log('\n🎯 Resumo da sincronização:');
  console.log(`✅ Sucesso: ${results.success}`);
  console.log(`❌ Falhas: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n📋 Detalhes das falhas:');
    results.details
      .filter(d => d.status === 'failed')
      .forEach(d => console.log(`  - ${d.titulo} (${d.id}): ${d.error}`));
  }
  
  console.log('\n🎉 Processo concluído!');
}

// Executar sincronização
if (require.main === module) {
  syncAllImoveis().catch(console.error);
}

module.exports = { syncAllImoveis };