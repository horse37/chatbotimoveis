const axios = require('axios');

async function testSyncReal() {
  try {
    console.log('🔄 Testando sincronização com dados reais...');
    
    // Buscar imóveis locais com estrutura correta
    const localResponse = await axios.get('http://localhost:4000/api/imoveis');
    
    // Acessar response.data.data.imoveis (estrutura correta)
    const imoveis = localResponse.data?.data?.imoveis || [];
    
    console.log(`📊 Total de imóveis encontrados: ${imoveis.length}`);
    
    if (imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado localmente');
      return;
    }
    
    const imovel = imoveis[0];
    console.log('🏠 Primeiro imóvel encontrado:');
    console.log('  ID:', imovel.id);
    console.log('  Título:', imovel.titulo);
    console.log('  Preço:', imovel.preco);
    
    // Preparar dados para Strapi
    const strapiData = {
      title: imovel.titulo || 'Imóvel sem título',
      description: imovel.descricao || '',
      price: Number(imovel.preco || 0),
      tipo_contrato: imovel.finalidade || 'venda',
      tipo_imovel: imovel.tipo || 'apartamento',
      active: Boolean(imovel.ativo !== false),
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      tipologia: `${imovel.quartos || 0} quartos, ${imovel.banheiros || 0} banheiros, ${imovel.vagas_garagem || 0} vagas`,
      url: `https://coopcorretores.com.br/imoveis/${imovel.id}`,
      id_integracao: imovel.id
    };
    
    console.log('\n📤 Dados a serem enviados:');
    console.log(JSON.stringify(strapiData, null, 2));
    
    const strapiUrl = 'https://whatsapp-strapi.xjueib.easypanel.host';
    
    // Verificar se já existe
    console.log('\n🔍 Verificando se imóvel já existe no Strapi...');
    const checkResponse = await axios.get(`${strapiUrl}/imoveis`);
    const existingImovel = checkResponse.data?.data?.find(item => item.attributes?.id_integracao === imovel.id);
    
    if (existingImovel) {
      console.log(`✅ Imóvel encontrado (Strapi ID: ${existingImovel.id}) - atualizando...`);
      const response = await axios.put(`${strapiUrl}/imoveis/${existingImovel.id}`, {
        data: strapiData
      });
      console.log('✅ Atualização bem-sucedida:', response.data.data?.id);
    } else {
      console.log('🆕 Criando novo imóvel...');
      const response = await axios.post(`${strapiUrl}/imoveis`, {
        data: strapiData
      });
      console.log('✅ Criação bem-sucedida:', response.data.data?.id);
    }
    
    console.log('\n🎉 Sincronização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro detalhado:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
  }
}

testSyncReal();