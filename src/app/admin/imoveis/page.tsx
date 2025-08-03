'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import toast from 'react-hot-toast'
import { fetchAuthApi } from '@/lib/api'
import { formatImovelId } from '@/lib/utils'

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
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [tipoFilter, setTipoFilter] = useState('')

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

      const response = await fetchAuthApi(`admin/imoveis?${params.toString()}`)

      if (response.ok) {
        const data = await response.json()
        setImoveis(data.imoveis)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, tipoFilter, router, searchTerm])

  useEffect(() => {
    fetchImoveis()
  }, [statusFilter, tipoFilter, fetchImoveis])

  const handleSearch = () => {
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

  if (loading) {
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
          <Link
            href="/admin/imoveis/cadastrar"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Imóvel</span>
          </Link>
        </div>

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
      </div>
    </AdminLayout>
  )
}