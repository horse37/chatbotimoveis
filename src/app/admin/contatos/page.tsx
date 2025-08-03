'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Eye, Trash2, Mail, Phone, Calendar, User, Building, MessageSquare } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import toast from 'react-hot-toast'
import { fetchAuthApi } from '@/lib/api'

interface Contato {
  id: number
  nome: string
  email: string
  telefone: string
  mensagem: string
  imovel_id?: number
  imovel_titulo?: string
  status: 'novo' | 'em_andamento' | 'respondido' | 'finalizado'
  created_at: string
  updated_at: string
}

const statusLabels = {
  novo: 'Novo',
  em_andamento: 'Em Andamento',
  respondido: 'Respondido',
  finalizado: 'Finalizado'
}

const statusColors = {
  novo: 'bg-red-100 text-red-800',
  em_andamento: 'bg-yellow-100 text-yellow-800',
  respondido: 'bg-blue-100 text-blue-800',
  finalizado: 'bg-green-100 text-green-800'
}

export default function Contatos() {
  const router = useRouter()
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    novos: 0,
    em_andamento: 0,
    respondidos: 0,
    finalizados: 0
  })

  // Buscar contatos
  const fetchContatos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetchAuthApi(`admin/contatos?${params}`)

      if (!response.ok) {
        throw new Error('Erro ao buscar contatos')
      }

      const data = await response.json()
      setContatos(data.contatos)
      setTotalPages(data.totalPages)
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter])

  useEffect(() => {
    fetchContatos()
  }, [fetchContatos])

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetchAuthApi(`admin/contatos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      // Atualizar lista
      fetchContatos()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status')
    }
  }

  const handleDelete = async (id: number, nome: string) => {
    // Confirmação de exclusão com toast
    toast((t) => (
      <div className="p-2">
        <p className="font-medium mb-2">Confirmar exclusão</p>
        <p className="text-sm mb-4">Tem certeza que deseja excluir o contato &apos;{nome}&apos;?</p>
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
      const response = await fetchAuthApi(`admin/contatos/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Erro ao excluir contato')
      }

      toast.success('Contato excluído com sucesso!')
      fetchContatos()
    } catch (err: any) {
      console.error('Erro ao excluir contato:', err)
      toast.error(err.message || 'Erro ao excluir contato')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Contatos e Leads</h1>
          <Button
            onClick={() => router.push('/admin/contatos/novo')}
          >
            Novo Contato
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.novos}</div>
                <div className="text-sm text-gray-600">Novos</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.em_andamento}</div>
                <div className="text-sm text-gray-600">Em Andamento</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.respondidos}</div>
                <div className="text-sm text-gray-600">Respondidos</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.finalizados}</div>
                <div className="text-sm text-gray-600">Finalizados</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os Status</option>
                  <option value="novo">Novo</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="respondido">Respondido</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de Contatos */}
        <Card>
          <CardHeader>
            <CardTitle>Contatos ({stats.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando contatos...</span>
              </div>
            ) : contatos.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contato encontrado</h3>
                <p className="text-gray-600">Não há contatos que correspondam aos filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contatos.map((contato) => (
                  <div key={contato.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{contato.nome}</h3>
                          <Badge className={statusColors[contato.status]}>
                            {statusLabels[contato.status]}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{contato.email}</span>
                          </div>
                          
                          {contato.telefone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{contato.telefone}</span>
                            </div>
                          )}
                          
                          {contato.imovel_titulo && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>Interesse em: {contato.imovel_titulo}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(contato.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm text-gray-700">{contato.mensagem}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <select
                          value={contato.status}
                          onChange={(e) => handleStatusChange(contato.id, e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="novo">Novo</option>
                          <option value="em_andamento">Em Andamento</option>
                          <option value="respondido">Respondido</option>
                          <option value="finalizado">Finalizado</option>
                        </select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/contatos/${contato.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`mailto:${contato.email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        
                        {contato.telefone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`tel:${contato.telefone}`)}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(contato.id, contato.nome)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}