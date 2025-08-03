// Script para testar a autenticação diretamente
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

// Função para testar o login
async function testarLogin(email, senha) {
  try {
    console.log(`Testando login com email: ${email} e senha: ${senha}`);
    
    // Fazer a requisição de login
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: senha }),
    });
    
    const data = await response.json();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta completa:', data);
    
    if (response.ok) {
      console.log('Login bem-sucedido!');
      console.log('Token JWT:', data.token);
      console.log('Dados do corretor:', data.corretor);
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
    console.log(`Hash bcrypt para senha '${senha}':`, hash);
    return hash;
  } catch (error) {
    console.error('Erro ao gerar hash:', error);
  }
}

// Função para verificar um hash bcrypt
async function verificarHash(senha, hash) {
  try {
    const isMatch = await bcrypt.compare(senha, hash);
    console.log(`A senha '${senha}' corresponde ao hash?`, isMatch);
    return isMatch;
  } catch (error) {
    console.error('Erro ao verificar hash:', error);
  }
}

// Executar os testes
async function executarTestes() {
  // Hash atual usado no banco de dados para 'admin123'
  const hashAtual = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  // Gerar um novo hash para 'admin123'
  await gerarHash('admin123');
  
  // Verificar se 'admin123' corresponde ao hash atual
  await verificarHash('admin123', hashAtual);
  
  // Testar login com as credenciais do administrador
  await testarLogin('admin@imobiliaria.com', 'admin123');
}

// Iniciar os testes
executarTestes().then(() => {
  console.log('Testes concluídos!');
});

/*
Instruções de uso:
1. Certifique-se de que a aplicação está rodando (npm run dev)
2. Instale as dependências necessárias:
   npm install node-fetch bcryptjs
3. Execute este script:
   node testar-login.js
*/