const axios = require('axios');

const API_BASE = 'http://localhost:4000';
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

async function getAllImoveis() {
  try {
    console.log('🔍 Buscando todos os imóveis da API local...');
    
    let allImoveis = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await axios.get(`${API_BASE}/api/imoveis?page=${page}&limit=12`);
      
      // Verificar estrutura correta
      let imoveis = [];
      if (response.data?.data) {
        imoveis = response.data.data;
      } else if (response.data?.imoveis) {
        imoveis = response.data.imoveis;
      } else {
        imoveis = response.data || [];
      }
      
      if (imoveis.length > 0) {
        allImoveis = [...allImoveis, ...imoveis];
        console.log(`📋 Página ${page}: ${imoveis.length} imóveis`);
        
        // Verificar se há mais páginas
        const pagination = response.data?.pagination;
        if (pagination && pagination.hasNext) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    console.log(`✅ Total encontrado: ${allImoveis.length} imóveis`);
    return allImoveis;
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis:', error.message);
    return [];
  }
}

async function syncImovelIndividual(imovel) {
  try {
    console.log(`\n🔄 Sincronizando: ${imovel.titulo || 'Sem título'} (ID: ${imovel.id})`);
    
    // Preparar dados para o Strapi
    const strapiData = {
      title: imovel.titulo || 'Imóvel sem título',
      description: imovel.descricao || '',
      price: Number(imovel.preco || 0),
      tipo_contrato: imovel.finalidade || 'venda',
      tipo_imovel: imovel.tipo || 'apartamento',
      active: true,
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      tipologia: `${imovel.quartos || 0} quartos, ${imovel.banheiros || 0} banheiros`,
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
      return { success: true, strapiId: response.data?.data?.id };
    } else {
      console.error(`❌ Erro:`, response.status);
      return { success: false, error: response.status };
    }

  } catch (error) {
    console.error(`❌ Erro ao sincronizar:`, error.message);
    return { success: false, error: error.message };
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
    console.log(`\n${i + 1}/${imoveis.length} - ${imovel.titulo || 'Sem título'}`);
    
    const result = await syncImovelIndividual(imovel);
    
    if (result.success) {
      success++;
      console.log(`✅ Sucesso!`);
    } else {
      failed++;
      console.log(`❌ Falha: ${result.error}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎯 RESUMO FINAL:');
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`📊 Total: ${imoveis.length}`);
  
  console.log('\n🎉 Sincronização concluída!');
}

// Executar
syncAllImoveis().catch(console.error);