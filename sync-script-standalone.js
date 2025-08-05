#!/usr/bin/env node
/**
 * Script de sincronização corrigido para Strapi v3.8
 * 
 * Uso: node sync-script-standalone.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const FormData = require('form-data');
const { URL } = require('url');

// Configurações
const STRAPI_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const PORT = process.env.PORT || 4000;

// Log das configurações
console.log('🔧 Configurações de sincronização:');
console.log(`🔗 STRAPI_URL: ${STRAPI_URL}`);
console.log(`🔓 Upload público - token não necessário`);

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
async function uploadFileToStrapi(filePathOrUrl, filename) {
  try {
    let fileStream;
    let fileSize;
    
    // Verifica se é uma URL ou caminho local
    if (filePathOrUrl.startsWith('http') || filePathOrUrl.startsWith('/uploads/')) {
      // É uma URL - faz stream direto do servidor web
      const fullUrl = filePathOrUrl.startsWith('/') ? 
        `https://coopcorretores.com.br${filePathOrUrl}` : filePathOrUrl;
      
      console.log(`   🌐 Fazendo stream da URL: ${fullUrl}`);
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        responseType: 'stream',
        timeout: 60000
      });
      
      fileStream = response.data;
      fileSize = response.headers['content-length'];
    } else {
      // É um caminho local
      if (!fs.existsSync(filePathOrUrl)) {
        console.log(`   ❌ Arquivo não encontrado: ${filePathOrUrl}`);
        return null;
      }
      fileStream = fs.createReadStream(filePathOrUrl);
      const stats = fs.statSync(filePathOrUrl);
      fileSize = stats.size;
    }

    console.log(`   📁 Preparando upload: ${filename} (${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'tamanho desconhecido'})`);

    // Preparar FormData
    const form = new FormData();
    form.append('files', fileStream, filename);

    console.log(`   📤 Enviando ${filename}...`);

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
    console.log(`   📊 Status da resposta: ${response.status}`);
    console.log(`   📊 Content-Type: ${response.headers['content-type']}`);
    
    // Verificar se a resposta é JSON
    if (typeof response.data === 'string') {
      console.log(`   ⚠️ Resposta é string, não JSON: ${response.data.substring(0, 200)}`);
      try {
        const parsedData = JSON.parse(response.data);
        response.data = parsedData;
      } catch (parseError) {
        console.log(`   ❌ Erro ao processar resposta JSON: ${parseError.message}`);
        return null;
      }
    }
    
    // Processar resposta (igual ao upload-sem-token.js)
    if (response.data && response.data[0]) {
      const file = response.data[0];
      console.log(`   ✅ Upload realizado: ${filename} (ID: ${file.id})`);
      return file.id;
    } else {
      console.log(`   ❌ Resposta inválida do servidor`);
      console.log(`   📄 Dados recebidos: ${JSON.stringify(response.data)}`);
      return null;
    }

  } catch (error) {
    console.log(`   ❌ Erro ao fazer upload de ${filename}:`);
    
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
      console.log(`   📊 Headers: ${JSON.stringify(error.response.headers)}`);
      
      // Log da resposta bruta para debug
      if (typeof error.response.data === 'string') {
        console.log(`   📄 Resposta bruta (primeiros 500 chars): ${error.response.data.substring(0, 500)}`);
      } else {
        console.log(`   📄 Erro: ${error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data)}`);
      }
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.log(`   💡 O upload parece exigir autenticação.`);
      } else if (error.response.status === 413) {
        console.log(`   💡 Arquivo muito grande. Verifique o limite de upload.`);
      } else if (error.response.status === 404) {
        console.log(`   💡 Endpoint de upload não encontrado. Verificar URL.`);
      } else if (error.response.status === 405) {
        console.log(`   💡 Método não permitido. Verificar endpoint.`);
      }
    } else if (error.code === 'ENOTFOUND') {
      console.log(`   🔍 Domínio não encontrado`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`   🔌 Conexão recusada`);
    } else {
      console.log(`   ❗ Erro: ${error.message}`);
    }
    
    return null;
  }
}

// Função para processar URL de arquivo (retorna URL para stream direto)
function getFilePathFromUrl(url) {
  console.log(`   🔍 Processando URL: ${url}`);
  
  // Para URLs completas, retorna como está
  if (url.startsWith('https://coopcorretores.com.br/')) {
    console.log(`   🌐 URL completa detectada`);
    return url;
  }
  
  // Para caminhos que começam com /, retorna como está (será processado no upload)
  if (url.startsWith('/')) {
    console.log(`   📂 Caminho relativo detectado`);
    return url;
  }
  
  // Para nomes de arquivo simples, constrói o caminho completo
  if (!url.startsWith('http')) {
    const fullPath = `/uploads/imoveis/${url}`;
    console.log(`   📁 Construindo caminho: ${fullPath}`);
    return fullPath;
  }
  
  console.log(`   ⚠️  URL não reconhecida: ${url}`);
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
        tipo_imovel: imovel.tipo_imovel || 'casa',
        active: true,
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        tipologia: imovel.tipologia,
        images: uploadedFotos
      }
    };

    // Enviar para o Strapi
    const response = await new Promise((resolve, reject) => {
      const url = new URL(STRAPI_URL);
      const data = JSON.stringify(imovelData);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/imoveis',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
         // 'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode === 200) {
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
      req.write(data);
      req.end();
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
          const localPath = getFilePathFromUrl(fotoUrl);
          
          if (localPath) {
            console.log(`   📤 Fazendo upload da foto ${i+1}: ${path.basename(localPath)}`);
            const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
            if (fileId) {
              uploadedFotos.push(fileId);
            }
          } else {
            console.log(`   ⚠️  Caminho local não encontrado para: ${fotoUrl}`);
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
        codigo: imovelData.codigo || imovelData.id?.toString() || 'sem-codigo'
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
      console.log(`   📤 Enviando imóvel "${imovelData.titulo}" para o Strapi...`);
      
      // Processar fotos
      const uploadedFotos = [];
      if (imovelData.fotos && imovelData.fotos.length > 0) {
        console.log(`   📸 Processando ${imovelData.fotos.length} fotos...`);
        for (let i = 0; i < imovelData.fotos.length; i++) {
          const foto = imovelData.fotos[i];
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

      // Processar vídeos
      const uploadedVideos = [];
      if (imovelData.videos && imovelData.videos.length > 0) {
        console.log(`   🎥 Processando ${imovelData.videos.length} vídeos...`);
        for (let i = 0; i < imovelData.videos.length; i++) {
          const video = imovelData.videos[i];
          console.log(`   📋 Vídeo ${i+1}: ${video}`);
          const localPath = getFilePathFromUrl(video);
          console.log(`   📁 Caminho local: ${localPath}`);
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
            console.log(`   ⚠️  Caminho local não encontrado para: ${video}`);
          }
        }
      }
      
      const url = new URL(STRAPI_URL);
      
      return new Promise((resolve) => {
        // Verificar se o imóvel já existe no Strapi
        const checkOptions = {
          hostname: url.hostname,
          port: url.port || 443,
          path: `/imoveis?filters[codigo][$eq]=${encodeURIComponent(imovelData.codigo)}`,
          method: 'GET',
          headers: {
        'Content-Type': 'application/json',
        // Removido autenticação - acesso público permitido
      }
        };

        const checkReq = https.request(checkOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const checkResponse = JSON.parse(data);
              
              const method = (checkResponse && checkResponse.length > 0) ? 'PUT' : 'POST';
              const path = (checkResponse && checkResponse.length > 0) 
                ? `/imoveis/${checkResponse[0].id}` 
                 : '/imoveis';
              
              if (method === 'PUT') {
                console.log(`   🔄 Atualizando imóvel existente (ID: ${checkResponse[0].id})`);
              } else {
                console.log(`   ➕ Criando novo imóvel`);
              }

              // Preparar dados com uploads
              const imovelParaStrapi = {
                titulo: imovelData.titulo,
                description: imovelData.descricao,
                price: imovelData.preco,
                tipo_contrato: imovelData.tipo_contrato || 'venda',
                tipo_imovel: imovelData.tipo_imovel || 'casa',
                active: true,
                bairro: imovelData.bairro,
                cidade: imovelData.cidade,
                tipologia: imovelData.tipologia,
                codigo: imovelData.codigo,
                images: uploadedFotos,
                videos: uploadedVideos
              };

              const payload = JSON.stringify(imovelParaStrapi);
              const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: path,
                method: method,
                headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        // Removido autenticação - acesso público permitido
      }
              };

              const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                  try {
                    const parsed = JSON.parse(responseData);
                    if (res.statusCode === 200 || res.statusCode === 201) {
                      console.log(`   ✅ Imóvel enviado com sucesso! ID: ${parsed.id}`);
                      resolve(true);
                    } else {
                      console.log(`   ❌ Erro ao enviar imóvel: Status ${res.statusCode}`, parsed);
                      resolve(false);
                    }
                  } catch (e) {
                    console.log(`   ❌ Erro ao parsear resposta: ${e.message}`);
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

  // Função para simular dados de imóveis (exemplo)
  function getImoveisExemplo() {
    return [
      {
        id: 1,
        titulo: "Casa Moderna 3 Quartos",
        descricao: "Casa moderna com 3 quartos, 2 banheiros, garagem para 2 carros",
        preco: 450000,
        tipo: "casa",
        status: "disponivel",
        endereco: "Rua das Flores, 123",
        cidade: "São Paulo",
        estado: "SP",
        bairro: "Jardim Paulista",
        quartos: 3,
        banheiros: 2,
        vagas: 2,
        area: 180,
        destaque: true,
        codigo: "CASA001",
        fotos: [
          "/uploads/imoveis/0bcd5d82-7841-48f2-8f22-1fe1f5c135fd.jpg",
          "/uploads/imoveis/1ecfe490-3f51-45fd-96c9-eab96872fcd2.jpg"
        ],
        videos: []
      },
      {
        id: 2,
        titulo: "Apartamento Vista Mar",
        descricao: "Apartamento com vista para o mar, 2 quartos, varanda gourmet",
        preco: 320000,
        tipo: "apartamento",
        status: "disponivel",
        endereco: "Av. Beira Mar, 456",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        bairro: "Copacabana",
        quartos: 2,
        banheiros: 1,
        vagas: 1,
        area: 85,
        destaque: false,
        codigo: "APTO001",
        fotos: [
          "/uploads/imoveis/20448267-d369-4b2d-90a4-1b93b11e27a2.jpg"
        ],
        videos: [
          "/uploads/imoveis/videos/2acc98f7-9d97-421a-8122-3c58418d549e.mp4"
        ]
      }
    ];
  }

// Função principal
// Função para buscar imóvel específico via API
async function getImovelFromAPI(imovelId) {
  try {
    const API_URL = process.env.NEXTAUTH_URL || 'http://localhost:4000';
    const response = await axios.get(`${API_URL}/api/admin/imoveis/${imovelId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || ''}`
      },
      timeout: 10000
    });
    
    if (response.status !== 200) {
      console.log(`❌ Imóvel com ID ${imovelId} não encontrado`);
      return null;
    }
    
    const imovel = response.data;
    
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
      area_util: imovel.area_util,
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
      fotos: imovel.fotos?.map(foto => foto.url) || [],
      videos: imovel.videos?.map(video => video.url) || [],
      created_at: imovel.created_at,
      updated_at: imovel.updated_at
    };
  } catch (error) {
    console.error('Erro ao buscar imóvel via API:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando sincronização com Strapi v3.8');
  
  // Verificar se foi passado um ID específico de imóvel
  const args = process.argv.slice(2);
  const imovelIdArg = args.find(arg => arg.startsWith('--imovel-id='));
  const imovelId = imovelIdArg ? imovelIdArg.split('=')[1] : null;
  
  if (!await testStrapiConnection()) {
    console.log('❌ Conexão com Strapi falhou. Verifique URL e token.');
    process.exit(1);
  }

  console.log('🚀 Iniciando sincronização de imóveis...');
  console.log(`🔗 URL Strapi: ${STRAPI_URL}`);
  
  if (imovelId) {
    console.log(`🎯 Sincronizando imóvel específico: ID ${imovelId}`);
  }
  
  // Verificar se as variáveis necessárias estão configuradas
  if (!STRAPI_URL || STRAPI_URL === 'https://whatsapp-strapi.xjueib.easypanel.host') {
    console.log('⚠️  Atenção: Usando URL padrão do Strapi');
  }
  
  // Testar conexão
  const conectado = await testStrapiConnection();
  if (!conectado) {
    console.log('❌ Não foi possível conectar ao Strapi. Verifique a URL e o token.');
    return;
  }
  
  console.log('✅ Conexão com Strapi estabelecida!');
  
  let imoveis = [];
  
  if (imovelId) {
    // Buscar imóvel específico via API
    const imovel = await getImovelFromAPI(imovelId);
    if (imovel) {
      imoveis = [imovel];
    }
  } else {
    // Buscar todos os imóveis (use a função de exemplo ou substitua por sua fonte de dados)
    imoveis = getImoveisExemplo(); // Substitua por sua lógica de busca
  }
  
  if (imoveis.length === 0) {
    console.log('⚠️  Nenhum imóvel encontrado para sincronizar');
    return;
  }
  
  console.log(`📊 Total de imóveis para processar: ${imoveis.length}`);
  
  const resultados = [];
  for (const imovel of imoveis) {
    const resultado = await enviarImovelParaStrapiCorrigido(imovel, imovel.id);
    resultados.push({
      status: resultado ? 'processado' : 'erro',
      titulo: imovel.titulo,
      fotosUpload: imovel.fotos ? imovel.fotos.length : 0,
      videosUpload: imovel.videos ? imovel.videos.length : 0
    });
  }
  
  console.log('\n✅ Sincronização concluída!');
  console.log(`📊 Processados: ${resultados.filter(r => r.status === 'processado').length}`);
  console.log(`❌ Erros: ${resultados.filter(r => r.status === 'erro').length}`);
  
  // Mostrar resumo detalhado
  const comUpload = resultados.filter(r => r.fotosUpload > 0 || r.videosUpload > 0);
  if (comUpload.length > 0) {
    console.log('\n📸 Uploads realizados:');
    comUpload.forEach(r => {
      console.log(`   ${r.titulo}: ${r.fotosUpload} fotos, ${r.videosUpload} vídeos`);
    });
  }

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