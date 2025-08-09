#!/usr/bin/env node
/**
 * Script de sincronização em massa baseado no sync-script-standalone.js
 * 
 * Uso: node sync-all-from-standalone.js
 * 
 * Este script usa a mesma lógica da função syncSingleImovel existente
 * para sincronizar todos os imóveis da API local
 */

// Carregar variáveis de ambiente
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const FormData = require('form-data');
const { URL } = require('url');

// Configurações
const STRAPI_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
const API_LOCAL_URL = 'http://localhost:4000';

console.log('🔧 Configurações de sincronização em massa:');
console.log(`🔗 STRAPI_URL: ${STRAPI_URL}`);
console.log(`🔗 API_LOCAL_URL: ${API_LOCAL_URL}`);

// ====== FUNÇÕES COPIADAS DO sync-script-standalone.js ======

// Função auxiliar para determinar tipo de conteúdo
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

// Função para obter caminho local do arquivo
function getFilePathFromUrl(url) {
  if (url.startsWith('/uploads/')) {
    return path.join(__dirname, '..', url);
  }
  return url;
}

// Função para verificar se arquivo existe no Strapi
async function checkFileExistsInStrapi(filename) {
  try {
    const response = await axios.get(`${STRAPI_URL}/upload/files?name=${encodeURIComponent(filename)}`);
    return response.data && response.data.length > 0 ? response.data[0].id : null;
  } catch (error) {
    console.log(`   ⚠️ Erro ao verificar existência do arquivo ${filename}: ${error.message}`);
    return null;
  }
}

