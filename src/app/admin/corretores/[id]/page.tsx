'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, User, Shield, Building } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

interface Corretor {
  id: number
  nome: string
  email: string
  creci: string
  telefone: string
  role: string
  ativo: boolean
  foto: string | null
  created_at: string
  updated_at: string
  stats?: {
    total_imoveis: number
    imoveis_ativos: number
    imoveis_vendidos: number
    total_leads: number
  }
}

const roleLabels: { [key: string]: string } = {
  admin: 'Administrador',
  corretor: 'Corretor',
  assistente: 'Assistente'
}

export default function DetalhesCorretor() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [corretor, setCorretor] = useState<Corretor | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Buscar dados do corretor
  useEffect(() => {
    const fetchCorretor = async () => {
      try {
        const response = await fetch(`/api/admin/corretores/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do corretor')
        }

        const data = await response.json()
        
        // Processar o campo foto se for um Buffer
        let processedCorretor = data.corretor
        if (processedCorretor.foto && typeof processedCorretor.foto === 'object' && processedCorretor.foto.type === 'Buffer') {
          let fotoPath = Buffer.from(processedCorretor.foto.data).toString('utf8')
          
          // Remover o prefixo '/uploads/corretores/' se existir
          const prefix = '/uploads/corretores/'
          if (fotoPath.startsWith(prefix)) {
            fotoPath = fotoPath.substring(prefix.length)
          }
          
          processedCorretor = { ...processedCorretor, foto: fotoPath }
        }
        
        setCorretor(processedCorretor)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do corretor')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCorretor()
    }
  }, [params.id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/corretores/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir corretor')
      }

      router.push('/admin/corretores')
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir corretor')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const toggleStatus = async () => {
    if (!corretor) return

    try {
      const response = await fetch(`/api/admin/corretores/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...corretor,
          ativo: !corretor.ativo
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao alterar status do corretor')
      }

      setCorretor(prev => prev ? { ...prev, ativo: !prev.ativo } : null)
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status do corretor')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do corretor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!corretor) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Corretor não encontrado</h2>
          <Button onClick={() => router.push('/admin/corretores')}>
            Voltar para Lista
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Corretor</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={toggleStatus}
            >
              {corretor.ativo ? 'Inativar' : 'Ativar'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/corretores/${params.id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-red-800">
                  Tem certeza que deseja excluir este corretor? Esta ação não pode ser desfeita.
                </span>
                <div className="flex space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Excluindo...' : 'Confirmar'}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                    {corretor.foto ? (
                      <Image
                        src={corretor.foto.startsWith('http') || corretor.foto.startsWith('/uploads') ? corretor.foto : `/uploads/corretores/${corretor.foto}`}
                        alt={corretor.nome}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Erro ao carregar:', corretor.foto)
                          // Esconder a imagem em caso de erro
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{corretor.nome}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={corretor.ativo ? 'default' : 'secondary'}>
                        {corretor.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">
                        {roleLabels[corretor.role] || corretor.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{corretor.email}</span>
                  </div>
                  
                  {corretor.telefone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <span className="text-sm font-medium">{corretor.telefone}</span>
                    </div>
                  )}
                  
                  {corretor.creci && (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">CRECI:</span>
                      <span className="text-sm font-medium">{corretor.creci}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Cadastrado em:</span>
                    <span className="text-sm font-medium">
                      {new Date(corretor.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            {corretor.stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Estatísticas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {corretor.stats.total_imoveis}
                      </div>
                      <div className="text-sm text-gray-600">Total de Imóveis</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {corretor.stats.imoveis_ativos}
                      </div>
                      <div className="text-sm text-gray-600">Imóveis Ativos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {corretor.stats.imoveis_vendidos}
                      </div>
                      <div className="text-sm text-gray-600">Imóveis Vendidos</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {corretor.stats.total_leads}
                      </div>
                      <div className="text-sm text-gray-600">Total de Leads</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/imoveis?corretor=${corretor.id}`)}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Ver Imóveis
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${corretor.email}`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
                
                {corretor.telefone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${corretor.telefone}`)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">ID do Usuário</Label>
                  <p className="text-sm">{corretor.id}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tipo de Usuário</Label>
                  <p className="text-sm">{roleLabels[corretor.role] || corretor.role}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="text-sm">
                    <Badge variant={corretor.ativo ? 'default' : 'secondary'}>
                      {corretor.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Última Atualização</Label>
                  <p className="text-sm">
                    {new Date(corretor.updated_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}