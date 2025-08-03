const bcrypt = require('bcryptjs');

// Hash armazenado no banco de dados (do arquivo inserir-admin.sql)
const hashArmazenado = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// Senha que o usuário está tentando usar para login
const senhaDigitada = 'admin123';

// Testar a comparação
bcrypt.compare(senhaDigitada, hashArmazenado, (err, isMatch) => {
  if (err) {
    console.error('Erro ao comparar senhas:', err);
    return;
  }
  
  console.log('Resultado da comparação:', isMatch);
  console.log('A senha está', isMatch ? 'correta' : 'incorreta');
});

// Gerar um novo hash para a mesma senha para verificar se o formato é compatível
bcrypt.hash(senhaDigitada, 10, (err, hash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    return;
  }
  
  console.log('\nNovo hash gerado:', hash);
  console.log('Hash armazenado:', hashArmazenado);
  console.log('Os hashes são diferentes, mas devem validar a mesma senha');
  
  // Verificar se o novo hash também valida a senha
  bcrypt.compare(senhaDigitada, hash, (err, isMatch) => {
    if (err) {
      console.error('Erro ao comparar com novo hash:', err);
      return;
    }
    
    console.log('Validação com novo hash:', isMatch);
  });
});