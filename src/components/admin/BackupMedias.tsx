'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Image as ImageIcon, Video, Calendar, HardDrive, AlertCircle } from 'lucide-react'
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
}

interface BackupMediasProps {
  imovelId: string
}

export default function BackupMedias({ imovelId }: BackupMediasProps) {
  const [medias, setMedias] = useState<BackupMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<number | null>(null)

  const fetchBackupMedias = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/backup/imoveis/${imovelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar backups')
      }

      const data = await response.json()
      setMedias(data.medias || [])
    } catch (error) {
      console.error('Erro ao buscar backups:', error)
      toast.error('Erro ao carregar backups de mídias')
    } finally {
      setLoading(false)
    }
  }, [imovelId])

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

      // Criar blob e fazer download
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />
  }

  const getTipoBadgeColor = (tipo: string) => {
    return tipo === 'video' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Backup de Mídias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando backups...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (medias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Backup de Mídias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mr-2" />
            <span>Nenhum backup de mídia encontrado para este imóvel</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Backup de Mídias ({medias.length})
        </CardTitle>
        <p className="text-sm text-gray-600">
          Arquivos salvos no banco de backup para recuperação
        </p>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}