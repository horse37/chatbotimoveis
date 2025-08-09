import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticação
    const auth = await requireAuth(request)
    if (!auth.success) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 })
    }
    
    // Verificar se é admin
    if (auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }
    
    console.log('🚀 Iniciando sincronização de imóveis...')
    
    try {
      // Buscar todos os imóveis do banco local com todos os campos necessários
      const imoveis = await query(`
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
        ORDER BY id ASC
      `);

      if (!imoveis || imoveis.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Nenhum imóvel encontrado para sincronização',
          total: 0,
          successCount: 0,
          errorCount: 0,
          errors: []
        });
      }

      const strapiUrl = process.env.STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host';
      
      console.log('🔗 URL do Strapi:', strapiUrl);
      console.log('⚠️  Sincronização sem token (modo público)');
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Sincronizar cada imóvel
      for (const imovel of imoveis) {
        try {
          // Preparar dados para o Strapi
          // Construir tipologia como no envio individual
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
      active: Boolean(imovel.ativo),
      bairro: imovel.bairro || '',
      cidade: imovel.cidade || '',
      tipologia: tipologia,
      url: `https://coopcorretores.com.br/imoveis/${imovel.id}`,
      id_integracao: imovel.id
    };

          console.log(`🔍 Verificando imóvel ${imovel.id} no Strapi...`);
          
          // Buscar todos os imóveis do Strapi
           const checkResponse = await fetch(`${strapiUrl}/imoveis`);
          
          if (!checkResponse.ok) {
            console.error(`❌ Erro ao buscar imóveis no Strapi:`, checkResponse.status, checkResponse.statusText);
            throw new Error(`Erro ao buscar imóveis: ${checkResponse.status}`);
          }
          
          const existingData = await checkResponse.json();
          console.log(`✅ Total de imóveis encontrados no Strapi:`, existingData?.data?.length || 0);
          
          // Procurar imóvel pelo id_integracao
        const imoveisExistentes = existingData?.data || [];
        const existingImovel = imoveisExistentes.find((item: any) => item.attributes?.id_integracao === imovel.id);
           
           let response;
           if (existingImovel) {
             console.log(`✅ Imóvel ${imovel.id} encontrado no Strapi (ID: ${existingImovel.id}) - atualizando...`);
            // Atualizar imóvel existente
            const imovelId = existingImovel.id;
            response = await fetch(`${strapiUrl}/imoveis/${imovelId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ data: strapiData })
            });
          } else {
            console.log(`🆕 Imóvel ${imovel.id} não encontrado - criando novo...`);
            // Criar novo imóvel
            response = await fetch(`${strapiUrl}/imoveis`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ data: strapiData })
            });
          }

          if (response.ok) {
            successCount++;
            console.log(`✅ Imóvel ${imovel.id} sincronizado com sucesso`);
          } else {
            const errorData = await response.text();
            console.error(`❌ Erro ao sincronizar imóvel ${imovel.id}:`, response.status, response.statusText, errorData);
            throw new Error(`HTTP ${response.status}: ${errorData}`);
          }
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Imóvel ${imovel.id}: ${errorMessage}`);
          console.error(`❌ Erro ao sincronizar imóvel ${imovel.id}:`, error);
        }
      }

      return NextResponse.json({
        success: true,
        total: imoveis.length,
        successCount,
        errorCount,
        errors,
        message: `Sincronização concluída: ${successCount}/${imoveis.length} imóveis processados`
      });

    } catch (error: any) {
      console.error('Erro na sincronização:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}