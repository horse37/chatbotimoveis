// Script para verificar versões do Node.js e bcrypt
const bcrypt = require('bcryptjs');

console.log('Versão do Node.js:', process.version);
console.log('Versão do bcrypt:', require('bcryptjs/package.json').version);

// Verificar se o bcrypt está funcionando corretamente
const senha = 'admin123';
const hashOriginal = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// Testar a comparação síncrona
try {
  const resultadoSync = bcrypt.compareSync(senha, hashOriginal);
  console.log('Comparação síncrona:', resultadoSync ? 'Sucesso' : 'Falha');
} catch (error) {
  console.error('Erro na comparação síncrona:', error);
}

// Testar a comparação assíncrona
bcrypt.compare(senha, hashOriginal, (err, result) => {
  if (err) {
    console.error('Erro na comparação assíncrona:', err);
  } else {
    console.log('Comparação assíncrona:', result ? 'Sucesso' : 'Falha');
  }
});

// Gerar um novo hash
bcrypt.genSalt(10, (err, salt) => {
  if (err) {
    console.error('Erro ao gerar salt:', err);
    return;
  }
  
  bcrypt.hash(senha, salt, (err, hash) => {
    if (err) {
      console.error('Erro ao gerar hash:', err);
      return;
    }
    
    console.log('Novo hash gerado:', hash);
    
    // Verificar o novo hash
    bcrypt.compare(senha, hash, (err, result) => {
      if (err) {
        console.error('Erro ao verificar novo hash:', err);
      } else {
        console.log('Verificação do novo hash:', result ? 'Sucesso' : 'Falha');
      }
    });
  });
});