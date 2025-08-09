#!/usr/bin/env node
/**
 * Script de teste para verificar a funcionalidade do botão "Sincronizar Strapi"
 * Simula as chamadas feitas pelo admin
 */

// Configurações
const BASE_URL = 'http://localhost:4000';
const TOKEN = 'test-token'; // Token mock para testes

// Função auxiliar para fetch
const fetch = global.fetch || require('node-fetch');

// Função para testar sincronização completa
async function testSyncCompleta() {
  console.log('🔄 Testando sincronização completa...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/sync-imoveis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sincronização completa - SUCESSO');
      console.log(`📊 Total: ${data.total}`);
      console.log(`✅ Sucessos: ${data.successCount}`);
      console.log(`❌ Erros: ${data.errorCount}`);
      if (data.errors && data.errors.length > 0) {
        console.log(`⚠️  Erros: ${data.errors.join(', ')}`);
      }
    } else {
      console.log('❌ Sincronização completa - FALHA');
      console.log(`Erro: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
  }
}

// Função para testar sincronização individual
async function testSyncIndividual(imovelId) {
  console.log(`🔄 Testando sincronização individual - ID: ${imovelId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/sync-imoveis/${imovelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sincronização individual - SUCESSO');
      console.log(`Mensagem: ${data.message}`);
    } else {
      console.log('❌ Sincronização individual - FALHA');
      console.log(`Erro: ${data.error}`);
    }
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🧪 Iniciando testes de sincronização...\n');
  
  // Verificar se o servidor está rodando
  try {
    const response = await fetch(`${BASE_URL}/api/imoveis`);
    console.log(`📡 Servidor rodando: ${response.ok ? '✅' : '❌'}`);
    if (!response.ok) {
      console.log('❌ Servidor não está respondendo corretamente');
      return;
    }
  } catch (error) {
    console.log('❌ Servidor não está rodando na porta 4000');
    console.log('💡 Execute: npm run dev');
    return;
  }

  // Testar sincronização completa
  await testSyncCompleta();
  console.log('');
  
  // Testar sincronização individual com ID 1 (ajuste conforme necessário)
  await testSyncIndividual(1);
  
  console.log('\n🏁 Testes concluídos!');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}