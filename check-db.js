const { query } = require('./src/lib/db');

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    // Verificar tabelas existentes
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tabelas encontradas:', tables.map(t => t.table_name));
    
    // Verificar estrutura da tabela imoveis
    const imoveisStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'imoveis'
      ORDER BY ordinal_position
    `);
    
    console.log('Estrutura da tabela imoveis:', imoveisStructure);
    
    // Verificar estrutura da tabela imovel_images
    const imagesStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'imovel_images'
      ORDER BY ordinal_position
    `);
    
    console.log('Estrutura da tabela imovel_images:', imagesStructure);
    
    // Verificar estrutura da tabela caracteristicas
    const caracteristicasStructure = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'caracteristicas'
      ORDER BY ordinal_position
    `);
    
    console.log('Estrutura da tabela caracteristicas:', caracteristicasStructure);
    
    // Contar imóveis
    const imoveisCount = await query('SELECT COUNT(*) as total FROM imoveis');
    console.log('Total de imóveis:', imoveisCount[0]?.total || 0);
    
    // Buscar alguns imóveis para verificar estrutura
    const sampleImoveis = await query('SELECT * FROM imoveis LIMIT 5');
    console.log('Amostra de imóveis:', sampleImoveis);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao verificar banco:', error);
    process.exit(1);
  }
}

checkDatabase();