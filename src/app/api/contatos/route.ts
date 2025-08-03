import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  console.log('API contatos - POST chamada recebida');
  
  try {
    const body = await request.json()
    console.log('Body recebido:', body);
    
    const {
      nome,
      email,
      telefone,
      mensagem,
      imovel_id
    } = body
    
    console.log('Dados extraídos:', { nome, email, telefone, mensagem, imovel_id });
    
    // Validações básicas
    if (!nome || !email || !mensagem) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome, email e mensagem são obrigatórios' 
        },
        { status: 400 }
      )
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Formato de email inválido' 
        },
        { status: 400 }
      )
    }
    
    // Nota: Removida verificação de existência do imóvel para simplificar o processo
    // O imovel_id será salvo mesmo que o imóvel não exista mais
    
    const sql = `
      INSERT INTO contatos (
        nome, email, telefone, mensagem, status, imovel_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      ) RETURNING *
    `
    
    const params = [
      nome,
      email,
      telefone,
      mensagem,
      'pendente',
      imovel_id || null
    ]
    
    console.log('Executando query SQL:', sql);
    console.log('Parâmetros:', params);
    
    const result = await query(sql, params)
    console.log('Resultado da query:', result);
    
    console.log('Contato inserido com sucesso!');
    
    // TODO: Enviar notificação por email para os corretores
    // TODO: Integrar com sistema de CRM se necessário
    
    const response = {
      success: true,
      message: 'Contato enviado com sucesso! Entraremos em contato em breve.'
    };
    
    console.log('Enviando resposta de sucesso:', response);
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parâmetros de filtro
    const status = searchParams.get('status') || ''
    const tipo = searchParams.get('tipo') || ''
    const imovelId = searchParams.get('imovelId') || ''
    
    // Parâmetros de paginação
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit
    
    let sql = `
      SELECT 
        c.*,
        i.titulo as imovel_titulo,
        i.endereco as imovel_endereco,
        i.preco as imovel_preco
      FROM contatos c
      LEFT JOIN imoveis i ON c.imovel_id = i.id
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1
    
    // Filtro por status
    if (status) {
      sql += ` AND c.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    // Filtro por tipo
    if (tipo) {
      sql += ` AND c.tipo = $${paramIndex}`
      params.push(tipo)
      paramIndex++
    }
    
    // Filtro por imóvel
    if (imovelId) {
      sql += ` AND c.imovel_id = $${paramIndex}`
      params.push(Number(imovelId))
      paramIndex++
    }
    
    // Ordenação
    sql += ` ORDER BY c.created_at DESC`
    
    // Query para contar total de registros
    const countSql = sql.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM'
    ).replace(/ORDER BY[\s\S]*$/, '')
    
    // Adicionar paginação
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)
    
    // Executar queries
    const [contatosResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, params.slice(0, -2))
    ])
    
    const contatos = contatosResult
    const total = parseInt(countResult[0].total)
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        contatos,
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
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}