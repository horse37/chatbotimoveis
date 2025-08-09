const axios = require('axios');

// Configurações
const API_BASE = 'http://localhost:4000';
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

// Token de autenticação (ajuste conforme necessário)
const AUTH_TOKEN = 'seu-token-aqui'; // Substitua pelo token real

async function getAllImoveis() {
  try {
    console.log('🔍 Buscando todos os imóveis da API local...');
    
    const response = await axios.get(`${API_BASE}/api/imoveis`);
    
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
      return [];
    }
    
    console.log(`✅ Total encontrado: ${imoveis.length} imóveis`);
    return imoveis;
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.response?.data || error.message);
    return [];
  }
}

async function checkExistingImovel(idIntegracao) {
  try {
    const response = await axios.get(`${STRAPI_URL}/imoveis`);
    const imoveis = response.data?.data || [];
    return imoveis.find(item => item.attributes?.id_integracao === idIntegracao);
  } catch (error) {
    console.error('❌ Erro ao verificar imóvel existente:', error.message);
    return null;
  }
}

async function syncImovelSmart(imovel) {
  try {
    console.log(`🔄 ${imovel.titulo || 'Imóvel sem título'} (ID: ${imovel.id})`);
    
    // Verificar se já existe
    const existing = await checkExistingImovel(imovel.id);
    
    if (existing) {
      console.log(`⏭️  Pulando - já existe no Strapi (ID: ${existing.id})`);
      return { success: true, action: 'skipped', reason: 'already_exists' };
    }
    
    // Preparar dados
    const caracteristicas = [];
    if (imovel.area_construida && imovel.area_construida !== "0.00") caracteristicas.push(`Área construída: ${imovel.area_construida}m²`);
    if (imovel.area_total && imovel.area_total !== "0.00") caracteristicas.push(`Área total: ${imovel.area_total}m²`);
    if (imovel.banheiros && imovel.banheiros !== 0) caracteristicas.push(`${imovel.banheiros} banheiros`);
    if (imovel.quartos && imovel.quartos !== 0) caracteristicas.push(`${imovel.quartos} quartos`);
    if (imovel.vagas_garagem && imovel.vagas_garagem !== 0) caracteristicas.push(`${imovel.vagas_garagem} vagas`);
    
    const tipologia = caracteristicas.join(' | ');
    
    const strapiData = {
      title: imovel.titulo || 'Imóvel sem título',
      description: imovel.descricao || '',
      price: Number(imovel.preco || 0),
      tipo_contrato: imovel.finalidade || 'venda',
      tipo_imovel: imovel.tipo || 'apartamento',
      active: true,
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      estado: imovel.estado || '',
      tipologia: tipologia,
      url: `https://coopcorretores.com.br/imoveis/${imovel.id}`,
      id_integracao: imovel.id
    };
    
    // Criar novo imóvel
    const response = await axios.post(`${STRAPI_URL}/imoveis`, {
      data: strapiData
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ Criado com sucesso`);
      return { success: true, action: 'created', strapiId: response.data?.data?.id };
    } else {
      console.log(`❌ Erro HTTP ${response.status}`);
      return { success: false, error: response.status };
    }
    
  } catch (error) {
    console.log(`❌ Falha: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.message };
  }
}

async function syncAllSmart() {
  console.log('🚀 Iniciando sincronização inteligente...
');
  
  const imoveis = await getAllImoveis();
  
  if (imoveis.length === 0) {
    console.log('❌ Nenhum imóvel encontrado.');
    return;
  }
  
  console.log(`📊 Processando ${imoveis.length} imóveis...
`);
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < imoveis.length; i++) {
    const imovel = imoveis[i];
    console.log(`\n${i + 1}/${imoveis.length} - ${imovel.titulo || 'Imóvel sem título'}`);
    
    const result = await syncImovelSmart(imovel);
    
    if (result.success) {
      if (result.action === 'created') {
        created++;
      } else if (result.action === 'skipped') {
        skipped++;
      }
    } else {
      failed++;
    }
    
    // Pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎯 RESUMO FINAL:');
  console.log(`✅ Criados: ${created}`);
  console.log(`⏭️  Pulados: ${skipped}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${imoveis.length}`);
  
  console.log('\n🎉 Sincronização inteligente concluída!');
}

// Executar
syncAllSmart().catch(console.error);