#!/usr/bin/env node
/**
 * Script simples para testar conexão com Strapi e listar imóveis existentes
 */

const https = require('https');

// Configurações
const STRAPI_URL = (process.env.NEXT_PUBLIC_STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host').replace('/api', '');

async function fetchWithHttps(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testStrapiConnection() {
  console.log('🔄 Testando conexão com Strapi...');
  console.log('📍 URL:', STRAPI_URL);
  
  try {
    // Testar diferentes endpoints possíveis
    const endpoints = [
      `${STRAPI_URL}/api/imoveis`,
      `${STRAPI_URL}/imoveis`,
      `${STRAPI_URL}/api/imoveis?populate=*`,
      `${STRAPI_URL}/imoveis?populate=*`
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔗 Tentando: ${endpoint}`);
      try {
        const response = await fetchWithHttps(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Status:', response.status);
        if (response.status === 200) {
          console.log('✅ Sucesso!');
          console.log('📦 Imóveis encontrados:', response.data.data?.length || 0);
          if (response.data.data && response.data.data.length > 0) {
            console.log('\n📋 Primeiros imóveis:');
            response.data.data.slice(0, 3).forEach((imovel, index) => {
              console.log(`  ${index + 1}. ${imovel.attributes?.title || 'Sem título'} - ID: ${imovel.id}`);
            });
          }
          return response.data.data || [];
        } else {
          console.log('❌ Resposta:', response.data);
        }
      } catch (error) {
        console.log('❌ Erro:', error.message);
      }
    }
    
    console.log('\n❌ Nenhum endpoint funcionou');
    return [];
    
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return [];
  }
}

// Executar teste
testStrapiConnection();