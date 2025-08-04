const https = require('https');

const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

// Função para fazer requisições HTTPS
async function fetchWithHttps(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testPayload() {
  console.log('🧪 Testando estrutura de payload para Strapi...\n');

  // Dados de teste
  const testPayload = {
    title: "Teste de Imóvel",
    description: "Descrição do imóvel de teste",
    price: 150000,
    tipo_contrato: "venda",
    tipo_imovel: "casa",
    active: true,
    bairro: "Centro",
    cidade: "São Paulo",
    tipologia: "3 quartos, 2 banheiros",
    url: "https://coopcorretores.com.br/imoveis/teste",
    id_integracao: 9999,
    images: ["https://example.com/foto1.jpg"],
    videos: []
  };

  console.log('📤 Payload que será enviado:');
  console.log(JSON.stringify(testPayload, null, 2));

  try {
    // Testar criando um novo imóvel
    console.log('\n📝 Criando imóvel de teste...');
    
    const createResponse = await fetchWithHttps(`${STRAPI_URL}/imoveis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: testPayload })
    });

    console.log('📥 Resposta do Strapi:');
    console.log(`Status: ${createResponse.status}`);
    console.log('Dados:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.status === 200 || createResponse.status === 201) {
      const newId = createResponse.data?.id;
      console.log(`✅ Imóvel criado com ID: ${newId}`);
      
      // Testar buscar o imóvel criado
      console.log('\n🔍 Buscando o imóvel criado...');
      const getResponse = await fetchWithHttps(`${STRAPI_URL}/imoveis/${newId}`);
      console.log('📋 Dados do imóvel:', JSON.stringify(getResponse.data, null, 2));
      
      // Limpar - deletar o imóvel de teste
      console.log('\n🗑️  Deletando imóvel de teste...');
      const deleteResponse = await fetchWithHttps(`${STRAPI_URL}/imoveis/${newId}`, {
        method: 'DELETE'
      });
      console.log(`Status de exclusão: ${deleteResponse.status}`);
      
    } else {
      console.log('❌ Erro ao criar imóvel');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testPayload();