const fetch = require('node-fetch');

async function testSync() {
  try {
    console.log('🧪 Testando sincronização direta...');
    
    const response = await fetch('http://localhost:3000/api/sync-imoveis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSync();