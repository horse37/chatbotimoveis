import { query } from '@/lib/db';

interface SyncOptions {
  action: 'create' | 'update' | 'delete';
  imovelId: number;
}

/**
 * Função auxiliar para sincronizar imóveis com o Strapi
 * Deve ser chamada sempre que houver operações na tabela imoveis
 */
export async function syncImovelWithStrapi({ action, imovelId }: SyncOptions): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/strapi-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        imovelId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro na sincronização Strapi:', error);
      return { success: false, error: error.error };
    }

    const result = await response.json();
    console.log(`Sincronização ${action} concluída para imóvel ${imovelId}:`, result);
    return result;
  } catch (error) {
      console.error('Erro ao sincronizar com Strapi:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      // Ignora erro do Strapi para não quebrar a função
      return { success: false, error: errorMessage };
    }
}

/**
 * Função para sincronizar todos os imoveis existentes
 * Útil para migração inicial ou ressincronização
 */
export async function syncAllImoveis(): Promise<any> {
  try {
    const imoveis = await query(`
      SELECT 
        i.*,
        json_agg(DISTINCT img.url) as images,
        json_agg(DISTINCT c.nome) as caracteristicas
      FROM imoveis i
      LEFT JOIN imovel_images img ON i.id = img.imovel_id
      LEFT JOIN imovel_caracteristicas ic ON i.id = ic.imovel_id
      LEFT JOIN caracteristicas c ON ic.caracteristica_id = c.id
      GROUP BY i.id
    `);

    const results = [];
    
    for (const imovel of imoveis) {
      const result = await syncImovelWithStrapi({
        action: 'create',
        imovelId: imovel.id
      });
      
      results.push({
        imovelId: imovel.id,
        result
      });
      
      // Pequena pausa para não sobrecarregar o Strapi
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      success: true,
      total: imoveis.length,
      results
    };
  } catch (error) {
    console.error('Erro ao sincronizar todos os imóveis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}

/**
 * Função para verificar o status da sincronização
 */
export async function checkSyncStatus(): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/strapi-sync`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar';
    return { success: false, error: errorMessage };
  }
}