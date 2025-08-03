'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building, Users, MessageSquare, TrendingUp, Plus, Eye, Edit } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { fetchAuthApi } from '@/lib/api'



interface DashboardStats {
  totalImoveis: number
  imoveisDisponiveis: number
  totalCorretores: number
  mensagensPendentes: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalImoveis: 0,
    imoveisDisponiveis: 0,
    totalCorretores: 0,
    mensagensPendentes: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchAuthApi('admin/stats')

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Se a resposta não for bem-sucedida, verificar se é um erro de autenticação
        if (response.status === 401) {
          console.error('Erro de autenticação ao buscar estatísticas')
          localStorage.removeItem('token')
          router.push('/login')
          return
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchStats()
  }, [fetchStats, router])

  const statCards = [
    {
      title: 'Total de Imóveis',
      value: stats.totalImoveis,
      icon: Building,
      color: 'bg-blue-500',
      href: '/admin/imoveis',
    },
    {
      title: 'Disponíveis',
      value: stats.imoveisDisponiveis,
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/admin/imoveis?status=disponivel',
    },
    {
      title: 'Corretores',
      value: stats.totalCorretores,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/corretores',
    },
    {
      title: 'Mensagens Pendentes',
      value: stats.mensagensPendentes,
      icon: MessageSquare,
      color: 'bg-orange-500',
      href: '/admin/contatos?status=pendente',
    },
  ]

  const quickActions = [
    {
      title: 'Cadastrar Imóvel',
      description: 'Adicionar novo imóvel ao sistema',
      icon: Plus,
      href: '/admin/imoveis/cadastrar',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Ver Imóveis',
      description: 'Gerenciar imóveis cadastrados',
      icon: Eye,
      href: '/admin/imoveis',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Gerenciar Corretores',
      description: 'Administrar equipe de corretores',
      icon: Edit,
      href: '/admin/corretores',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ]

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 opacity-90"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full" style={{backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.05) 2px, transparent 0)', backgroundSize: '50px 50px'}}></div>
          </div>
          <div className="relative px-6 py-12 sm:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                  Dashboard Administrativo
                </h1>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                  Gerencie seu sistema imobiliário com eficiência e controle total
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                    <span className="text-sm font-medium">Última atualização: Agora</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                    <span className="text-sm font-medium">Status: Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="relative -mt-8 px-6 sm:px-8 lg:px-12 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {statCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => router.push(card.href)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-5">
                      <Icon className="w-full h-full text-gray-900" />
                    </div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div className={`${card.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                            {card.value}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">
                            {card.value === 1 ? card.title.slice(0, -1) : card.title}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                          {card.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Clique para gerenciar
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="px-6 sm:px-8 lg:px-12 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Acesse rapidamente as funcionalidades mais utilizadas do sistema
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.title}
                    onClick={() => router.push(action.href)}
                    className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
                    style={{ animationDelay: `${(index + 4) * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style={{ background: action.color.includes('blue') ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
                                              action.color.includes('green') ? 'linear-gradient(135deg, #10b981, #059669)' : 
                                              'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`${action.color.split(' ')[0]} p-4 rounded-xl shadow-lg group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300`}>
                          <Icon className="w-8 h-8 text-white group-hover:text-white" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors duration-300">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 group-hover:text-white/90 leading-relaxed transition-colors duration-300">
                        {action.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}