const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações do Strapi
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.argv[2] || 'your-api-token-here';

// Caminho da imagem a ser testada
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function testUploadImagem() {
  try {
    console.log('🚀 Iniciando teste de upload de imagem...');
    console.log(`📁 Caminho da imagem: ${IMAGE_PATH}`);

    // Verificar se o arquivo existe
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
      return;
    }

    // Verificar tamanho do arquivo
    const stats = fs.statSync(IMAGE_PATH);
    console.log(`📊 Tamanho do arquivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Criar FormData
    const form = new FormData();
    form.append('files', fs.createReadStream(IMAGE_PATH));
    form.append('ref', 'api::imovel.imovel');
    form.append('field', 'images');

    console.log('📤 Enviando imagem para o Strapi...');

    // Fazer upload
    const response = await axios.post(`${STRAPI_URL}/api/upload`, form, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ Upload realizado com sucesso!');
    console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));

    // Se o upload foi bem-sucedido, retornar os dados
    if (response.data && response.data[0]) {
      const uploadedFile = response.data[0];
      console.log(`🔗 URL da imagem: ${STRAPI_URL}${uploadedFile.url}`);
      console.log(`🆔 ID do arquivo: ${uploadedFile.id}`);
    }

  } catch (error) {
    console.error('❌ Erro durante o upload:');
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Resposta:', error.response.data);
    } else if (error.request) {
      console.error('🔌 Sem resposta do servidor');
    } else {
      console.error('❗ Erro:', error.message);
    }
  }
}

// Função para testar conexão com Strapi
async function testStrapiConnection() {
  try {
    console.log('🔍 Testando conexão com Strapi...');
    
    const response = await axios.get(`${STRAPI_URL}/api/upload`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      }
    });

    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('📊 Status:', response.status);
    
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:');
    console.error('📊 Status:', error.response?.status);
    console.error('📄 Mensagem:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

// Executar testes
async function main() {
  console.log('🎯 Teste de Upload de Imagem - Strapi');
  console.log('=====================================\n');

  // Verificar variáveis de ambiente
  if (!STRAPI_API_TOKEN || STRAPI_API_TOKEN === 'your-api-token-here') {
    console.warn('⚠️  STRAPI_API_TOKEN não configurado. Use:');
    console.warn('   set STRAPI_API_TOKEN=seu-token-aqui');
    console.warn('   node test-upload-imagem.js\n');
    return;
  }

  // Testar conexão primeiro
  const conectado = await testStrapiConnection();
  if (!conectado) {
    console.error('❌ Não foi possível conectar ao Strapi. Verifique a URL e o token.');
    return;
  }

  console.log('\n');
  await testUploadImagem();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testUploadImagem, testStrapiConnection };