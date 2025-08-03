import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar estatísticas
    const [imoveisResult, imoveisDisponiveisResult, corretoresResult, mensagensResult] = await Promise.all([
      query('SELECT COUNT(*) as total FROM imoveis'),
      query('SELECT COUNT(*) as total FROM imoveis WHERE status = $1', ['disponivel']),
      query('SELECT COUNT(*) as total FROM corretores'),
      query('SELECT COUNT(*) as total FROM contatos WHERE status = $1', ['pendente']),
    ])

    const stats = {
      totalImoveis: parseInt(imoveisResult[0].total),
      imoveisDisponiveis: parseInt(imoveisDisponiveisResult[0].total),
      totalCorretores: parseInt(corretoresResult[0].total),
      mensagensPendentes: parseInt(mensagensResult[0].total),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}