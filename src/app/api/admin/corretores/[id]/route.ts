import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// GET - Buscar corretor por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const paramsResolved = await params
    const corretorId = parseInt(paramsResolved.id)
    if (isNaN(corretorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const corretores = await query(
      'SELECT id, nome, email, creci, telefone, foto, ativo, role, created_at FROM corretores WHERE id = $1',
      [corretorId]
    )

    if (corretores.length === 0) {
      return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 })
    }

    const corretor = corretores[0]

    // Processar o campo foto se for um Buffer
    if (corretor.foto && typeof corretor.foto === 'object' && corretor.foto.type === 'Buffer') {
      corretor.foto = Buffer.from(corretor.foto.data).toString('utf8')
    }

    // Buscar estatísticas do corretor
    const stats = await query(`
      SELECT 
        COUNT(*) as total_imoveis,
        COUNT(CASE WHEN status = 'disponivel' THEN 1 END) as imoveis_disponiveis,
        COUNT(CASE WHEN status = 'vendido' THEN 1 END) as imoveis_vendidos,
        COUNT(CASE WHEN status = 'alugado' THEN 1 END) as imoveis_alugados
      FROM imoveis 
      WHERE corretor_id = $1
    `, [corretorId])

    return NextResponse.json({
      corretor: {
        ...corretor,
        estatisticas: stats[0] || {
          total_imoveis: 0,
          imoveis_disponiveis: 0,
          imoveis_vendidos: 0,
          imoveis_alugados: 0
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar corretor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar corretor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const paramsResolved = await params
    const corretorId = parseInt(paramsResolved.id)
    if (isNaN(corretorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar se o corretor existe
    const existingCorretor = await query(
      'SELECT * FROM corretores WHERE id = $1',
      [corretorId]
    )

    if (existingCorretor.length === 0) {
      return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    if (authResult.role !== 'admin' && authResult.userId !== corretorId) {
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
      role,
      ativo
    } = body

    // Verificar se email já existe (exceto para o próprio corretor)
    if (email && email !== existingCorretor[0].email) {
      const emailExists = await query(
        'SELECT id FROM corretores WHERE email = $1 AND id != $2',
        [email, corretorId]
      )

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Preparar campos para atualização
    let updateFields = []
    let updateValues = []

    let paramIndex = 1;
    
    if (nome !== undefined) {
      updateFields.push(`nome = $${paramIndex}`)
      updateValues.push(nome)
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`)
      updateValues.push(email)
      paramIndex++;
    }

    if (senha) {
      const hashedPassword = await bcrypt.hash(senha, 10)
      updateFields.push(`senha = $${paramIndex}`)
      updateValues.push(hashedPassword)
      paramIndex++;
    }

    if (creci !== undefined) {
      updateFields.push(`creci = $${paramIndex}`)
      updateValues.push(creci)
      paramIndex++;
    }

    if (telefone !== undefined) {
      updateFields.push(`telefone = $${paramIndex}`)
      updateValues.push(telefone)
      paramIndex++;
    }

    if (foto !== undefined) {
      updateFields.push(`foto = $${paramIndex}`)
      updateValues.push(foto)
      paramIndex++;
    }

    // Apenas admin pode alterar role e status
    if (authResult.role === 'admin') {
      if (role !== undefined) {
        updateFields.push(`role = $${paramIndex}`)
        updateValues.push(role)
        paramIndex++;
      }

      if (ativo !== undefined) {
        updateFields.push(`ativo = $${paramIndex}`)
        updateValues.push(ativo)
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    updateValues.push(corretorId)

    await query(
      `UPDATE corretores SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues
    )

    // Buscar corretor atualizado
    const updatedCorretor = await query(
      'SELECT id, nome, email, creci, telefone, foto, ativo, role, created_at FROM corretores WHERE id = $1',
      [corretorId]
    )

    return NextResponse.json({
      message: 'Corretor atualizado com sucesso',
      corretor: updatedCorretor[0]
    })
  } catch (error) {
    console.error('Erro ao atualizar corretor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir corretor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Apenas admin pode excluir corretores
    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const paramsResolved = await params
    const corretorId = parseInt(paramsResolved.id)

    // Impedir que o corretor exclua o próprio cadastro
    if (authResult.userId === corretorId) {
      return NextResponse.json({ error: 'Você não pode excluir o seu próprio cadastro' }, { status: 403 })
    }
    if (isNaN(corretorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar se o corretor existe
    const existingCorretor = await query(
      'SELECT * FROM corretores WHERE id = $1',
      [corretorId]
    )

    if (existingCorretor.length === 0) {
      return NextResponse.json({ error: 'Corretor não encontrado' }, { status: 404 })
    }

    // Verificar se o corretor tem imóveis associados
    const imoveisAssociados = await query(
      'SELECT COUNT(*) as total FROM imoveis WHERE corretor_id = $1',
      [corretorId]
    )

    if (imoveisAssociados[0].total > 0) {
      console.log(`Tentativa de excluir corretor ${corretorId} com ${imoveisAssociados[0].total} imóveis associados`)
      return NextResponse.json(
        { 
          error: 'Não é possível excluir corretor com imóveis associados', 
          message: `Este corretor possui ${imoveisAssociados[0].total} imóvel(is) vinculado(s). Remova os imóveis ou transfira-os para outro corretor antes de excluir.`
        },
        { status: 400 }
      )
    }

    try {
      // Remover foto se existir
      const corretor = existingCorretor[0]
      if (corretor.foto) {
        const fotoPath = path.join(process.cwd(), 'public', corretor.foto)
        if (fs.existsSync(fotoPath)) {
          console.log(`Excluindo foto do corretor: ${fotoPath}`)
          fs.unlinkSync(fotoPath)
        } else {
          console.log(`Foto do corretor não encontrada no caminho: ${fotoPath}`)
        }
      } else {
        console.log(`Corretor não possui foto para excluir`)
      }

      // Excluir corretor
      await query('DELETE FROM corretores WHERE id = $1', [corretorId])

      return NextResponse.json({
        message: 'Corretor excluído com sucesso'
      })
    } catch (deleteError) {
      console.error('Erro ao excluir corretor ou sua foto:', deleteError)
      throw deleteError // Propaga o erro para ser capturado pelo try/catch externo
    }
  } catch (error) {
    console.error('Erro ao excluir corretor [API]:', error)
    // Log detalhado para ajudar na depuração
    if (error instanceof Error) {
      console.error(`Detalhes do erro: ${error.message}`)
      console.error(`Stack trace: ${error.stack}`)
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}