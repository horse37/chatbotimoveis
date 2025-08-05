#!/usr/bin/env node

/**
 * Upload de Imagem para Strapi v4
 * 
 * INSTRUÇÕES:
 * 1. Obtenha o token do Strapi (Settings > API Tokens)
 * 2. Execute: node upload-final.js SEU_TOKEN_AQUI
 * 
 * O arquivo será enviado para: https://whatsapp-strapi.xjueib.easypanel.host/upload
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações do Strapi
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.argv[2];

// Caminho da imagem
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function uploadImagem() {
  console.log('🚀 Upload de Imagem para Strapi v4');
  console.log('===================================\n');

  // Validações
  if (!STRAPI_API_TOKEN) {
    console.error('❌ Token não fornecido!');
    console.log('💡 Use: node upload-final.js SEU_TOKEN_AQUI');
    console.log('   Para obter o token: Strapi Admin > Settings > API Tokens > Create new API Token\n');
    return;
  }

  if (!fs.existsSync(IMAGE_PATH)) {
    console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
    return;
  }

  try {
    const stats = fs.statSync(IMAGE_PATH);
    console.log(`📁 Arquivo: ${path.basename(IMAGE_PATH)}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔗 URL Strapi: ${STRAPI_URL}`);
    console.log(`🔑 Token: ${STRAPI_API_TOKEN.substring(0, 8)}...`);

    // Preparar FormData
    const form = new FormData();
    form.append('files', fs.createReadStream(IMAGE_PATH));
    
    // Opcional: especificar pasta (se configurada no Strapi)
    // form.append('folder', 'imoveis');

    console.log('\n📤 Enviando imagem...');

    // Fazer upload
    const response = await axios.post(`${STRAPI_URL}/upload`, form, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
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
      console.log(`📋 Formato: ${file.ext}`);
      
      // Salvar informações para uso posterior
      const info = {
        id: file.id,
        url: `${STRAPI_URL}${file.url}`,
        name: file.name,
        size: file.size,
        width: file.width,
        height: file.height,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync('upload-info.json', JSON.stringify(info, null, 2));
      console.log('\n💾 Informações salvas em: upload-info.json');
    }

  } catch (error) {
    console.error('\n❌ Erro no upload:');
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📄 Erro: ${error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data)}`);
      
      if (error.response.status === 401) {
        console.error('\n💡 Verifique se o token está correto e tem as permissões necessárias.');
        console.error('   Vá em: Strapi Admin > Settings > API Tokens');
      } else if (error.response.status === 413) {
        console.error('\n💡 Arquivo muito grande. Verifique o limite de upload no Strapi.');
      }
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 Domínio não encontrado. Verifique a URL do Strapi.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Conexão recusada. Verifique se o Strapi está rodando.');
    } else {
      console.error('❗ Erro:', error.message);
    }
  }
}

// Executar
uploadImagem();