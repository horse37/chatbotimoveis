'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building, Users, MessageSquare, TrendingUp, Eye, Plus, Calendar, DollarSign } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DashboardStats {
  imoveis: {
    total: number
    ativos: number
    vendidos: number
    inativos: number
  }
  corretores: {
    total: number
    ativos: number
    inativos: number
  }
  contatos: {
    total: number
    novos: number
    em_andamento: number
    respondidos: number
    finalizados: number
  }
  vendas: {
    mes_atual: number
    mes_anterior: number
    total_ano: number
  }
}

interface RecentActivity {
  id: number
  tipo: 'imovel' | 'contato' | 'corretor'
  titulo: string
  descricao: string
  data: string
  status?: string
}

interface TopImovel {
  id: number
  titulo: string
  preco: number
  visualizacoes: number
  contatos: number
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [topImoveis, setTopImoveis] = useState<TopImovel[]>([])

  // Buscar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar dados do dashboard')
        }

        const data = await response.json()
        setStats(data.stats)
        setRecentActivities(data.recentActivities || [])
        setTopImoveis(data.topImoveis || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'imovel':
        return <Building className="h-4 w-4" />
      case 'contato':
        return <MessageSquare className="h-4 w-4" />
      case 'corretor':
        return <Users className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'novo':
        return 'bg-green-100 text-green-800'
      case 'inativo':
      case 'finalizado':
        return 'bg-gray-100 text-gray-800'
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800'
      case 'respondido':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral do sistema imobiliário</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => router.push('/admin/imoveis/novo')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Imóvel
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {stats && (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Imóveis */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Imóveis</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.imoveis.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.imoveis.ativos} ativos • {stats.imoveis.vendidos} vendidos
                  </div>
                </CardContent>
              </Card>

              {/* Corretores */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Corretores</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.corretores.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.corretores.ativos} ativos • {stats.corretores.inativos} inativos
                  </div>
                </CardContent>
              </Card>

              {/* Contatos */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.contatos.total}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.contatos.novos} novos • {stats.contatos.em_andamento} em andamento
                  </div>
                </CardContent>
              </Card>

              {/* Vendas */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.vendas.mes_atual}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stats.vendas.mes_atual > stats.vendas.mes_anterior ? '+' : ''}
                    {((stats.vendas.mes_atual - stats.vendas.mes_anterior) / (stats.vendas.mes_anterior || 1) * 100).toFixed(1)}% vs mês anterior
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribuição de Imóveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Imóveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Ativos</span>
                      </div>
                      <span className="text-sm font-medium">{stats.imoveis.ativos}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Vendidos</span>
                      </div>
                      <span className="text-sm font-medium">{stats.imoveis.vendidos}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm">Inativos</span>
                      </div>
                      <span className="text-sm font-medium">{stats.imoveis.inativos}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status dos Contatos */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Contatos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Novos</span>
                      </div>
                      <span className="text-sm font-medium">{stats.contatos.novos}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Em Andamento</span>
                      </div>
                      <span className="text-sm font-medium">{stats.contatos.em_andamento}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Respondidos</span>
                      </div>
                      <span className="text-sm font-medium">{stats.contatos.respondidos}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Finalizados</span>
                      </div>
                      <span className="text-sm font-medium">{stats.contatos.finalizados}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Seção Inferior */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Imóveis Mais Visualizados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Imóveis Mais Visualizados</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/admin/imoveis')}
                    >
                      Ver Todos
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topImoveis.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
                  ) : (
                    <div className="space-y-4">
                      {topImoveis.map((imovel, index) => (
                        <div key={imovel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">{imovel.titulo}</h4>
                            <p className="text-sm text-gray-600">
                              R$ {imovel.preco.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Eye className="h-4 w-4" />
                              <span>{imovel.visualizacoes}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MessageSquare className="h-4 w-4" />
                              <span>{imovel.contatos}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Atividades Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividades Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivities.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {getActivityIcon(activity.tipo)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.titulo}</p>
                            <p className="text-sm text-gray-600">{activity.descricao}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-500">
                                {new Date(activity.data).toLocaleString('pt-BR')}
                              </p>
                              {activity.status && (
                                <Badge className={getStatusColor(activity.status)}>
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}