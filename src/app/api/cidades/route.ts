import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Buscar cidades distintas que têm imóveis cadastrados
    const sql = `
      SELECT DISTINCT cidade 
      FROM imoveis 
      WHERE cidade IS NOT NULL 
        AND cidade != '' 
        AND status = 'disponivel'
      ORDER BY cidade ASC
    `
    
    const result = await query(sql)
    
    // Extrair apenas os nomes das cidades
    const cidades = result.map((row: any) => row.cidade)
    
    return NextResponse.json({
      success: true,
      cidades
    })
    
  } catch (error) {
    console.error('Erro ao buscar cidades:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}