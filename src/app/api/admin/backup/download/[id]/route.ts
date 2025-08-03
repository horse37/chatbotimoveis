import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { backupQuery } from '@/lib/backup-db'

// GET - Baixar uma mídia específica do backup
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

    const { id: backupId } = await params

    // Buscar a mídia de backup
    const backupMedia = await backupQuery(
      `SELECT 
        id,
        imovel_id,
        url_original,
        tipo_midia,
        nome_arquivo,
        mime_type,
        dados,
        tamanho,
        hash_arquivo,
        metadata
      FROM imovel_midia_backup 
      WHERE id = $1`,
      [backupId]
    )

    if (backupMedia.length === 0) {
      return NextResponse.json(
        { message: 'Mídia de backup não encontrada' },
        { status: 404 }
      )
    }

    const media = backupMedia[0]
    
    // Preparar headers para download
    const headers = new Headers()
    headers.set('Content-Type', media.mime_type)
    headers.set('Content-Length', media.tamanho.toString())
    headers.set('Content-Disposition', `attachment; filename="${media.nome_arquivo}"`)
    headers.set('Cache-Control', 'no-cache')
    
    // Retornar o arquivo
    return new NextResponse(media.dados, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Erro ao baixar mídia de backup:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}