const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações do Strapi
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.argv[2]; // Token deve ser passado como argumento

// Caminho da imagem
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function testarConexao() {
  try {
    console.log('🔍 Testando conexão com Strapi...');
    
    const response = await axios.get(`${STRAPI_URL}`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      }
    });

    console.log('✅ Conexão estabelecida!');
    console.log('📊 Status:', response.status);
    return true;

  } catch (error) {
    console.error('❌ Erro de conexão:');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Erro:', error.response.data);
    } else {
      console.error('❗', error.message);
    }
    return false;
  }
}

async function uploadImagemReal() {
  console.log('🚀 Upload Real de Imagem para Strapi');
  console.log('====================================\n');

  if (!STRAPI_API_TOKEN) {
    console.error('❌ Token não fornecido. Use: node upload-real.js SEU_TOKEN');
    return;
  }

  try {
    // Verificar arquivo
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
      return;
    }

    const stats = fs.statSync(IMAGE_PATH);
    console.log(`📁 Arquivo: ${path.basename(IMAGE_PATH)}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Testar conexão primeiro
    const conectado = await testarConexao();
    if (!conectado) {
      console.error('❌ Não foi possível conectar ao Strapi');
      return;
    }

    // Preparar upload
    const form = new FormData();
    form.append('files', fs.createReadStream(IMAGE_PATH));
    form.append('folder', 'imoveis');

    console.log('\n📤 Enviando imagem...');

    // Upload com retry - endpoint correto é /upload
    const response = await axios.post(`${STRAPI_URL}/upload`, form, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Accept': 'application/json',
        ...form.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ Upload realizado com sucesso!');
    
    if (response.data && response.data[0]) {
      const file = response.data[0];
      console.log('\n📋 Resultado:');
      console.log(`🆔 ID: ${file.id}`);
      console.log(`📄 Nome: ${file.name}`);
      console.log(`🔗 URL: ${STRAPI_URL}${file.url}`);
      console.log(`📐 Dimensões: ${file.width}x${file.height}`);
      console.log(`📊 Tamanho: ${(file.size / 1024).toFixed(2)} KB`);
    }

  } catch (error) {
    console.error('❌ Erro no upload:');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Erro:', error.response.data?.error?.message || error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Strapi não está acessível');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔍 Domínio não encontrado');
    } else {
      console.error('❗ Erro:', error.message);
    }
  }
}

// Executar
uploadImagemReal();