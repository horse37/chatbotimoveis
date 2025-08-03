import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Imovel, TipoImovel, StatusImovel } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parâmetros de filtro
    const busca = searchParams.get('busca') || ''
    const tipos = searchParams.get('tipos')?.split(',').filter(Boolean) || []
    const status = searchParams.get('status')?.split(',').filter(Boolean) || []
    const quartos = searchParams.get('quartos')?.split(',').map(Number).filter(Boolean) || []
    const banheiros = searchParams.get('banheiros')?.split(',').map(Number).filter(Boolean) || []
    const vagas = searchParams.get('vagas')?.split(',').map(Number).filter(Boolean) || []
    const cidades = searchParams.get('cidades')?.split(',').filter(Boolean) || []
    const precoMin = searchParams.get('precoMin') ? Number(searchParams.get('precoMin')) : null
    const precoMax = searchParams.get('precoMax') ? Number(searchParams.get('precoMax')) : null
    const areaMin = searchParams.get('areaMin') ? Number(searchParams.get('areaMin')) : null
    const areaMax = searchParams.get('areaMax') ? Number(searchParams.get('areaMax')) : null
    
    // Parâmetros de paginação
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 12
    const offset = (page - 1) * limit
    
    // Construir query SQL
    let sql = `
      SELECT 
        i.*
      FROM imoveis i
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1
    
    // Filtro de busca textual
    if (busca) {
      // Verificar se a busca é um número para comparação de código
      const isNumeric = /^\d+$/.test(busca.trim())
      
      if (isNumeric) {
        sql += ` AND (
          LOWER(i.titulo) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.descricao) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.endereco) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.bairro) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.cidade) LIKE LOWER($${paramIndex}) OR 
          CAST(i.codigo AS TEXT) LIKE $${paramIndex} OR 
          i.codigo = $${paramIndex + 1}
        )`
        params.push(`%${busca}%`)
        params.push(parseInt(busca.trim()))
        paramIndex += 2
      } else {
        sql += ` AND (
          LOWER(i.titulo) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.descricao) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.endereco) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.bairro) LIKE LOWER($${paramIndex}) OR 
          LOWER(i.cidade) LIKE LOWER($${paramIndex}) OR 
          CAST(i.codigo AS TEXT) LIKE $${paramIndex}
        )`
        params.push(`%${busca}%`)
        paramIndex++
      }
    }
    
    // Filtro por tipos
    if (tipos.length > 0) {
      sql += ` AND i.tipo = ANY($${paramIndex})`
      params.push(tipos)
      paramIndex++
    }
    
    // Filtro por status
    if (status.length > 0) {
      sql += ` AND i.status = ANY($${paramIndex})`
      params.push(status)
      paramIndex++
    }
    
    // Filtro por quartos
    if (quartos.length > 0) {
      sql += ` AND i.quartos = ANY($${paramIndex})`
      params.push(quartos)
      paramIndex++
    }
    
    // Filtro por banheiros
    if (banheiros.length > 0) {
      sql += ` AND i.banheiros = ANY($${paramIndex})`
      params.push(banheiros)
      paramIndex++
    }
    
    // Filtro por vagas
    if (vagas.length > 0) {
      sql += ` AND i.vagas_garagem = ANY($${paramIndex})`
      params.push(vagas)
      paramIndex++
    }
    
    // Filtro por cidades
    if (cidades.length > 0) {
      sql += ` AND LOWER(i.cidade) = ANY($${paramIndex})`
      params.push(cidades.map(c => c.toLowerCase()))
      paramIndex++
    }
    
    // Filtro por preço
    if (precoMin !== null) {
      sql += ` AND i.preco >= $${paramIndex}`
      params.push(precoMin)
      paramIndex++
    }
    
    if (precoMax !== null) {
      sql += ` AND i.preco <= $${paramIndex}`
      params.push(precoMax)
      paramIndex++
    }
    
    // Filtro por área
    if (areaMin !== null) {
      sql += ` AND i.area_total >= $${paramIndex}`
      params.push(areaMin)
      paramIndex++
    }
    
    if (areaMax !== null) {
      sql += ` AND i.area_total <= $${paramIndex}`
      params.push(areaMax)
      paramIndex++
    }
    
    // Ordenação
    sql += ` ORDER BY i.created_at DESC`
    
    // Query para contar total de registros
    let countSql = `
      SELECT COUNT(*) as total
      FROM imoveis i
      WHERE 1=1
    `
    
    // Adicionar os mesmos filtros da query principal
    let countParamIndex = 1
    const countParams: any[] = []
    
    // Filtro de busca textual
    if (busca) {
      // Verificar se a busca é um número para comparação de código
      const isNumeric = /^\d+$/.test(busca.trim())
      
      if (isNumeric) {
        countSql += ` AND (
          LOWER(i.titulo) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.descricao) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.endereco) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.bairro) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.cidade) LIKE LOWER($${countParamIndex}) OR 
          CAST(i.codigo AS TEXT) LIKE $${countParamIndex} OR 
          i.codigo = $${countParamIndex + 1}
        )`
        countParams.push(`%${busca}%`)
        countParams.push(parseInt(busca.trim()))
        countParamIndex += 2
      } else {
        countSql += ` AND (
          LOWER(i.titulo) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.descricao) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.endereco) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.bairro) LIKE LOWER($${countParamIndex}) OR 
          LOWER(i.cidade) LIKE LOWER($${countParamIndex}) OR 
          CAST(i.codigo AS TEXT) LIKE $${countParamIndex}
        )`
        countParams.push(`%${busca}%`)
        countParamIndex++
      }
    }
    
    // Filtro por tipos
    if (tipos.length > 0) {
      countSql += ` AND i.tipo = ANY($${countParamIndex})`
      countParams.push(tipos)
      countParamIndex++
    }
    
    // Filtro por status
    if (status.length > 0) {
      countSql += ` AND i.status = ANY($${countParamIndex})`
      countParams.push(status)
      countParamIndex++
    }
    
    // Filtro por quartos
    if (quartos.length > 0) {
      countSql += ` AND i.quartos = ANY($${countParamIndex})`
      countParams.push(quartos)
      countParamIndex++
    }
    
    // Filtro por banheiros
    if (banheiros.length > 0) {
      countSql += ` AND i.banheiros = ANY($${countParamIndex})`
      countParams.push(banheiros)
      countParamIndex++
    }
    
    // Filtro por vagas
    if (vagas.length > 0) {
      countSql += ` AND i.vagas_garagem = ANY($${countParamIndex})`
      countParams.push(vagas)
      countParamIndex++
    }
    
    // Filtro por cidades
    if (cidades.length > 0) {
      countSql += ` AND LOWER(i.cidade) = ANY($${countParamIndex})`
      countParams.push(cidades.map(c => c.toLowerCase()))
      countParamIndex++
    }
    
    // Filtro por preço
    if (precoMin !== null) {
      countSql += ` AND i.preco >= $${countParamIndex}`
      countParams.push(precoMin)
      countParamIndex++
    }
    
    if (precoMax !== null) {
      countSql += ` AND i.preco <= $${countParamIndex}`
      countParams.push(precoMax)
      countParamIndex++
    }
    
    // Filtro por área
    if (areaMin !== null) {
      countSql += ` AND i.area_total >= $${countParamIndex}`
      countParams.push(areaMin)
      countParamIndex++
    }
    
    if (areaMax !== null) {
      countSql += ` AND i.area_total <= $${countParamIndex}`
      countParams.push(areaMax)
      countParamIndex++
    }
    
    // Adicionar paginação
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)
    
    // Executar queries
    const [imoveisResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ])
    
    const imoveis = imoveisResult
    const total = parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        imoveis,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      titulo,
      descricao,
      tipo,
      status,
      preco,
      endereco,
      bairro,
      cidade,
      cep,
      area_total,
      area_construida,
      quartos,
      banheiros,
      vagas_garagem,
      caracteristicas,
      corretor_id
    } = body
    
    // Validações básicas
    if (!titulo || !tipo || !preco || !endereco || !cidade || !corretor_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos obrigatórios não preenchidos' 
        },
        { status: 400 }
      )
    }
    
    const sql = `
      INSERT INTO imoveis (
        titulo, descricao, tipo, status, preco, endereco, bairro, cidade, cep,
        area_total, area_construida, quartos, banheiros, vagas_garagem,
        caracteristicas, corretor_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `
    
    const params = [
      titulo,
      descricao,
      tipo,
      status || 'disponivel',
      preco,
      endereco,
      bairro,
      cidade,
      cep,
      area_total,
      area_construida,
      quartos,
      banheiros,
      vagas_garagem,
      JSON.stringify(caracteristicas || []),
      corretor_id
    ]
    
    const result = await query(sql, params)
    const imovel = result[0]
    
    return NextResponse.json({
      success: true,
      data: { imovel }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Erro ao criar imóvel:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}