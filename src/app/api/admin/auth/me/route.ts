import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Buscar dados do usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const userId = authResult.userId

    // Buscar dados do usuário
    const result = await query(
      'SELECT id, nome, email, role, ativo, created_at FROM corretores WHERE id = $1',
      [userId]
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const user = result[0]

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      return NextResponse.json(
        { error: 'Usuário inativo' },
        { status: 403 }
      )
    }

    // Buscar estatísticas do usuário (se for corretor)
    let stats = null
    if (user.role === 'corretor') {
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total_imoveis,
          COUNT(*) FILTER (WHERE status = 'ativo') as imoveis_ativos,
          COUNT(*) FILTER (WHERE status = 'vendido') as imoveis_vendidos,
          (
            SELECT COUNT(*) 
            FROM contatos c 
            JOIN imoveis i ON c.imovel_id = i.id 
            WHERE i.corretor_id = $1
          ) as total_contatos
        FROM imoveis 
        WHERE corretor_id = $1
      `, [userId])
      
      if (statsResult.length > 0) {
        stats = {
          total_imoveis: parseInt(statsResult[0].total_imoveis),
          imoveis_ativos: parseInt(statsResult[0].imoveis_ativos),
          imoveis_vendidos: parseInt(statsResult[0].imoveis_vendidos),
          total_contatos: parseInt(statsResult[0].total_contatos)
        }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        created_at: user.created_at,
        stats
      }
    })
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}