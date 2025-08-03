'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAuthApi } from '@/lib/api';
import { formatImovelId } from '@/lib/utils';


interface Corretor {
  id: number;
  nome: string;
}

interface ImovelForm {
  codigo?: number;
  titulo: string;
  descricao: string;
  tipo: string;
  finalidade: string;
  preco: string;
  area_total: string;
  area_construida: string;
  quartos: string;
  banheiros: string;
  vagas_garagem: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: string;
  longitude: string;
  status: string;
  caracteristicas: string;
  proprietario: string;
  telefone: string;
  email: string;
  id_angariador: string;
  fotos: File[];
  videos: File[];
  fotosExistentes: string[];
  videosExistentes: string[];
}

export default function EditarImovel() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ImovelForm>({
    codigo: undefined,
    titulo: '',
    descricao: '',
    tipo: '',
    finalidade: '',
    preco: '',
    area_total: '',
    area_construida: '',
    quartos: '',
    banheiros: '',
    vagas_garagem: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    latitude: '',
    longitude: '',
    status: 'disponivel',
    caracteristicas: '',
    proprietario: '',
    telefone: '',
    email: '',
    id_angariador: '',
    fotos: [],
    videos: [],
    fotosExistentes: [],
    videosExistentes: []
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState('');
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loadingCorretores, setLoadingCorretores] = useState(false);

  const carregarCorretores = useCallback(async () => {
    try {
      setLoadingCorretores(true);
      const response = await fetchAuthApi('admin/corretores');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar corretores');
      }

      const data = await response.json();
      setCorretores(data.corretores || data);
    } catch (error) {
      console.error('Erro ao carregar corretores:', error);
      toast.error('Erro ao carregar lista de corretores');
    } finally {
      setLoadingCorretores(false);
    }
  }, []);

  const limparAngariador = () => {
    setFormData(prev => ({
      ...prev,
      id_angariador: ''
    }));
  };

  const fetchImovel = useCallback(async () => {
    try {
      setLoadingData(true);
      const response = await fetchAuthApi(`admin/imoveis/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar imóvel');
      }

      const data = await response.json();
      const imovel = data.imovel || data;
      
      setFormData({
        codigo: imovel.codigo,
        titulo: imovel.titulo || '',
        descricao: imovel.descricao || '',
        tipo: imovel.tipo || '',
        finalidade: imovel.finalidade || '',
        preco: imovel.preco ? parseFloat(imovel.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        area_total: imovel.area_total?.toString() || '',
        area_construida: imovel.area_construida?.toString() || '',
        quartos: imovel.quartos?.toString() || '',
        banheiros: imovel.banheiros?.toString() || '',
        vagas_garagem: imovel.vagas_garagem?.toString() || '',
        endereco: imovel.endereco || '',
        bairro: imovel.bairro || '',
        cidade: imovel.cidade || '',
        estado: imovel.estado || '',
        cep: imovel.cep || '',
        latitude: imovel.latitude?.toString() || '',
        longitude: imovel.longitude?.toString() || '',
        status: imovel.status || 'disponivel',
        caracteristicas: Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas.join(', ') : (imovel.caracteristicas || ''),
        proprietario: imovel.proprietario || '',
        telefone: imovel.telefone || '',
        email: imovel.email || '',
        id_angariador: imovel.id_angariador?.toString() || '',
        fotos: [],
        videos: [],
        fotosExistentes: Array.isArray(imovel.fotos) ? imovel.fotos : (imovel.fotos ? JSON.parse(imovel.fotos) : []),
        videosExistentes: Array.isArray(imovel.videos) ? imovel.videos : (imovel.videos ? JSON.parse(imovel.videos) : [])
      });
    } catch (error) {
      console.error('Erro ao carregar imóvel:', error);
      toast.error('Erro ao carregar dados do imóvel');
    } finally {
      setLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchImovel();
    }
    carregarCorretores();
  }, [id, fetchImovel, carregarCorretores]);

  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter os centavos
    const numberValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatTelefone = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Aplica a máscara de telefone
    if (numericValue.length <= 10) {
      return numericValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatEmail = (value: string) => {
    return value.toLowerCase();
  };

  const handleInputChange = (field: keyof ImovelForm, value: string) => {
    if (field === 'preco') {
      // Para o campo preço, aplica a máscara de moeda
      const formattedValue = formatCurrency(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else if (field === 'telefone') {
      // Para o campo telefone, aplica a máscara de telefone
      const formattedValue = formatTelefone(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else if (field === 'email') {
      // Para o campo email, converte para minúsculas
      const formattedValue = formatEmail(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const buscarCep = async (cep: string) => {
    if (!cep || cep.length !== 8) return;

    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));

      toast.success('Endereço preenchido automaticamente');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const cleanCep = value.replace(/\D/g, '');
    handleInputChange('cep', cleanCep);
    
    if (cleanCep.length === 8) {
      buscarCep(cleanCep);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        toast.error(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} é muito grande (máximo 5MB)`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      fotos: [...prev.fotos, ...validFiles]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

  const removeFotoExistente = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotosExistentes: prev.fotosExistentes.filter((_, i) => i !== index)
    }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('video/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB
      
      if (!isValidType) {
        toast.error(`${file.name} não é um vídeo válido`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} é muito grande (máximo 100MB)`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, ...validFiles]
    }));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const removeVideoExistente = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videosExistentes: prev.videosExistentes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Criar FormData para enviar arquivos
      const formDataToSend = new FormData();
      
      // Adicionar dados do formulário
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'fotos' && key !== 'videos' && key !== 'fotosExistentes' && key !== 'videosExistentes') {
          // Converter o preço formatado para um valor numérico antes de enviar
          if (key === 'preco') {
            // Remove R$, pontos e converte vírgula para ponto
            const numericValue = (value as string).replace(/[R$\s.]/g, '').replace(',', '.');
            formDataToSend.append(key, numericValue);
          } else {
            formDataToSend.append(key, value as string);
          }
        }
      });
      
      // Adicionar fotos existentes que não foram removidas
      formDataToSend.append('fotosExistentes', JSON.stringify(formData.fotosExistentes));
      
      // Adicionar vídeos existentes que não foram removidos
      formDataToSend.append('videosExistentes', JSON.stringify(formData.videosExistentes));
      
      // Adicionar novas fotos
      formData.fotos.forEach((foto) => {
        formDataToSend.append('fotos', foto);
      });
      
      // Adicionar novos vídeos
      formData.videos.forEach((video) => {
        formDataToSend.append('videos', video);
      });
      
      // Importando a função getApiBaseUrl da lib/api para obter a URL base da API
      const { getApiBaseUrl } = await import('@/lib/api');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/admin/imoveis/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar imóvel');
      }

      toast.success('Imóvel atualizado com sucesso!');
      router.push('/admin/imoveis');
    } catch (error: any) {
      console.error('Erro ao atualizar imóvel:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados do imóvel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <h1 className="text-2xl font-bold">Editar Imóvel</h1>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Informações do Imóvel</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Campo ID */}
            <div className="mb-6">
              <div className="space-y-2">
                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700">ID do Imóvel</label>
                <input
                  id="codigo"
                  type="text"
                  value={formatImovelId(formData.codigo)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono cursor-not-allowed"
                  placeholder="ID será gerado automaticamente"
                />
                <p className="text-xs text-gray-500">Este campo é gerado automaticamente e não pode ser alterado.</p>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">Título *</label>
                <input
                  id="titulo"
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  placeholder="Ex: Casa com 3 quartos"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo *</label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                  <option value="rural">Rural</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="finalidade" className="block text-sm font-medium text-gray-700">Finalidade *</label>
                <select
                  id="finalidade"
                  value={formData.finalidade}
                  onChange={(e) => handleInputChange('finalidade', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione a finalidade</option>
                  <option value="venda">Venda</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="venda_aluguel">Venda e Aluguel</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="vendido">Vendido</option>
                  <option value="alugado">Alugado</option>
                  <option value="reservado">Reservado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="preco" className="block text-sm font-medium text-gray-700">Preço (R$) *</label>
              <input
                id="preco"
                type="text"
                value={formData.preco}
                onChange={(e) => handleInputChange('preco', e.target.value)}
                placeholder="0,00"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                placeholder="Descrição detalhada do imóvel"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Características */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label htmlFor="area_total" className="block text-sm font-medium text-gray-700">Área Total (m²)</label>
                <input
                  id="area_total"
                  type="number"
                  step="0.01"
                  value={formData.area_total}
                  onChange={(e) => handleInputChange('area_total', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="area_construida" className="block text-sm font-medium text-gray-700">Área Construída (m²)</label>
                <input
                  id="area_construida"
                  type="number"
                  step="0.01"
                  value={formData.area_construida}
                  onChange={(e) => handleInputChange('area_construida', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quartos" className="block text-sm font-medium text-gray-700">Quartos</label>
                <input
                  id="quartos"
                  type="number"
                  value={formData.quartos}
                  onChange={(e) => handleInputChange('quartos', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="banheiros" className="block text-sm font-medium text-gray-700">Banheiros</label>
                <input
                  id="banheiros"
                  type="number"
                  value={formData.banheiros}
                  onChange={(e) => handleInputChange('banheiros', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="vagas_garagem" className="block text-sm font-medium text-gray-700">Vagas de Garagem</label>
              <input
                id="vagas_garagem"
                type="number"
                value={formData.vagas_garagem}
                onChange={(e) => handleInputChange('vagas_garagem', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Localização</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
                  <div className="flex gap-2">
                    <input
                      id="cep"
                      type="text"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000000"
                      maxLength={8}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => buscarCep(formData.cep)}
                      disabled={loadingCep || formData.cep.length !== 8}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">Endereço *</label>
                  <input
                    id="endereco"
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Rua, Avenida, etc."
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input
                    id="bairro"
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    placeholder="Nome do bairro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade *</label>
                  <input
                    id="cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Nome da cidade"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    id="estado"
                    type="text"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    placeholder="-23.550520"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    placeholder="-46.633309"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="caracteristicas" className="block text-sm font-medium text-gray-700">Características Adicionais</label>
              <textarea
                id="caracteristicas"
                value={formData.caracteristicas}
                onChange={(e) => handleInputChange('caracteristicas', e.target.value)}
                placeholder="Ex: Piscina, Churrasqueira, Jardim, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Dados do Proprietário */}
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Dados do Proprietário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="proprietario" className="block text-sm font-medium text-gray-700">Nome do Proprietário</label>
                <input
                  id="proprietario"
                  type="text"
                  value={formData.proprietario}
                  onChange={(e) => handleInputChange('proprietario', e.target.value)}
                  placeholder="Nome completo do proprietário"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  id="telefone"
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="id_angariador" className="block text-sm font-medium text-gray-700">Angariador</label>
                <div className="flex space-x-2">
                  <select
                    id="id_angariador"
                    value={formData.id_angariador}
                    onChange={(e) => handleInputChange('id_angariador', e.target.value)}
                    disabled={loadingCorretores}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um angariador</option>
                    {corretores.map((corretor) => (
                      <option key={corretor.id} value={corretor.id}>
                        {corretor.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={limparAngariador}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    title="Limpar seleção"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {loadingCorretores && (
                  <p className="text-sm text-gray-500">Carregando corretores...</p>
                )}
              </div>
            </div>

            {/* Seção de Fotos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Fotos do Imóvel</h3>
              
              {/* Fotos Existentes */}
              {formData.fotosExistentes.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Fotos Atuais</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.fotosExistentes.map((foto, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-full h-24 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFotoExistente(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload de Novas Fotos */}
              <div className="space-y-2">
                <label htmlFor="fotos" className="block text-sm font-medium text-gray-700">Adicionar Novas Fotos</label>
                <input
                  id="fotos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">Selecione múltiplas imagens (JPG, PNG, GIF). Máximo 5MB por arquivo.</p>
              </div>
              
              {/* Preview das Novas Fotos */}
              {formData.fotos.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Novas Fotos Selecionadas</label>
                  <div className="space-y-2">
                    {formData.fotos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seção de Vídeos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Vídeos do Imóvel</h3>
              
              {/* Vídeos Existentes */}
              {formData.videosExistentes.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Vídeos Atuais</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.videosExistentes.map((video, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={video}
                          className="w-full h-32 object-cover rounded-md border"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => removeVideoExistente(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload de Novos Vídeos */}
              <div className="space-y-2">
                <label htmlFor="videos" className="block text-sm font-medium text-gray-700">Adicionar Novos Vídeos</label>
                <input
                  id="videos"
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500">Selecione múltiplos vídeos (MP4, MOV, AVI). Máximo 100MB por arquivo.</p>
              </div>
              
              {/* Preview dos Novos Vídeos */}
              {formData.videos.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Novos Vídeos Selecionados</label>
                  <div className="space-y-2">
                    {formData.videos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}