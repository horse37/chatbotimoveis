'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface User {
  id: number
  nome: string
  email: string
  role: string
  telefone?: string
  creci?: string
  ativo: boolean
  created_at: string
  stats?: {
    total_imoveis: number
    imoveis_ativos: number
    imoveis_vendidos: number
    total_contatos: number
  }
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData({
          nome: data.user.nome,
          email: data.user.email,
          telefone: data.user.telefone || '',
          senha_atual: '',
          nova_senha: '',
          confirmar_senha: ''
        })
      } else {
        toast.error('Erro ao carregar dados do perfil')
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      toast.error('Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.nova_senha && formData.nova_senha !== formData.confirmar_senha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.nova_senha && formData.nova_senha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setUpdating(true)

    try {
      const token = localStorage.getItem('admin_token')
      const updateData: any = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone
      }

      if (formData.nova_senha) {
        updateData.senha_atual = formData.senha_atual
        updateData.nova_senha = formData.nova_senha
      }

      const response = await fetch(`/api/admin/corretores/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!')
        setEditMode(false)
        setFormData({
          ...formData,
          senha_atual: '',
          nova_senha: '',
          confirmar_senha: ''
        })
        fetchUserData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setUpdating(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar dados do perfil</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Perfil */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Informações Pessoais</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {editMode ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <hr className="my-6" />

                <h3 className="text-md font-medium text-gray-900 mb-4">Alterar Senha</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    name="senha_atual"
                    value={formData.senha_atual}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    name="nova_senha"
                    value={formData.nova_senha}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    name="confirmar_senha"
                    value={formData.confirmar_senha}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {updating ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-gray-900">{user.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">E-mail</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Telefone</label>
                  <p className="text-gray-900">{user.telefone || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">CRECI</label>
                  <p className="text-gray-900">{user.creci || 'Não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Função</label>
                  <p className="text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Membro desde</label>
                  <p className="text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="space-y-6">
          {user.stats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Minhas Estatísticas</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Imóveis</span>
                  <span className="font-semibold">{user.stats.total_imoveis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Imóveis Ativos</span>
                  <span className="font-semibold text-green-600">{user.stats.imoveis_ativos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Imóveis Vendidos</span>
                  <span className="font-semibold text-blue-600">{user.stats.imoveis_vendidos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de Contatos</span>
                  <span className="font-semibold">{user.stats.total_contatos}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <a
                href="/admin/imoveis/novo"
                className="block w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Cadastrar Imóvel
              </a>
              <a
                href="/admin/imoveis"
                className="block w-full px-4 py-2 text-center bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Ver Meus Imóveis
              </a>
              <a
                href="/admin/contatos"
                className="block w-full px-4 py-2 text-center bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Ver Contatos
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}