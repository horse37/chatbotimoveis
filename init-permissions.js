#!/usr/bin/env node

/**
 * Script de inicialização para corrigir permissões dos diretórios de upload
 * Executa automaticamente quando a aplicação inicia
 */

const fs = require('fs');
const path = require('path');

// Diretórios que precisam de permissões de escrita
const uploadDirs = [
  '/app/public/uploads',
  '/app/public/uploads/imoveis',
  '/app/public/uploads/corretores',
  '/app/public/uploads/imoveis/videos'
];

console.log('🔧 Verificando permissões de upload...');

// Função para criar diretório se não existir
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o777 });
      console.log(`✅ Diretório criado: ${dirPath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao criar diretório ${dirPath}:`, error.message);
  }
}

// Função para testar escrita
function testWrite(dirPath) {
  const testFile = path.join(dirPath, 'test_write.tmp');
  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`✅ Teste de escrita bem-sucedido: ${dirPath}`);
    return true;
  } catch (error) {
    console.log(`❌ Falha no teste de escrita em ${dirPath}: ${error.message}`);
    return false;
  }
}

// Função para obter informações do diretório
function getDirInfo(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const stats = fs.statSync(dirPath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      return mode;
    } else {
      return 'não existe';
    }
  } catch (error) {
    return 'erro';
  }
}

// Executar verificações
async function initPermissions() {
  let allTestsPassed = true;

  for (const dir of uploadDirs) {
    ensureDir(dir);
    
    const testResult = testWrite(dir);
    if (!testResult) {
      allTestsPassed = false;
    }
  }

  console.log('\n=== RESULTADO FINAL ===');
  if (allTestsPassed) {
    console.log('✅ Todas as permissões estão corretas!');
  } else {
    console.log('⚠️ Algumas permissões podem não estar corretas.');
    console.log('\n📋 Comandos manuais para executar como root:');
    console.log('chmod -R 777 /app/public/uploads');
    console.log('chown -R nextjs:nodejs /app/public/uploads');
  }

  console.log('\n📊 Status dos diretórios:');
  for (const dir of uploadDirs) {
    const info = getDirInfo(dir);
    console.log(`📁 ${dir}: ${info}`);
  }

  console.log('\n🔧 Verificação finalizada.\n');

  // Se houver problemas, tentar uma última correção
  if (!allTestsPassed) {
    console.log('🔄 Tentando correção final...');
    try {
      for (const dir of uploadDirs) {
        if (fs.existsSync(dir)) {
          fs.chmodSync(dir, 0o777);
        }
      }
      console.log('✅ Correção final aplicada.');
    } catch (error) {
      console.log('⚠️ Correção final falhou:', error.message);
    }
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  initPermissions().catch(error => {
    console.error('❌ Erro durante inicialização:', error);
    process.exit(1);
  });
}

module.exports = { initPermissions };