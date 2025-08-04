const https = require('https');

const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

async function testDirect() {
  console.log('🧪 Testando payload direto...\n');

  const testPayload = {
    title: "Teste Direto",
    description: "Teste com payload direto",
    price: 200000,
    tipo_contrato: "venda",
    tipo_imovel: "casa",
    active: true,
    bairro: "Centro",
    cidade: "São Paulo",
    tipologia: "3 quartos",
    url: "https://teste.com",
    id_integracao: 9997
  };

  console.log('Enviando:', JSON.stringify(testPayload, null, 2));

  try {
    const https = require('https');
    const data = JSON.stringify(testPayload);
    
    const options = {
      hostname: 'whatsapp-strapi.xjueib.easypanel.host',
      port: 443,
      path: '/imoveis',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Resposta:', responseData);
      });
    });

    req.on('error', (error) => {
      console.error('Erro:', error);
    });

    req.write(data);
    req.end();

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testDirect();