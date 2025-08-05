#!/usr/bin/env node

/**
 * Upload de Imagem para Strapi v4 - SEM TOKEN
 * 
 * Para quando o upload não requer autenticação
 * Execute: node upload-sem-token.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações do Strapi
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

// Caminho da imagem
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function uploadSemToken() {
  console.log('🚀 Upload de Imagem para Strapi - SEM TOKEN');
  console.log('==========================================\n');

  try {
    // Verificar arquivo
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
      return;
    }

    const stats = fs.statSync(IMAGE_PATH);
    console.log(`📁 Arquivo: ${path.basename(IMAGE_PATH)}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔗 URL Strapi: ${STRAPI_URL}`);
    console.log('🔓 Sem autenticação (upload público)');

    // Preparar FormData
    const form = new FormData();
    form.append('files', fs.createReadStream(IMAGE_PATH));

    console.log('\n📤 Enviando imagem...');

    // Fazer upload sem token
    const response = await axios.post(`${STRAPI_URL}/upload`, form, {
      headers: {
        'Accept': 'application/json',
        ...form.getHeaders()
      },
      timeout: 30000
    });

    // Processar resposta
    if (response.data && response.data[0]) {
      const file = response.data[0];
      console.log('\n✅ Upload realizado com sucesso!');
      console.log(`🆔 ID do arquivo: ${file.id}`);
      console.log(`📄 Nome: ${file.name}`);
      console.log(`🔗 URL: ${STRAPI_URL}${file.url}`);
      console.log(`📐 Dimensões: ${file.width}x${file.height}px`);
      console.log(`📊 Tamanho: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Salvar informações
      const info = {
        id: file.id,
        url: `${STRAPI_URL}${file.url}`,
        name: file.name,
        size: file.size,
        width: file.width,
        height: file.height,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync('upload-success.json', JSON.stringify(info, null, 2));
      console.log('\n💾 Informações salvas em: upload-success.json');
    }

  } catch (error) {
    console.error('\n❌ Erro no upload:');
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📄 Erro: ${error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data)}`);
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('\n💡 O upload parece exigir autenticação.');
        console.error('   Tente usar: node upload-final.js SEU_TOKEN');
      } else if (error.response.status === 413) {
        console.error('\n💡 Arquivo muito grande. Verifique o limite de upload.');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 Domínio não encontrado.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Conexão recusada.');
    } else {
      console.error('❗ Erro:', error.message);
    }
  }
}

// Executar
uploadSemToken();