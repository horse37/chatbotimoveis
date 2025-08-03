'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, MapPin, Home, Bed, Bath, Car, Ruler } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatImovelId } from '@/lib/utils'
import Image from 'next/image'

interface Imovel {
  id: number
  codigo?: number
  titulo: string
  descricao: string
  tipo: string
  finalidade: string
  status: string
  preco: number
  area_total?: number
  area_construida?: number
  quartos?: number
  banheiros?: number
  vagas_garagem?: number
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  caracteristicas: string[]
  fotos: string[]
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export default function ImovelDetalhes() {
  const router = useRouter()
  const params = useParams()
  const [imovel, setImovel] = useState<Imovel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)

  const fetchImovel = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/imoveis/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar imóvel')
      }

      const data = await response.json()
      setImovel(data.imovel)
    } catch (err) {
      setError('Erro ao carregar imóvel')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/imoveis/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir imóvel')
      }

      router.push('/admin/imoveis')
    } catch (err) {
      setError('Erro ao excluir imóvel')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-800'
      case 'vendido':
        return 'bg-red-100 text-red-800'
      case 'alugado':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchImovel()
  }, [fetchImovel])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !imovel) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error || 'Imóvel não encontrado'}
            </AlertDescription>
          </Alert>
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
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                  ID: {formatImovelId(imovel.codigo)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{imovel.titulo}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(imovel.status)}`}>
                  {imovel.status}
                </span>
                <span className="text-sm text-gray-500 capitalize">
                  {imovel.tipo} para {imovel.finalidade}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/imoveis/${imovel.id}/editar`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fotos */}
            {imovel.fotos && imovel.fotos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fotos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Foto Principal */}
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imovel.fotos[selectedImage]}
                        alt={`Foto ${selectedImage + 1} do imóvel`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Miniaturas */}
                    {imovel.fotos.length > 1 && (
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {imovel.fotos.map((foto, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                              selectedImage === index ? 'border-blue-500' : 'border-transparent'
                            }`}
                          >
                            <Image
                              src={foto}
                              alt={`Miniatura ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Descrição */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {imovel.descricao || 'Nenhuma descrição disponível.'}
                </p>
              </CardContent>
            </Card>

            {/* Características Extras */}
            {imovel.caracteristicas && imovel.caracteristicas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {imovel.caracteristicas.map((caracteristica, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{caracteristica}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preço e Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(imovel.preco)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {imovel.tipo} para {imovel.finalidade}
                  </p>
                </div>

                {/* Características Principais */}
                <div className="grid grid-cols-2 gap-4">
                  {imovel.area_total && (
                    <div className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{imovel.area_total}m²</p>
                        <p className="text-xs text-gray-500">Área Total</p>
                      </div>
                    </div>
                  )}
                  
                  {imovel.area_construida && (
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{imovel.area_construida}m²</p>
                        <p className="text-xs text-gray-500">Área Construída</p>
                      </div>
                    </div>
                  )}
                  
                  {imovel.quartos && (
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{imovel.quartos}</p>
                        <p className="text-xs text-gray-500">Quartos</p>
                      </div>
                    </div>
                  )}
                  
                  {imovel.banheiros && (
                    <div className="flex items-center space-x-2">
                      <Bath className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{imovel.banheiros}</p>
                        <p className="text-xs text-gray-500">Banheiros</p>
                      </div>
                    </div>
                  )}
                  
                  {imovel.vagas_garagem && (
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{imovel.vagas_garagem}</p>
                        <p className="text-xs text-gray-500">Vagas</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Localização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{imovel.endereco}</p>
                {imovel.bairro && (
                  <p className="text-sm text-gray-600">{imovel.bairro}</p>
                )}
                <p className="text-sm text-gray-600">
                  {imovel.cidade}, {imovel.estado}
                </p>
                {imovel.cep && (
                  <p className="text-sm text-gray-600">CEP: {imovel.cep}</p>
                )}
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">ID do Imóvel</p>
                  <p className="text-sm text-gray-600">#{imovel.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Criado em</p>
                  <p className="text-sm text-gray-600">{formatDate(imovel.created_at)}</p>
                </div>
                {imovel.updated_at && imovel.updated_at !== imovel.created_at && (
                  <div>
                    <p className="text-sm font-medium">Última atualização</p>
                    <p className="text-sm text-gray-600">{formatDate(imovel.updated_at)}</p>
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