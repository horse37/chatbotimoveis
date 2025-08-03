// Script para testar a autenticação diretamente
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

// Credenciais de teste
const credentials = {
  email: 'admin@imobiliaria.com',
  password: 'admin123'
};

// URL da API de login (ajuste conforme necessário)
const loginUrl = 'http://localhost:3000/api/auth/login';

// Função para testar o login
async function testarLogin() {
  try {
    console.log('Testando login com:', credentials);
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta completa:', data);
    
    if (response.ok) {
      console.log('Login bem-sucedido!');
    } else {
      console.log('Falha no login:', data.message);
    }
  } catch (error) {
    console.error('Erro ao testar login:', error);
  }
}

// Função para gerar um hash bcrypt
async function gerarHash(senha) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senha, salt);
    console.log(`Hash gerado para '${senha}':`, hash);
    return hash;
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

// Função para verificar um hash bcrypt
async function verificarHash(senha, hash) {
  try {
    const isMatch = await bcrypt.compare(senha, hash);
    console.log(`A senha '${senha}' ${isMatch ? 'corresponde' : 'não corresponde'} ao hash`);
    return isMatch;
  } catch (error) {
    console.error('Erro ao verificar hash:', error);
  }
}

// Executar os testes
async function executarTestes() {
  // Gerar um novo hash para a senha
  const novoHash = await gerarHash(credentials.password);
  
  // Hash atual do banco de dados (do arquivo inserir-admin.sql)
  const hashAtual = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  // Verificar o hash atual
  console.log('\nVerificando hash atual do banco de dados:');
  await verificarHash(credentials.password, hashAtual);
  
  // Verificar o novo hash
  console.log('\nVerificando novo hash gerado:');
  await verificarHash(credentials.password, novoHash);
  
  // Testar o login na API
  console.log('\nTestando login na API:');
  await testarLogin();
}

// Iniciar os testes
executarTestes();