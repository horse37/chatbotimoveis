// Configuração do Strapi usando a biblioteca oficial
import { strapi } from '@strapi/client';
import type { StrapiClient } from '@strapi/client';

// Configuração padrão do Strapi
export const strapiConfig = {
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
  apiToken: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN,
  serverToken: process.env.STRAPI_SERVER_API_TOKEN,
  timeout: 10000,
};

// Validar configuração
export const validateStrapiConfig = () => {
  const required = ['NEXT_PUBLIC_STRAPI_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Variáveis de ambiente Strapi ausentes: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
};

// Criar cliente Strapi pré-configurado
export const strapiClient = strapi({
  baseURL: strapiConfig.baseURL,
  auth: strapiConfig.apiToken,
});

// Helper para URLs de mídia
export const getStrapiMediaUrl = (url: string): string => {
  if (url.startsWith('http')) return url;
  
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  return `${baseUrl}${url}`;
};

// Helper para URLs de imagem com otimização
export const getStrapiImageUrl = (url: string, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string => {
  if (!url) return '';
  
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
  
  // Se já for URL completa, retornar
  if (url.startsWith('http')) return url;
  
  // Verificar se tem formatos disponíveis
  const filename = url.substring(url.lastIndexOf('/') + 1);
  const path = url.substring(0, url.lastIndexOf('/') + 1);
  
  // Tentar usar o formato específico
  const sizedUrl = `${path}${size}_${filename}`;
  
  return `${baseUrl}${sizedUrl}`;
};

// Exportar configuração padrão
export default strapiConfig;