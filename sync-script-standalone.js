#!/usr/bin/env node
/**
 * Script de sincronização corrigido para Strapi v3.8
 * 
 * Uso: node sync-script-standalone.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configurações
const STRAPI_URL = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const PORT = process.env.PORT || 4005;

// Log das configurações
console.log('🔧 Configurações de sincronização:');
console.log(`🔗 STRAPI_URL: ${STRAPI_URL}`);
console.log(`🔑 STRAPI_API_TOKEN: ${STRAPI_API_TOKEN ? 'Configurado' : 'Não configurado'}`);

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

// Função para upload de arquivos usando https nativo
async function uploadFileToStrapi(filePath, filename) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Arquivo não encontrado: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath);
    const boundary = '----formdata-' + Math.random().toString(36);
    
    let body = [];
    body.push(Buffer.from(`--${boundary}\r\n`));
    body.push(Buffer.from(`Content-Disposition: form-data; name="files"; filename="${filename}"\r\n`));
    body.push(Buffer.from(`Content-Type: ${getContentType(filename)}\r\n\r\n`));
    body.push(fileContent);
    body.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    
    const bodyBuffer = Buffer.concat(body);
    const url = new URL(STRAPI_URL);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
         // 'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (res.statusCode === 200 && parsedData[0]) {
              console.log(`   ✅ Arquivo enviado: ${filename} (ID: ${parsedData[0].id})`);
              resolve(parsedData[0].id);
            } else {
              console.log(`   ❌ Erro ao enviar arquivo: ${filename} (Status: ${res.statusCode})`, parsedData);
              resolve(null);
            }
          } catch (e) {
            console.log(`   ❌ Erro ao processar resposta: ${e.message}`);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ Erro de rede ao enviar ${filename}:`, error.message);
        resolve(null);
      });

      req.write(bodyBuffer);
      req.end();
    });
  } catch (error) {
    console.log(`   ❌ Erro ao processar arquivo ${filename}:`, error.message);
    return null;
  }
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

// Função para testar conexão com Strapi usando https nativo
async function testStrapiConnection() {
  return new Promise((resolve) => {
    const url = new URL(STRAPI_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/imoveis',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
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
          'Authorization': `Bearer ${STRAPI_API_TOKEN}`
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

// Função principal
async function main() {
  console.log('🚀 Iniciando sincronização com Strapi v3.8');
  
  if (!await testStrapiConnection()) {
    console.log('❌ Conexão com Strapi falhou. Verifique URL e token.');
    process.exit(1);
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
          const localPath = getLocalPathFromUrl(fotoUrl);
          
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
          const localPath = getLocalPathFromUrl(videoUrl);
          
          if (localPath) {
            console.log(`   📤 Fazendo upload do vídeo ${i+1}: ${path.basename(localPath)}`);
            const fileId = await uploadFileToStrapi(localPath, path.basename(localPath));
            if (fileId) {
              uploadedVideos.push(fileId);
            }
          } else {
            console.log(`   ⚠️  Caminho local não encontrado para: ${videoUrl}`);
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
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`
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

              const payload = JSON.stringify(imovelData);
              const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: path,
                method: method,
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload),
                  'Authorization': `Bearer ${STRAPI_API_TOKEN}`
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
          "/uploads/imoveis/casa1.jpg",
          "/uploads/imoveis/casa2.jpg"
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
          "/uploads/imoveis/apto1.jpg"
        ],
        videos: [
          "/uploads/imoveis/tour-apto.mp4"
        ]
      }
    ];
  }

  // Função principal corrigida
  console.log('🚀 Iniciando sincronização de imóveis...');
  console.log(`🔗 URL Strapi: ${STRAPI_URL}`);
  
  // Verificar se as variáveis necessárias estão configuradas
  if (!STRAPI_URL || STRAPI_URL === 'https://whatsapp-strapi.xjueib.easypanel.host') {
    console.log('⚠️  Atenção: Usando URL padrão do Strapi');
  }
  
  if (!STRAPI_API_TOKEN) {
    console.log('⚠️  Atenção: STRAPI_API_TOKEN não configurado - uploads podem falhar');
  }
  
  // Testar conexão
  const conectado = await testStrapiConnection();
  if (!conectado) {
    console.log('❌ Não foi possível conectar ao Strapi. Verifique a URL e o token.');
    return;
  }
  
  console.log('✅ Conexão com Strapi estabelecida!');
  
  // Buscar imóveis (use a função de exemplo ou substitua por sua fonte de dados)
  const imoveis = getImoveisExemplo(); // Substitua por sua lógica de busca
  
  if (imoveis.length === 0) {
    console.log('⚠️  Nenhum imóvel encontrado para sincronizar');
    return;
  }
  
  console.log(`📊 Total de imóveis para processar: ${imoveis.length}`);
  
  const resultados = [];
  for (const imovel of imoveis) {
    const resultado = await syncSingleImovelCorrigido(imovel);
    resultados.push(resultado);
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
  syncSingleImovel,
  syncSingleImovelCorrigido,
  testStrapiConnection
};