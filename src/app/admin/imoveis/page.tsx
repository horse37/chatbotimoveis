'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Edit, Trash2, Eye, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import SyncModal from '@/components/admin/SyncModal'
import toast from 'react-hot-toast'
import { fetchAuthApi } from '@/lib/api'
import { formatImovelId } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/useAuth'

// Função para sincronização automática em segundo plano
const syncImovelBackground = async (imovelId: string, token: string) => {
  try {
    console.log(`🔄 Sincronização automática iniciada para imóvel ${imovelId}`);
    const response = await fetch(`/api/sync-imoveis/${imovelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log(`✅ Sincronização automática concluída para imóvel ${imovelId}`);
    } else {
      console.error(`❌ Erro na sincronização automática do imóvel ${imovelId}:`, response.statusText);
    }
  } catch (error) {
    console.error(`🔌 Erro de conexão na sincronização automática do imóvel ${imovelId}:`, error);
  }
};

interface Imovel {
  id: number
  codigo?: number
  titulo: string
  tipo: string
  status: string
  preco: number
  cidade: string
  estado: string
  quartos?: number
  banheiros?: number
  area_total?: number
  created_at: string
}

export default function AdminImoveisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalImoveis, setTotalImoveis] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [tipoFilter, setTipoFilter] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncingImovelId, setSyncingImovelId] = useState<number | null>(null)
  const [syncProgress, setSyncProgress] = useState<string>('')
  const [syncStep, setSyncStep] = useState<number>(0)
  const [totalSteps] = useState<number>(6)
  const [isSyncingIndividual, setIsSyncingIndividual] = useState(false)
  const [showFullSyncModal, setShowFullSyncModal] = useState(false)
  const [fullSyncProgress, setFullSyncProgress] = useState({ current: 0, total: 0, currentImovel: '', successCount: 0, errorCount: 0, errors: [] as string[] })

  const fetchImoveis = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (tipoFilter) params.append('tipo', tipoFilter)
      if (searchTerm) params.append('search', searchTerm)

      params.append('page', currentPage.toString())
      params.append('limit', '10')
      
      const response = await fetchAuthApi(`admin/imoveis?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setImoveis(data.imoveis)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalImoveis(data.pagination?.total || 0)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, tipoFilter, router, searchTerm, currentPage])

  useEffect(() => {
    fetchImoveis()
  }, [statusFilter, tipoFilter, fetchImoveis])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchImoveis()
  }

  const handleDelete = async (id: number, titulo: string) => {
    // Confirmação de exclusão com toast
    toast((t) => (
      <div className="p-2">
        <p className="font-medium mb-2">Confirmar exclusão</p>
        <p className="text-sm mb-4">Tem certeza que deseja excluir o imóvel &apos;{titulo}&apos;?</p>
        <div className="flex space-x-2">
          <button
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
            onClick={() => {
              toast.dismiss(t.id)
              confirmDelete(id)
            }}
          >
            Excluir
          </button>
          <button
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 })
  }

  const confirmDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/imoveis/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Erro ao excluir imóvel')
      }

      toast.success('Imóvel excluído com sucesso!')
      setImoveis(imoveis.filter(imovel => imovel.id !== id))
    } catch (err: any) {
      console.error('Erro ao excluir imóvel:', err)
      toast.error(err.message || 'Erro ao excluir imóvel')
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setShowFullSyncModal(true)
    setFullSyncProgress({ current: 0, total: 0, currentImovel: 'Iniciando...', successCount: 0, errorCount: 0, errors: [] })
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        setIsSyncing(false)
        setShowFullSyncModal(false)
        return
      }

      // Buscar todos os imóveis para sincronizar (sem limite)
      const response = await fetch('/api/imoveis?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Erro ao buscar lista de imóveis')
      }
      
      const imoveisData = await response.json()
      console.log('📊 Dados recebidos da API:', imoveisData)
      const imoveis = imoveisData?.data?.imoveis || []
      const totalImoveis = imoveis.length
      console.log(`📋 Total de imóveis encontrados: ${totalImoveis}`)
      
      if (totalImoveis === 0) {
        toast('Nenhum imóvel para sincronizar')
        setIsSyncing(false)
        setShowFullSyncModal(false)
        return
      }

      setFullSyncProgress(prev => ({ ...prev, total: totalImoveis, currentImovel: 'Preparando sincronização...' }))
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Sincronizar cada imóvel individualmente usando o endpoint individual
      for (let i = 0; i < imoveis.length; i++) {
        const imovel = imoveis[i]
        
        setFullSyncProgress(prev => ({
          ...prev,
          current: i + 1,
          currentImovel: imovel.titulo || `Imóvel ${i + 1}`
        }))

        try {
          console.log(`🔄 Iniciando sincronização do imóvel ${imovel.id} - Título: ${imovel.titulo}`)
          const response = await fetch(`/api/sync-imoveis/${imovel.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          })

          console.log(`📊 Resposta da API para imóvel ${imovel.id}:`, response.status, response.statusText)
          
          if (response.ok) {
            const result = await response.json()
            console.log(`✅ Sucesso na sincronização do imóvel ${imovel.id} - ${imovel.titulo}:`, result)
            successCount++
          } else {
            const errorData = await response.text()
            console.error(`❌ ERRO na sincronização do imóvel ${imovel.id} - ${imovel.titulo}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            })
            toast.error(`Erro no imóvel ${imovel.id} - ${imovel.titulo}: ${response.statusText}`)
            errorCount++
            errors.push(`Imóvel ${imovel.id} (${imovel.titulo}): ${response.statusText} - ${errorData}`)
          }
        } catch (error) {
          console.error(`🔌 ERRO DE CONEXÃO para imóvel ${imovel.id} - ${imovel.titulo}:`, error)       
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          toast.error(`Erro de conexão no imóvel ${imovel.id} - ${imovel.titulo}: ${errorMessage}`)    
          errorCount++
          errors.push(`Imóvel ${imovel.id} (${imovel.titulo}): Erro de conexão - ${errorMessage}`)
        }

        // Pequena pausa para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Atualizar progresso final
      setFullSyncProgress(prev => ({
        ...prev,
        current: totalImoveis,
        currentImovel: 'Concluído!',
        successCount,
        errorCount,
        errors
      }))

      if (errorCount === 0) {
        toast.success(`Sincronização concluída: ${successCount} imóveis sincronizados`)
      } else {
        toast.error(`Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`)
      }
      
      // Recarregar a lista de imóveis após sincronização
      setTimeout(() => {
        fetchImoveis()
        setShowFullSyncModal(false)
      }, 2000)
      
    } catch (error) {
      console.error('Erro ao conectar com o servidor:', error)
      setFullSyncProgress(prev => ({
        ...prev,
        currentImovel: 'Erro de conexão',
        errorCount: 1,
        errors: ['Erro ao conectar com o servidor']
      }))
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncIndividual = (imovelId: number, titulo: string) => {
    // Confirmação de sincronização com toast
    toast((t) => (
      <div className="p-2">
        <p className="font-medium mb-2">Confirmar sincronização</p>
        <p className="text-sm mb-4">Deseja sincronizar o imóvel &quot;{titulo}&quot; com o Strapi?</p>
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            onClick={() => {
              toast.dismiss(t.id)
              confirmSyncIndividual(imovelId, titulo)
            }}
          >
            Sincronizar
          </button>
          <button
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 text-sm"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 })
  }

  const confirmSyncIndividual = async (imovelId: number, titulo: string) => {
    setSyncingImovelId(imovelId)
    setShowSyncModal(true)
    setIsSyncingIndividual(true)
    setSyncStep(0)
    setSyncProgress('🚀 Iniciando sincronização...')
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Token de autenticação não encontrado')
        setShowSyncModal(false)
        setIsSyncingIndividual(false)
        return
      }

      setSyncStep(1)
      setSyncProgress('🔗 Conectando com o servidor...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSyncStep(2)
      setSyncProgress('📋 Buscando dados do imóvel...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await fetch(`/api/sync-imoveis/${imovelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      setSyncStep(3)
      setSyncProgress('📤 Enviando dados para o Strapi...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSyncStep(4)
      setSyncProgress('📸 Processando imagens...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setSyncStep(5)
      setSyncProgress('🎥 Processando vídeos...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result = await response.json()
      
      if (response.ok) {
        setSyncStep(6)
        setSyncProgress('✅ Sincronização concluída com sucesso!')
        toast.success(`Imóvel '${titulo}' sincronizado com sucesso!`)
        
        // Recarregar a lista de imóveis após sincronização
        setTimeout(() => {
          fetchImoveis()
          setShowSyncModal(false)
          setSyncingImovelId(null)
          setSyncStep(0)
        }, 2000)
      } else {
        setSyncProgress(`❌ Erro: ${result.error || 'Erro desconhecido'}`)
        toast.error(`Erro na sincronização: ${result.error || 'Erro desconhecido'}`)
        
        setTimeout(() => {
          setShowSyncModal(false)
          setSyncingImovelId(null)
          setSyncStep(0)
        }, 3000)
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor:', error)
      setSyncProgress('❌ Erro ao conectar com o servidor')
      toast.error('Erro ao conectar com o servidor')
      
      setTimeout(() => {
        setShowSyncModal(false)
        setSyncingImovelId(null)
        setSyncStep(0)
      }, 3000)
    } finally {
      setIsSyncingIndividual(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      disponivel: 'bg-green-100 text-green-800',
      vendido: 'bg-red-100 text-red-800',
      alugado: 'bg-blue-100 text-blue-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading || authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Imóveis</h1>
            <p className="text-gray-600">Visualize e gerencie todos os imóveis cadastrados</p>
          </div>
          <div className="flex space-x-3">
            {isAdmin && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Sincronizar Strapi</span>
                  </>
                )}
                </button>
            )}
            <Link
              href="/admin/imoveis/cadastrar"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Imóvel</span>
            </Link>
          </div>
        </div>

        {/* Resultado da sincronização */}
        {syncResult && (
          <div className={`p-4 rounded-md ${syncResult.includes('Erro') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {syncResult}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Título, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos os status</option>
                <option value="disponivel">Disponível</option>
                <option value="vendido">Vendido</option>
                <option value="alugado">Alugado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos os tipos</option>
                <option value="casa">Casa</option>
                <option value="apartamento">Apartamento</option>
                <option value="terreno">Terreno</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filtrar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Imóveis */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          {imoveis.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum imóvel encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imóvel
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Tipo
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Preço
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Localização
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {imoveis.map((imovel) => (
                    <tr key={imovel.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap w-20">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {formatImovelId(imovel.codigo)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {imovel.titulo}
                          </div>
                          <div className="text-xs text-gray-500">
                            {imovel.quartos && `${imovel.quartos}q`}
                            {imovel.banheiros && ` • ${imovel.banheiros}b`}
                            {imovel.area_total && ` • ${imovel.area_total}m²`}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap w-24">
                        <span className="capitalize text-sm text-gray-900">
                          {imovel.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap w-28">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(imovel.status)}`}>
                          {imovel.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 w-32">
                        {formatPrice(imovel.preco)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 w-40">
                        <div className="truncate">
                          {imovel.cidade}, {imovel.estado}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium w-24">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => router.push(`/admin/imoveis/${imovel.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/imoveis/${imovel.id}/editar`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleSyncIndividual(imovel.id, imovel.titulo)}
                              className="text-green-600 hover:text-green-900"
                              title="Sincronizar com Strapi"
                              disabled={isSyncingIndividual && syncingImovelId === imovel.id}
                            >
                              <RefreshCw className={`w-4 h-4 ${isSyncingIndividual && syncingImovelId === imovel.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(imovel.id, imovel.titulo)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                  {' '}até{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, totalImoveis)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{totalImoveis}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Próximo</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Progresso da Sincronização Individual */}
        {showSyncModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="text-center">
                <div className="mb-4">
                  <RefreshCw className={`w-12 h-12 mx-auto text-blue-500 ${isSyncingIndividual ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sincronizando Imóvel
                </h3>
                
                {/* Barra de Progresso */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progresso</span>
                    <span>{syncStep}/{totalSteps}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(syncStep / totalSteps) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 min-h-[20px]">
                  {syncProgress}
                </p>
                
                {/* Lista de Passos */}
                <div className="text-left mb-4">
                  <div className="space-y-2 text-xs">
                    {[
                      '🚀 Iniciando sincronização',
                      '🔗 Conectando com servidor',
                      '📋 Buscando dados do imóvel',
                      '📤 Enviando dados para Strapi',
                      '📸 Processando imagens',
                      '🎥 Processando vídeos'
                    ].map((step, index) => (
                      <div key={index} className={`flex items-center space-x-2 ${
                        index < syncStep ? 'text-green-600' : 
                        index === syncStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          index < syncStep ? 'bg-green-500' :
                          index === syncStep ? 'bg-blue-500' : 'bg-gray-300'
                        }`}></div>
                        <span>{step}</span>
                        {index < syncStep && <span className="text-green-500">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
                
                {!isSyncingIndividual && (
                  <button
                    onClick={() => {
                      setShowSyncModal(false)
                      setSyncingImovelId(null)
                      setSyncProgress('')
                      setSyncStep(0)
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Progresso da Sincronização Completa */}
        <SyncModal
          isOpen={showFullSyncModal}
          onClose={() => setShowFullSyncModal(false)}
          progress={fullSyncProgress}
          isComplete={!isSyncing && fullSyncProgress.current > 0}
        />
      </div>
    </AdminLayout>
  )
}