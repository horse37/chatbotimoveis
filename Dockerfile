# Dockerfile para projeto Next.js
# Multi-stage build para otimizar o tamanho da imagem
# Configurado para banco de dados externo

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar arquivos de dependências e scripts necessários
COPY package.json package-lock.json* ./
COPY init-permissions.js ./
RUN npm ci --include=dev

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o projeto (inclui tsconfig.json, src/, public/ etc.)
COPY . .

# Preparar o diretório node_modules/@
RUN mkdir -p ./node_modules/@/components ./node_modules/@/lib ./node_modules/@/app ./node_modules/@/types

# Copiar diretamente os componentes para node_modules/@
# Isso permite que importações como '@/components/...' funcionem corretamente durante o build
RUN cp -r ./src/components/* ./node_modules/@/components/
RUN cp -r ./src/lib/* ./node_modules/@/lib/
RUN cp -r ./src/app/* ./node_modules/@/app/
RUN cp -r ./src/types/* ./node_modules/@/types/

# Criar jsconfig.json para ajudar na resolução de caminhos durante o build
RUN echo '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["./src/*"]}}}' > jsconfig.json

# Criar next.config.js para garantir que esteja disponível
RUN echo "/** @type {import('next').NextConfig} */" > next.config.js && \
    echo "const path = require('path');" >> next.config.js && \
    echo "" >> next.config.js && \
    echo "const nextConfig = {" >> next.config.js && \
    echo "  output: 'standalone'," >> next.config.js && \
    echo "  distDir: '.next'," >> next.config.js && \
    echo "  // Removido transpilePackages para evitar conflito com serverExternalPackages" >> next.config.js && \
    echo "  // transpilePackages: ['@']," >> next.config.js && \
    echo "  serverExternalPackages: []," >> next.config.js && \
    echo "  experimental: {" >> next.config.js && \
    echo "    // Removido serverComponentsExternalPackages que foi movido para serverExternalPackages" >> next.config.js && \
    echo "    // Removido esmExternals que não é mais recomendado" >> next.config.js && \
    echo "  }," >> next.config.js && \
    echo "  images: {" >> next.config.js && \
    echo "    domains: ['localhost']," >> next.config.js && \
    echo "    unoptimized: true," >> next.config.js && \
    echo "    remotePatterns: [" >> next.config.js && \
    echo "      {" >> next.config.js && \
    echo "        protocol: 'https'," >> next.config.js && \
    echo "        hostname: '**'," >> next.config.js && \
    echo "      }," >> next.config.js && \
    echo "      {" >> next.config.js && \
    echo "        protocol: 'http'," >> next.config.js && \
    echo "        hostname: '**'," >> next.config.js && \
    echo "      }," >> next.config.js && \
    echo "    ]," >> next.config.js && \
    echo "  }," >> next.config.js && \
    echo "  async rewrites() {" >> next.config.js && \
    echo "    return [" >> next.config.js && \
    echo "      {" >> next.config.js && \
    echo "        source: '/uploads/:path*'," >> next.config.js && \
    echo "        destination: '/uploads/:path*'," >> next.config.js && \
    echo "      }," >> next.config.js && \
    echo "    ];" >> next.config.js && \
    echo "  }," >> next.config.js && \
    echo "  // Adicionando webpack config para garantir que @ seja resolvido corretamente" >> next.config.js && \
    echo "  webpack: (config) => {" >> next.config.js && \
    echo "    config.resolve.alias['@'] = path.resolve(__dirname, 'src');" >> next.config.js && \
    echo "    return config;" >> next.config.js && \
    echo "  }," >> next.config.js && \
    echo "};" >> next.config.js && \
    echo "" >> next.config.js && \
    echo "module.exports = nextConfig;" >> next.config.js

# Copiar jsconfig.json para node_modules/@ para garantir resolução de caminhos
RUN cp jsconfig.json ./node_modules/@/

# Desativar telemetria
ENV NEXT_TELEMETRY_DISABLED=1

# Adicionar variável de ambiente temporária para o build
# Esta variável será substituída pela real durante a execução
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/imobiliaria_temp

# Build com ambiente de produção (padrão do Next.js)
# Adicionando --no-lint para evitar problemas durante o build
RUN npm run build -- --no-lint

# Garantir que os componentes estejam disponíveis nos diretórios .next/server e .next/standalone
RUN mkdir -p ./.next/server/app/components ./.next/server/src/components ./.next/standalone/src/components ./.next/standalone/src/lib ./.next/standalone/src/app ./.next/server/src/types ./.next/standalone/src/types
RUN cp -r ./src/components/* ./.next/server/app/components/
RUN cp -r ./src/components/* ./.next/server/src/components/
RUN cp -r ./src/components/* ./.next/standalone/src/components/
RUN cp -r ./src/lib/* ./.next/standalone/src/lib/
RUN cp -r ./src/app/* ./.next/standalone/src/app/
RUN cp -r ./src/types/* ./.next/server/src/types/
RUN cp -r ./src/types/* ./.next/standalone/src/types/

# Copiar jsconfig.json e next.config.js para o diretório standalone
RUN cp jsconfig.json ./.next/standalone/
RUN cp next.config.js ./.next/standalone/

# Copiar node_modules/@ para o diretório standalone
RUN mkdir -p ./.next/standalone/node_modules/@
RUN cp -r ./node_modules/@/* ./.next/standalone/node_modules/@/

# Stage 3: Runner (Imagem final e enxuta)
FROM node:18-alpine AS runner
WORKDIR /app

# Variáveis de ambiente
# Usando NODE_ENV=production que é o valor padrão esperado pelo Next.js em produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Criar usuário não-root para produção
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos públicos e build
COPY --from=builder /app/public ./public

# Criar pastas para uploads e aplicar permissões
RUN mkdir -p ./public/uploads/imoveis ./public/uploads/corretores ./public/uploads/imoveis/videos
RUN chmod -R 755 ./public/uploads
RUN chown -R nextjs:nodejs ./public/uploads
RUN chmod -R 777 ./public/uploads

# Copiar build standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar código fonte completo para garantir que todos os componentes estejam disponíveis
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Configurar estrutura de diretórios para garantir que os componentes sejam encontrados durante a execução
# Criar diretórios para o alias '@' dentro de node_modules
RUN mkdir -p /app/node_modules/@/components /app/node_modules/@/lib /app/node_modules/@/app /app/node_modules/@/types

# Copiar diretamente os componentes e outros diretórios importantes para node_modules/@
# Isso permite que importações como '@/components/...' funcionem corretamente
COPY --from=builder --chown=nextjs:nodejs /app/src/components/ /app/node_modules/@/components/
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/ /app/node_modules/@/lib/
COPY --from=builder --chown=nextjs:nodejs /app/src/app/ /app/node_modules/@/app/
COPY --from=builder --chown=nextjs:nodejs /app/src/types/ /app/node_modules/@/types/

# Copiar arquivos de configuração necessários
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/jsconfig.json ./
COPY --from=deps /app/init-permissions.js ./

# Copiar jsconfig.json para node_modules/@ para garantir resolução de caminhos
COPY --from=builder --chown=nextjs:nodejs /app/jsconfig.json /app/node_modules/@/

# Aplicar permissões corretas nos diretórios de upload ANTES de trocar usuário
RUN chmod -R 777 /app/public/uploads && \
    chown -R nextjs:nodejs /app/public/uploads

# Trocar para o usuário seguro
USER nextjs

# Expor porta da aplicação
EXPOSE 4000

# Comando para iniciar o servidor com correção de permissões
CMD ["sh", "-c", "node init-permissions.js && node server.js"]
