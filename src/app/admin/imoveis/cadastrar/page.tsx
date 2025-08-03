'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Upload, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAuthApi, getApiBaseUrl } from '@/lib/api';

interface ImovelForm {
  titulo: string
  descricao: string
  tipo: string
  finalidade: string
  status: string
  preco: string
  area_total: string
  area_construida: string
  quartos: string
  banheiros: string
  vagas_garagem: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  bairro: string
  latitude: string
  longitude: string
  caracteristicas: string
  proprietario: string
  telefone: string
  email: string
  id_angariador: string
  fotos: File[]
  videos: File[]
}

interface Corretor {
  id: number
  nome: string
  email: string
}

export default function CadastrarImovelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loadingCorretores, setLoadingCorretores] = useState(false)
  
  const [formData, setFormData] = useState<ImovelForm>({
    titulo: '',
    descricao: '',
    tipo: '',
    finalidade: '',
    status: 'disponivel',
    preco: '',
    area_total: '',
    area_construida: '',
    quartos: '',
    banheiros: '',
    vagas_garagem: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    bairro: '',
    latitude: '',
    longitude: '',
    caracteristicas: '',
    proprietario: '',
    telefone: '',
    email: '',
    id_angariador: '',
    fotos: [],
    videos: []
  })
  
  const [loadingCep, setLoadingCep] = useState(false)

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
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limitedValue = numericValue.slice(0, 11);
    
    // Aplica a máscara de telefone
    if (limitedValue.length <= 2) {
      return limitedValue;
    } else if (limitedValue.length <= 6) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
    } else if (limitedValue.length <= 10) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
    } else {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`;
    }
  };

  const formatEmail = (value: string) => {
    // Converte para minúsculas
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



  const limparAngariador = () => {
    setFormData(prev => ({
      ...prev,
      id_angariador: ''
    }));
};

const carregarCorretores = useCallback(async () => {
  try {
    setLoadingCorretores(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const response = await fetchAuthApi('admin/corretores');
    if (!response.ok) {
      throw new Error('Erro ao carregar corretores');
    }

    const data = await response.json();
    setCorretores(data.corretores || []);
  } catch (error) {
    console.error('Erro ao carregar corretores:', error);
    toast.error('Erro ao carregar corretores');
  } finally {
    setLoadingCorretores(false);
  }
}, [router]);

useEffect(() => {
  carregarCorretores();
}, [carregarCorretores]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Criar FormData para enviar arquivos
      const formDataToSend = new FormData();
      
      // Adicionar dados do formulário
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'fotos' && key !== 'videos') {
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
      
      // Adicionar fotos
      formData.fotos.forEach((foto) => {
        formDataToSend.append('fotos', foto);
      });
      
      // Adicionar vídeos
      formData.videos.forEach((video) => {
        formDataToSend.append('videos', video);
      });
      
      // Importando a função getApiBaseUrl da lib/api para obter a URL base da API
      const { getApiBaseUrl } = await import('@/lib/api');
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/admin/imoveis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar imóvel');
      }

      toast.success('Imóvel cadastrado com sucesso!');
      router.push('/admin/imoveis');
    } catch (error: any) {
      console.error('Erro ao cadastrar imóvel:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold">Cadastrar Imóvel</h1>
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
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Características</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="area_total" className="block text-sm font-medium text-gray-700">Área Total (m²)</label>
                <input
                  id="area_total"
                  type="number"
                  value={formData.area_total}
                  onChange={(e) => handleInputChange('area_total', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="area_construida" className="block text-sm font-medium text-gray-700">Área Construída (m²)</label>
                <input
                  id="area_construida"
                  type="number"
                  value={formData.area_construida}
                  onChange={(e) => handleInputChange('area_construida', e.target.value)}
                  placeholder="0"
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
            </div>

            {/* Características Adicionais */}
            <div className="space-y-2 mt-6">
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

            {/* Localização */}
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex space-x-2">
                <div className="flex-1 space-y-2">
                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
                  <input
                    id="cep"
                    type="text"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <button
                    type="button"
                    onClick={() => buscarCep(formData.cep)}
                    className="h-10 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    disabled={loadingCep || formData.cep.replace(/\D/g, '').length !== 8}
                  >
                    {loadingCep ? '...' : 'Buscar'}
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
                  placeholder="Rua, número, complemento"
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
                  placeholder="Bairro"
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
                  placeholder="Cidade"
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

              <div className="space-y-2">
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                <input
                  id="latitude"
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  placeholder="Ex: -23.5505"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                <input
                  id="longitude"
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  placeholder="Ex: -46.6333"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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

            {/* Fotos */}
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Fotos do Imóvel</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                    <p className="text-xs text-gray-500">PNG, JPG ou JPEG (máx. 5MB por arquivo)</p>
                  </div>
                  <input 
                    id="file-upload" 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {formData.fotos && formData.fotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.fotos.map((foto, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <Image 
                          src={foto instanceof File ? URL.createObjectURL(foto) : foto} 
                          alt={`Foto ${index + 1}`} 
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vídeos do Imóvel */}
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Vídeos do Imóvel</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Video className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                    <p className="text-xs text-gray-500">MP4 ou MOV (máx. 50MB por arquivo)</p>
                  </div>
                  <input 
                    id="video-upload" 
                    type="file" 
                    multiple 
                    accept="video/mp4, video/quicktime"
                    className="hidden" 
                    onChange={handleVideoChange}
                  />
                </label>
              </div>

              {formData.videos && formData.videos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                        <video 
                          controls 
                          className="w-full h-full"
                          src={video instanceof File ? URL.createObjectURL(video) : video}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Link
                href="/admin/imoveis"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {loading ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Salvando...
                  </span>
                ) : (
                  'Salvar Imóvel'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}