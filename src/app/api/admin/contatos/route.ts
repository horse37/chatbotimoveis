import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obter dados do corpo da requisição
    const { nome, email, telefone, mensagem, status, imovel_id } = await request.json()

    // Validar campos obrigatórios
    if (!nome || !email || !mensagem) {
      return NextResponse.json({ error: 'Nome, email e mensagem são obrigatórios' }, { status: 400 })
    }

    // Inserir contato no banco de dados
    const result = await query(
      `INSERT INTO contatos (nome, email, telefone, mensagem, status, imovel_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [nome, email, telefone || null, mensagem, status || 'novo', imovel_id || null]
    )

    return NextResponse.json({
      success: true,
      message: 'Contato criado com sucesso',
      data: { id: result[0].id }
    })
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * limit

    // Construir consulta SQL
    let sqlQuery = `
      SELECT c.*, i.titulo as imovel_titulo 
      FROM contatos c 
      LEFT JOIN imoveis i ON c.imovel_id = i.id 
      WHERE 1=1
    `
    const queryParams = []

    if (search) {
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
      sqlQuery += ` AND (c.nome ILIKE $${queryParams.length - 2} OR c.email ILIKE $${queryParams.length - 1} OR c.mensagem ILIKE $${queryParams.length})`
    }

    if (status) {
      queryParams.push(status)
      sqlQuery += ` AND c.status = $${queryParams.length}`
    }

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total FROM contatos c 
      WHERE 1=1 
      ${search ? `AND (c.nome ILIKE $1 OR c.email ILIKE $2 OR c.mensagem ILIKE $3)` : ''}
      ${status ? `AND c.status = $${search ? '4' : '1'}` : ''}
    `

    const countParams = []
    if (search) {
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) {
      countParams.push(status)
    }

    // Obter estatísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'novo' THEN 1 END) as novos,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'respondido' THEN 1 END) as respondidos,
        COUNT(CASE WHEN status = 'finalizado' THEN 1 END) as finalizados
      FROM contatos
    `

    // Executar consultas
    sqlQuery += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit, offset)

    const [contatosResult, countResult, statsResult] = await Promise.all([
      query(sqlQuery, queryParams),
      query(countQuery, countParams),
      query(statsQuery)
    ])

    const total = parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      contatos: contatosResult,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: statsResult[0]
    })
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  }
}