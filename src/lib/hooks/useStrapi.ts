import { useState, useEffect, useCallback } from 'react';
import { strapiClient, validateStrapiConfig } from '../strapi-config';
import type { StrapiResponse, StrapiMedia } from '../strapi';

// Estado do hook
interface UseStrapiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Configuração de parâmetros
interface StrapiParams {
  populate?: string | string[] | Record<string, any>;
  filters?: Record<string, any>;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
  };
  fields?: string[];
}

// Hook principal para integração com Strapi
export const useStrapi = () => {
  // Validar configuração na inicialização
  useEffect(() => {
    validateStrapiConfig();
  }, []);

  return {
    strapi: strapiClient,
  };
};

// Hook para buscar lista de conteúdo
export const useStrapiList = <T = any>(
  contentType: string,
  params?: StrapiParams,
  enabled: boolean = true
): UseStrapiState<T[]> & { refetch: () => void } => {
  const [state, setState] = useState<UseStrapiState<T[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await strapiClient.collection(contentType).find(params);
      setState({
        data: response.data as T[],
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as Error,
      });
    }
  }, [contentType, params, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
};

// Hook para buscar item único
export const useStrapiItem = <T = any>(
  contentType: string,
  id: string | number | null,
  params?: Omit<StrapiParams, 'pagination' | 'fields'>,
  enabled: boolean = true
): UseStrapiState<T> & { refetch: () => void } => {
  const [state, setState] = useState<UseStrapiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!id || !enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await strapiClient.collection(contentType).findOne(String(id), params);
      setState({
        data: response.data as T,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error as Error,
      });
    }
  }, [contentType, id, params, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
};

// Hook para múltiplos tipos de conteúdo
export const useStrapiMultiple = <T extends Record<string, any>>(
  queries: Record<string, { contentType: string; params?: StrapiParams }>,
  enabled: boolean = true
) => {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const promises = Object.entries(queries).map(async ([key, query]) => {
        const response = await strapiClient.collection(query.contentType).find(query.params);
        return [key, response.data];
      });

      const results = await Promise.all(promises);
      const dataMap = Object.fromEntries(results);
      
      setData(dataMap);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [queries, enabled]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
  };
};

// Hook para operações de mutação
export const useStrapiMutation = <T = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(async (contentType: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await strapiClient.collection(contentType).create(data);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  }, []);

  const update = useCallback(async (contentType: string, id: string | number, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await strapiClient.collection(contentType).update(String(id), data);
      setLoading(false);
      return response;
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  }, []);

  const remove = useCallback(async (contentType: string, id: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await strapiClient.collection(contentType).delete(String(id));
      setLoading(false);
      return response;
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    create,
    update,
    remove,
    loading,
    error,
  };
};

// Hook específico para mídia
export const useStrapiMedia = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (files: File | File[], field?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const fileArray = Array.isArray(files) ? files : [files];
      const formData = new FormData();
      fileArray.forEach(file => formData.append(field || 'files', file));
      
      const response = await strapiClient.fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      setLoading(false);
      return response;
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    upload,
    loading,
    error,
  };
};

// Tipos úteis para exportar
export type {
  UseStrapiState,
  StrapiParams,
};

// Exportar hooks individuais
const strapiHooks = {
  useStrapi,
  useStrapiList,
  useStrapiItem,
  useStrapiMultiple,
  useStrapiMutation,
  useStrapiMedia,
};

export default strapiHooks;