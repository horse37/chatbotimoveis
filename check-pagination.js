const axios = require('axios');

async function checkPagination() {
  try {
    console.log('🔍 Verificando total de imóveis...');
    
    const response = await axios.get('http://localhost:4000/api/imoveis');
    
    console.log('📊 Estrutura completa:');
    console.log('Total de imóveis:', response.data?.data?.imoveis?.length);
    console.log('Paginação:', response.data?.data?.pagination);
    
    if (response.data?.data?.pagination) {
      console.log('📋 Total geral:', response.data.data.pagination.total);
      console.log('📋 Página atual:', response.data.data.pagination.page);
      console.log('📋 Por página:', response.data.data.pagination.perPage);
    }
    
    // Tentar buscar sem limite para ver todos
    const allResponse = await axios.get('http://localhost:4000/api/imoveis?limit=100');
    console.log('📊 Com limite 100:', allResponse.data?.data?.imoveis?.length);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkPagination();