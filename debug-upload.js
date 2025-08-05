const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações do Strapi
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.argv[2]; // Token deve ser passado como argumento

// Caminho da imagem
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function verificarEndpoints() {
  console.log('🔍 Verificando endpoints do Strapi...\n');

  const endpoints = [
    '/api',
    '/api/upload',
    '/upload',
    '/api/upload/',
    '/api/upload/files'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.options(`${STRAPI_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        }
      });
      
      console.log(`✅ ${endpoint}: Métodos permitidos - ${response.headers.allow}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint}: ${error.response.status} - ${error.response.statusText}`);
        console.log(`   Headers: ${JSON.stringify(error.response.headers)}`);
      } else {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }
}

async function testarUpload() {
  console.log('\n🚀 Testando upload com diferentes abordagens...\n');

  if (!fs.existsSync(IMAGE_PATH)) {
    console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
    return;
  }

  if (!STRAPI_API_TOKEN) {
    console.error('❌ Token não fornecido. Use: node debug-upload.js SEU_TOKEN');
    return;
  }

  const form = new FormData();
  form.append('files', fs.createReadStream(IMAGE_PATH));
  form.append('folder', 'imoveis');

  // Teste 1: POST direto
  try {
    console.log('📤 Teste 1: POST direto para /api/upload');
    const response = await axios.post(`${STRAPI_URL}/api/upload`, form, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Accept': 'application/json',
        ...form.getHeaders()
      }
    });
    
    console.log('✅ Sucesso!');
    console.log(response.data);
    return;
  } catch (error) {
    console.log('❌ Falha:', error.response?.status, error.response?.data);
  }

  // Teste 2: POST sem folder
  try {
    console.log('\n📤 Teste 2: POST sem folder');
    const form2 = new FormData();
    form2.append('files', fs.createReadStream(IMAGE_PATH));
    
    const response = await axios.post(`${STRAPI_URL}/api/upload`, form2, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Accept': 'application/json',
        ...form2.getHeaders()
      }
    });
    
    console.log('✅ Sucesso!');
    console.log(response.data);
    return;
  } catch (error) {
    console.log('❌ Falha:', error.response?.status, error.response?.data);
  }

  // Teste 3: GET para verificar permissões
  try {
    console.log('\n🔍 Teste 3: GET para /api/upload');
    const response = await axios.get(`${STRAPI_URL}/api/upload`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      }
    });
    
    console.log('✅ GET permitido:', response.data);
  } catch (error) {
    console.log('❌ GET falhou:', error.response?.status, error.response?.data);
  }
}

// Executar
(async () => {
  console.log('🛠️  Debug de Upload Strapi\n');
  await verificarEndpoints();
  await testarUpload();
})();