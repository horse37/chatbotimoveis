import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Buscar contato por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const paramsResolved = await params
    const contatoId = paramsResolved.id
    
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      return NextResponse.json(
        { error: 'ID do contato inválido' },
        { status: 400 }
      )
    }

    // Buscar contato com informações do imóvel
    const contatoQuery = `
      SELECT 
        c.*,
        i.titulo as imovel_titulo,
        i.preco as imovel_preco,
        i.endereco as imovel_endereco
      FROM contatos c
      LEFT JOIN imoveis i ON c.imovel_id = i.id
      WHERE c.id = $1
    `
    
    const result = await query(contatoQuery, [contatoId])
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      contato: result[0]
    })
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar contato
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const paramsResolved = await params
    const contatoId = paramsResolved.id
    
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      return NextResponse.json(
        { error: 'ID do contato inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, observacoes } = body

    // Verificar se o contato existe
    const checkQuery = 'SELECT id FROM contatos WHERE id = $1'
    const checkResult = await query(checkQuery, [contatoId])
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    // Validar status se fornecido
    const validStatuses = ['novo', 'em_andamento', 'respondido', 'finalizado']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Construir query de atualização
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (status) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++
    }

    if (observacoes !== undefined) {
      updateFields.push(`observacoes = $${paramIndex}`)
      updateValues.push(observacoes)
      paramIndex++
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(contatoId)

    const updateQuery = `
      UPDATE contatos 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await query(updateQuery, updateValues)

    return NextResponse.json({
      message: 'Contato atualizado com sucesso',
      contato: result[0]
    })
  } catch (error) {
    console.error('Erro ao atualizar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir contato
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const paramsResolved = await params
    const contatoId = paramsResolved.id
    
    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(contatoId)) {
      return NextResponse.json(
        { error: 'ID do contato inválido' },
        { status: 400 }
      )
    }

    // Verificar se o contato existe
    const checkQuery = 'SELECT id FROM contatos WHERE id = $1'
    const checkResult = await query(checkQuery, [contatoId])
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }

    // Excluir contato
    await query('DELETE FROM contatos WHERE id = $1', [contatoId])

    return NextResponse.json({
      message: 'Contato excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}