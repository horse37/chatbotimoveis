import { NextRequest, NextResponse } from 'next/server';
import { strapiSyncService } from '@/lib/strapi-sync';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, imovelId } = body;

    if (!action || !imovelId) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: action e imovelId' },
        { status: 400 }
      );
    }

    if (!['create', 'update', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use: create, update ou delete' },
        { status: 400 }
      );
    }

    // Busca o imóvel no banco local
    const imovelResult = await query(`
      SELECT 
        i.*,
        json_agg(DISTINCT jsonb_build_object('url', img.url)) as images,
        json_agg(DISTINCT jsonb_build_object('nome', c.nome)) as caracteristicas
      FROM imoveis i
      LEFT JOIN imovel_images img ON i.id = img.imovel_id
      LEFT JOIN imovel_caracteristicas ic ON i.id = ic.imovel_id
      LEFT JOIN caracteristicas c ON ic.caracteristica_id = c.id
      WHERE i.id = $1
      GROUP BY i.id
    `, [imovelId]);

    const imovel = imovelResult[0];

    if (!imovel && action !== 'delete') {
      return NextResponse.json(
        { error: 'Imóvel não encontrado' },
        { status: 404 }
      );
    }

    // Prepara os dados para sincronização
    let localImovel = null;
    
    if (imovel) {
      localImovel = {
        id: imovel.id,
        title: imovel.title,
        description: imovel.description,
        price: Number(imovel.price),
        tipo_contrato: imovel.tipo_contrato,
        tipo_imovel: imovel.tipo_imovel,
        active: Boolean(imovel.active),
        bairro: imovel.bairro,
        cidade: imovel.cidade,
        images: (imovel.images || []).map((img: any) => img.url || img),
        caracteristicas: (imovel.caracteristicas || []).map((c: any) => c.nome || c),
        created_at: new Date(imovel.created_at),
        updated_at: new Date(imovel.updated_at)
      };
    }

    // Sincroniza com o Strapi
    if (!localImovel) {
      return NextResponse.json(
        { error: 'Imóvel não encontrado no banco local' },
        { status: 404 }
      );
    }
    
    const result = await strapiSyncService.syncImovel(localImovel, action);

    return NextResponse.json({
      success: true,
      action,
      imovelId,
      strapiResponse: result
    });

  } catch (error) {
      console.error('Erro na sincronização:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return NextResponse.json(
        { error: 'Erro interno do servidor', details: errorMessage },
        { status: 500 }
      );
    }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de sincronização Strapi ativa',
    endpoints: {
      sync: 'POST /api/strapi-sync'
    },
    bodyExample: {
      action: 'create|update|delete',
      imovelId: 123
    }
  });
}