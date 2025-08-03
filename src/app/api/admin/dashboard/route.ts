import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET - Buscar dados do dashboard
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Buscar estatísticas de imóveis
    const imoveisStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as ativos,
        COUNT(*) FILTER (WHERE status = 'vendido') as vendidos,
        COUNT(*) FILTER (WHERE ativo = false) as inativos
      FROM imoveis
    `)

    // Buscar estatísticas de corretores
    const corretoresStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE ativo = true) as ativos,
        COUNT(*) FILTER (WHERE ativo = false) as inativos
      FROM corretores
    `)

    // Buscar estatísticas de contatos
    const contatosStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'novo') as novos,
        COUNT(*) FILTER (WHERE status = 'em_andamento') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'respondido') as respondidos,
        COUNT(*) FILTER (WHERE status = 'finalizado') as finalizados
      FROM contatos
    `)

    // Buscar estatísticas de vendas (simuladas por enquanto)
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const vendasStats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'vendido' AND EXTRACT(MONTH FROM updated_at) = $1 AND EXTRACT(YEAR FROM updated_at) = $2) as mes_atual,
        COUNT(*) FILTER (WHERE status = 'vendido' AND EXTRACT(MONTH FROM updated_at) = $3 AND EXTRACT(YEAR FROM updated_at) = $4) as mes_anterior,
        COUNT(*) FILTER (WHERE status = 'vendido' AND EXTRACT(YEAR FROM updated_at) = $2) as total_ano
      FROM imoveis
    `, [currentMonth, currentYear, previousMonth, previousMonthYear])

    // Buscar imóveis mais visualizados (simulado por enquanto)
    const topImoveis = await query(`
      SELECT 
        i.id,
        i.titulo,
        i.preco,
        COALESCE(i.visualizacoes, 0) as visualizacoes,
        (
          SELECT COUNT(*) 
          FROM contatos c 
          WHERE c.imovel_id = i.id
        ) as contatos
      FROM imoveis i
      WHERE i.ativo = true
      ORDER BY COALESCE(i.visualizacoes, 0) DESC, i.created_at DESC
      LIMIT 5
    `)

    // Buscar atividades recentes
    const recentActivities = await query(`
      (
        SELECT 
          'imovel' as tipo,
          'Novo imóvel cadastrado' as titulo,
          titulo as descricao,
          created_at as data,
          status,
          id
        FROM imoveis
        ORDER BY created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'contato' as tipo,
          'Novo contato recebido' as titulo,
          CONCAT('Contato de ', nome) as descricao,
          created_at as data,
          status,
          id
        FROM contatos
        ORDER BY created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'corretor' as tipo,
          'Corretor cadastrado' as titulo,
          CONCAT('Corretor: ', nome) as descricao,
          created_at as data,
          CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END as status,
          id
        FROM corretores
        ORDER BY created_at DESC
        LIMIT 2
      )
      ORDER BY data DESC
      LIMIT 10
    `)

    // Montar resposta
    const stats = {
      imoveis: {
        total: parseInt(imoveisStats[0].total),
        ativos: parseInt(imoveisStats[0].ativos),
        vendidos: parseInt(imoveisStats[0].vendidos),
        inativos: parseInt(imoveisStats[0].inativos)
      },
      corretores: {
        total: parseInt(corretoresStats[0].total),
        ativos: parseInt(corretoresStats[0].ativos),
        inativos: parseInt(corretoresStats[0].inativos)
      },
      contatos: {
        total: parseInt(contatosStats[0].total),
        novos: parseInt(contatosStats[0].novos),
        em_andamento: parseInt(contatosStats[0].em_andamento),
        respondidos: parseInt(contatosStats[0].respondidos),
        finalizados: parseInt(contatosStats[0].finalizados)
      },
      vendas: {
        mes_atual: parseInt(vendasStats[0].mes_atual),
        mes_anterior: parseInt(vendasStats[0].mes_anterior),
        total_ano: parseInt(vendasStats[0].total_ano)
      }
    }

    return NextResponse.json({
      stats,
      topImoveis: topImoveis.map(imovel => ({
        ...imovel,
        visualizacoes: parseInt(imovel.visualizacoes),
        contatos: parseInt(imovel.contatos)
      })),
      recentActivities: recentActivities
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}