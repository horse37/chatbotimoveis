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

interface ImovelForm {
  titulo: string
  descricao: string
  tipo: string
  finalidade: string
  preco: string
  area_total: string
  area_construida: string
  quartos: string
  banheiros: string
  vagas_garagem: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  caracteristicas: string[]
  fotos: File[]
  videos: File[]
}

const tiposImovel = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' }
]

const finalidades = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' }
]

const caracteristicasDisponiveis = [
  'Piscina', 'Churrasqueira', 'Área de lazer', 'Academia', 'Salão de festas',
  'Playground', 'Quadra esportiva', 'Portaria 24h', 'Elevador', 'Varanda',
  'Jardim', 'Garagem coberta', 'Ar condicionado', 'Armários embutidos',
  'Cozinha americana', 'Suíte master', 'Closet', 'Lavabo', 'Despensa'
]

export default function NovoImovel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState<ImovelForm>({
    titulo: '',
    descricao: '',
    tipo: '',
    finalidade: '',
    preco: '',
    area_total: '',
    area_construida: '',
    quartos: '',
    banheiros: '',
    vagas_garagem: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    cep: '',
    caracteristicas: [],
    fotos: [],
    videos: []
  })

  const handleInputChange = (field: keyof ImovelForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCaracteristicaToggle = (caracteristica: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(caracteristica)
        ? prev.caracteristicas.filter(c => c !== caracteristica)
        : [...prev.caracteristicas, caracteristica]
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...files] }))
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setFormData(prev => ({ ...prev, videos: [...prev.videos, ...files] }))
    }
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }))
  }

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Criar FormData para upload de arquivos
      const submitData = new FormData()
      
      // Adicionar dados do formulário
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'fotos') {
          value.forEach((file: File) => {
            submitData.append('fotos', file)
          })
        } else if (key === 'videos') {
          value.forEach((file: File) => {
            submitData.append('videos', file)
          })
        } else if (key === 'caracteristicas') {
          submitData.append(key, JSON.stringify(value))
        } else {
          submitData.append(key, value as string)
        }
      })

      const response = await fetch('/api/admin/imoveis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      })

      if (!response.ok) {
        throw new Error('Erro ao cadastrar imóvel')
      }

      setSuccess('Imóvel cadastrado com sucesso!')
      setTimeout(() => {
        router.push('/admin/imoveis')
      }, 2000)
    } catch (err) {
      setError('Erro ao cadastrar imóvel. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Novo Imóvel</h1>
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
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    placeholder="Ex: Casa em condomínio fechado"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => handleInputChange('preco', e.target.value)}
                    placeholder="850000.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposImovel.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="finalidade">Finalidade *</Label>
                  <select
                    id="finalidade"
                    value={formData.finalidade}
                    onChange={(e) => handleInputChange('finalidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione a finalidade</option>
                    {finalidades.map(finalidade => (
                      <option key={finalidade.value} value={finalidade.value}>
                        {finalidade.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descreva o imóvel..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="area_total">Área Total (m²)</Label>
                  <Input
                    id="area_total"
                    type="number"
                    step="0.01"
                    value={formData.area_total}
                    onChange={(e) => handleInputChange('area_total', e.target.value)}
                    placeholder="300.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="area_construida">Área Construída (m²)</Label>
                  <Input
                    id="area_construida"
                    type="number"
                    step="0.01"
                    value={formData.area_construida}
                    onChange={(e) => handleInputChange('area_construida', e.target.value)}
                    placeholder="250.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quartos">Quartos</Label>
                  <Input
                    id="quartos"
                    type="number"
                    value={formData.quartos}
                    onChange={(e) => handleInputChange('quartos', e.target.value)}
                    placeholder="3"
                  />
                </div>
                
                <div>
                  <Label htmlFor="banheiros">Banheiros</Label>
                  <Input
                    id="banheiros"
                    type="number"
                    value={formData.banheiros}
                    onChange={(e) => handleInputChange('banheiros', e.target.value)}
                    placeholder="2"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="vagas_garagem">Vagas de Garagem</Label>
                <Input
                  id="vagas_garagem"
                  type="number"
                  value={formData.vagas_garagem}
                  onChange={(e) => handleInputChange('vagas_garagem', e.target.value)}
                  placeholder="2"
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua das Flores, 123"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange('bairro', e.target.value)}
                    placeholder="Jardim das Rosas"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
              
              <div className="w-48">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  placeholder="01234-567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Características Extras */}
          <Card>
            <CardHeader>
              <CardTitle>Características Extras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {caracteristicasDisponiveis.map(caracteristica => (
                  <label key={caracteristica} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.caracteristicas.includes(caracteristica)}
                      onChange={() => handleCaracteristicaToggle(caracteristica)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{caracteristica}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upload de Fotos */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fotos">Adicionar Fotos</Label>
                <input
                  id="fotos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Selecione múltiplas imagens (JPG, PNG, WebP)
                </p>
              </div>
              
              {formData.fotos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Fotos selecionadas:</h4>
                  <div className="space-y-2">
                    {formData.fotos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload de Vídeos */}
          <Card>
            <CardHeader>
              <CardTitle>Vídeos do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="videos">Adicionar Vídeos</Label>
                <input
                  id="videos"
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Selecione vídeos (MP4, MOV, AVI) - Máximo 100MB por arquivo
                </p>
              </div>
              
              {formData.videos.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Vídeos selecionados:</h4>
                  <div className="space-y-2">
                    {formData.videos.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVideo(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                'Salvando...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Imóvel
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}