/**
 * Utilitário para fazer requisições à API com a URL base correta
 * Resolve o problema de autenticação no EasyPanel
 */

// Obtém a URL base da API do ambiente
export const getApiBaseUrl = () => {
  // Em ambiente de cliente (browser)
  if (typeof window !== 'undefined') {
    // Usa a URL atual do navegador como base para a API
    const currentUrl = window.location.origin;
    return `${currentUrl}/api`;
  }
  
  // Em ambiente de servidor (SSR)
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
};

/**
 * Função para fazer requisições à API com a URL base correta
 * @param endpoint - Endpoint da API (sem a parte /api)
 * @param options - Opções da requisição fetch
 * @returns Promise com a resposta da requisição
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  return fetch(url, options);
};

/**
 * Função para fazer requisições autenticadas à API
 * @param endpoint - Endpoint da API (sem a parte /api)
 * @param options - Opções da requisição fetch
 * @returns Promise com a resposta da requisição
 */
export const fetchAuthApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Token não encontrado');
  }
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };
  
  return fetchApi(endpoint, {
    ...options,
    headers,
  });
};