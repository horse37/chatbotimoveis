import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { backupQuery } from '@/lib/backup-db'
import { query } from '@/lib/db'

// GET - Listar todos os backups de mídias
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const imovelCodigo = searchParams.get('imovelId') // Código do imóvel
    const tipoMidia = searchParams.get('tipo')
    const offset = (page - 1) * limit

    // Se foi fornecido código do imóvel, buscar o UUID correspondente no banco principal
    let imovelUuid = null
    if (imovelCodigo) {
      try {
        console.log('Buscando imóvel com código:', imovelCodigo)
        const imovelResult = await query(
          'SELECT id FROM imoveis WHERE codigo = $1',
          [parseInt(imovelCodigo)]
        )
        console.log('Resultado da busca do imóvel:', imovelResult)
        if (imovelResult.length > 0) {
          imovelUuid = imovelResult[0].id
          console.log('UUID do imóvel encontrado:', imovelUuid)
        } else {
          console.log('Nenhum imóvel encontrado com o código:', imovelCodigo)
          // Se não encontrou o imóvel, retornar resultado vazio
          return NextResponse.json({
            success: true,
            medias: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0
            },
            estatisticas: {
              total_backups: 0,
              total_imoveis: 0,
              tamanho_total_mb: '0',
              tamanho_total_gb: '0',
              total_imagens: 0,
              total_videos: 0
            }
          })
        }
      } catch (error) {
        console.error('Erro ao buscar imóvel por código:', error)
        return NextResponse.json(
          { message: 'Erro ao buscar imóvel' },
          { status: 500 }
        )
      }
    }

    // Construir query com filtros
    let whereClause = ''
    const queryParams: any[] = []
    let paramIndex = 0

    if (imovelUuid) {
      paramIndex++
      whereClause += `WHERE imovel_id = $${paramIndex}`
      queryParams.push(imovelUuid)
      console.log('Filtro por imóvel aplicado. UUID:', imovelUuid)
    }

    if (tipoMidia) {
      paramIndex++
      whereClause += whereClause ? ` AND tipo_midia = $${paramIndex}` : `WHERE tipo_midia = $${paramIndex}`
      queryParams.push(tipoMidia)
      console.log('Filtro por tipo de mídia aplicado:', tipoMidia)
    }

    console.log('WHERE clause final:', whereClause)
    console.log('Query params:', queryParams)

    // Buscar backups da tabela de backup
    const backupMediasQuery = `
      SELECT 
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
      ${whereClause}
      ORDER BY data_captura DESC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
    `
    queryParams.push(limit, offset)

    // Query para contar total
    const countQuery = `SELECT COUNT(*) as total FROM imovel_midia_backup ${whereClause}`
    const countParams = queryParams.slice(0, -2) // Remove limit e offset

    const [backupMedias, countResult] = await Promise.all([
      backupQuery(backupMediasQuery, queryParams),
      backupQuery(countQuery, countParams)
    ])

    const total = parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    // Processar metadata e adicionar informações úteis
    const processedMedias = backupMedias.map(media => ({
      ...media,
      metadata: typeof media.metadata === 'string' ? JSON.parse(media.metadata) : media.metadata,
      tamanho_mb: (media.tamanho / (1024 * 1024)).toFixed(2)
    }))

    // Estatísticas baseadas nos filtros aplicados
    const statsQuery = `
      SELECT 
        COUNT(*) as total_backups,
        COUNT(DISTINCT imovel_id) as total_imoveis,
        COALESCE(SUM(tamanho), 0) as tamanho_total,
        COUNT(CASE WHEN tipo_midia = 'imagem' THEN 1 END) as total_imagens,
        COUNT(CASE WHEN tipo_midia = 'video' THEN 1 END) as total_videos
      FROM imovel_midia_backup
      ${whereClause}
    `
    const stats = await backupQuery(statsQuery, countParams)
    const tamanhoTotal = parseInt(stats[0].tamanho_total) || 0
    const estatisticas = {
      ...stats[0],
      tamanho_total: tamanhoTotal,
      tamanho_total_mb: (tamanhoTotal / (1024 * 1024)).toFixed(2),
      tamanho_total_gb: (tamanhoTotal / (1024 * 1024 * 1024)).toFixed(2)
    }

    return NextResponse.json({
      success: true,
      medias: processedMedias,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      estatisticas
    })
  } catch (error) {
    console.error('Erro ao buscar backups de mídias:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}