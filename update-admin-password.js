// Script para atualizar a senha do usuário admin no banco de dados
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não está definida nas variáveis de ambiente');
  process.exit(1);
}

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // desabilita SSL para desenvolvimento local
});

async function updateAdminPassword() {
  const client = await pool.connect();
  try {
    // Senha em texto plano que queremos definir
    const plainPassword = 'admin123';
    
    // Gerar o hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    console.log('Hash gerado para a senha:', hashedPassword);
    
    // Atualizar a senha do usuário admin
    const result = await client.query(
      'UPDATE corretores SET senha = $1 WHERE email = $2 RETURNING id, nome, email',
      [hashedPassword, 'admin@imobiliaria.com']
    );
    
    if (result.rows.length > 0) {
      console.log('Senha atualizada com sucesso para o usuário:', result.rows[0].email);
      console.log('Agora você pode fazer login com:');
      console.log('Email: admin@imobiliaria.com');
      console.log('Senha: admin123');
    } else {
      console.log('Usuário admin não encontrado. Verifique se o banco de dados foi inicializado corretamente.');
    }
    
    // Verificar se o usuário existe
    const checkResult = await client.query(
      'SELECT id, nome, email FROM corretores WHERE email = $1',
      ['admin@imobiliaria.com']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Usuário admin encontrado no banco de dados:', checkResult.rows[0]);
    } else {
      console.log('ATENÇÃO: Usuário admin não existe no banco de dados!');
      console.log('Execute o script database-setup.sql para criar o usuário admin.');
    }
    
  } catch (error) {
    console.error('Erro ao atualizar a senha:', error);
    if (error.code === 'ECONNREFUSED') {
      console.error('Não foi possível conectar ao banco de dados. Verifique se o PostgreSQL está rodando.');
    } else if (error.code === '3D000') {
      console.error('Banco de dados não existe. Verifique se o banco "imobiliaria_db" foi criado.');
    } else if (error.code === '28P01') {
      console.error('Falha na autenticação do banco de dados. Verifique usuário e senha no DATABASE_URL.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

updateAdminPassword();