// Função para upload de arquivos
async function uploadFileToStrapi(filePathOrUrl, filename) {
  if (!filePathOrUrl || !filename) {
    console.log(`   ❌ Parâmetros inválidos - filePathOrUrl: ${filePathOrUrl}, filename: ${filename}`);
    return null;
  }
  
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  try {
    // Verificar se arquivo já existe
    const existingFileId = await checkFileExistsInStrapi(cleanFilename);
    if (existingFileId) {
      console.log(`   ♻️ Arquivo ${cleanFilename} já existe no Strapi (ID: ${existingFileId})`);
      return existingFileId;
    }

    let fileStream;
    let fileSize;
    
    if (filePathOrUrl.startsWith('http') || filePathOrUrl.startsWith('/uploads/')) {
      const fullUrl = filePathOrUrl.startsWith('/') ? 
        `https://coopcorretores.com.br${filePathOrUrl}` : filePathOrUrl;
      
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        responseType: 'stream',
        timeout: 60000
      });
      fileStream = response.data;
      fileSize = response.headers['content-length'];
    } else {
      if (!fs.existsSync(filePathOrUrl)) {
        console.log(`   ❌ Arquivo não encontrado: ${filePathOrUrl}`);
        return null;
      }
      fileStream = fs.createReadStream(filePathOrUrl);
      const stats = fs.statSync(filePathOrUrl);
      fileSize = stats.size;
    }

    const form = new FormData();
    form.append('files', fileStream, cleanFilename);

    const response = await axios.post(`${STRAPI_URL}/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data[0]?.id;
  } catch (error) {
    console.log(`   ❌ Erro ao fazer upload: ${error.message}`);
    return null;
  }
}

// ====== FUNÇÃO PRINCIPAL COPIADA E ADAPTADA ======

// Função principal para sincronizar um imóvel - CÓPIA EXATA DA ORIGINAL
async function syncSingleImovel(imovel) {
  try {
    console.log(`\n📋 Processando imóvel ${imovel.id}: ${imovel.titulo}`);
    console.log(`   📊 Total de fotos: ${imovel.fotos?.length || 0}`);
    console.log(`   📊 Total de vídeos: ${imovel.videos?.length || 0}`);
    
    // Processar fotos
    const uploadedFotos = [];
    if (imovel.fotos && imovel.fotos.length > 0) {
      console.log(`   📸 Processando ${imovel.fotos.length} fotos...`);
      for (let i = 0; i < imovel.fotos.length; i++) {
        const foto = imovel.fotos[i];
        console.log(`   📋 Foto ${i+1}: ${foto}`);
        const localPath = getFilePathFromUrl(foto);
        console.log(`   📁 Caminho local: ${localPath}`);
        if (localPath) {
          console.log(`   📤 Iniciando upload da foto ${i+1}: ${path.basename(localPath)}`);
          const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
          if (fileId) {
            uploadedFotos.push(fileId);
            console.log(`   ✅ Foto ${i+1} enviada com sucesso (ID: ${fileId})`);
          } else {
            console.log(`   ❌ Falha no upload da foto ${i+1}`);
          }
        } else {
          console.log(`   ⚠️  Caminho local não encontrado para: ${foto}`);
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
        tipo_imovel: imovel.tipo || 'outros',
        active: true,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        tipologia: (() => {
          const caracteristicas = [];
          if (imovel.area_construida && imovel.area_construida !== 0) caracteristicas.push(`area_construida ${String(imovel.area_construida)}`);
          if (imovel.area_total && imovel.area_total !== 0) caracteristicas.push(`area_total ${String(imovel.area_total)}`);
          if (imovel.banheiros && imovel.banheiros !== 0) caracteristicas.push(`banheiros ${String(imovel.banheiros)}`);
          if (imovel.quartos && imovel.quartos !== 0) caracteristicas.push(`quartos ${String(imovel.quartos)}`);
          if (imovel.vagas_garagem && imovel.vagas_garagem !== 0) caracteristicas.push(`vagas_garagem ${String(imovel.vagas_garagem)}`);
          return caracteristicas.join(', ');
        })(),
        images: uploadedFotos
      }
    };

    // Verificar se imóvel já existe no Strapi
    const response = await new Promise((resolve, reject) => {
      const url = new URL(STRAPI_URL);
      
      // Primeiro, verificar se o imóvel já existe
      const checkOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: `/imoveis?id_integracao=${encodeURIComponent(imovel.id)}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      console.log(`🔍 Verificando se imóvel já existe no Strapi pelo id_integracao: ${imovel.id}`);

      const checkReq = https.request(checkOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const checkResponse = JSON.parse(data);
            const existingImoveis = checkResponse.data || checkResponse;
            const method = (existingImoveis && existingImoveis.length > 0) ? 'PUT' : 'POST';
            const path = (existingImoveis && existingImoveis.length > 0) 
              ? `/imoveis/${existingImoveis[0].id}` 
              : '/imoveis';
            
            if (method === 'PUT') {
              console.log(`   🔄 Atualizando imóvel existente (ID: ${existingImoveis[0].id})`);
            } else {
              console.log(`   ➕ Criando novo imóvel`);
            }

            // Adicionar id_integracao aos dados
            imovelData.data.id_integracao = imovel.id;
            
            const requestData = JSON.stringify(imovelData);
            const requestOptions = {
              hostname: url.hostname,
              port: url.port || 443,
              path: path,
              method: method,
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
              }
            };

            const req = https.request(requestOptions, (res) => {
              let responseData = '';
              res.on('data', chunk => responseData += chunk);
              res.on('end', () => {
                try {
                  const parsed = JSON.parse(responseData);
                  if (res.statusCode === 200 || res.statusCode === 201) {
                    resolve(parsed);
                  } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                  }
                } catch (e) {
                  reject(new Error('Invalid JSON response'));
                }
              });
            });

            req.on('error', reject);
            req.write(requestData);
            req.end();
            
          } catch (e) {
            reject(new Error(`Erro ao verificar duplicatas: ${e.message}`));
          }
        });
      });

      checkReq.on('error', reject);
      checkReq.end();
    });

    console.log(`   ✅ Imóvel sincronizado com ID: ${response.data.id}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erro ao sincronizar imóvel:`, error.response?.data || error.message);
    return false;
  }
}

// ====== FUNÇÕES NOVAS PARA SINCRONIZAÇÃO EM MASSA ======

// Buscar todos os imóveis da API local - usando lógica robusta
async function getAllImoveisFromLocalAPI() {
  try {
    console.log('🔍 Buscando todos os imóveis da API local...');
    
    // Primeiro, verificar se o servidor está rodando
    try {
      const healthCheck = await axios.get('http://localhost:4000/api/imoveis', {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Servidor local respondeu com sucesso');
      
      // Verificar diferentes estruturas de resposta
      const response = healthCheck;
      
      // Tentar diferentes caminhos para encontrar os imóveis
      let imoveis = [];
      
      console.log('🔍 Analisando estrutura da resposta...');
      console.log('   - Status:', response.status);
      console.log('   - Chaves disponíveis:', Object.keys(response.data || {}));
      
      // Verificar estruturas possíveis
      if (response.data && Array.isArray(response.data)) {
        imoveis = response.data;
      } else if (response.data && response.data.data) {
        imoveis = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (response.data && response.data.imoveis) {
        imoveis = response.data.imoveis;
      } else {
        console.log('❌ Estrutura de resposta não reconhecida');
        console.log('   - Conteúdo da resposta:', JSON.stringify(response.data, null, 2));
        return [];
      }
      
      console.log(`✅ Encontrados ${imoveis.length} imóveis`);
      
      // Mapear para o formato esperado
      return imoveis.map(imovel => ({
        id: imovel.id,
        codigo: imovel.codigo,
        titulo: imovel.titulo,
        descricao: imovel.descricao,
        tipo: imovel.tipo,
        status: imovel.status,
        preco: imovel.preco,
        area_total: imovel.area_total,
        area_construida: imovel.area_construida,
        quartos: imovel.quartos,
        banheiros: imovel.banheiros,
        vagas_garagem: imovel.vagas_garagem,
        endereco: imovel.endereco,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        estado: imovel.estado,
        cep: imovel.cep,
        latitude: imovel.latitude,
        longitude: imovel.longitude,
        caracteristicas: imovel.caracteristicas,
        fotos: imovel.fotos || [],
        videos: imovel.videos || []
      }));
      
    } catch (error) {
      console.log(`❌ Erro de conexão: ${error.message}`);
      console.log('💡 Verificando se o servidor está rodando em outra porta...');
      
      // Tentar porta alternativa 3000
      try {
        const altResponse = await axios.get('http://localhost:3000/api/imoveis', {
          timeout: 10000
        });
        
        const imoveis = altResponse.data?.data || altResponse.data?.imoveis || altResponse.data || [];
        console.log(`✅ Encontrados ${imoveis.length} imóveis na porta 3000`);
        
        return imoveis.map(imovel => ({
          id: imovel.id,
          codigo: imovel.codigo,
          titulo: imovel.titulo,
          descricao: imovel.descricao,
          tipo: imovel.tipo,
          status: imovel.status,
          preco: imovel.preco,
          area_total: imovel.area_total,
          area_construida: imovel.area_construida,
          quartos: imovel.quartos,
          banheiros: imovel.banheiros,
          vagas_garagem: imovel.vagas_garagem,
          endereco: imovel.endereco,
          bairro: imovel.bairro,
          cidade: imovel.cidade,
          estado: imovel.estado,
          cep: imovel.cep,
          latitude: imovel.latitude,
          longitude: imovel.longitude,
          caracteristicas: imovel.caracteristicas,
          fotos: imovel.fotos || [],
          videos: imovel.videos || []
        }));
        
      } catch (altError) {
        console.log('❌ Servidor não encontrado nas portas 4000 ou 3000');
        console.log('💡 Verifique se o servidor está rodando: npm run dev ou npm start');
        return [];
      }
    }
    
  } catch (error) {
    console.error('❌ Erro crítico ao buscar imóveis:', error.message);
    return [];
  }
}

// Processar todos os imóveis
async function syncAllImoveis() {
  console.log('🚀 Iniciando sincronização em massa de imóveis...\n');
  
  try {
    // 1. Buscar todos os imóveis da API local
    const imoveis = await getAllImoveisFromLocalAPI();
    
    if (!imoveis || imoveis.length === 0) {
      console.log('❌ Nenhum imóvel encontrado para sincronizar');
      return;
    }
    
    console.log(`📊 Total de imóveis para sincronizar: ${imoveis.length}\n`);
    
    let sucessos = 0;
    let falhas = 0;
    
    // 2. Processar cada imóvel usando a mesma lógica da syncSingleImovel
    for (let i = 0; i < imoveis.length; i++) {
      const imovel = imoveis[i];
      const progresso = `${i + 1}/${imoveis.length}`;
      
      console.log(`\n${progresso} Processando imóvel ID: ${imovel.id}`);
      
      try {
        const resultado = await syncSingleImovel(imovel);
        
        if (resultado) {
          console.log(`   ✅ ${progresso} - Sucesso: ${imovel.titulo || 'Imóvel ' + imovel.id}`);
          sucessos++;
        } else {
          console.log(`   ❌ ${progresso} - Falha: ${imovel.titulo || 'Imóvel ' + imovel.id}`);
          falhas++;
        }
        
      } catch (error) {
        console.log(`   ❌ ${progresso} - Erro crítico: ${error.message}`);
        falhas++;
      }
      
      // Pausa entre requisições para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎯 SINCRONIZAÇÃO CONCLUÍDA');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Falhas: ${falhas}`);
    console.log(`📊 Total: ${imoveis.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização em massa:', error.message);
  }
}

// Executar sincronização
if (require.main === module) {
  syncAllImoveis();
}

module.exports = { syncAllImoveis, syncSingleImovel };