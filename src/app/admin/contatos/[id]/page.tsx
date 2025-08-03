'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Calendar, User, Building, MessageSquare, Edit, Trash2 } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Contato {
  id: number
  nome: string
  email: string
  telefone: string
  mensagem: string
  imovel_id?: number
  imovel_titulo?: string
  imovel_preco?: number
  imovel_endereco?: string
  status: 'novo' | 'em_andamento' | 'respondido' | 'finalizado'
  observacoes?: string
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

export default function DetalhesContato() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [contato, setContato] = useState<Contato | null>(null)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Buscar dados do contato
  useEffect(() => {
    const fetchContato = async () => {
      try {
        const response = await fetch(`/api/admin/contatos/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do contato')
        }

        const data = await response.json()
        setContato(data.contato)
        setNewStatus(data.contato.status)
        setObservacoes(data.contato.observacoes || '')
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do contato')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchContato()
    }
  }, [params.id])

  const handleStatusUpdate = async () => {
    if (!contato) return

    try {
      const response = await fetch(`/api/admin/contatos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: newStatus,
          observacoes
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar contato')
      }

      const data = await response.json()
      setContato(data.contato)
      setEditingStatus(false)
      setSuccess('Contato atualizado com sucesso!')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar contato')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/contatos/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir contato')
      }

      router.push('/admin/contatos')
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir contato')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados do contato...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!contato) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contato não encontrado</h2>
          <Button onClick={() => router.push('/admin/contatos')}>
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
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Contato</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setEditingStatus(!editingStatus)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editingStatus ? 'Cancelar' : 'Editar Status'}
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
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-red-800">
                  Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
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
            {/* Dados do Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Informações do Contato</span>
                  </div>
                  <Badge className={statusColors[contato.status]}>
                    {statusLabels[contato.status]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{contato.nome}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{contato.email}</span>
                  </div>
                  
                  {contato.telefone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <span className="text-sm font-medium">{contato.telefone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Recebido em:</span>
                    <span className="text-sm font-medium">
                      {new Date(contato.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Atualizado em:</span>
                    <span className="text-sm font-medium">
                      {new Date(contato.updated_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mensagem */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Mensagem</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{contato.mensagem}</p>
                </div>
              </CardContent>
            </Card>

            {/* Imóvel de Interesse */}
            {contato.imovel_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Imóvel de Interesse</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">{contato.imovel_titulo}</h3>
                    {contato.imovel_preco && (
                      <p className="text-lg font-semibold text-green-600">
                        R$ {contato.imovel_preco.toLocaleString('pt-BR')}
                      </p>
                    )}
                    {contato.imovel_endereco && (
                      <p className="text-sm text-gray-600">{contato.imovel_endereco}</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/imoveis/${contato.imovel_id}`)}
                    >
                      Ver Imóvel
                    </Button>
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
                  onClick={() => window.open(`mailto:${contato.email}`)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
                
                {contato.telefone && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${contato.telefone}`)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                )}
                
                <div className="relative group">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={() => window.open('https://wa.me/5543991334100')}
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-b border-gray-100 text-left"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                      (43) 99133-4100
                    </button>
                    <button
                      onClick={() => window.open('https://wa.me/5543991439947')}
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-b border-gray-100 text-left"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                      (43) 99143-9947
                    </button>
                    <button
                      onClick={() => window.open('https://wa.me/5543999833258')}
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-b border-gray-100 text-left"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                      (43) 99983-3258
                    </button>
                    <button
                      onClick={() => window.open('https://wa.me/5543999844526')}
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors text-left"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                      (43) 99984-4526
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciar Status */}
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingStatus ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="novo">Novo</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="respondido">Respondido</option>
                        <option value="finalizado">Finalizado</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Adicione observações sobre este contato..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleStatusUpdate}
                        className="flex-1"
                      >
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingStatus(false)
                          setNewStatus(contato.status)
                          setObservacoes(contato.observacoes || '')
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status Atual</Label>
                      <p className="text-sm">
                        <Badge className={statusColors[contato.status]}>
                          {statusLabels[contato.status]}
                        </Badge>
                      </p>
                    </div>
                    
                    {contato.observacoes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Observações</Label>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                          {contato.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}