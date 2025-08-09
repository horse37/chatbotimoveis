const axios = require('axios');

// Configurações
const STRAPI_URL = 'http://localhost:1337';
const API_URL = 'http://localhost:4000';

console.log('🚀 Script de sincronização em massa - Baseado no sync-script-standalone.js');

// Buscar todos os imóveis usando a lógica do check-local-imoveis.js
async function getAllImoveis() {
  console.log('🔍 Buscando todos os imóveis da API local...');
  
  const urls = [
    'http://localhost:4000/api/imoveis',
    'http://localhost:3000/api/imoveis'
  ];
  
  let allImoveis = [];
  
  for (const url of urls) {
    try {
      console.log(`🔄 Tentando: ${url}`);
      
      // Buscar todos os imóveis com paginação
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await axios.get(`${url}?page=${page}&limit=100`, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        let imoveis = [];
        
        // Verificar diferentes estruturas de resposta
        if (response.data && Array.isArray(response.data)) {
          imoveis = response.data;
        } else if (response.data && response.data.data) {
          imoveis = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        } else if (response.data && response.data.imoveis) {
          imoveis = response.data.imoveis;
        } else if (response.data && response.data.results) {
          imoveis = response.data.results;
        } else {
          console.log('❌ Estrutura de resposta não reconhecida');
          break;
        }
        
        // Normalizar dados dos imóveis
        imoveis = imoveis.map(imovel => {
          // Se o imóvel estiver aninhado em 'attributes'
          if (imovel.attributes) {
            return {
              id: imovel.id,
              ...imovel.attributes
            };
          }
          return imovel;
        });
        
        // Filtrar apenas imóveis válidos
        imoveis = imoveis.filter(imovel => imovel && (imovel.id || imovel._id || imovel.codigo));
        
        allImoveis = allImoveis.concat(imoveis);
        
        // Verificar se há mais páginas
        const pagination = response.data.pagination || response.data.meta?.pagination;
        if (pagination) {
          hasMore = page < pagination.pageCount || page < pagination.totalPages;
        } else {
          hasMore = imoveis.length === 100; // Assumir mais páginas se tem 100 itens
        }
        
        page++;
        
        if (!hasMore) break;
      }
      
      console.log(`✅ Encontrados ${allImoveis.length} imóveis em ${url}`);
      return allImoveis;
      
    } catch (error) {
      console.log(`❌ Falha em ${url}: ${error.message}`);
    }
  }
  
  console.log('❌ Nenhum servidor local encontrado');
  console.log('💡 Verifique se o servidor está rodando com: npm run dev');
  return [];
}

// Função para sincronizar um único imóvel - versão simplificada baseada no syncSingleImovel
async function syncSingleImovel(imovel) {
  try {
    console.log(`\n📋 Processando imóvel ${imovel.id}: ${imovel.titulo || 'Sem título'}`);
    
    // Preparar dados para o Strapi usando a estrutura real dos dados
    const imovelData = {
      data: {
        titulo: imovel.nome || imovel.titulo || 'Imóvel sem título',
        description: imovel.descricao || imovel.descricao_completa || 'Sem descrição',
        price: Number(imovel.valor) || Number(imovel.preco) || 0,
        tipo_contrato: imovel.finalidade || 'venda',
        tipo_imovel: imovel.tipo || 'outros',
        active: imovel.status === 'disponivel',
        bairro: imovel.bairro || 'Não informado',
        cidade: imovel.cidade || 'Não informada',
        area_construida: Number(imovel.area_construida) || 0,
        area_total: Number(imovel.area_total) || 0,
        quartos: Number(imovel.dormitorios) || 0,
        banheiros: Number(imovel.banheiros) || 0,
        vagas_garagem: Number(imovel.vagas_garagem) || 0,
        id_integracao: String(imovel.id || imovel.codigo || '0')
      }
    };

    // Configurar headers para acesso público
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Log para debug dos dados
    console.log(`   📊 Dados do imóvel:`, JSON.stringify(imovelData.data, null, 2));
    
    // Verificar se imóvel já existe no Strapi
    try {
      const checkResponse = await axios.get(`${STRAPI_URL}/api/imoveis?filters[id_integracao][$eq]=${imovelData.data.id_integracao}`, { headers });
      const existingImoveis = checkResponse.data?.data || [];
      
      if (existingImoveis.length > 0) {
        const imovelId = existingImoveis[0].id;
        console.log(`   🔄 Atualizando imóvel existente (ID: ${imovelId})`);
        const updateResponse = await axios.put(`${STRAPI_URL}/api/imoveis/${imovelId}`, imovelData, { headers });
        console.log(`   ✅ Imóvel atualizado com sucesso`);
        return { action: 'updated', id: imovelId };
      } else {
        console.log(`   ➕ Criando novo imóvel`);
        const createResponse = await axios.post(`${STRAPI_URL}/api/imoveis`, imovelData, { headers });
        const novoId = createResponse.data?.data?.id || createResponse.data?.id || 'desconhecido';
        console.log(`   ✅ Imóvel criado com sucesso`);
        return { action: 'created', id: novoId };
      }
    } catch (error) {
      console.log(`   ❌ Erro ao sincronizar: ${error.response?.data?.error?.message || error.message}`);
      if (error.response?.data) {
        console.log(`   📋 Detalhes do erro:`, error.response.data);
      }
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro ao processar imóvel: ${error.message}`);
    return false;
  }
}

// Função principal para sincronizar todos os imóveis
async function syncAllImoveis() {
  console.log('🚀 Iniciando sincronização em massa de imóveis...\n');
  
  try {
    // 1. Buscar todos os imóveis
    const imoveis = await getAllImoveis();
    
    if (!imoveis || imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado para sincronizar');
      return;
    }
    
    console.log(`📊 Total de imóveis para sincronizar: ${imoveis.length}\n`);
    
    let sucessos = 0;
    let falhas = 0;
    let criados = 0;
    let atualizados = 0;
    
    // 2. Processar cada imóvel
    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const progresso = `${i + 1}/${imoveis.length}`;
      
      console.log(`${progresso} Processando imóvel ID: ${imovel.id || imovel._id || 'desconhecido'} - ${imovel.titulo || 'Sem título'}`);
      
      try {
        const resultado = await syncSingleImovel(imovel);
        
        if (resultado) {
          if (resultado.action === 'created') {
            criados++;
            console.log(`   ✅ ${progresso} - Criado (ID: ${resultado.id})`);
          } else if (resultado.action === 'updated') {
            atualizados++;
            console.log(`   ✅ ${progresso} - Atualizado (ID: ${resultado.id})`);
          }
          sucessos++;
        } else {
          console.log(`   ❌ ${progresso} - Falha`);
          falhas++;
        }
        
      } catch (error) {
        console.log(`   ❌ ${progresso} - Erro: ${error.message}`);
        falhas++;
      }
      
      // Pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎯 SINCRONIZAÇÃO CONCLUÍDA');
    console.log(`✅ Criados: ${criados}`);
    console.log(`🔄 Atualizados: ${atualizados}`);
    console.log(`❌ Falhas: ${falhas}`);
    console.log(`📊 Total: ${imoveis.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error.message);
  }
}

// Executar sincronização
if (require.main === module) {
  syncAllImoveis();
}

module.exports = { syncAllImoveis, syncSingleImovel };