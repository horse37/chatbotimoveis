#!/usr/bin/env node
/**
 * Script de teste completo para demonstrar sincronização com Strapi
 * Mostra os 3 imóveis existentes e permite testar a sincronização
 */

const https = require('https');
const { Pool } = require('pg');

// Configurações
const STRAPI_URL = 'https://whatsapp-strapi.xjueib.easypanel.host';

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

async function getStrapiImoveis() {
  console.log('🔄 Buscando imóveis do Strapi...');
  try {
    const response = await fetchWithHttps(`${STRAPI_URL}/imoveis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ Encontrados ${response.data.length} imóveis no Strapi`);
      response.data.forEach((imovel, index) => {
        console.log(`\n${index + 1}. ${imovel.title}`);
        console.log(`   Preço: R$ ${imovel.price.toLocaleString('pt-BR')}`);
        console.log(`   Tipo: ${imovel.tipo_imovel} - ${imovel.tipo_contrato}`);
        console.log(`   Localização: ${imovel.bairro}, ${imovel.cidade}`);
        console.log(`   Descrição: ${imovel.description.substring(0, 100)}...`);
      });
      return response.data;
    } else {
      console.log('❌ Erro ao buscar imóveis:', response.status);
      return [];
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return [];
  }
}

async function testSync() {
  console.log('🚀 Teste de sincronização com Strapi\n');
  
  // Buscar imóveis do Strapi
  const strapiImoveis = await getStrapiImoveis();
  
  if (strapiImoveis.length === 0) {
    console.log('❌ Nenhum imóvel encontrado no Strapi');
    return;
  }
  
  console.log('\n📋 Imóveis do Strapi (serão mantidos intactos):');
  console.log('='.repeat(50));
  
  // Criar dados de exemplo para teste
  const imoveisExemplo = [
    {
      id: 999,
      titulo: 'Apartamento Teste Sincronização',
      descricao: 'Apartamento de teste para demonstrar sincronização com Strapi',
      preco: 350000,
      tipo: 'apartamento',
      finalidade: 'venda',
      bairro: 'Centro',
      cidade: 'São Paulo',
      ativo: true,
      quartos: 3,
      banheiros: 2
    }
  ];
  
  console.log('\n📝 Dados de exemplo para sincronização:');
  console.log('Imóvel de teste:', imoveisExemplo[0].titulo);
  
  // Simular sincronização
  console.log('\n🔄 Simulando sincronização...');
  for (const imovel of imoveisExemplo) {
    const tipologia = [
      imovel.banheiros ? `Banheiros ${imovel.banheiros}` : '',
      imovel.quartos ? `Quarto ${imovel.quartos}` : ''
    ].filter(Boolean).join(', ');
    
    const payload = {
      title: imovel.titulo,
      description: imovel.descricao,
      price: imovel.preco,
      tipo_contrato: imovel.finalidade,
      tipo_imovel: imovel.tipo,
      active: imovel.ativo,
      bairro: imovel.bairro,
      cidade: imovel.cidade,
      tipologia: tipologia,
      local_id: imovel.id
    };
    
    console.log('\n📤 Payload para Strapi:');
    console.log(JSON.stringify(payload, null, 2));
  }
  
  console.log('\n✅ Sincronização simulada com sucesso!');
  console.log('📊 Resumo:');
  console.log(`- ${strapiImoveis.length} imóveis existentes no Strapi (serão mantidos)`);
  console.log(`- 1 imóvel de teste pronto para sincronização`);
  console.log('\n💡 Para sincronizar imóveis reais, popule o banco local ou ajuste a função getAllLocalImoveis()');
}

testSync();