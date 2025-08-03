#!/bin/bash

# Script para corrigir permissões dos diretórios de upload
# Execute este script no container em execução

echo "Corrigindo permissões dos diretórios de upload..."

# Criar diretórios se não existirem
mkdir -p /app/public/uploads/imoveis
mkdir -p /app/public/uploads/corretores
mkdir -p /app/public/uploads/imoveis/videos

# Aplicar permissões corretas
chmod -R 777 /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads

# Verificar permissões
echo "Verificando permissões:"
ls -la /app/public/uploads/
ls -la /app/public/uploads/imoveis/
ls -la /app/public/uploads/corretores/

echo "Permissões corrigidas com sucesso!"