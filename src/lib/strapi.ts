import { strapi } from '@strapi/client';

// Configuração e tipos para Strapi
export interface StrapiConfig {
  baseURL: string;
  apiToken?: string;
  timeout?: number;
}

export interface StrapiResponse<T = any> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiMedia {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

// Instância única do cliente Strapi
let strapiClient: ReturnType<typeof strapi> | null = null;

// Inicializar o cliente Strapi
export const initStrapi = (config: StrapiConfig): ReturnType<typeof strapi> => {
  strapiClient = strapi({
      baseURL: config.baseURL,
      auth: config.apiToken,
    });
  
  return strapiClient;
};

// Obter cliente inicializado
export const getStrapi = () => {
  if (!strapiClient) {
    throw new Error('Strapi client not initialized. Call initStrapi() first.');
  }
  return strapiClient;
};

// Helper para inicialização rápida com configuração de ambiente
export const createStrapiClient = (overrides?: Partial<StrapiConfig>) => {
  const config: StrapiConfig = {
    baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api',
    apiToken: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || process.env.STRAPI_API_TOKEN,
    timeout: 10000,
    ...overrides,
  };
  
  return initStrapi(config);
};

// Helpers para operações comuns usando a API correta da @strapi/client
export const strapiOperations = {
  // Buscar lista de conteúdo
  async find<T = any>(contentType: string, params?: any) {
    const client = getStrapi();
    return client.collection(contentType).find(params);
  },

  // Buscar item único
  async findOne<T = any>(contentType: string, id: string | number, params?: any) {
    const client = getStrapi();
    return client.collection(contentType).findOne(String(id), params);
  },

  // Criar novo conteúdo
  async create<T = any>(contentType: string, data: any) {
    const client = getStrapi();
    return client.collection(contentType).create(data);
  },

  // Atualizar conteúdo
  async update<T = any>(contentType: string, id: string | number, data: any) {
    const client = getStrapi();
    return client.collection(contentType).update(String(id), data);
  },

  // Deletar conteúdo
  async delete<T = any>(contentType: string, id: string | number) {
    const client = getStrapi();
    return client.collection(contentType).delete(String(id));
  },

  // Upload de arquivos
  async upload(files: any, field?: string) {
      const client = getStrapi();
      const fileArray = Array.isArray(files) ? files : [files];
      
      const formData = new FormData();
      fileArray.forEach(file => formData.append(field || 'files', file));
      
      return client.fetch('/upload', {
        method: 'POST',
        body: formData,
      });
    },

  // Buscar com populate automático
  async findWithPopulate<T = any>(contentType: string, populate: string | string[] = '*', params?: any) {
    const client = getStrapi();
    return client.collection(contentType).find({
      populate,
      ...params,
    });
  },
};

// Exportar tipos úteis
export type { StrapiClient } from '@strapi/client';
export default strapiOperations;