#!/usr/bin/env node
/**
 * Script de sincronização standalone sem dependências externas
 * 
 * Uso: node sync-script-standalone.js
 * Não requer dotenv - usa variáveis de ambiente diretamente
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurações - usar variáveis de ambiente ou valores padrão
const STRAPI_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const PORT = process.env.PORT || 4005;

// Log das configurações (sem expor token sensível)
console.log('🔧 Configurações de sincronização:');
console.log(`🔗 STRAPI_URL: ${STRAPI_URL}`);
console.log(`🔑 STRAPI_API_TOKEN: ${STRAPI_API_TOKEN ? 'Configurado' : 'Não configurado'}`);

// Funções auxiliares
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

async function uploadFileToStrapi(filePath, filename) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Arquivo não encontrado: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath);
    
    const boundary = '----formdata-' + Math.random().toString(36);
    
    let body = [];
    body.push(Buffer.from(`--${boundary}\r\n`));
    body.push(Buffer.from(`Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`));
    body.push(Buffer.from('Content-Type: application/octet-stream\r\n\r\n'));
    body.push(fileContent);
    body.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    
    const bodyBuffer = Buffer.concat(body);

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'whatsapp-strapi.xjueib.easypanel.host',
        port: 443,
        path: '/api/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length
        }
      };

      const req = https.request(options, (res) => {
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
      req.write(bodyBuffer);
      req.end();
    });

    if (response.status === 200 && response.data && response.data[0]) {
      const uploadedFile = response.data[0];
      console.log(`   ✅ Arquivo enviado: ${filename} (ID: ${uploadedFile.id})`);
      return uploadedFile.id;
    } else {
      console.log(`   ❌ Erro ao enviar arquivo: ${filename}`, response.data);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Erro ao processar arquivo ${filename}:`, error.message);
    return null;
  }
}

function getLocalPathFromUrl(url) {
  if (url.startsWith('https://coopcorretores.com.br/')) {
    const relativePath = url.replace('https://coopcorretores.com.br/', '');
    return path.join(__dirname, 'public', relativePath);
  }
  
  if (url.startsWith('/')) {
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return path.join(__dirname, 'public', cleanUrl);
  }
  
  if (!url.startsWith('http')) {
    return path.join(__dirname, 'public', 'uploads', 'imoveis', url);
  }
  
  return null;
}

async function getAllImoveisFromStrapi() {
  try {
    console.log('🔄 Buscando imóveis do Strapi...');
    const response = await fetchWithHttps(`${STRAPI_URL}/imoveis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ Encontrados ${response.data?.length || 0} imóveis no Strapi`);
      return response.data || [];
    } else {
      console.log('❌ Erro ao buscar imóveis do Strapi:', response.status);
      return [];
    }
  } catch (error) {
    console.log('❌ Erro de conexão com Strapi:', error.message);
    return [];
  }
}

async function syncSingleImovel(imovelData) {
  try {
    console.log(`\n📋 Processando imóvel ${imovelData.id}: ${imovelData.titulo}`);
    
    let fotos = [];
    let videos = [];
    
    try {
      if (imovelData.fotos) {
        fotos = typeof imovelData.fotos === 'string' ? JSON.parse(imovelData.fotos) : imovelData.fotos;
      }
    } catch (e) {
      console.log(`   ⚠️  Erro ao processar fotos: ${e.message}`);
      fotos = [];
    }
    
    try {
      if (imovelData.videos) {
        videos = typeof imovelData.videos === 'string' ? JSON.parse(imovelData.videos) : imovelData.videos;
      }
    } catch (e) {
      console.log(`   ⚠️  Erro ao processar vídeos: ${e.message}`);
      videos = [];
    }
    
    console.log(`   📸 ${fotos.length} fotos encontradas`);
    console.log(`   🎥 ${videos.length} vídeos encontrados`);
    
    return {
      id: imovelData.id,
      titulo: imovelData.titulo,
      status: 'processado',
      fotos: fotos.length,
      videos: videos.length
    };
  } catch (error) {
    console.log(`   ❌ Erro ao processar imóvel ${imovelData.id}:`, error.message);
    return {
      id: imovelData.id,
      titulo: imovelData.titulo || 'Sem título',
      status: 'erro',
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Iniciando sincronização de imóveis...');
  console.log(`🔗 URL Strapi: ${STRAPI_URL}`);
  
  // Verificar se as variáveis necessárias estão configuradas
  if (!STRAPI_URL || STRAPI_URL === 'https://whatsapp-strapi.xjueib.easypanel.host') {
    console.log('⚠️  Atenção: Usando URL padrão do Strapi');
  }
  
  if (!STRAPI_API_TOKEN) {
    console.log('⚠️  Atenção: STRAPI_API_TOKEN não configurado - uploads podem falhar');
  }
  
  try {
    const imoveis = await getAllImoveisFromStrapi();
    
    if (imoveis.length === 0) {
      console.log('⚠️  Nenhum imóvel encontrado para sincronizar');
      return;
    }
    
    console.log(`📊 Total de imóveis para processar: ${imoveis.length}`);
    
    const resultados = [];
    for (const imovel of imoveis) {
      const resultado = await syncSingleImovel(imovel);
      resultados.push(resultado);
    }
    
    console.log('\n✅ Sincronização concluída!');
    console.log(`📊 Processados: ${resultados.filter(r => r.status === 'processado').length}`);
    console.log(`❌ Erros: ${resultados.filter(r => r.status === 'erro').length}`);
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };