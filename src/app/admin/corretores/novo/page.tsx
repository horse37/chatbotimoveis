'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NovoCorretor() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
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

  const handleInputChange = (field: keyof CorretorForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Verificar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, foto: file }));
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      console.log('Arquivo selecionado:', file.name, file.type, file.size);
    }
  }

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, foto: null }))
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Primeiro, vamos fazer upload da foto se existir
      let fotoUrl = null;
      if (formData.foto) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.foto);
        
        try {
          console.log('Iniciando upload da foto...');
          
          // Obter a URL base da API
          const apiBaseUrl = getApiBaseUrl();
          const token = localStorage.getItem('token');
          
          const uploadResponse = await fetch(`${apiBaseUrl}/admin/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error('Erro na resposta do upload:', errorData);
            throw new Error(errorData.error || 'Erro ao fazer upload da foto');
          }
          
          const uploadData = await uploadResponse.json();
          fotoUrl = uploadData.url;
          console.log('Upload concluído com sucesso. URL:', fotoUrl);
        } catch (uploadError) {
          console.error('Erro no upload da foto:', uploadError);
          toast.error('Erro ao fazer upload da foto, mas continuaremos o cadastro');
          // Continuamos o cadastro mesmo sem a foto
        }
      }

      // Preparar dados para envio
      const submitData = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        creci: formData.creci,
        telefone: formData.telefone,
        role: formData.role,
        ativo: formData.ativo,
        foto: fotoUrl
      };

      console.log('Enviando dados do corretor:', { ...submitData, senha: '***' });

      const apiBaseUrl = getApiBaseUrl();
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiBaseUrl}/admin/corretores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cadastrar corretor');
      }

      const data = await response.json();
      setSuccess('Corretor cadastrado com sucesso!');
      toast.success('Corretor cadastrado com sucesso!');
      
      setTimeout(() => {
        router.push('/admin/corretores');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar corretor. Tente novamente.');
      toast.error(err.message || 'Erro ao cadastrar corretor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Novo Corretor</h1>
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

          {/* Credenciais de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle>Credenciais de Acesso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    placeholder="Repita a senha"
                    required
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
                      src={previewUrl}
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
                      Foto selecionada: {formData.foto?.name}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remover Foto
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="foto">Selecionar Foto</Label>
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
                'Cadastrando...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Cadastrar Corretor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}