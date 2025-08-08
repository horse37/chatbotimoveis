#!/usr/bin/env node
/**
 * Script de sincronização corrigido para Strapi v3.8
 * 
 * Uso: node sync-script-standalone.js
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
const STRAPI_API_TOKEN = ''; // Desabilitado - usando upload público
const PORT = process.env.PORT || 4000;

// Log das configurações
console.log('🔧 Configurações de sincronização:');
console.log(`🔗 STRAPI_URL: ${STRAPI_URL}`);
console.log(`🔓 Upload público - sem autenticação`);

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

// Função para upload de arquivos usando axios (aceita URLs diretas)
// Função para verificar se um arquivo já existe no Strapi pelo nome
async function checkFileExistsInStrapi(filename) {
  try {
    // Usar a API correta do Strapi v3.8 para buscar arquivos
    const response = await axios.get(`${STRAPI_URL}/upload/files?name=${encodeURIComponent(filename)}`);
    return response.data && response.data.length > 0 ? response.data[0].id : null;
  } catch (error) {
    console.log(`   ⚠️ Erro ao verificar existência do arquivo ${filename}: ${error.message}`);
    // Retorna null para continuar com o upload mesmo se a verificação falhar
    // Log adicional para debug específico
    console.log(`   🔍 [EASYPANEL-LOG] Detalhes do erro para ${cleanFilename}:`);
    console.log(`   🔍 [EASYPANEL-LOG] - URL original: ${filePathOrUrl}`);
    console.log(`   🔍 [EASYPANEL-LOG] - Filename original: ${filename}`);
    console.log(`   🔍 [EASYPANEL-LOG] - Filename limpo: ${cleanFilename}`);
    
    return null;
  }
}

async function getAllImoveisFromAPI() {
  try {
    // Usar URL correta baseada no ambiente
    const API_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
    console.log(`🔍 [EASYPANEL-LOG] Buscando todos os imóveis na API: ${API_URL}/imoveis?limit=50`);
    
    // Aguardar um pouco para garantir que o servidor esteja pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tentar primeiro a API simples de admin
    const response = await axios.get(`${API_URL}/imoveis?limit=50`, {
      timeout: 60000, // Aumentado para 60 segundos
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      console.log(`❌ Erro ao buscar imóveis da API`);
      return [];
    }
    
    const data = response.data;
    const imoveis = data.imoveis || data.data?.imoveis || data || [];
    
    console.log(`📋 ${imoveis.length} imóveis encontrados na API`);
    console.log(`🔍 DEBUG - Estrutura da resposta:`, Object.keys(data));
    if (data.data) {
      console.log(`🔍 DEBUG - Estrutura de data:`, Object.keys(data.data));
    }
    
    // Mapear cada imóvel para o formato esperado
    return imoveis.map(imovel => {
      console.log(`🔍 DEBUG - Mapeando imóvel ID: ${imovel.id}`);
      console.log(`   - Área Construída: ${imovel.area_construida}`);
      console.log(`   - Bairro: ${imovel.bairro}`);
      
      return {
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
      };
    });
    
  } catch (error) {
    console.log(`❌ [EASYPANEL-LOG] Erro ao buscar imóveis da API: ${error.message}`);
    console.log(`❌ [EASYPANEL-LOG] Stack trace: ${error.stack}`);
    return [];
  }
}

async function uploadFileToStrapi(filePathOrUrl, filename) {
  // Validação inicial dos parâmetros
  if (!filePathOrUrl || !filename) {
    console.log(`   ❌ [EASYPANEL-LOG] Parâmetros inválidos - filePathOrUrl: ${filePathOrUrl}, filename: ${filename}`);
    return null;
  }
  
  // Limpar filename de caracteres problemáticos
  const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (cleanFilename !== filename) {
    console.log(`   🧹 [EASYPANEL-LOG] Filename limpo: ${filename} -> ${cleanFilename}`);
  }
  
  try {
    // Primeiro, verificar se o arquivo já existe no Strapi
    console.log(`   🔍 [EASYPANEL-LOG] Verificando se arquivo ${cleanFilename} já existe no Strapi...`);
    const existingFileId = await checkFileExistsInStrapi(cleanFilename);
    if (existingFileId) {
      console.log(`   ♻️ [EASYPANEL-LOG] Arquivo ${cleanFilename} já existe no Strapi (ID: ${existingFileId})`);
      return existingFileId;
    }

    let fileStream;
    let fileSize;
    
    // Verifica se é uma URL ou caminho local
    if (filePathOrUrl.startsWith('http') || filePathOrUrl.startsWith('/uploads/')) {
      // É uma URL - faz stream direto do servidor web
      const fullUrl = filePathOrUrl.startsWith('/') ? 
        `https://coopcorretores.com.br${filePathOrUrl}` : filePathOrUrl;
      
      console.log(`   🌐 [EASYPANEL-LOG] Fazendo stream da URL: ${fullUrl}`);
      try {
        const response = await axios({
          method: 'GET',
          url: fullUrl,
          responseType: 'stream',
          timeout: 60000
        });
        console.log(`   ✅ [EASYPANEL-LOG] Stream obtido com sucesso, status: ${response.status}`);
        fileStream = response.data;
        fileSize = response.headers['content-length'];
      } catch (streamError) {
        console.log(`   ❌ [EASYPANEL-LOG] Erro ao fazer stream da URL: ${streamError.message}`);
        console.log(`   ❌ [EASYPANEL-LOG] Stack trace stream: ${streamError.stack}`);
        return null;
      }

    } else {
      // É um caminho local
      if (!fs.existsSync(filePathOrUrl)) {
        console.log(`   ❌ [EASYPANEL-LOG] Arquivo não encontrado: ${filePathOrUrl}`);
        return null;
      }
      console.log(`   📁 [EASYPANEL-LOG] Lendo arquivo local: ${filePathOrUrl}`);
      fileStream = fs.createReadStream(filePathOrUrl);
      const stats = fs.statSync(filePathOrUrl);
      fileSize = stats.size;
    }

    console.log(`   📁 [EASYPANEL-LOG] Preparando upload: ${filename} (${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'tamanho desconhecido'})`);

    // Preparar FormData
    const form = new FormData();
    form.append('files', fileStream, cleanFilename);

    console.log(`   📤 [EASYPANEL-LOG] Enviando ${cleanFilename}...`);
    console.log(`   🔗 [EASYPANEL-LOG] URL de upload: ${STRAPI_URL}/upload`);
    console.log(`   📊 [EASYPANEL-LOG] Tamanho do arquivo: ${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'desconhecido'}`);

    const response = await axios.post(`${STRAPI_URL}/upload`, form, {
      headers: {
        'Accept': 'application/json',
        ...form.getHeaders()
      },
      timeout: 120000, // 2 minutos para arquivos grandes
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Log da resposta para debug
    console.log(`   📊 [EASYPANEL-LOG] Status da resposta: ${response.status}`);
    console.log(`   📊 [EASYPANEL-LOG] Content-Type: ${response.headers['content-type']}`);
    
    // Verificar se a resposta é JSON
    if (typeof response.data === 'string') {
      console.log(`   ⚠️ [EASYPANEL-LOG] Resposta é string, não JSON: ${response.data.substring(0, 200)}`);
      try {
        const parsedData = JSON.parse(response.data);
        response.data = parsedData;
      } catch (parseError) {
        console.log(`   ❌ [EASYPANEL-LOG] Erro ao processar resposta JSON: ${parseError.message}`);
        console.log(`   ❌ [EASYPANEL-LOG] Stack trace parse: ${parseError.stack}`);
        return null;
      }
    }
    
    // Processar resposta (igual ao upload-sem-token.js)
    if (response.data && response.data[0]) {
      const file = response.data[0];
      console.log(`   ✅ [EASYPANEL-LOG] Upload realizado: ${cleanFilename} (ID: ${file.id})`);
      return file.id;
    } else {
      console.log(`   ❌ [EASYPANEL-LOG] Resposta inválida do servidor`);
      console.log(`   📄 [EASYPANEL-LOG] Dados recebidos: ${JSON.stringify(response.data)}`);
      return null;
    }

  } catch (error) {
    console.log(`   ❌ [EASYPANEL-LOG] Erro ao fazer upload de ${cleanFilename}:`);
    console.log(`   ❌ [EASYPANEL-LOG] Tipo do erro: ${error.constructor.name}`);
    console.log(`   ❌ [EASYPANEL-LOG] Mensagem: ${error.message}`);
    console.log(`   ❌ [EASYPANEL-LOG] Stack trace upload: ${error.stack}`);
    
    if (error.response) {
      console.log(`   📊 [EASYPANEL-LOG] Status: ${error.response.status}`);
      console.log(`   📊 [EASYPANEL-LOG] Headers: ${JSON.stringify(error.response.headers)}`);
      
      // Log da resposta bruta para debug
      if (typeof error.response.data === 'string') {
        console.log(`   📄 [EASYPANEL-LOG] Resposta bruta (primeiros 500 chars): ${error.response.data.substring(0, 500)}`);
      } else {
        console.log(`   📄 [EASYPANEL-LOG] Erro: ${error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data)}`);
      }
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.log(`   💡 [EASYPANEL-LOG] O upload parece exigir autenticação.`);
      } else if (error.response.status === 413) {
        console.log(`   💡 [EASYPANEL-LOG] Arquivo muito grande. Verifique o limite de upload.`);
      } else if (error.response.status === 404) {
        console.log(`   💡 [EASYPANEL-LOG] Endpoint de upload não encontrado. Verificar URL.`);
      } else if (error.response.status === 405) {
        console.log(`   💡 [EASYPANEL-LOG] Método não permitido. Verificar endpoint.`);
      }
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   🔍 [EASYPANEL-LOG] Domínio não encontrado`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`   🔌 [EASYPANEL-LOG] Conexão recusada`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   ⏰ [EASYPANEL-LOG] Timeout na conexão`);
    } else if (error.code === 'ECONNRESET') {
      console.log(`   🔌 [EASYPANEL-LOG] Conexão resetada pelo servidor`);
    } else {
      console.log(`   ❗ [EASYPANEL-LOG] Erro: ${error.message}`);
      console.log(`   ❗ [EASYPANEL-LOG] Código do erro: ${error.code}`);
    }
    
    return null;
  }
}

// Função para processar URL de arquivo (retorna URL para stream direto)
function getFilePathFromUrl(url) {
  console.log(`   🔍 Processando URL: ${url}`);
  
  // Validação inicial
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.log(`   ❌ URL inválida ou vazia`);
    return null;
  }
  
  // Limpar a URL removendo espaços e caracteres especiais
  const cleanUrl = url.trim();
  
  // Para URLs completas, retorna como está
  if (cleanUrl.startsWith('https://coopcorretores.com.br/') || cleanUrl.startsWith('http://coopcorretores.com.br/')) {
    console.log(`   🌐 URL completa detectada`);
    return cleanUrl;
  }
  
  // Para outras URLs completas (http/https)
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    console.log(`   🌐 URL externa detectada`);
    return cleanUrl;
  }
  
  // Para caminhos que começam com /, retorna como está (será processado no upload)
  if (cleanUrl.startsWith('/')) {
    console.log(`   📂 Caminho relativo detectado`);
    return cleanUrl;
  }
  
  // Para nomes de arquivo simples, constrói o caminho completo
  if (!cleanUrl.includes('://')) {
    const fullPath = `/uploads/imoveis/${cleanUrl}`;
    console.log(`   📁 Construindo caminho: ${fullPath}`);
    return fullPath;
  }
  
  console.log(`   ⚠️ URL não reconhecida: ${cleanUrl}`);
  return null;
}

// Função para testar conexão com Strapi usando https nativo
async function testStrapiConnection() {
  return new Promise((resolve) => {
    const url = new URL(STRAPI_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/',
      method: 'GET',
      headers: {
        // Removido autenticação - acesso público permitido
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          console.log('❌ Erro ao conectar ao Strapi:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erro ao conectar ao Strapi:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// Função principal para sincronizar um imóvel
async function syncSingleImovel(imovel) {
  try {
    console.log(`\n📋 Processando imóvel ${imovel.id}: ${imovel.titulo}`);
    console.log(`   📊 Total de fotos: ${imovel.fotos?.length || 0}`);
    console.log(`   📊 Total de vídeos: ${imovel.videos?.length || 0}`);
    if (imovel.fotos && imovel.fotos.length > 0) {
      console.log(`   📸 URLs das fotos:`, imovel.fotos);
    }
    if (imovel.videos && imovel.videos.length > 0) {
      console.log(`   🎥 URLs dos vídeos:`, imovel.videos);
    }
    
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
          console.log(`🔍 DEBUG Tipologia - area_construida: ${imovel.area_construida} (tipo: ${typeof imovel.area_construida})`);
          console.log(`🔍 DEBUG Tipologia - area_total: ${imovel.area_total} (tipo: ${typeof imovel.area_total})`);
          if (imovel.area_construida && imovel.area_construida !== 0) caracteristicas.push(`area_construida ${String(imovel.area_construida)}`);
          if (imovel.area_total && imovel.area_total !== 0) caracteristicas.push(`area_total ${String(imovel.area_total)}`);
          if (imovel.banheiros && imovel.banheiros !== 0) caracteristicas.push(`banheiros ${String(imovel.banheiros)}`);
          if (imovel.quartos && imovel.quartos !== 0) caracteristicas.push(`quartos ${String(imovel.quartos)}`);
          if (imovel.vagas_garagem && imovel.vagas_garagem !== 0) caracteristicas.push(`vagas_garagem ${String(imovel.vagas_garagem)}`);
          const resultado = caracteristicas.join(', ');
          console.log(`🔍 DEBUG Tipologia final: ${resultado}`);
          return resultado;
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
            console.log(`📊 Resposta da verificação:`, JSON.stringify(checkResponse, null, 2));
            
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

// Função para obter todos os imóveis do Strapi
async function getAllImoveisFromStrapi() {
    try {
      console.log('🔄 Buscando imóveis do Strapi...');
      const url = new URL(STRAPI_URL);
      
      return new Promise((resolve) => {
        const options = {
          hostname: url.hostname,
          port: url.port || 443,
          path: '/imoveis',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log(`✅ Encontrados ${parsed?.length || 0} imóveis no Strapi`);
              resolve(parsed || []);
            } catch (e) {
              console.log('❌ Erro ao parsear resposta:', e.message);
              resolve([]);
            }
          });
        });

        req.on('error', (error) => {
          console.log('❌ Erro ao buscar imóveis:', error.message);
          resolve([]);
        });

        req.end();
      });
    } catch (error) {
      console.log('❌ Erro de conexão com Strapi:', error.message);
      return [];
    }
  }

// Função para sincronizar um único imóvel (versão corrigida)
async function syncSingleImovelCorrigido(imovelData) {
    try {
      console.log(`\n📋 Processando imóvel ${imovelData.id || 'sem ID'}: ${imovelData.titulo || 'Sem título'}`);
      
      let fotos = [];
      let videos = [];
      
      // Processar fotos
      try {
        if (imovelData.fotos) {
          fotos = typeof imovelData.fotos === 'string' ? JSON.parse(imovelData.fotos) : imovelData.fotos;
        }
      } catch (e) {
        console.log(`   ⚠️  Erro ao processar fotos: ${e.message}`);
        fotos = [];
      }
      
      // Processar vídeos
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
      
      // Processar upload das imagens
      const uploadedFotos = [];
      if (fotos.length > 0) {
        console.log(`   📸 Processando ${fotos.length} fotos...`);
        for (let i = 0; i < fotos.length; i++) {
          const fotoUrl = fotos[i];
          console.log(`   🔍 DEBUG - Foto ${i+1} URL original: ${fotoUrl}`);
          
          // Validação adicional da URL
          if (!fotoUrl || fotoUrl.trim() === '') {
            console.log(`   ⚠️ Foto ${i+1} tem URL vazia - pulando`);
            continue;
          }
          
          const localPath = getFilePathFromUrl(fotoUrl);
          console.log(`   🔍 DEBUG - Foto ${i+1} caminho processado: ${localPath}`);
          
          if (localPath) {
            const filename = path.basename(localPath.split('?')[0]); // Remove query params
            console.log(`   📤 Fazendo upload da foto ${i+1}: ${filename}`);
            try {
              const fileId = await uploadFileToStrapi(localPath, filename);
              if (fileId) {
                uploadedFotos.push(fileId);
                console.log(`   ✅ Foto ${i+1} enviada com sucesso (ID: ${fileId})`);
              } else {
                console.log(`   ⚠️ Falha no upload da foto ${i+1} - continuando com próxima foto`);
              }
            } catch (error) {
              console.log(`   ⚠️ Erro no upload da foto ${i+1}: ${error.message}`);
              console.log(`   📋 Continuando processamento das demais fotos...`);
              // Continua o loop mesmo com erro na foto
            }
          } else {
            console.log(`   ⚠️ Caminho local não encontrado para: ${fotoUrl}`);
          }
        }
      }
      
      // Processar upload dos vídeos
      const uploadedVideos = [];
      if (videos.length > 0) {
        console.log(`   🎥 Processando ${videos.length} vídeos...`);
        for (let i = 0; i < videos.length; i++) {
          const videoUrl = videos[i];
          console.log(`   📋 Vídeo ${i+1}: ${videoUrl}`);
          const localPath = getFilePathFromUrl(videoUrl);
          console.log(`   📁 Caminho local vídeo: ${localPath}`);
          
          if (localPath) {
            console.log(`   📤 Iniciando upload do vídeo ${i+1}: ${path.basename(localPath)}`);
            const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
            if (fileId) {
              uploadedVideos.push(fileId);
              console.log(`   ✅ Vídeo ${i+1} enviado com sucesso (ID: ${fileId})`);
            } else {
              console.log(`   ❌ Falha no upload do vídeo ${i+1}`);
            }
          } else {
            console.log(`   ⚠️  Caminho local não encontrado para vídeo: ${videoUrl}`);
          }
        }
      }
      
      // Preparar dados do imóvel para envio ao Strapi
      const imovelParaStrapi = {
        titulo: imovelData.titulo || 'Imóvel sem título',
        title: imovelData.titulo || 'Imóvel sem título',
        descricao: imovelData.descricao || '',
        preco: parseFloat(imovelData.preco) || 0,
        tipo: imovelData.tipo || 'casa',
        status: imovelData.status || 'disponivel',
        endereco: imovelData.endereco || '',
        cidade: imovelData.cidade || '',
        estado: imovelData.estado || '',
        bairro: imovelData.bairro || '',
        quartos: parseInt(imovelData.quartos) || 0,
        banheiros: parseInt(imovelData.banheiros) || 0,
        vagas: parseInt(imovelData.vagas) || 0,
        area: parseFloat(imovelData.area) || 0,
        fotos: uploadedFotos,
        videos: uploadedVideos,
        destaque: Boolean(imovelData.destaque) || false,
        slug: imovelData.slug || (imovelData.titulo || '').toLowerCase().replace(/\s+/g, '-'),
        codigo: imovelData.codigo || imovelData.id?.toString() || 'sem-codigo',
        url: `https://coopcorretores.com.br/imoveis/${imovelData.id}`,
        id_integracao: imovelData.id
      };

      // Enviar imóvel para o Strapi
      const sucesso = await enviarImovelParaStrapiCorrigido(imovelParaStrapi, imovelData.id);
      
      return {
        id: imovelData.id,
        titulo: imovelData.titulo,
        status: sucesso ? 'processado' : 'erro',
        fotos: fotos.length,
        videos: videos.length,
        fotosUpload: uploadedFotos.length,
        videosUpload: uploadedVideos.length,
        enviadoParaStrapi: sucesso
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



// Função para enviar/atualizar imóvel no Strapi (versão corrigida)
async function enviarImovelParaStrapiCorrigido(imovelData, originalId) {
    try {
      console.log(`   📤 [EASYPANEL-LOG] Enviando imóvel "${imovelData.titulo}" para o Strapi...`);
      console.log(`   📋 [EASYPANEL-LOG] Dados do imóvel:`);
      console.log(`      - Título: ${imovelData.titulo}`);
      console.log(`      - Tipo: ${imovelData.tipo}`);
      console.log(`      - Preço: R$ ${imovelData.preco}`);
      console.log(`      - Cidade: ${imovelData.cidade}`);
      console.log(`      - Status: ${imovelData.status}`);
      
      // Processar fotos
      const uploadedFotos = [];
      if (imovelData.fotos && imovelData.fotos.length > 0) {
        console.log(`   📸 [EASYPANEL-LOG] Processando ${imovelData.fotos.length} fotos...`);
        for (let i = 0; i < imovelData.fotos.length; i++) {
          const foto = imovelData.fotos[i];
          console.log(`   📋 [EASYPANEL-LOG] Foto ${i+1}: ${foto}`);
          const localPath = getFilePathFromUrl(foto);
          console.log(`   📁 [EASYPANEL-LOG] Caminho local: ${localPath}`);
          if (localPath) {
            console.log(`   📤 [EASYPANEL-LOG] Iniciando upload da foto ${i+1}: ${path.basename(localPath)}`);
            try {
              const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
              if (fileId) {
                uploadedFotos.push(fileId);
                console.log(`   ✅ [EASYPANEL-LOG] Foto ${i+1} enviada com sucesso (ID: ${fileId})`);
              } else {
                console.log(`   ⚠️ [EASYPANEL-LOG] Falha no upload da foto ${i+1} - continuando com próxima foto`);
              }
            } catch (error) {
              console.log(`   ⚠️ [EASYPANEL-LOG] Erro no upload da foto ${i+1}: ${error.message}`);
              console.log(`   📋 [EASYPANEL-LOG] Continuando processamento das demais fotos...`);
              // Continua o loop mesmo com erro na foto
            }
          } else {
            console.log(`   ⚠️ [EASYPANEL-LOG] Caminho local não encontrado para: ${foto}`);
          }
        }
      }

      // Processar vídeos
      const uploadedVideos = [];
      if (imovelData.videos && imovelData.videos.length > 0) {
        console.log(`   🎥 [EASYPANEL-LOG] Processando ${imovelData.videos.length} vídeos...`);
        for (let i = 0; i < imovelData.videos.length; i++) {
          const video = imovelData.videos[i];
          console.log(`   📋 [EASYPANEL-LOG] Vídeo ${i+1}: ${video}`);
          const localPath = getFilePathFromUrl(video);
          console.log(`   📁 [EASYPANEL-LOG] Caminho local: ${localPath}`);
          if (localPath) {
            console.log(`   📤 [EASYPANEL-LOG] Iniciando upload do vídeo ${i+1}: ${path.basename(localPath)}`);
            try {
              const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
              if (fileId) {
                uploadedVideos.push(fileId);
                console.log(`   ✅ [EASYPANEL-LOG] Vídeo ${i+1} enviado com sucesso (ID: ${fileId})`);
              } else {
                console.log(`   ⚠️ [EASYPANEL-LOG] Falha no upload do vídeo ${i+1} - continuando com próximo vídeo`);
              }
            } catch (error) {
              console.log(`   ⚠️ [EASYPANEL-LOG] Erro no upload do vídeo ${i+1}: ${error.message}`);
              console.log(`   📋 [EASYPANEL-LOG] Continuando processamento dos demais vídeos...`);
              // Continua o loop mesmo com erro no vídeo
            }
          } else {
            console.log(`   ⚠️ [EASYPANEL-LOG] Caminho local não encontrado para: ${video}`);
          }
        }
      }
      
      const url = new URL(STRAPI_URL);
      
      return new Promise((resolve) => {
        // Verificar se o imóvel já existe no Strapi pelo id_integracao
        const checkOptions = {
          hostname: url.hostname,
          port: url.port || 443,
          path: `/imoveis?id_integracao=${encodeURIComponent(originalId || imovelData.id)}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        console.log(`🔍 Verificando se imóvel já existe no Strapi pelo id_integracao: ${originalId || imovelData.id}`);

        const checkReq = https.request(checkOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const checkResponse = JSON.parse(data);
              console.log(`📊 Resposta da verificação:`, JSON.stringify(checkResponse, null, 2));
              
              // Strapi retorna um objeto com propriedade 'data' contendo os resultados
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

              // Preparar dados com uploads
              const imovelParaStrapi = {
                title: imovelData.titulo || 'Sem título',
                description: imovelData.descricao || 'Sem descrição',
                price: parseFloat(imovelData.preco) || 0,
                tipo_contrato: imovelData.finalidade || imovelData.tipo_contrato || 'venda',
                tipo_imovel: imovelData.tipo || 'outros',
                active: imovelData.status === 'disponivel',
                bairro: imovelData.bairro || '',
                cidade: imovelData.cidade || '',
                estado: imovelData.estado || '',
                endereco: imovelData.endereco || '',
                cep: imovelData.cep || '',
                area_total: parseFloat(imovelData.area_total) || 0,
                area_construida: parseFloat(imovelData.area_construida) || 0,
                quartos: parseInt(imovelData.quartos) || 0,
                banheiros: parseInt(imovelData.banheiros) || 0,
                vagas_garagem: parseInt(imovelData.vagas_garagem) || 0,
                latitude: parseFloat(imovelData.latitude) || null,
                longitude: parseFloat(imovelData.longitude) || null,
                caracteristicas: imovelData.caracteristicas || '',
                tipologia: (() => {
                  const caracteristicas = [];
                  console.log(`🔍 DEBUG Tipologia Envio - area_construida: ${imovelData.area_construida} (tipo: ${typeof imovelData.area_construida})`);
                  console.log(`🔍 DEBUG Tipologia Envio - area_total: ${imovelData.area_total} (tipo: ${typeof imovelData.area_total})`);
                  if (imovelData.area_construida && imovelData.area_construida !== 0) caracteristicas.push(`area_construida ${String(imovelData.area_construida)}`);
                  if (imovelData.area_total && imovelData.area_total !== 0) caracteristicas.push(`area_total ${String(imovelData.area_total)}`);
                  if (imovelData.banheiros && imovelData.banheiros !== 0) caracteristicas.push(`banheiros ${String(imovelData.banheiros)}`);
                  if (imovelData.quartos && imovelData.quartos !== 0) caracteristicas.push(`quartos ${String(imovelData.quartos)}`);
                  if (imovelData.vagas_garagem && imovelData.vagas_garagem !== 0) caracteristicas.push(`vagas_garagem ${String(imovelData.vagas_garagem)}`);
                  const resultado = caracteristicas.join(', ');
                  console.log(`🔍 DEBUG Tipologia Envio final: ${resultado}`);
                  return resultado;
                })(),
                codigo: imovelData.codigo || imovelData.id,
                url: `https://coopcorretores.com.br/imoveis/${originalId || imovelData.id}`,
                id_integracao: originalId || imovelData.id,
                images: uploadedFotos,
                videos: uploadedVideos
              };

              const payload = JSON.stringify(imovelParaStrapi);
              console.log(`📤 Enviando imóvel para Strapi:`);
              console.log(JSON.stringify(imovelParaStrapi, null, 2));
              
              const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: path,
                method: method,
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload)
                }
              };
              


              console.log(`🔗 [EASYPANEL-LOG] Enviando para: ${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}${path}`);
              console.log(`📊 [EASYPANEL-LOG] Método: ${method}`);
              
              const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                  console.log(`📊 [EASYPANEL-LOG] Status da resposta do imóvel: ${res.statusCode}`);
                  console.log(`📊 [EASYPANEL-LOG] Headers da resposta:`, JSON.stringify(res.headers, null, 2));
                  console.log(`📊 [EASYPANEL-LOG] Resposta completa:`, responseData);
                  
                  try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode === 200 || res.statusCode === 201) {
                      console.log(`   ✅ [EASYPANEL-LOG] Imóvel enviado com sucesso! ID: ${parsed.id || parsed.data?.id}`);
                      resolve(true);
                    } else {
                      console.log(`   ❌ [EASYPANEL-LOG] Erro ao enviar imóvel: Status ${res.statusCode}`);
                      console.log(`   ❌ [EASYPANEL-LOG] Detalhes do erro:`, JSON.stringify(parsed, null, 2));
                      resolve(false);
                    }
                  } catch (e) {
                      console.log(`   ❌ [EASYPANEL-LOG] Erro ao parsear resposta: ${e.message}`);
                      console.log(`   ❌ [EASYPANEL-LOG] Resposta bruta: ${responseData}`);
                      resolve(false);
                    }
                });
              });

              req.on('error', (error) => {
                console.log(`   ❌ Erro ao enviar imóvel para Strapi:`, error.message);
                resolve(false);
              });

              req.write(payload);
              req.end();
            } catch (e) {
              console.log(`   ❌ Erro ao verificar imóvel existente:`, e.message);
              resolve(false);
            }
          });
        });

        checkReq.on('error', (error) => {
          console.log(`   ❌ Erro ao verificar imóvel:`, error.message);
          resolve(false);
        });

        checkReq.end();
      });
    } catch (error) {
      console.log(`   ❌ Erro ao enviar imóvel para Strapi:`, error.message);
      return false;
    }
  }



// Função para buscar imóvel específico via API
async function getImovelFromAPI(imovelId) {
  try {
    // Usar URL correta baseada no ambiente
    const API_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
    console.log(`🔍 Buscando imóvel ID ${imovelId} na API pública: ${API_URL}/imoveis/${imovelId}`);
    const response = await axios.get(`${API_URL}/imoveis/${imovelId}`, {
      timeout: 60000, // Aumentado para 60 segundos
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status !== 200) {
      console.log(`❌ Imóvel com ID ${imovelId} não encontrado`);
      return null;
    }
    
    const imovel = response.data;
    console.log(`📋 Dados recebidos da API:`);
    console.log(`   - ID: ${imovel.id}`);
    console.log(`   - Código: ${imovel.codigo}`);
    console.log(`   - Título: ${imovel.titulo}`);
    console.log(`   - Descrição: ${imovel.descricao}`);
    console.log(`   - Tipo: ${imovel.tipo}`);
    console.log(`   - Status: ${imovel.status}`);
    console.log(`   - Preço: ${imovel.preco}`);
    console.log(`   - Área Total: ${imovel.area_total}`);
    console.log(`   - Área Construída: ${imovel.area_construida}`);
    console.log(`   - Quartos: ${imovel.quartos}`);
    console.log(`   - Banheiros: ${imovel.banheiros}`);
    console.log(`   - Vagas: ${imovel.vagas_garagem}`);
    console.log(`   - Endereço: ${imovel.endereco}`);
    console.log(`   - Bairro: ${imovel.bairro}`);
    console.log(`🔍 DEBUG - Todos os campos do objeto imovel:`, Object.keys(imovel));
    console.log(`🔍 DEBUG - Valores específicos:`);
    console.log(`   - imovel.area_construida: ${imovel.area_construida}`);
    console.log(`   - imovel.bairro: ${imovel.bairro}`);
    console.log(`   - Cidade: ${imovel.cidade}`);
    console.log(`   - Estado: ${imovel.estado}`);
    console.log(`   - CEP: ${imovel.cep}`);
    console.log(`   - Características: ${imovel.caracteristicas}`);
    console.log(`   - Fotos: ${imovel.fotos?.length || 0} (tipo: ${typeof imovel.fotos})`);
    console.log(`   - Vídeos: ${imovel.videos?.length || 0} (tipo: ${typeof imovel.videos})`);
    
    // Converter para o formato esperado pelo script
    return {
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
      fotos: Array.isArray(imovel.fotos) ? imovel.fotos.map(foto => typeof foto === 'string' ? foto : foto.url) : (typeof imovel.fotos === 'string' ? JSON.parse(imovel.fotos || '[]') : []),
      videos: Array.isArray(imovel.videos) ? imovel.videos.map(video => typeof video === 'string' ? video : video.url) : (typeof imovel.videos === 'string' ? JSON.parse(imovel.videos || '[]') : []),
      created_at: imovel.created_at,
      updated_at: imovel.updated_at
    };
  } catch (error) {
    console.error('Erro ao buscar imóvel via API:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 [EASYPANEL-LOG] Iniciando sincronização com Strapi v3.8');
  console.log(`🕐 [EASYPANEL-LOG] Timestamp: ${new Date().toISOString()}`);
  
  // Verificar se foi passado um ID específico de imóvel
  const args = process.argv.slice(2);
  const imovelIdArg = args.find(arg => arg.startsWith('--imovel-id='));
  const imovelId = imovelIdArg ? imovelIdArg.split('=')[1] : null;
  
  console.log(`🔗 [EASYPANEL-LOG] URL Strapi: ${STRAPI_URL}`);
  
  if (imovelId) {
    console.log(`🎯 [EASYPANEL-LOG] Sincronizando imóvel específico: ID ${imovelId}`);
  } else {
    console.log(`🔄 [EASYPANEL-LOG] Sincronizando todos os imóveis`);
  }
  
  // Verificar se as variáveis necessárias estão configuradas
  if (!STRAPI_URL || STRAPI_URL === 'https://whatsapp-strapi.xjueib.easypanel.host') {
    console.log('⚠️ [EASYPANEL-LOG] Atenção: Usando URL padrão do Strapi');
  }
  
  // Testar conexão
  const conectado = await testStrapiConnection();
  if (!conectado) {
    console.log('❌ [EASYPANEL-LOG] Não foi possível conectar ao Strapi. Verifique a URL e o token.');
    process.exit(1);
  }
  
  console.log('✅ [EASYPANEL-LOG] Conexão com Strapi estabelecida!');
  
  let imoveis = [];
  
  if (imovelId) {
    // Buscar dados reais do imóvel via API
    console.log(`🎯 Buscando dados reais do imóvel ID: ${imovelId}`);
    const imovelData = await getImovelFromAPI(imovelId);
    
    if (imovelData) {
      imoveis = [imovelData];
      console.log(`✅ Dados do imóvel carregados com sucesso!`);
    } else {
      console.log(`❌ Não foi possível carregar os dados do imóvel ${imovelId}`);
      console.log(`🎯 Usando dados de exemplo como fallback`);
      imoveis = [{
        id: imovelId,
        codigo: `COD-${imovelId.substring(0, 8)}`,
        titulo: 'Casa Teste (Fallback)',
        descricao: 'Casa de teste para sincronização - dados de fallback',
        tipo: 'casa',
        status: 'disponivel',
        preco: 250000,
        area_total: 200,
        area_util: 180,
        quartos: 3,
        banheiros: 2,
        vagas_garagem: 2,
        endereco: 'Rua Teste, 123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '00000-000',
        latitude: -23.5505,
        longitude: -46.6333,
        caracteristicas: 'Casa teste com características especiais',
        fotos: [
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
        ],
        videos: []
      }];
    }
  } else {
    // Buscar todos os imóveis da API
    console.log('🔄 [EASYPANEL-LOG] Sincronizando todos os imóveis da base de dados...');
    const todosImoveis = await getAllImoveisFromAPI();
    
    if (todosImoveis.length === 0) {
      console.log('❌ [EASYPANEL-LOG] Nenhum imóvel encontrado na API');
      return;
    }
    
    imoveis = todosImoveis;
    console.log(`✅ [EASYPANEL-LOG] ${imoveis.length} imóveis carregados da API!`);
  }
  
  if (imoveis.length === 0) {
    console.log('⚠️  Nenhum imóvel encontrado para sincronizar');
    return;
  }
  
  console.log(`📊 [EASYPANEL-LOG] Total de imóveis para processar: ${imoveis.length}`);
  
  const resultados = [];
  let sucessos = 0;
  let erros = 0;
  
  for (let i = 0; i < imoveis.length; i++) {
    const imovel = imoveis[i];
    console.log(`\n🔄 [EASYPANEL-LOG] Processando imóvel ${i + 1}/${imoveis.length} - ID: ${imovel.id}`);
    
    try {
      console.log(`📋 [EASYPANEL-LOG] Dados do imóvel:`);
      console.log(`   - Título: ${imovel.titulo || 'Sem título'}`);
      console.log(`   - Tipo: ${imovel.tipo || 'N/A'}`);
      console.log(`   - Preço: R$ ${imovel.preco || '0.00'}`);
      console.log(`   - Cidade: ${imovel.cidade || 'N/A'}`);
      console.log(`   - Status: ${imovel.status || 'N/A'}`);
      console.log(`   - Fotos: ${imovel.fotos ? imovel.fotos.length : 0}`);
      console.log(`   - Vídeos: ${imovel.videos ? imovel.videos.length : 0}`);
      
      const resultado = await enviarImovelParaStrapiCorrigido(imovel, imovel.id);
      
      if (resultado) {
        sucessos++;
        console.log(`✅ [EASYPANEL-LOG] Sucesso: Imóvel ${imovel.id} sincronizado (${sucessos}/${imoveis.length})`);
        resultados.push({
          status: 'processado',
          titulo: imovel.titulo,
          fotosUpload: imovel.fotos ? imovel.fotos.length : 0,
          videosUpload: imovel.videos ? imovel.videos.length : 0
        });
      } else {
        erros++;
        console.log(`❌ [EASYPANEL-LOG] Erro: Falha ao sincronizar imóvel ${imovel.id} (${erros} erros)`);
        resultados.push({
          status: 'erro',
          titulo: imovel.titulo,
          fotosUpload: 0,
          videosUpload: 0
        });
      }
      
    } catch (error) {
      erros++;
      console.log(`❌ [EASYPANEL-LOG] Erro ao processar imóvel ${imovel.id}: ${error.message}`);
      console.log(`❌ [EASYPANEL-LOG] Stack trace: ${error.stack}`);
      resultados.push({
        status: 'erro',
        titulo: imovel.titulo || 'Sem título',
        fotosUpload: 0,
        videosUpload: 0,
        error: error.message
      });
    }
    
    // Pequena pausa entre processamentos para evitar sobrecarga
    if (i < imoveis.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n✅ [EASYPANEL-LOG] Sincronização concluída!');
  console.log(`📊 [EASYPANEL-LOG] Processados com sucesso: ${sucessos}`);
  console.log(`❌ [EASYPANEL-LOG] Erros encontrados: ${erros}`);
  console.log(`📊 [EASYPANEL-LOG] Total processado: ${resultados.length}`);
  
  if (erros > 0) {
    console.log('\n❌ [EASYPANEL-LOG] Imóveis com erro:');
    resultados.filter(r => r.status === 'erro').forEach(r => {
      console.log(`   - ${r.titulo}: ${r.error || 'Erro desconhecido'}`);
    });
  }
  
  // Mostrar resumo detalhado
  const comUpload = resultados.filter(r => r.fotosUpload > 0 || r.videosUpload > 0);
  if (comUpload.length > 0) {
    console.log('\n📸 [EASYPANEL-LOG] Uploads realizados:');
    comUpload.forEach(r => {
      console.log(`   ${r.titulo}: ${r.fotosUpload} fotos, ${r.videosUpload} vídeos`);
    });
  }
  
  console.log(`\n🏁 [EASYPANEL-LOG] Processo finalizado - ${new Date().toISOString()}`);

}

// Executar a sincronização
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  uploadFileToStrapi,
  enviarImovelParaStrapiCorrigido,
  testStrapiConnection
};