import { backupQuery } from './backup-db'
import { readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

interface MediaFile {
  url: string
  tipo: 'imagem' | 'video'
}

interface BackupMediaData {
  imovel_id: string
  url_original: string
  tipo_midia: string
  nome_arquivo: string
  caminho_servidor: string
  mime_type: string
  dados: Buffer
  tamanho: number
  hash_arquivo: string
  metadata?: any
}

// Função para calcular hash do arquivo
function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// Função para determinar o MIME type baseado na extensão
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/avi',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// Função para determinar o tipo de mídia
function getMediaType(fileName: string): 'imagem' | 'video' {
  const ext = path.extname(fileName).toLowerCase()
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv']
  return videoExtensions.includes(ext) ? 'video' : 'imagem'
}

// Função para fazer backup de um arquivo específico
export async function backupMediaFile(imovelId: string, mediaUrl: string): Promise<boolean> {
  try {
    // Verificar se o backup já existe
    const existingBackup = await backupQuery(
      'SELECT id FROM imovel_midia_backup WHERE url_original = $1',
      [mediaUrl]
    )

    if (existingBackup.length > 0) {
      console.log(`Backup já existe para: ${mediaUrl}`)
      return true
    }

    // Construir caminho do arquivo no servidor
    const filePath = path.join(process.cwd(), 'public', mediaUrl)
    
    // Ler o arquivo
    const fileBuffer = await readFile(filePath)
    const fileName = path.basename(mediaUrl)
    const mimeType = getMimeType(fileName)
    const mediaType = getMediaType(fileName)
    const fileHash = calculateFileHash(fileBuffer)
    
    // Preparar dados para backup
    const backupData: BackupMediaData = {
      imovel_id: imovelId,
      url_original: mediaUrl,
      tipo_midia: mediaType,
      nome_arquivo: fileName,
      caminho_servidor: filePath,
      mime_type: mimeType,
      dados: fileBuffer,
      tamanho: fileBuffer.length,
      hash_arquivo: fileHash,
      metadata: {
        original_path: mediaUrl,
        backup_date: new Date().toISOString(),
        file_size_mb: (fileBuffer.length / (1024 * 1024)).toFixed(2)
      }
    }

    // Inserir no banco de backup
    await backupQuery(
      `INSERT INTO imovel_midia_backup (
        imovel_id, url_original, tipo_midia, nome_arquivo, caminho_servidor,
        mime_type, dados, tamanho, hash_arquivo, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        backupData.imovel_id,
        backupData.url_original,
        backupData.tipo_midia,
        backupData.nome_arquivo,
        backupData.caminho_servidor,
        backupData.mime_type,
        backupData.dados,
        backupData.tamanho,
        backupData.hash_arquivo,
        JSON.stringify(backupData.metadata)
      ]
    )

    console.log(`Backup realizado com sucesso para: ${mediaUrl}`)
    return true
  } catch (error) {
    console.error(`Erro ao fazer backup de ${mediaUrl}:`, error)
    return false
  }
}

// Função para fazer backup de todas as mídias de um imóvel
export async function backupImovelMedias(imovelId: string, fotos: string[], videos: string[]): Promise<void> {
  console.log(`🚀 INICIANDO BACKUP - Imóvel: ${imovelId}`)
  console.log(`🔧 BACKUP_DATABASE_URL configurado: ${process.env.BACKUP_DATABASE_URL ? 'SIM' : 'NÃO'}`)
  
  // Verificar se o backup está habilitado
  if (!process.env.BACKUP_DATABASE_URL) {
    console.log('❌ Backup de mídias desabilitado - BACKUP_DATABASE_URL não configurado')
    return
  }

  console.log(`✅ Iniciando backup de mídias para imóvel ${imovelId}...`)
  console.log(`📊 Total de fotos: ${fotos.length}, Total de vídeos: ${videos.length}`)
  
  const allMedias = [...fotos, ...videos]
  
  // Se não há mídias, não fazer nada
  if (allMedias.length === 0) {
    console.log(`Nenhuma mídia para backup no imóvel ${imovelId}`)
    return
  }

  const backupPromises = allMedias.map(mediaUrl => 
    backupMediaFile(imovelId, mediaUrl).catch(error => {
      console.error(`Falha no backup de ${mediaUrl}:`, error)
      return false
    })
  )

  try {
    const results = await Promise.all(backupPromises)
    const successCount = results.filter(result => result === true).length
    const totalCount = allMedias.length
    
    console.log(`Backup concluído para imóvel ${imovelId}: ${successCount}/${totalCount} arquivos salvos`)
  } catch (error) {
    console.error(`Erro durante backup de mídias do imóvel ${imovelId}:`, error)
  }
}

// Função para executar backup em segundo plano (não bloqueia a resposta)
export function scheduleMediaBackup(imovelId: string, fotos: string[], videos: string[]): void {
  console.log(`🔄 BACKUP AGENDADO - Imóvel ID: ${imovelId}, Fotos: ${fotos.length}, Vídeos: ${videos.length}`)
  console.log(`📁 Fotos para backup:`, fotos)
  console.log(`🎥 Vídeos para backup:`, videos)
  
  // Executar em segundo plano usando setImmediate para não bloquear
  setImmediate(() => {
    // Usar Promise.resolve para garantir execução assíncrona
    Promise.resolve().then(async () => {
      try {
        await backupImovelMedias(imovelId, fotos, videos)
      } catch (error) {
        console.error('❌ Erro no backup agendado:', error)
      }
    }).catch(error => {
      console.error('Erro crítico no backup:', error)
    })
  })
}