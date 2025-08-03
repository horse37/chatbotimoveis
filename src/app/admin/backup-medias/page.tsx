'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, Image, Video, Calendar, HardDrive, AlertCircle, Filter, Search, Database } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface BackupMedia {
  id: number
  imovel_id: string
  url_original: string
  tipo_midia: 'imagem' | 'video'
  nome_arquivo: string
  mime_type: string
  tamanho: number
  tamanho_mb: string
  hash_arquivo: string
  metadata: any
  data_captura: string
  imovel_titulo?: string
  imovel_endereco?: string
  imovel_cidade?: string
  imovel_excluido: boolean
}

interface Estatisticas {
  total_backups: number
  total_imoveis: number
  tamanho_total_mb: string
  tamanho_total_gb: string
  total_imagens: number
  total_videos: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function BackupMediasPage() {
  const [medias, setMedias] = useState<BackupMedia[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    imovelId: '',
    tipo: '',
    search: ''
  })

  const fetchBackupMedias = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (filters.imovelId) params.append('imovelId', filters.imovelId)
      if (filters.tipo && filters.tipo !== 'todos') params.append('tipo', filters.tipo)
      
      const response = await fetch(`/api/admin/backup?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar backups')
      }

      const data = await response.json()
      setMedias(data.medias || [])
      setPagination(data.pagination)
      setEstatisticas(data.estatisticas)
    } catch (error) {
      console.error('Erro ao buscar backups:', error)
      toast.error('Erro ao carregar backups de mídias')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, filters])

  useEffect(() => {
    fetchBackupMedias()
  }, [fetchBackupMedias])

  const downloadMedia = async (mediaId: number, nomeArquivo: string) => {
    try {
      setDownloading(mediaId)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/backup/download/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download realizado com sucesso!')
    } catch (error) {
      console.error('Erro ao baixar mídia:', error)
      toast.error('Erro ao baixar arquivo')
    } finally {
      setDownloading(null)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === 'video' ? <Video className="w-4 h-4" aria-label="Vídeo" /> : <Image className="w-4 h-4" aria-label="Imagem" />
  }

  const getTipoBadgeColor = (tipo: string) => {
    return tipo === 'video' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8" />
            Backup de Mídias
          </h1>
          <p className="text-gray-600 mt-1">
            Gerenciar e recuperar mídias salvas no banco de backup
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Backups</p>
                  <p className="text-2xl font-bold">{estatisticas.total_backups}</p>
                </div>
                <HardDrive className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Imóveis com Backup</p>
                  <p className="text-2xl font-bold">{estatisticas.total_imoveis}</p>
                </div>
                <Database className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Imagens / Vídeos</p>
                  <p className="text-2xl font-bold">{estatisticas.total_imagens} / {estatisticas.total_videos}</p>
                </div>
                <div className="flex gap-1">
                  <Image className="w-4 h-4 text-blue-500" aria-label="Ícone de imagem" />
                  <Video className="w-4 h-4 text-purple-500" aria-label="Ícone de vídeo" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamanho Total</p>
                  <p className="text-2xl font-bold">{estatisticas.tamanho_total_gb} GB</p>
                </div>
                <HardDrive className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ID do Imóvel</label>
              <Input
                placeholder="Digite o ID do imóvel"
                value={filters.imovelId}
                onChange={(e) => handleFilterChange('imovelId', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Mídia</label>
              <Select value={filters.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="imagem">Imagens</SelectItem>
                  <SelectItem value="video">Vídeos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchBackupMedias} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mídias */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mídias de Backup ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Carregando backups...</span>
            </div>
          ) : medias.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mr-2" />
              <span>Nenhum backup encontrado</span>
            </div>
          ) : (
            <div className="space-y-4">
              {medias.map((media) => (
                <div
                  key={media.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTipoIcon(media.tipo_midia)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {media.nome_arquivo}
                        </p>
                        <Badge className={getTipoBadgeColor(media.tipo_midia)}>
                          {media.tipo_midia}
                        </Badge>

                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>ID: {media.imovel_id}</span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {media.tamanho_mb} MB
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(media.data_captura)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 truncate">
                        Original: {media.url_original}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadMedia(media.id, media.nome_arquivo)}
                      disabled={downloading === media.id}
                      className="flex items-center gap-2"
                    >
                      {downloading === media.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloading === media.id ? 'Baixando...' : 'Download'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}