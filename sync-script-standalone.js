#!/usr/bin/env node
/**
 * Script de sincronização corrigido para Strapi v3.8
 * 
 * Uso: node sync-script-standalone.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configurações
const STRAPI_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const PORT = process.env.PORT || 4005;

// Log das configurações
console.log('🔧 Configurações de sincronização:');
console.log(`🔗 STRAPI_URL: ${STRAPI_URL}`);
console.log(`🔑 STRAPI_API_TOKEN: ${STRAPI_API_TOKEN ? 'Configurado' : 'Não configurado'}`);

// Função corrigida para upload de arquivos
async function uploadFileToStrapi(filePath, filename) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Arquivo não encontrado: ${filePath}`);
      return null;
    }

    const form = new FormData();
    form.append('files', fs.createReadStream(filePath), {
      filename: filename,
      contentType: getContentType(filename)
    });

    const response = await axios.post(`${STRAPI_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.data && response.data[0]) {
      console.log(`   ✅ Arquivo enviado: ${filename} (ID: ${response.data[0].id})`);
      return response.data[0].id;
    }
    return null;
  } catch (error) {
    console.log(`   ❌ Erro no upload de ${filename}:`, error.response?.data || error.message);
    return null;
  }
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.pdf': 'application/pdf'
  };
  return types[ext] || 'application/octet-stream';
}

// Função para obter caminho local
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

// Função para testar conexão com Strapi
async function testStrapiConnection() {
  try {
    const response = await axios.get(`${STRAPI_URL}/imoveis`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      }
    });
    return response.status === 200;
  } catch (error) {
    console.log('❌ Erro ao conectar ao Strapi:', error.message);
    return false;
  }
}

// Função principal para sincronizar um imóvel
async function syncSingleImovel(imovel) {
  try {
    console.log(`\n📋 Processando imóvel ${imovel.id}: ${imovel.titulo}`);
    
    // Processar fotos
    const uploadedFotos = [];
    if (imovel.fotos && imovel.fotos.length > 0) {
      console.log(`   📸 Processando ${imovel.fotos.length} fotos...`);
      for (const foto of imovel.fotos) {
        const localPath = getLocalPathFromUrl(foto);
        if (localPath) {
          const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
          if (fileId) uploadedFotos.push(fileId);
        }
      }
    }

    // Preparar dados para o Strapi
    const imovelData = {
      data: {
        titulo: imovel.titulo,
        description: imovel.descricao,
        price: imovel.preco,
        tipo_contrato: imovel.tipo_contrato || 'venda',
        tipo_imovel: imovel.tipo_imovel || 'casa',
        active: true,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        tipologia: imovel.tipologia,
        images: uploadedFotos
      }
    };

    // Enviar para o Strapi
    const response = await axios({
      method: 'POST',
      url: `${STRAPI_URL}/imoveis`,
      data: imovelData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      }
    });

    console.log(`   ✅ Imóvel sincronizado com ID: ${response.data.id}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro ao sincronizar imóvel:`, error.response?.data || error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando sincronização com Strapi v3.8');
  
  if (!await testStrapiConnection()) {
    console.log('❌ Conexão com Strapi falhou. Verifique URL e token.');
    process.exit(1);
  }

  // Aqui você adicionaria a lógica para obter seus imóveis
  // Exemplo:
  const imoveis = []; // Substitua por sua lista de imóveis
  
  for (const imovel of imoveis) {
    await syncSingleImovel(imovel);
  }

  console.log('\n✅ Sincronização concluída!');
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  uploadFileToStrapi,
  syncSingleImovel
};