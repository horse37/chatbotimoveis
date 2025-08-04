// Exemplos práticos de uso da biblioteca oficial @strapi/client
// Este arquivo serve como referência para implementações comuns

import { useStrapiList, useStrapiItem, useStrapiMutation, useStrapiMedia } from './hooks/useStrapi';
import { getStrapiImageUrl } from './strapi-config';

// ===== DEFINIÇÕES DE TIPOS =====

export interface Imovel {
  id: number;
  attributes: {
    titulo: string;
    descricao: string;
    preco: number;
    quartos: number;
    banheiros: number;
    area: number;
    cidade: string;
    estado: string;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    imagem_destaque: {
      data: {
        id: number;
        attributes: {
          url: string;
          alternativeText?: string;
        };
      };
    };
    corretor: {
      data: {
        id: number;
        attributes: {
          nome: string;
          email: string;
          telefone: string;
        };
      };
    };
  };
}

export interface ImovelFormData {
  titulo: string;
  descricao: string;
  preco: number;
  quartos: number;
  banheiros: number;
  area: number;
  cidade: string;
  estado: string;
  endereco: string;
  cep: string;
  corretor: number;
  tipo_imovel: number;
  imagem_destaque?: number;
}

// ===== EXEMPLO 1: Listagem de Imóveis =====

// Hook para listar imóveis
export function useImoveisList() {
  return useStrapiList<Imovel>('imoveis', {
    populate: ['imagem_destaque', 'corretor'],
    filters: { ativo: true },
    sort: 'createdAt:desc',
    pagination: { page: 1, pageSize: 12 }
  });
}

// ===== EXEMPLO 2: Detalhes de um Imóvel =====

// Hook para buscar detalhes de um imóvel
export function useImovelDetail(id: string) {
  return useStrapiItem<Imovel>('imoveis', id, {
    populate: ['imagem_destaque', 'corretor', 'caracteristicas', 'tipo_imovel']
  });
}

// ===== EXEMPLO 3: Formulário de Criação =====

// Hook para criar novo imóvel
export function useImovelCreation() {
  const { create, loading, error } = useStrapiMutation();
  const { upload, loading: uploading, error: uploadError } = useStrapiMedia();

  const createImovel = async (formData: ImovelFormData, files: File[]) => {
    try {
      // Fazer upload das imagens primeiro
      const uploadedImages = await upload(files);
      const responseData = await uploadedImages.json();
      const imageIds = responseData.map((img: any) => img.id);

      // Criar o imóvel
      const novoImovel = await create('imoveis', {
        ...formData,
        ativo: true,
        imagens: imageIds,
        imagem_destaque: imageIds[0]
      });

      return novoImovel;
    } catch (error) {
      console.error('Erro ao criar imóvel:', error);
      throw error;
    }
  };

  return {
    createImovel,
    loading: loading || uploading,
    error: error || uploadError
  };
}

// ===== EXEMPLO 4: Busca com Filtros =====

// Hook customizado para busca
export function useImoveisSearch(filtros: {
  cidade?: string;
  minPreco?: number;
  maxPreco?: number;
  quartos?: number;
  tipo?: string;
}) {
  const params = {
    populate: ['imagem_destaque', 'corretor', 'tipo_imovel'],
    filters: {
      ...(filtros.cidade && { cidade: { $eq: filtros.cidade } }),
      ...(filtros.minPreco && { preco: { $gte: filtros.minPreco } }),
      ...(filtros.maxPreco && { preco: { $lte: filtros.maxPreco } }),
      ...(filtros.quartos && { quartos: { $gte: filtros.quartos } }),
      ...(filtros.tipo && { tipo_imovel: { nome: { $eq: filtros.tipo } } }),
      ativo: true
    },
    sort: 'preco:asc',
    pagination: { page: 1, pageSize: 20 }
  };

  return useStrapiList<Imovel>('imoveis', params);
}

// ===== EXEMPLO 5: Dashboard com Estatísticas =====

interface Estatisticas {
  totalImoveis: number;
  imoveisAtivos: number;
  valorMedio: number;
  cidades: string[];
}

export function useDashboardData() {
  const { data: imoveis, loading, error } = useStrapiList<Imovel>('imoveis', {
    populate: ['corretor'],
    pagination: { pageSize: 100 }
  });

  const estatisticas: Estatisticas = {
    totalImoveis: imoveis?.length || 0,
    imoveisAtivos: imoveis?.filter(i => i.attributes.ativo).length || 0,
    valorMedio: imoveis?.length ? 
      imoveis.reduce((sum, i) => sum + i.attributes.preco, 0) / imoveis.length : 0,
    cidades: Array.from(new Set(imoveis?.map(i => i.attributes.cidade) || []))
  };

  return { imoveis, estatisticas, loading, error };
}

// ===== EXEMPLO 6: Server Components =====

// Server-side data fetching (para usar em Server Components)
export async function getImoveisServer() {
  const { strapiClient: getStrapiServer } = await import('./strapi-config');
  
  try {
    const serverStrapi = getStrapiServer;
    const response = await serverStrapi.collection('imoveis').find({
      populate: ['imagem_destaque', 'corretor'],
      filters: { ativo: true },
      pagination: { pageSize: 50 }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    return [];
  }
}

// ===== EXEMPLO 7: Funções de Utilidade =====

// Função para formatar URL de imagem
export const formatImagemUrl = (url: string, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium') => {
  return getStrapiImageUrl(url, size);
};

// Função para buscar imóveis por cidade
export function useImoveisPorCidade(cidade: string) {
  return useStrapiList<Imovel>('imoveis', {
    populate: ['imagem_destaque'],
    filters: { cidade: { $eq: cidade }, ativo: true },
    sort: 'preco:asc',
    pagination: { pageSize: 10 }
  });
}

// Função para buscar imóveis recentes
export function useImoveisRecentes(limit: number = 6) {
  return useStrapiList<Imovel>('imoveis', {
    populate: ['imagem_destaque', 'corretor'],
    filters: { ativo: true },
    sort: 'createdAt:desc',
    pagination: { pageSize: limit }
  });
}

// Exportar tudo
export {
  getStrapiImageUrl
};