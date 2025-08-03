import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - Listar corretores
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'todos'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let whereConditions = []
    let queryParams: any[] = []

    // Filtro de busca
    if (search) {
      whereConditions.push(`(nome LIKE $${queryParams.length + 1} OR email LIKE $${queryParams.length + 2} OR creci LIKE $${queryParams.length + 3})`)
      const searchPattern = `%${search}%`
      queryParams.push(searchPattern, searchPattern, searchPattern)
    }

    // Filtro de status
    if (status !== 'todos') {
      whereConditions.push(`ativo = $${queryParams.length + 1}`)
      queryParams.push(status === 'ativo' ? 1 : 0)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM corretores 
      ${whereClause}
    `
    const countResult = await query(countQuery, queryParams)
    const total = countResult && countResult[0] ? countResult[0].total : 0

    // Query para buscar corretores
    const corretoresQuery = `
      SELECT id, nome, email, creci, telefone, foto, ativo, role, created_at
      FROM corretores 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `
    
    const corretores = await query(corretoresQuery, [...queryParams, limit, offset])

    // Processar o campo foto se for um Buffer para cada corretor
    const corretoresProcessados = corretores.map(corretor => {
      if (corretor.foto && typeof corretor.foto === 'object' && corretor.foto.type === 'Buffer') {
        corretor.foto = Buffer.from(corretor.foto.data).toString('utf8')
      }
      return corretor
    })

    return NextResponse.json({
      corretores: corretoresProcessados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar corretores:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo corretor
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é admin
    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const {
      nome,
      email,
      senha,
      creci,
      telefone,
      foto,
      role = 'corretor',
      ativo = true
    } = body

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await query(
      'SELECT id FROM corretores WHERE email = $1',
      [email]
    )

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Inserir corretor
    const result = await query(
      `INSERT INTO corretores 
       (nome, email, senha, creci, telefone, foto, role, ativo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nome, email, hashedPassword, creci, telefone, foto, role, ativo]
    )

    const novoCorretor = {
      id: result[0].id,
      nome,
      email,
      creci,
      telefone,
      foto,
      role,
      ativo
    }

    return NextResponse.json({
      message: 'Corretor cadastrado com sucesso',
      corretor: novoCorretor
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar corretor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}