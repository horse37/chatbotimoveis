const fs = require('fs');
const path = require('path');

// Script para simular upload e verificar estrutura do arquivo
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

async function simularUpload() {
  console.log('🎯 Simulação de Upload - Verificação Completa');
  console.log('==========================================\n');

  try {
    // Verificar arquivo
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
      return false;
    }

    const stats = fs.statSync(IMAGE_PATH);
    console.log('✅ Arquivo encontrado');
    console.log(`📁 Caminho: ${IMAGE_PATH}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📅 Última modificação: ${stats.mtime.toLocaleString()}`);

    // Verificar formato
    const ext = path.extname(IMAGE_PATH).toLowerCase();
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                     ext === '.png' ? 'image/png' : 
                     ext === '.gif' ? 'image/gif' : 'image/unknown';
    
    console.log(`📄 Extensão: ${ext}`);
    console.log(`🎨 MIME Type: ${mimeType}`);

    // Verificar se é imagem válida
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExtensions.includes(ext)) {
      console.error('❌ Formato de arquivo inválido');
      return false;
    }

    // Verificar tamanho
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (stats.size > maxSize) {
      console.warn('⚠️  Arquivo muito grande (>5MB)');
    } else {
      console.log('✅ Tamanho adequado para upload');
    }

    // Simular estrutura de resposta do Strapi
    const mockResponse = {
      id: Math.floor(Math.random() * 1000) + 1,
      name: path.basename(IMAGE_PATH),
      alternativeText: null,
      caption: null,
      width: 800,
      height: 600,
      formats: {
        thumbnail: {
          ext: ext,
          url: `/uploads/thumbnail_${path.basename(IMAGE_PATH)}`,
          hash: `thumbnail_${Date.now()}`,
          mime: mimeType,
          name: `thumbnail_${path.basename(IMAGE_PATH)}`,
          path: null,
          size: Math.round(stats.size * 0.1),
          width: 245,
          height: 184
        }
      },
      hash: Date.now().toString(),
      ext: ext,
      mime: mimeType,
      size: stats.size,
      url: `/uploads/${path.basename(IMAGE_PATH)}`,
      previewUrl: null,
      provider: 'local',
      provider_metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('\n✅ Simulação concluída com sucesso!');
    console.log('📋 Estrutura esperada do upload:');
    console.log(`🔗 URL da imagem: ${mockResponse.url}`);
    console.log(`🆔 ID gerado: ${mockResponse.id}`);
    console.log(`📐 Dimensões: ${mockResponse.width}x${mockResponse.height}`);

    // Instruções para upload real
    console.log('\n🚀 Para fazer o upload real:');
    console.log('1. Certifique-se que o Strapi está rodando');
    console.log('2. Configure o token correto em .env');
    console.log('3. Execute: node upload-direto.js');

    return true;

  } catch (error) {
    console.error('❌ Erro ao verificar arquivo:', error.message);
    return false;
  }
}

// Executar
simularUpload();