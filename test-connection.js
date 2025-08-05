#!/usr/bin/env node
/**
 * Script de teste para verificar conexão com Strapi
 * Uso: node test-connection.js
 */

const https = require('https');
const { URL } = require('url');

// Configurações
const STRAPI_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

console.log('🧪 Testando conexão com Strapi...');
console.log(`🔗 URL: ${STRAPI_URL}`);
console.log(`🔑 Token: ${STRAPI_API_TOKEN ? 'Configurado' : 'Não configurado'}`);

async function testConnection() {
  try {
    const url = new URL(STRAPI_URL);
    
    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/imoveis',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`📊 Status da resposta: ${res.statusCode}`);
          
          if (res.statusCode === 200) {
            console.log('✅ Conexão estabelecida com sucesso!');
            try {
              const parsed = JSON.parse(data);
              console.log(`📋 Total de imóveis encontrados: ${parsed?.length || 0}`);
            } catch (e) {
              console.log('⚠️  Resposta não é JSON válido');
            }
            resolve(true);
          } else if (res.statusCode === 401) {
            console.log('❌ Erro de autenticação - verifique o token');
            resolve(false);
          } else if (res.statusCode === 404) {
            console.log('❌ Endpoint não encontrado - verifique a URL do Strapi');
            resolve(false);
          } else {
            console.log(`❌ Erro desconhecido: ${res.statusCode}`);
            console.log('📄 Resposta:', data.substring(0, 500));
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.log('❌ Erro de rede:', error.message);
        resolve(false);
      });

      req.setTimeout(10000, () => {
        console.log('⏰ Timeout - servidor não respondeu em 10 segundos');
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.log('❌ Erro ao configurar requisição:', error.message);
    return false;
  }
}

async function testUploadEndpoint() {
  console.log('\n🧪 Testando endpoint de upload...');
  
  try {
    const url = new URL(STRAPI_URL);
    
    return new Promise((resolve) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/upload',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        }
      };

      const req = https.request(options, (res) => {
        console.log(`📊 Status do upload endpoint: ${res.statusCode}`);
        
        if (res.statusCode === 404) {
          console.log('❌ Endpoint /upload não encontrado');
          resolve(false);
        } else if (res.statusCode === 401) {
          console.log('❌ Erro de autenticação no upload');
          resolve(false);
        } else if (res.statusCode === 405) {
          console.log('✅ Endpoint /upload encontrado (método GET não permitido, mas endpoint existe)');
          resolve(true);
        } else {
          console.log('✅ Endpoint /upload está acessível');
          resolve(true);
        }
      });

      req.on('error', (error) => {
        console.log('❌ Erro ao testar upload:', error.message);
        resolve(false);
      });

      req.setTimeout(5000, () => {
        console.log('⏰ Timeout ao testar upload');
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.log('❌ Erro ao testar upload:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes...\n');
  
  const connectionOk = await testConnection();
  const uploadOk = await testUploadEndpoint();
  
  console.log('\n📊 Resultados:');
  console.log(`Conexão com Strapi: ${connectionOk ? '✅ OK' : '❌ Falhou'}`);
  console.log(`Endpoint de upload: ${uploadOk ? '✅ OK' : '❌ Falhou'}`);
  
  if (connectionOk && uploadOk) {
    console.log('\n🎉 Todos os testes passaram! O script está pronto para uso.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique as configurações e tente novamente.');
  }
}

// Executar testes
runTests().catch(console.error);