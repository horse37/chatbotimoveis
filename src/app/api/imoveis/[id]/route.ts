import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID do imóvel inválido' 
        },
        { status: 400 }
      )
    }
    
    const sql = `
      SELECT 
        id,
        codigo,
        titulo,
        descricao,
        preco,
        tipo,
        status,
        area_total,
        quartos,
        banheiros,
        vagas_garagem,
        endereco,
        cidade,
        estado,
        cep,
        fotos,
        videos,
        created_at,
        updated_at
      FROM imoveis
      WHERE id = $1
    `
    
    const result = await query(sql, [id])
    
    if (!result || result.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Imóvel não encontrado' 
        },
        { status: 404 }
      )
    }
    
    const imovel = result[0]
    
    // Processar as fotos e vídeos (se estiverem em formato JSON)
    if (imovel.fotos) {
      try {
        imovel.fotos = typeof imovel.fotos === 'string' 
          ? JSON.parse(imovel.fotos) 
          : imovel.fotos;
      } catch {
        imovel.fotos = [];
      }
    } else {
      imovel.fotos = [];
    }
    
    if (imovel.videos) {
      try {
        imovel.videos = typeof imovel.videos === 'string' 
          ? JSON.parse(imovel.videos) 
          : imovel.videos;
      } catch {
        imovel.videos = [];
      }
    } else {
      imovel.videos = [];
    }
    
    return NextResponse.json(imovel)
    
  } catch (error) {
    console.error('Erro ao buscar imóvel:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID do imóvel inválido' 
        },
        { status: 400 }
      )
    }
    
    const {
      titulo,
      descricao,
      tipo,
      status,
      preco,
      endereco,
      bairro,
      cidade,
      cep,
      area_total,
      area_construida,
      quartos,
      banheiros,
      vagas_garagem,
      caracteristicas
    } = body
    
    // Verificar se o imóvel existe
    const checkSql = 'SELECT id FROM imoveis WHERE id = $1 AND ativo = true'
    const checkResult = await query(checkSql, [id])
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Imóvel não encontrado' 
        },
        { status: 404 }
      )
    }
    
    const sql = `
      UPDATE imoveis SET
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        tipo = COALESCE($3, tipo),
        status = COALESCE($4, status),
        preco = COALESCE($5, preco),
        endereco = COALESCE($6, endereco),
        bairro = COALESCE($7, bairro),
        cidade = COALESCE($8, cidade),
        cep = COALESCE($9, cep),
        area_total = COALESCE($10, area_total),
        area_construida = COALESCE($11, area_construida),
        quartos = COALESCE($12, quartos),
        banheiros = COALESCE($13, banheiros),
        vagas_garagem = COALESCE($14, vagas_garagem),
        caracteristicas = COALESCE($15, caracteristicas),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `
    
    const queryParams = [
      titulo,
      descricao,
      tipo,
      status,
      preco,
      endereco,
      bairro,
      cidade,
      cep,
      area_total,
      area_construida,
      quartos,
      banheiros,
      vagas_garagem,
      caracteristicas ? JSON.stringify(caracteristicas) : null,
      id
    ]
    
    const result = await query(sql, queryParams)
    const imovel = result[0]
    
    return NextResponse.json({
      success: true,
      data: { imovel }
    })
    
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID do imóvel inválido' 
        },
        { status: 400 }
      )
    }
    
    // Soft delete - marcar como inativo
    const sql = `
      UPDATE imoveis SET 
        ativo = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND ativo = true
      RETURNING id
    `
    
    const result = await query(sql, [id])
    
    if (result.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Imóvel não encontrado' 
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Imóvel removido com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao remover imóvel:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}