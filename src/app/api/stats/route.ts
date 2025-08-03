import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET() {
  try {
    const client = await pool.connect()
    
    // Buscar total de imóveis
    const imoveisResult = await client.query('SELECT COUNT(*) as total FROM imoveis WHERE status = $1', ['disponivel'])
    const totalImoveis = parseInt(imoveisResult.rows[0].total)
    
    // Buscar total de cidades
    const cidadesResult = await client.query('SELECT COUNT(DISTINCT cidade) as total FROM imoveis')
    const totalCidades = parseInt(cidadesResult.rows[0].total)
    
    // Anos de experiência (valor fixo)
    const anosExperiencia = 10
    
    client.release()
    
    return NextResponse.json({
      imoveis: totalImoveis,
      cidades: totalCidades,
      anos: anosExperiencia
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}