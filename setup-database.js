const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5434,
  database: 'postgres' // conecta primeiro ao banco padrão
};

async function setupDatabase() {
  console.log('🔧 Configurando banco de dados...');
  
  let pool = new Pool(dbConfig);
  
  try {
    // Testa a conexão
    console.log('📡 Testando conexão com PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conexão com PostgreSQL estabelecida!');
    
    // Verifica se o banco imobiliaria_db existe
    console.log('🔍 Verificando se o banco imobiliaria_db existe...');
    const dbExists = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'imobiliaria_db'"
    );
    
    if (dbExists.rows.length === 0) {
      console.log('📦 Criando banco de dados imobiliaria_db...');
      await pool.query('CREATE DATABASE imobiliaria_db');
      console.log('✅ Banco de dados criado com sucesso!');
    } else {
      console.log('✅ Banco de dados imobiliaria_db já existe!');
    }
    
    await pool.end();
    
    // Conecta ao banco imobiliaria_db
    pool = new Pool({
      ...dbConfig,
      database: 'imobiliaria_db'
    });
    
    // Verifica se as tabelas existem
    console.log('🔍 Verificando estrutura das tabelas...');
    const tablesExist = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('corretores', 'imoveis', 'contatos', 'imovel_fotos')
    `);
    
    if (tablesExist.rows.length < 4) {
      console.log('📋 Criando estrutura das tabelas...');
      
      // Lê e executa o schema SQL
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Estrutura das tabelas criada!');
      } else {
        console.log('⚠️  Arquivo schema.sql não encontrado. Criando tabelas básicas...');
        await createBasicTables(pool);
      }
    } else {
      console.log('✅ Estrutura das tabelas já existe!');
    }
    
    await pool.end();
    console.log('🎉 Configuração do banco de dados concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Acesse: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Soluções possíveis:');
      console.log('1. Verifique se o PostgreSQL está instalado');
      console.log('2. Inicie o serviço PostgreSQL');
      console.log('3. Verifique se está rodando na porta 5434');
      console.log('4. Verifique usuário/senha: postgres/postgres');
    }
    
    process.exit(1);
  }
}

async function createBasicTables(pool) {
  const createTables = `
    -- Tabela de corretores
    CREATE TABLE IF NOT EXISTS corretores (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      telefone VARCHAR(20),
      creci VARCHAR(20),
      foto VARCHAR(500),
      permissao VARCHAR(20) DEFAULT 'corretor',
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tabela de imóveis
    CREATE TABLE IF NOT EXISTS imoveis (
      id SERIAL PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      preco DECIMAL(12,2) NOT NULL,
      endereco TEXT NOT NULL,
      cidade VARCHAR(100) NOT NULL,
      estado VARCHAR(2) NOT NULL,
      cep VARCHAR(10),
      quartos INTEGER,
      banheiros INTEGER,
      vagas INTEGER,
      area_total DECIMAL(10,2),
      area_construida DECIMAL(10,2),
      corretor_id INTEGER REFERENCES corretores(id),
      ativo BOOLEAN DEFAULT true,
      visualizacoes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tabela de fotos dos imóveis
    CREATE TABLE IF NOT EXISTS imovel_fotos (
      id SERIAL PRIMARY KEY,
      imovel_id INTEGER REFERENCES imoveis(id) ON DELETE CASCADE,
      url VARCHAR(500) NOT NULL,
      ordem INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Tabela de contatos
    CREATE TABLE IF NOT EXISTS contatos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telefone VARCHAR(20),
      mensagem TEXT NOT NULL,
      imovel_id INTEGER REFERENCES imoveis(id),
      tipo VARCHAR(50) DEFAULT 'contato',
      status VARCHAR(50) DEFAULT 'novo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pool.query(createTables);
}

setupDatabase();