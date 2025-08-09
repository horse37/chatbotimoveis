import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('Sincronização individual - ID recebido:', id, 'tipo:', typeof id)
  
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Validar se o ID é uma string válida (UUID ou string normal)
    if (!id || typeof id !== 'string') {
      console.log('Erro: ID não é uma string válida -', id)
      return NextResponse.json({ error: 'ID do imóvel inválido' }, { status: 400 })
    }

    console.log('ID string válido recebido:', id)

    // Buscar o imóvel específico
    const imovelResult = await query(`
      SELECT 
        id,
        titulo,
        descricao,
        preco,
        finalidade,
        tipo,
        ativo,
        bairro,
        cidade,
        area_construida,
        area_total,
        quartos,
        banheiros,
        vagas_garagem
      FROM imoveis
      WHERE id = $1
    `, [id]);

    if (!imovelResult || imovelResult.length === 0) {
      return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 })
    }

    const imovel = imovelResult[0];
    const strapiUrl = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
    
    console.log('🔗 URL do Strapi:', strapiUrl);
    console.log('⚠️  Sincronização sem token (modo público)');

    // Preparar dados para o Strapi
    const caracteristicas = [];
    if (imovel.area_construida && imovel.area_construida !== 0) caracteristicas.push(`area_construida ${String(imovel.area_construida)}`);
    if (imovel.area_total && imovel.area_total !== 0) caracteristicas.push(`area_total ${String(imovel.area_total)}`);
    if (imovel.banheiros && imovel.banheiros !== 0) caracteristicas.push(`banheiros ${String(imovel.banheiros)}`);
    if (imovel.quartos && imovel.quartos !== 0) caracteristicas.push(`quartos ${String(imovel.quartos)}`);
    if (imovel.vagas_garagem && imovel.vagas_garagem !== 0) caracteristicas.push(`vagas_garagem ${String(imovel.vagas_garagem)}`);
    const tipologia = caracteristicas.join(', ');

    const strapiData = {
      title: imovel.titulo || 'Imóvel sem título',
      description: imovel.descricao || '',
      price: Number(imovel.preco || 0),
      tipo_contrato: imovel.finalidade || 'venda',
      tipo_imovel: imovel.tipo || 'apartamento',
      active: imovel.ativo !== null ? Boolean(imovel.ativo) : true, // Default para true se null
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      tipologia: tipologia,
      url: `https://coopcorretores.com.br/imoveis/${imovel.id}`,
      id_integracao: String(imovel.id)
    };
    
    console.log(`📋 Dados preparados para envio:`, JSON.stringify(strapiData, null, 2));
    
    // Validar dados essenciais
    if (!strapiData.title || !strapiData.id_integracao) {
      console.error(`❌ Dados essenciais faltando:`, {
        title: strapiData.title,
        id_integracao: strapiData.id_integracao
      });
      return NextResponse.json(
        { error: 'Dados essenciais faltando (title ou id_integracao)' },
        { status: 400 }
      );
    }

    console.log(`🔍 Verificando imóvel ${imovel.id} no Strapi...`);
    
    // Buscar imóvel específico por id_integracao no Strapi v3.8
    const filterUrl = `${strapiUrl}/imoveis?id_integracao=${encodeURIComponent(imovel.id)}`;
    console.log(`🔍 Buscando imóvel por id_integracao: ${filterUrl}`);
    
    const existingResponse = await fetch(filterUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!existingResponse.ok) {
      console.error(`❌ Erro ao buscar imóveis:`, existingResponse.status, existingResponse.statusText);
      throw new Error(`Erro ao buscar imóveis: ${existingResponse.status}`);
    }
    
    const existingData = await existingResponse.json();
    console.log(`✅ Resposta da busca:`, JSON.stringify(existingData, null, 2));
    
    // No Strapi v3.8, a resposta é um array direto, não { data: [] }
    const imoveisExistentes = Array.isArray(existingData) ? existingData : [];
    console.log(`✅ Total de imóveis encontrados: ${imoveisExistentes.length}`);
    
    let existingImovel = null;
    if (imoveisExistentes.length > 0) {
      existingImovel = imoveisExistentes[0]; // Pega o primeiro resultado
      console.log(`✅ MATCH encontrado! ID Strapi: ${existingImovel.id}`);
    }
    
    console.log(`📊 Imóvel encontrado:`, existingImovel ? `SIM (ID: ${existingImovel.id})` : 'NÃO');
    
    let response;
    if (existingImovel) {
      console.log(`🔄 Atualizando imóvel existente no Strapi (ID: ${existingImovel.id})...`);
      console.log(`📤 URL de atualização: ${strapiUrl}/imoveis/${existingImovel.id}`);
      console.log(`📤 Dados de atualização:`, JSON.stringify(strapiData, null, 2));
      
      response = await fetch(`${strapiUrl}/imoveis/${existingImovel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strapiData)
      });
    } else {
      console.log(`➕ Criando novo imóvel no Strapi...`);
      console.log(`📤 URL de criação: ${strapiUrl}/imoveis`);
      console.log(`📤 Dados de criação:`, JSON.stringify(strapiData, null, 2));
      
      response = await fetch(`${strapiUrl}/imoveis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strapiData)
      });
    }

    console.log(`📥 Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao sincronizar imóvel ${imovel.id}:`, response.status, errorText);
      return NextResponse.json(
        { error: `Erro ao sincronizar: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log(`📥 Resposta do Strapi:`, JSON.stringify(result, null, 2));
    
    const operacao = existingImovel ? 'atualizado' : 'criado';
    console.log(`✅ Imóvel ${imovel.id} ${operacao} com sucesso no Strapi!`);
    
    return NextResponse.json({
      success: true,
      message: `Imóvel ${imovel.id} ${operacao} com sucesso`,
      data: result,
      operation: operacao
    });

  } catch (error: any) {
    console.error('Erro na sincronização individual:', error)
    
    if (error.code === 'TIMEOUT') {
      return NextResponse.json({ 
        error: 'Timeout na sincronização - processo demorou mais que o esperado' 
      }, { status: 408 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    }, { status: 500 })
  }
}