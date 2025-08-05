#!/usr/bin/env node
/**
 * Script de sincronização completa com Strapi
 * 
 * Uso: node sync-script.js
 * Ou: npm run sync:all
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { URL } = require('url');
require('dotenv').config();

// Carregar variáveis de ambiente
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^"|"$/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

// Configurações
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

// Funções auxiliares
async function fetchWithHttps(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function uploadFileToStrapi(filePath, filename) {
  try {
    console.log(`   📤 Enviando arquivo: ${filename}...`);
    
    // Verificar se o arquivo existe localmente
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Arquivo não encontrado: ${filePath}`);
      return null;
    }

    const form = new FormData();
    form.append('files', fs.createReadStream(filePath), filename);

    const url = new URL(STRAPI_URL);
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || 443,
      path: '/upload',
      headers: {
        ...form.getHeaders()
        // Sem autenticação para perfil público
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200 && parsed[0]) {
              console.log(`   ✅ Arquivo enviado: ${filename} (ID: ${parsed[0].id})`);
              resolve(parsed[0].id);
            } else {
              console.log(`   ❌ Erro no upload: ${res.statusCode}`, parsed);
              resolve(null);
            }
          } catch (e) {
            console.log(`   ❌ Erro ao processar resposta JSON: ${e.message}`);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ Erro de rede ao enviar ${filename}:`, error.message);
        resolve(null);
      });

      form.pipe(req);
    });
  } catch (error) {
    console.log(`   ❌ Erro ao processar arquivo ${filename}:`, error.message);
    return null;
  }
}

function getLocalPathFromUrl(url) {
  // Converter URL para caminho local
  if (url.startsWith('https://coopcorretores.com.br/')) {
    const relativePath = url.replace('https://coopcorretores.com.br/', '');
    return path.join(__dirname, 'public', relativePath);
  }
  
  if (url.startsWith('/')) {
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return path.join(__dirname, 'public', cleanUrl);
  }
  
  // Se for um caminho relativo simples (apenas nome do arquivo)
  if (!url.startsWith('http')) {
    return path.join(__dirname, 'public', 'uploads', 'imoveis', url);
  }
  
  return null;
}

async function getAllImoveisFromStrapi() {
  try {
    console.log('🔄 Buscando imóveis do Strapi...');
    const response = await fetchWithHttps(`${STRAPI_URL}/imoveis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      let imoveis = [];
      const responseData = response.data;
      
      if (Array.isArray(responseData?.data)) {
        imoveis = responseData.data;
      } else if (Array.isArray(responseData)) {
        imoveis = responseData;
      } else if (responseData?.data && typeof responseData.data === 'object') {
        // Caso seja um único objeto
        imoveis = [responseData.data];
      }
      
      console.log(`✅ Encontrados ${imoveis.length} imóveis no Strapi`);
      return imoveis;
    } else {
      console.log('❌ Erro ao buscar imóveis do Strapi:', response.status);
      console.log('📄 Resposta:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Erro de conexão com Strapi:', error.message);
    return [];
  }
}

async function syncSingleImovel(imovelData) {
  try {
    console.log(`\n📋 Processando imóvel ${imovelData.id}: ${imovelData.titulo}`);
    
    // Processar fotos e vídeos do JSON
    let fotos = [];
    let videos = [];
    
    try {
      if (imovelData.fotos) {
        fotos = typeof imovelData.fotos === 'string' ? JSON.parse(imovelData.fotos) : imovelData.fotos;
      }
    } catch (e) {
      console.log(`   ⚠️  Erro ao processar fotos: ${e.message}`);
      fotos = [];
    }
    
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



    // Processar fotos e vídeos - upload para Strapi
    console.log(`   📸 Processando ${fotos.length} fotos...`);
    const uploadedFotos = [];
    for (const foto of fotos) {
      let fileId = null;
      
      if (foto.startsWith('http')) {
        // Se for URL externa, manter como está
        fileId = foto;
      } else {
        // Se for caminho local, fazer upload
        const localPath = getLocalPathFromUrl(foto);
        if (localPath) {
          const filename = path.basename(foto);
          fileId = await uploadFileToStrapi(localPath, filename);
        } else {
          // Se não conseguir determinar caminho local, manter URL
          fileId = foto.startsWith('/') ? `https://coopcorretores.com.br${foto}` : foto;
        }
      }
      
      if (fileId) {
        uploadedFotos.push(fileId);
      } else {
        // Fallback para URL original se upload falhar
        uploadedFotos.push(foto.startsWith('/') ? `https://coopcorretores.com.br${foto}` : foto);
      }
    }

    console.log(`   🎥 Processando ${videos.length} vídeos...`);
    const uploadedVideos = [];
    for (const video of videos) {
      let fileId = null;
      
      if (video.startsWith('http')) {
        // Se for URL externa, manter como está
        fileId = video;
      } else {
        // Se for caminho local, fazer upload
        const localPath = getLocalPathFromUrl(video);
        if (localPath) {
          const filename = path.basename(video);
          fileId = await uploadFileToStrapi(localPath, filename);
        } else {
          // Se não conseguir determinar caminho local, manter URL
          fileId = video.startsWith('/') ? `https://coopcorretores.com.br${video}` : video;
        }
      }
      
      if (fileId) {
        uploadedVideos.push(fileId);
      } else {
        // Fallback para URL original se upload falhar
        uploadedVideos.push(video.startsWith('/') ? `https://coopcorretores.com.br${video}` : video);
      }
    }

    // Preparar dados para sincronização
    const tipologia = [
      imovelData.banheiros ? `${imovelData.banheiros} banheiros` : '',
      imovelData.quartos ? `${imovelData.quartos} quartos` : ''
    ].filter(Boolean).join(', ');

    // Construir URL pública do imóvel usando ID local
    const publicUrl = `https://coopcorretores.com.br/imoveis/${imovelData.id}`;
    
    // Preparar payload no formato Strapi v4 - versão simplificada
    const payload = {
      data: {
        title: String(imovelData.titulo || 'Imóvel sem título').substring(0, 255),
        description: String(imovelData.descricao || '').substring(0, 2000),
        price: Number(imovelData.preco) || 0,
        tipo_contrato: String(imovelData.finalidade || 'venda').substring(0, 50),
        tipo_imovel: String(imovelData.tipo || 'apartamento').substring(0, 50),
        active: Boolean(imovelData.ativo),
        bairro: String(imovelData.bairro || '').substring(0, 100),
        cidade: String(imovelData.cidade || '').substring(0, 100),
        tipologia: String(tipologia).substring(0, 255),
        url: String(publicUrl).substring(0, 500),
        id_integracao: String(imovelData.id).substring(0, 100)
      }
    };

    // Verificar se já existe no Strapi (modo público)
    console.log(`   🔍 Verificando se imóvel ${imovelData.id} já existe no Strapi...`);
    const existingResponse = await fetchWithHttps(`${STRAPI_URL}/imoveis?filters[id_integracao][$eq]=${encodeURIComponent(imovelData.id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Sem autenticação para perfil público
      }
    });

    const responseData = existingResponse.data;
    let allImoveis = [];
    
    if (Array.isArray(responseData?.data)) {
      allImoveis = responseData.data;
    } else if (Array.isArray(responseData)) {
      allImoveis = responseData;
    } else if (responseData?.data && typeof responseData.data === 'object') {
      // Caso a resposta seja um objeto único, transformar em array
      allImoveis = [responseData.data];
    }
    
    const existing = allImoveis.filter(imovel => imovel && (imovel.attributes?.id_integracao === imovelData.id || imovel.id_integracao === imovelData.id));
    console.log(`   📊 Encontrados ${existing.length} imóveis com id_integracao=${imovelData.id}`);

    if (existing.length > 0) {
      // Atualizar existente
      const strapiId = existing[0].id;
      console.log(`   🔄 Atualizando imóvel ${imovelData.id} no Strapi (ID: ${strapiId})...`);
      
      // Manter URL com ID local (não alterar para ID do Strapi)
      payload.url = `https://coopcorretores.com.br/imoveis/${imovelData.id}`;
      
      console.log(`   📤 Enviando PUT para: ${STRAPI_URL}/imoveis/${strapiId}`);
      console.log(`   📦 Payload:`, JSON.stringify({ data: payload.data }, null, 2));
      
      const updateResponse = await fetchWithHttps(`${STRAPI_URL}/imoveis/${strapiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ data: payload.data })
      });

      if (updateResponse.status === 200) {
        console.log(`   ✅ Imóvel ${imovelData.id} atualizado com sucesso`);
        return { success: true, action: 'update', id: imovelData.id };
      } else {
        console.log(`   ❌ Erro ao atualizar imóvel ${imovelData.id}: Status ${updateResponse.status}`);
        console.log(`   📄 Resposta:`, updateResponse.data);
        return { success: false, error: `Status ${updateResponse.status}`, id: imovelData.id };
      }
    } else {
      // Criar novo
      console.log(`   ➕ Criando imóvel ${imovelData.id} no Strapi...`);
      console.log(`   📤 Enviando POST para: ${STRAPI_URL}/imoveis`);
      console.log(`   📦 Payload:`, JSON.stringify({ data: payload.data }, null, 2));
      
      const createResponse = await fetchWithHttps(`${STRAPI_URL}/imoveis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ data: payload.data })
      });

      if (createResponse.status === 200 || createResponse.status === 201) {
        const newStrapiId = createResponse.data?.id;
        if (newStrapiId) {
          // Não alterar a URL - manter com ID local
          const updatedPayload = { ...payload };
          await fetchWithHttps(`${STRAPI_URL}/api/imoveis/${newStrapiId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ data: updatedPayload.data })
          });
        }
        console.log(`   ✅ Imóvel ${imovelData.id} criado com sucesso`);
        return { success: true, action: 'create', id: imovelData.id };
      } else {
        console.log(`   ❌ Erro ao criar imóvel ${imovelData.id}: Status ${createResponse.status}`);
        console.log(`   📄 Resposta:`, createResponse.data);
        return { success: false, error: `Status ${createResponse.status}`, id: imovelData.id };
      }
    }

  } catch (error) {
    console.log(`   ❌ Erro ao sincronizar imóvel ${imovelData.id}:`, error.message);
    return { success: false, error: error.message, id: imovelData.id };
  }
}

async function getAllLocalImoveis() {
  try {
    console.log('🔄 Buscando imóveis do banco local...');
    
    // Importar módulos do projeto Next.js
    const { Pool } = require('pg');
    
    // Configuração do banco usando DATABASE_URL do .env
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:masterkey@50.114.32.196:5432/imobiliaria_db?schema=public';
    console.log('🔗 Usando DATABASE_URL:', connectionString.replace(/:.*@/, ':***@'));
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:masterkey@50.114.32.196:5432/imobiliaria_db?schema=public'
    });

    // Buscar imóveis da base local
    const query = `
      SELECT 
        id,
        titulo,
        descricao,
        preco,
        tipo,
        finalidade,
        bairro,
        cidade,
        ativo,
        quartos,
        banheiros,
        fotos,
        videos
      FROM imoveis 
      ORDER BY id ASC
    `;

    const result = await pool.query(query);
    await pool.end();

    console.log(`✅ Encontrados ${result.rows.length} imóveis no banco local`);
    
    // Log detalhado dos imóveis encontrados
    result.rows.forEach(imovel => {
      let fotosCount = 0;
      let videosCount = 0;
      
      try {
        const fotos = imovel.fotos ? (typeof imovel.fotos === 'string' ? JSON.parse(imovel.fotos) : imovel.fotos) : [];
        const videos = imovel.videos ? (typeof imovel.videos === 'string' ? JSON.parse(imovel.videos) : imovel.videos) : [];
        fotosCount = fotos.length;
        videosCount = videos.length;
      } catch (e) {
        // Ignorar erros de parsing
      }
      
      console.log(`   📌 Imóvel ${imovel.id}: ${imovel.titulo} (${fotosCount} fotos, ${videosCount} vídeos)`);
    });
    
    return result.rows;
  } catch (error) {
    console.log('❌ Erro ao buscar imóveis locais:', error.message);
    console.log('⚠️  Verifique as configurações do banco de dados no arquivo .env');
    
    // Fallback para testes - mantém os dados de exemplo
    return [
      {
        id: 1,
        titulo: 'Apartamento 2 Quartos Centro',
        descricao: 'Ótimo apartamento no centro da cidade',
        preco: 250000,
        tipo: 'apartamento',
        finalidade: 'venda',
        ativo: true,
        bairro: 'Centro',
        cidade: 'São Paulo',
        quartos: 2,
        banheiros: 2,
        fotos: []
      }
    ];
  }
}

async function main() {
  console.log('🚀 Iniciando sincronização completa com Strapi...\n');
  
  // Configuração para ambiente de teste público
  console.log('📝 Usando Strapi em modo público (sem autenticação)');

  // Buscar imóveis locais
  const localImoveis = await getAllLocalImoveis();
  
  if (localImoveis.length === 0) {
    console.log('⚠️  Nenhum imóvel encontrado no banco local');
    console.log('   Verifique sua conexão com o banco de dados');
    process.exit(0);
  }

  console.log(`📊 Encontrados ${localImoveis.length} imóveis para sincronizar\n`);

  // Buscar imóveis do Strapi
  const strapiImoveis = await getAllImoveisFromStrapi();
  
  // Sincronizar cada imóvel
  let successCount = 0;
  let errorCount = 0;
  let errorDetails = [];
  
  console.log(`\n🚀 Iniciando sincronização de ${localImoveis.length} imóveis...`);
  
  for (const imovel of localImoveis) {
    const result = await syncSingleImovel(imovel);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      errorDetails.push({ id: result.id, error: result.error });
    }
  }

  console.log('\n📋 Resumo da sincronização:');
  console.log(`✅ Sucesso: ${successCount} imóveis`);
  console.log(`❌ Erros: ${errorCount} imóveis`);
  console.log(`📊 Total: ${localImoveis.length} imóveis processados`);
  
  // Detalhes dos erros
  if (errorDetails.length > 0) {
    console.log('\n🔍 Detalhes dos erros:');
    errorDetails.forEach(error => {
      console.log(`   ❌ Imóvel ${error.id}: ${error.error}`);
    });
  }
  
  console.log(`\n✅ Sincronização concluída com sucesso!`);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { syncSingleImovel, getAllLocalImoveis };