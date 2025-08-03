import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { backupQuery } from '@/lib/backup-db'

// GET - Listar mídias de backup de um imóvel específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores podem acessar backups.' },
        { status: 403 }
      )
    }

    const { id: imovelId } = await params

    // Buscar mídias de backup do imóvel
    const backupMedias = await backupQuery(
      `SELECT 
        id,
        imovel_id,
        url_original,
        tipo_midia,
        nome_arquivo,
        mime_type,
        tamanho,
        hash_arquivo,
        metadata,
        data_captura
      FROM imovel_midia_backup 
      WHERE imovel_id = $1 
      ORDER BY data_captura DESC`,
      [imovelId]
    )

    // Processar metadata
    const processedMedias = backupMedias.map(media => ({
      ...media,
      metadata: typeof media.metadata === 'string' ? JSON.parse(media.metadata) : media.metadata,
      tamanho_mb: (media.tamanho / (1024 * 1024)).toFixed(2)
    }))

    return NextResponse.json({
      success: true,
      imovelId,
      totalMedias: processedMedias.length,
      medias: processedMedias
    })
  } catch (error) {
    console.error('Erro ao buscar backup de mídias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}