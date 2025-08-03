// Tipos para as entidades do banco de dados

export interface Corretor {
  id: number
  nome: string
  email: string
  senha?: string // opcional para não expor em responses
  telefone?: string
  foto_perfil?: string
  status_online: boolean
  created_at: Date
  updated_at: Date
}

export interface Imovel {
  id: number
  codigo?: number
  titulo: string
  descricao?: string
  tipo: TipoImovel
  status: StatusImovel
  preco: number
  area_total?: number
  area_construida?: number
  quartos?: number
  banheiros?: number
  vagas_garagem?: number
  endereco: string
  bairro?: string
  cidade: string
  estado: string
  cep?: string
  latitude?: number
  longitude?: number
  corretor_id?: number
  corretor?: Corretor
  corretor_nome?: string
  corretor_foto?: string
  corretor_telefone?: string
  corretor_whatsapp?: string
  caracteristicas?: string[]
  fotos?: string[] // URLs das fotos do imóvel
  videos?: string[] // URLs dos vídeos do imóvel
  midias?: ImovelMidia[]
  created_at: Date
  updated_at: Date
}

export interface ImovelMidia {
  id: number
  imovel_id: number
  tipo: TipoMidia
  url: string
  ordem: number
  created_at: Date
}

export interface Contato {
  id: number
  nome: string
  email: string
  telefone?: string
  mensagem: string
  imovel_id?: number
  corretor_id?: number
  status: StatusContato
  imovel?: Imovel
  corretor?: Corretor
  created_at: Date
}

// Enums
export type TipoImovel = 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'rural' | 'cobertura' | 'studio' | 'venda' | 'aluguel'

export type StatusImovel = 'disponivel' | 'vendido' | 'alugado' | 'reservado'

export type TipoMidia = 'imagem' | 'video'

export type StatusContato = 'pendente' | 'respondido' | 'arquivado'

// Tipos para filtros
export interface FiltrosImovel {
  tipo?: TipoImovel[]
  status?: StatusImovel[]
  preco_min?: number
  preco_max?: number
  quartos?: number[]
  banheiros?: number[]
  vagas_garagem?: number[]
  area_min?: number
  area_max?: number
  cidade?: string[]
  estado?: string[]
  busca?: string // busca textual
}

// Tipos para paginação
export interface PaginationParams {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Tipos para autenticação
export interface LoginCredentials {
  email: string
  senha: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  corretor?: Omit<Corretor, 'senha'>
  message?: string
}

// Tipos para upload de arquivos
export interface UploadResponse {
  success: boolean
  url?: string
  filename?: string
  message?: string
}

// Tipos para formulários
export interface ContatoForm {
  nome: string
  email: string
  telefone?: string
  mensagem: string
  imovel_id?: number
}

export interface ImovelForm {
  titulo: string
  descricao?: string
  tipo: TipoImovel
  status: StatusImovel
  preco: number
  area_total?: number
  area_construida?: number
  quartos?: number
  banheiros?: number
  vagas_garagem?: number
  endereco: string
  cidade: string
  estado: string
  cep?: string
  latitude?: number
  longitude?: number
  corretor_id?: number
}

export interface CorretorForm {
  nome: string
  email: string
  senha?: string
  telefone?: string
  foto_perfil?: string
}

// Tipos para API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Tipos para estatísticas (admin)
export interface EstatisticasAdmin {
  total_imoveis: number
  imoveis_disponiveis: number
  imoveis_vendidos: number
  imoveis_alugados: number
  total_corretores: number
  corretores_online: number
  contatos_pendentes: number
  contatos_mes: number
}