'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Eye, UserCheck, UserX } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { fetchAuthApi } from '@/lib/api'

interface Corretor {
  id: number
  nome: string
  email: string
  creci: string
  telefone: string
  foto: string
  ativo: boolean
  role: string
  created_at: string
}

export default function Corretores() {
  const router = useRouter()
  const [corretores, setCorretores] = useState<Corretor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  useEffect(() => {
    // Obter o papel e ID do usuário atual do token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserRole(payload.role)
        setCurrentUserId(payload.id)
      } catch (error) {
        console.error('Erro ao decodificar token:', error)
      }
    }
  }, [])

  const fetchCorretores = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'todos') params.append('status', statusFilter)

      const response = await fetchAuthApi(`admin/corretores?${params}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar corretores')
      }

      const data = await response.json()
      // Garantir que corretores seja sempre um array
      const corretoresData = Array.isArray(data.corretores) ? data.corretores : (data.corretores?.rows || [])
      
      // Processar os dados dos corretores para converter Buffer em string
      const processedCorretores = corretoresData.map((corretor: any) => {
        if (corretor.foto && typeof corretor.foto === 'object' && corretor.foto.type === 'Buffer') {
          // Converter Buffer para string
          let fotoPath = Buffer.from(corretor.foto.data).toString('utf8')
          
          // Remover o prefixo '/uploads/corretores/' se existir
          const prefix = '/uploads/corretores/'
          if (fotoPath.startsWith(prefix)) {
            fotoPath = fotoPath.substring(prefix.length)
            console.log('Caminho ajustado:', fotoPath)
          }
          
          return { ...corretor, foto: fotoPath }
        }
        return corretor
      })
      
      console.log('Corretores processados:', processedCorretores)
      
      // Se não for admin, mostrar apenas o próprio cadastro
      let filteredCorretores = processedCorretores
      if (currentUserRole !== 'admin' && currentUserId) {
        filteredCorretores = processedCorretores.filter((corretor: any) => corretor.id === currentUserId)
      }
      
      setCorretores(filteredCorretores)
    } catch (err) {
      setError('Erro ao carregar corretores')
      toast.error('Erro ao carregar corretores')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, currentUserRole, currentUserId])

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetchAuthApi(`admin/corretores/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      toast.success('Status atualizado com sucesso!')
      fetchCorretores()
    } catch (err) {
      toast.error('Erro ao atualizar status do corretor')
    }
  }

  const handleDelete = async (id: number, nome: string) => {
    // Verificar se o usuário é admin
    if (currentUserRole !== 'admin') {
      toast.error('Apenas administradores podem excluir corretores', {
        duration: 4000,
        icon: '🔒',
      })
      return
    }

    // Confirmação de exclusão com toast
    toast((t) => (
      <div className="p-2">
        <p className="font-medium mb-2">Confirmar exclusão</p>
        <p className="text-sm mb-4">Tem certeza que deseja excluir o corretor &apos;{nome}&apos;?</p>
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
      const response = await fetchAuthApi(`admin/corretores/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Erro ao excluir corretor')
      }

      toast.success('Corretor excluído com sucesso!')
      fetchCorretores()
    } catch (err: any) {
      console.error('Erro ao excluir corretor:', err)
      toast.error(err.message || 'Erro ao excluir corretor')
    }
  }

  useEffect(() => {
    if (currentUserRole !== null) {
      fetchCorretores()
    }
  }, [searchTerm, statusFilter, currentUserRole, currentUserId, fetchCorretores])

  const filteredCorretores = corretores.filter(corretor => {
    const matchesSearch = corretor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corretor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corretor.creci.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || 
                         (statusFilter === 'ativo' && corretor.ativo) ||
                         (statusFilter === 'inativo' && !corretor.ativo)
    
    return matchesSearch && matchesStatus
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Corretores</h1>
          {/* Apenas admin pode cadastrar novos corretores */}
          {currentUserRole === 'admin' && (
            <Button onClick={() => router.push('/admin/corretores/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Corretor
            </Button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou CRECI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Corretores */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCorretores.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum corretor encontrado.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredCorretores.map((corretor) => (
                <Card key={corretor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Foto do Corretor */}
                        <div className="relative w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                          {corretor.foto ? (
                            <Image
                              src={corretor.foto.startsWith('http') || corretor.foto.startsWith('/uploads') ? corretor.foto : `/uploads/corretores/${corretor.foto}`}
                              alt={corretor.nome}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('Erro ao carregar foto:', corretor.foto)
                                console.log('URL final:', e.currentTarget.src)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xl font-semibold">
                                {corretor.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Informações do Corretor */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {corretor.nome}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              corretor.ativo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {corretor.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              corretor.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : corretor.role === 'corretor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {corretor.role === 'admin' ? 'Administrador' : 
                               corretor.role === 'corretor' ? 'Corretor' : 'Assistente'}
                            </span>
                          </div>
                          
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600">
                              <strong>Email:</strong> {corretor.email}
                            </p>
                            {corretor.creci && (
                              <p className="text-sm text-gray-600">
                                <strong>CRECI:</strong> {corretor.creci}
                              </p>
                            )}
                            {corretor.telefone && (
                              <p className="text-sm text-gray-600">
                                <strong>Telefone:</strong> {corretor.telefone}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              <strong>Cadastrado em:</strong> {new Date(corretor.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        {/* Visualizar - todos podem ver */}
                        {(currentUserRole === 'admin' || currentUserId === corretor.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/corretores/${corretor.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Editar - admin pode editar todos, corretor só o próprio */}
                        {(currentUserRole === 'admin' || currentUserId === corretor.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/corretores/${corretor.id}/editar`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Ativar/Desativar - apenas admin */}
                        {currentUserRole === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(corretor.id, corretor.ativo)}
                            className={corretor.ativo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          >
                            {corretor.ativo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        )}
                        
                        {/* Excluir - apenas admin e não pode excluir a si mesmo */}
                        {currentUserRole === 'admin' && currentUserId !== corretor.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(corretor.id, corretor.nome)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total de Corretores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{corretores.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Corretores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {corretores.filter(c => c.ativo).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {corretores.filter(c => c.role === 'admin').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}