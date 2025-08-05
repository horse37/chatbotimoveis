const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações do Strapi
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.argv[2] || 'seu-token-aqui'; // Passe o token como argumento

// Caminho da imagem
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function uploadImagemDireto() {
  console.log('🚀 Iniciando upload direto da imagem...');
  console.log(`📁 Arquivo: ${IMAGE_PATH}`);
  console.log(`🔗 URL Strapi: ${STRAPI_URL}`);

  try {
    // Verificar arquivo
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
      return;
    }

    const stats = fs.statSync(IMAGE_PATH);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Criar FormData para upload
    const form = new FormData();
    form.append('files', fs.createReadStream(IMAGE_PATH));
    form.append('path', 'imoveis'); // Pasta de destino no Strapi

    console.log('📤 Enviando...');

    // Fazer upload - endpoint correto para Strapi v4
    const response = await axios.post(`${STRAPI_URL}/api/upload`, form, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ Upload realizado com sucesso!');
    console.log('📋 Resposta completa:');
    console.log(JSON.stringify(response.data, null, 2));

    // Exibir URL da imagem
    if (response.data && response.data[0]) {
      const file = response.data[0];
      console.log(`\n🔗 URL da imagem: ${STRAPI_URL}${file.url}`);
      console.log(`🆔 ID: ${file.id}`);
      console.log(`📄 Nome: ${file.name}`);
    }

  } catch (error) {
    console.error('❌ Erro no upload:');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Erro:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Strapi não está rodando em:', STRAPI_URL);
      console.error('💡 Inicie o Strapi primeiro: npm run develop');
    } else {
      console.error('❗ Erro:', error.message);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  uploadImagemDireto();
}