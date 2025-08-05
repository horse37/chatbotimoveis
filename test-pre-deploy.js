const fs = require('fs');
const path = require('path');

// Teste pré-deploy para verificar o arquivo de imagem
const IMAGE_PATH = "D:\\Downloads\\5ed707a5-8995-4194-bd54-bccfab2f8aa9.jpg";

function testPreDeploy() {
  console.log('🎯 Teste Pré-Deploy - Verificação de Imagem');
  console.log('==========================================\n');

  try {
    // Verificar se arquivo existe
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error('❌ Arquivo não encontrado:', IMAGE_PATH);
      return false;
    }
    console.log('✅ Arquivo encontrado:', IMAGE_PATH);

    // Verificar informações do arquivo
    const stats = fs.statSync(IMAGE_PATH);
    console.log('📊 Tamanho:', (stats.size / 1024 / 1024).toFixed(2) + ' MB');
    console.log('📅 Modificado em:', stats.mtime.toLocaleString());

    // Verificar extensão
    const ext = path.extname(IMAGE_PATH).toLowerCase();
    console.log('📁 Extensão:', ext);

    // Verificar se é uma imagem válida
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExtensions.includes(ext)) {
      console.error('❌ Extensão de arquivo inválida para imagem');
      return false;
    }
    console.log('✅ Extensão válida para imagem');

    // Verificar tamanho (máximo 5MB recomendado)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (stats.size > maxSize) {
      console.warn('⚠️  Arquivo muito grande. Considere comprimir antes do upload');
    } else {
      console.log('✅ Tamanho adequado para upload');
    }

    console.log('\n🚀 Pré-deploy concluído com sucesso!');
    console.log('📋 O arquivo está pronto para upload no Strapi');
    return true;

  } catch (error) {
    console.error('❌ Erro ao verificar arquivo:', error.message);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testPreDeploy();
}