#!/bin/bash

# Script para corrigir permissões durante o deploy
# Execute este script após o deploy no EasyPanel ou ambiente de produção

echo "=== CORREÇÃO DE PERMISSÕES PARA DEPLOY ==="
echo "Iniciando correção de permissões dos diretórios de upload..."

# Definir diretório base
BASE_DIR="/app"
if [ ! -d "$BASE_DIR" ]; then
    BASE_DIR="$(pwd)"
fi

echo "Diretório base: $BASE_DIR"

# Criar diretórios de upload se não existirem
echo "Criando diretórios de upload..."
mkdir -p "$BASE_DIR/public/uploads/imoveis"
mkdir -p "$BASE_DIR/public/uploads/corretores"
mkdir -p "$BASE_DIR/public/uploads/imoveis/videos"

# Verificar se os diretórios foram criados
if [ -d "$BASE_DIR/public/uploads" ]; then
    echo "✅ Diretórios criados com sucesso"
else
    echo "❌ Falha ao criar diretórios"
    exit 1
fi

# Aplicar permissões
echo "Aplicando permissões..."
chmod -R 755 "$BASE_DIR/public/uploads"
chmod -R 777 "$BASE_DIR/public/uploads"

# Tentar aplicar ownership se possível
if id "nextjs" &>/dev/null; then
    echo "Aplicando ownership para usuário nextjs..."
    chown -R nextjs:nodejs "$BASE_DIR/public/uploads" 2>/dev/null || echo "⚠️ Não foi possível alterar ownership (normal em alguns ambientes)"
else
    echo "⚠️ Usuário nextjs não encontrado, mantendo ownership atual"
fi

# Verificar permissões finais
echo "\n=== VERIFICAÇÃO FINAL ==="
echo "Estrutura de diretórios:"
ls -la "$BASE_DIR/public/uploads/" 2>/dev/null || echo "❌ Diretório uploads não encontrado"
ls -la "$BASE_DIR/public/uploads/imoveis/" 2>/dev/null || echo "❌ Diretório imoveis não encontrado"
ls -la "$BASE_DIR/public/uploads/corretores/" 2>/dev/null || echo "❌ Diretório corretores não encontrado"

# Teste de escrita
echo "\nTestando permissões de escrita..."
TEST_FILE="$BASE_DIR/public/uploads/test_write.txt"
echo "teste" > "$TEST_FILE" 2>/dev/null
if [ -f "$TEST_FILE" ]; then
    echo "✅ Teste de escrita bem-sucedido"
    rm "$TEST_FILE"
else
    echo "❌ Falha no teste de escrita"
fi

echo "\n=== COMANDOS PARA EASYPANEL ==="
echo "Se estiver usando EasyPanel, execute estes comandos no terminal do container:"
echo "1. docker exec -u root <container_name> /bin/bash"
echo "2. chmod +x /app/deploy-fix.sh"
echo "3. /app/deploy-fix.sh"
echo "4. exit"

echo "\n=== CORREÇÃO CONCLUÍDA ==="
echo "Se ainda houver problemas, verifique:"
echo "- Se o processo Node.js tem permissão para escrever"
echo "- Se o sistema de arquivos não está em modo somente leitura"
echo "- Se há espaço suficiente em disco"