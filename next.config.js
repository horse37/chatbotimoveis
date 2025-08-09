/** @type {import('next').NextConfig} */
/* ARQUIVO DE CONFIGURAÇÃO DO NEXT */
const path = require('path');

// Detectar ambiente de produção
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Configuração para build standalone
  output: 'standalone',
  // Definir o diretório de build para garantir que todos os arquivos sejam incluídos
  distDir: '.next',
  // Configuração para pacotes externos no servidor
  serverExternalPackages: [],
  // Desabilitar ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuração experimental para melhorar a resolução de módulos
  experimental: {
    // Configurações experimentais removidas para evitar conflitos
  },
  
  // Configurações de SEO
  compress: true,
  poweredByHeader: false,
  
  // Headers para SEO e segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600'
          }
        ]
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      }
    ]
  },
  
  // Configurações para o proxy do EasyPanel
  // Estas configurações são aplicadas apenas em produção
  // Se NEXT_PUBLIC_BASE_URL estiver definido, usamos como assetPrefix
  basePath: '',
  //assetPrefix: isProd && process.env.NEXT_PUBLIC_BASE_URL ? process.env.NEXT_PUBLIC_BASE_URL : '',
  
  assetPrefix: isProd ? process.env.NEXT_PUBLIC_BASE_URL + '/' : '',
  
  
  // Configuração para garantir que o Next.js use a porta correta
  serverRuntimeConfig: {
    port: process.env.PORT || 4000,
  },
  publicRuntimeConfig: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ✅ Correção para aliases como "@/components"
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  
  // Configuração de aliases já definida acima
};

module.exports = nextConfig;

// FIM DO ARQUIVO
