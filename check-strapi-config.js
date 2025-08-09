const fs = require('fs');
const path = require('path');

// Verificar configurações do Strapi
console.log('🔍 Verificando configurações do Strapi...');

// Verificar se existe .env local
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasToken = envContent.includes('STRAPI_API_TOKEN=') && !envContent.includes('STRAPI_API_TOKEN=');
  console.log('📝 STRAPI_API_TOKEN configurado:', hasToken ? 'Sim' : 'Não');
} else {
  console.log('❌ Arquivo .env não encontrado');
}

// Verificar arquivo .env.example
console.log('\n📋 Configurações necessárias:');
console.log('STRAPI_URL: URL do Strapi');
console.log('STRAPI_API_TOKEN: Token privado do Strapi');

// Verificar se existe setup-strapi-token.js
const setupPath = path.join(__dirname, 'setup-strapi-token.js');
if (fs.existsSync(setupPath)) {
  console.log('\n✅ Script de configuração encontrado: setup-strapi-token.js');
  console.log('Execute: node setup-strapi-token.js');
} else {
  console.log('\n❌ Script de configuração não encontrado');
}

console.log('\n🔄 Para configurar o Strapi:');
console.log('1. Copie .env.example para .env');
console.log('2. Configure STRAPI_API_TOKEN com seu token privado');
console.log('3. Configure STRAPI_URL com a URL do seu Strapi');
console.log('4. Reinicie o servidor');