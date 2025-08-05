#!/usr/bin/env node

const https = require('https');
const url = require('url');

// Configuração simples - sem token
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

// feito corretamente

console.log('🧪 Testando upload público no Strapi...');
console.log(`🔗 URL: ${STRAPI_URL}`);

// Teste simples de GET
function testGet() {
  return new Promise((resolve) => {
    const urlObj = new URL(STRAPI_URL);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: '/imoveis',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('📡 Testando GET /imoveis...');
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ GET Response Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log(`✅ GET Success - ${parsed.length || 0} imoveis encontrados`);
            resolve(true);
          } catch (e) {
            console.log('❌ Erro ao parsear GET response');
            resolve(false);
          }
        } else {
          console.log(`❌ GET Failed - Status: ${res.statusCode}`);
          console.log(`❌ Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ GET Error: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Teste simples de POST com dados mínimos
function testPost() {
  return new Promise((resolve) => {
    const urlObj = new URL(STRAPI_URL);
    
    const testData = {
      titulo: 'Teste Upload Público',
      preco: 100000,
      tipo_contrato: 'venda',
      tipo_imovel: 'casa',
      cidade: 'São Paulo',
      codigo: 'TESTE-' + Date.now()
    };

    const payload = JSON.stringify(testData);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: '/imoveis',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    console.log('📡 Testando POST /imoveis...');
    console.log('📋 Dados:', testData);
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ POST Response Status: ${res.statusCode}`);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ POST Success - Imóvel criado');
          resolve(true);
        } else {
          console.log(`❌ POST Failed - Status: ${res.statusCode}`);
          console.log(`❌ Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ POST Error: ${error.message}`);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// Executar testes
async function runTests() {
  console.log('\n🚀 Iniciando testes...\n');
  
  const getResult = await testGet();
  const postResult = await testPost();
  
  console.log('\n📊 Resultados:');
  console.log(`GET: ${getResult ? '✅ Sucesso' : '❌ Falhou'}`);
  console.log(`POST: ${postResult ? '✅ Sucesso' : '❌ Falhou'}`);
  
  if (getResult && postResult) {
    console.log('\n🎉 Upload público está funcionando!');
  } else {
    console.log('\n⚠️  Upload público não está funcionando');
  }
}

runTests().catch(console.error);