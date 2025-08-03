'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { fetchAuthApi, getApiBaseUrl } from '@/lib/api'

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
}

interface CorretorForm {
  nome: string
  email: string
  senha: string
  confirmarSenha: string
  creci: string
  telefone: string
  role: string
  ativo: boolean
  foto: File | null
}

const roles = [
  { value: 'corretor', label: 'Corretor' },
  { value: 'admin', label: 'Administrador' },
  { value: 'assistente', label: 'Assistente' }
]

export default function EditarCorretor() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [corretor, setCorretor] = useState<Corretor | null>(null)
  
  const [formData, setFormData] = useState<CorretorForm>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    creci: '',
    telefone: '',
    role: 'corretor',
    ativo: true,
    foto: null
  })

  // Buscar dados do corretor
  useEffect(() => {
    const fetchCorretor = async () => {
      try {
        const response = await fetchAuthApi(`admin/corretores/${params.id}`)

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do corretor')
        }

        const data = await response.json()
        setCorretor(data.corretor)
        
        // Preencher formulário com dados existentes
        setFormData({
          nome: data.corretor.nome,
          email: data.corretor.email,
          senha: '',
          confirmarSenha: '',
          creci: data.corretor.creci || '',
          telefone: data.corretor.telefone || '',
          role: data.corretor.role,
          ativo: data.corretor.ativo,
          foto: null
        })
        
        // Se tem foto, definir preview
        if (data.corretor.foto) {
          setPreviewUrl(data.corretor.foto)
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do corretor')
      } finally {
        setLoadingData(false)
      }
    }

    if (params.id) {
      fetchCorretor()
    }
  }, [params.id])

  const handleInputChange = (field: keyof CorretorForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem')
        return
      }
      
      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB')
        return
      }
      
      setFormData(prev => ({ ...prev, foto: file }))
      
      // Criar preview da imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      console.log('Arquivo selecionado:', file.name, file.type, file.size)
    }
  }

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, foto: null }))
    setPreviewUrl(corretor?.foto || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validações
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (formData.senha && formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      // Primeiro, fazer upload da foto se uma nova foi selecionada
      let fotoUrl = corretor?.foto || null
      if (formData.foto) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', formData.foto)
        
        try {
          console.log('Iniciando upload da foto...')
          // Obter a URL base da API
          const apiBaseUrl = getApiBaseUrl()
          const token = localStorage.getItem('token')
          
          const uploadResponse = await fetch(`${apiBaseUrl}/admin/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          })
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            console.error('Erro na resposta do upload:', errorData)
            throw new Error(errorData.error || 'Erro ao fazer upload da foto')
          }
          
          const uploadData = await uploadResponse.json()
           fotoUrl = uploadData.url
           console.log('Upload concluído com sucesso. URL:', fotoUrl)
           toast.success('Foto enviada com sucesso!')
        } catch (uploadError) {
           console.error('Erro no upload da foto:', uploadError)
           toast.error('Erro ao fazer upload da foto, mas continuaremos a atualização')
           // Continuamos a atualização mesmo sem a nova foto
         }
      }

      // Preparar dados para envio
      const submitData: any = {
        nome: formData.nome,
        email: formData.email,
        creci: formData.creci,
        telefone: formData.telefone,
        role: formData.role,
        ativo: formData.ativo,
        foto: fotoUrl
      }

      // Só incluir senha se foi preenchida
      if (formData.senha) {
        submitData.senha = formData.senha
      }

      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiBaseUrl}/admin/corretores/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar corretor')
      }

      const data = await response.json()
      setSuccess('Corretor atualizado com sucesso!')
      toast.success('Corretor atualizado com sucesso!')
      
      setTimeout(() => {
        router.push('/admin/corretores')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar corretor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
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
            <h1 className="text-2xl font-bold text-gray-900">Editar Corretor</h1>
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: João Silva Santos"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="joao@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={formData.creci}
                    onChange={(e) => handleInputChange('creci', e.target.value)}
                    placeholder="Ex: 123456-F"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <p className="text-sm text-gray-600">Deixe em branco para manter a senha atual</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senha">Nova Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Tipo de Usuário *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    id="ativo"
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => handleInputChange('ativo', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="ativo">Usuário Ativo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Foto do Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewUrl && typeof previewUrl === 'string' && previewUrl.trim() !== '' ? (
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-full overflow-hidden">
                    <Image
                      src={previewUrl.startsWith('data:') || previewUrl.startsWith('/') ? previewUrl : `/${previewUrl}`}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={() => {
                        console.error('Erro ao carregar imagem:', previewUrl)
                        setPreviewUrl(null)
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.foto ? `Nova foto: ${formData.foto.name}` : 'Foto atual'}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {formData.foto ? 'Cancelar Alteração' : 'Remover Foto'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="foto">Selecionar Nova Foto</Label>
                  <input
                    id="foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Selecione uma imagem (JPG, PNG, WebP)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <Label>Data de Cadastro</Label>
                  <p>{new Date(corretor.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label>Última Atualização</Label>
                  <p>{new Date(corretor.updated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}