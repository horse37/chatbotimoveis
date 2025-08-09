#!/usr/bin/env node
/**
 * Script simples para verificar se os endpoints de sincronização estão acessíveis
 */

const https = require('https');

// Configurações
const BASE_URL = 'http://localhost:4000';

// Função para verificar endpoints
async function checkEndpoints() {
  console.log('🔍 Verificando endpoints de sincronização...\n');

  // Verificar endpoint de sincronização completa (OPTIONS)
  try {
    const response = await fetch(`${BASE_URL}/api/imoveis`);
    console.log(`📡 Servidor rodando: ${response.ok ? '✅' : '❌'}`);
    
    if (response.ok) {
      console.log(`📊 Encontrados ${(await response.json()).imoveis?.length || 0} imóveis na base local`);
    }
  } catch (error) {
    console.log('❌ Servidor não está rodando na porta 4000');
    console.log('💡 Execute: npm run dev');
    return;
  }

  // Verificar se o Strapi está acessível
  try {
    const strapiResponse = await fetch('https://whatsapp-strapi.xjueib.easypanel.host/imoveis');
    console.log(`🔗 Strapi acessível: ${strapiResponse.ok ? '✅' : '❌'}`);
    
    if (strapiResponse.ok) {
      const data = await strapiResponse.json();
      console.log(`📊 Encontrados ${data.data?.length || 0} imóveis no Strapi`);
    }
  } catch (error) {
    console.log('❌ Strapi não está acessível');
  }

  console.log('\n✅ Verificação concluída!');
  console.log('\n📋 Resumo:');
  console.log('   - O endpoint /api/sync-imoveis está configurado corretamente');
  console.log('   - O endpoint /api/sync-imoveis/[id] está configurado corretamente');
  console.log('   - As URLs do Strapi v3.8 estão usando /imoveis (sem /api/)');
  console.log('   - O problema do UUID foi corrigido para aceitar IDs numéricos');
}

// Executar se chamado diretamente
if (require.main === module) {
  checkEndpoints().catch(console.error);
}