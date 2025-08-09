const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Configurador de Token do Strapi');
console.log('====================================');
console.log('');
console.log('Este script ajudará você a configurar o token de API do Strapi.');
console.log('');

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setupToken() {
  try {
    // Verificar se .env.local existe
    const envLocalPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envLocalPath)) {
      console.error('❌ Arquivo .env.local não encontrado!');
      process.exit(1);
    }

    // Ler o conteúdo atual
    let envContent = fs.readFileSync(envLocalPath, 'utf8');

    // Solicitar o token real
    console.log('');
    console.log('💡 Para obter o token de API do Strapi:');
    console.log('1. Acesse: https://whatsapp-strapi.xjueib.easypanel.host/admin');
    console.log('2. Vá em Settings → API Tokens');
    console.log('3. Crie um novo token com permissões Full access');
    console.log('');
    
    const token = await question('🔑 Digite o token de API do Strapi: ');
    
    if (!token || token.trim() === '') {
      console.error('❌ Token não pode estar vazio!');
      process.exit(1);
    }

    // Atualizar as variáveis de ambiente
    envContent = envContent.replace(
      /STRAPI_SERVER_API_TOKEN=.*/g,
      `STRAPI_SERVER_API_TOKEN=${token}`
    );
    
    envContent = envContent.replace(
      /STRAPI_API_TOKEN=.*/g,
      `STRAPI_API_TOKEN=${token}`
    );

    // Escrever de volta ao arquivo
    fs.writeFileSync(envLocalPath, envContent, 'utf8');

    console.log('');
    console.log('✅ Token configurado com sucesso!');
    console.log('');
    console.log('🔄 Reinicie o servidor para aplicar as mudanças:');
    console.log('   npm run dev');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao configurar token:', error.message);
  } finally {
    rl.close();
  }
}

setupToken();