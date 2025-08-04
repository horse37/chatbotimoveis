/**
 * INSTRUÇÕES DE INTEGRAÇÃO COM STRAPI
 * 
 * Este arquivo contém exemplos de como integrar a sincronização com Strapi
 * no seu código existente de gerenciamento de imóveis.
 * 
 * IMPORTANTE: Substitua as chamadas ao seu banco de dados atual
 * pelos exemplos abaixo conforme sua implementação.
 */

// Exemplo de função para criar imóvel com sincronização
export async function createImovelWithSync(imovelData: any) {
  /* 
   * Substitua esta função pela sua lógica de criação de imóvel
   * e adicione a chamada de sincronização
   */
  
  try {
    // 1. Crie o imóvel no seu banco de dados
    // const imovel = await seuSistemaDeBanco.criarImovel(imovelData);
    
    // 2. Sincronize com o Strapi
    // await syncImovelWithStrapi({ action: 'create', imovelId: imovel.id });
    
    // 3. Retorne o imóvel criado
    // return imovel;
    
    console.log('Função createImovelWithSync - implementar conforme seu sistema');
    return null;
  } catch (error) {
    console.error('Erro ao criar imóvel:', error);
    throw error;
  }
}

// Exemplo de função para atualizar imóvel com sincronização
export async function updateImovelWithSync(id: number, imovelData: any) {
  /*
   * Substitua esta função pela sua lógica de atualização de imóvel
   */
  
  try {
    // 1. Atualize o imóvel no seu banco de dados
    // const imovel = await seuSistemaDeBanco.atualizarImovel(id, imovelData);
    
    // 2. Sincronize com o Strapi
    // await syncImovelWithStrapi({ action: 'update', imovelId: id });
    
    // 3. Retorne o imóvel atualizado
    // return imovel;
    
    console.log('Função updateImovelWithSync - implementar conforme seu sistema');
    return null;
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error);
    throw error;
  }
}

// Exemplo de função para deletar imóvel com sincronização
export async function deleteImovelWithSync(id: number) {
  /*
   * Substitua esta função pela sua lógica de exclusão de imóvel
   */
  
  try {
    // 1. Delete o imóvel do seu banco de dados
    // await seuSistemaDeBanco.deletarImovel(id);
    
    // 2. Sincronize com o Strapi
    // await syncImovelWithStrapi({ action: 'delete', imovelId: id });
    
    // 3. Retorne confirmação
    // return { success: true, deletedId: id };
    
    console.log('Função deleteImovelWithSync - implementar conforme seu sistema');
    return { success: true, deletedId: id };
  } catch (error) {
    console.error('Erro ao deletar imóvel:', error);
    throw error;
  }
}

/**
 * Funções auxiliares que podem ser usadas diretamente
 */

/**
 * Testa a conexão com o Strapi
 */
export async function testStrapiConnection() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host'}/imoveis`);
    return response.ok;
  } catch (error) {
    console.error('Erro na conexão com Strapi:', error);
    return false;
  }
}

/**
 * Obtém estatísticas básicas (requer implementação do seu sistema)
 */
export async function getSyncStats() {
  try {
    // Substitua pela sua lógica de contagem
    // const totalLocal = await seuSistemaDeBanco.contarImoveis();
    const totalLocal = 0; // Implementar
    
    let totalStrapi = 0;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://whatsapp-strapi.xjueib.easypanel.host'}/imoveis`);
      if (response.ok) {
        const data = await response.json();
        totalStrapi = Array.isArray(data) ? data.length : 0;
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do Strapi:', error);
    }

    return {
      totalLocal,
      totalStrapi,
      pendingSync: Math.max(0, totalLocal - totalStrapi)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao obter estatísticas:', errorMessage);
    return { totalLocal: 0, totalStrapi: 0, pendingSync: 0 };
  }
}

/**
 * EXEMPLOS DE INTEGRAÇÃO
 * 
 * Para usar a sincronização, substitua suas operações CRUD existentes:
 * 
 * EXEMPLO 1 - Criação:
 * 
 * // Antes:
 * const novoImovel = await seuSistema.criarImovel(dados);
 * 
 * // Depois:
 * const novoImovel = await seuSistema.criarImovel(dados);
 * await syncImovelWithStrapi({ action: 'create', imovelId: novoImovel.id });
 * 
 * EXEMPLO 2 - Atualização:
 * 
 * // Antes:
 * await seuSistema.atualizarImovel(id, dados);
 * 
 * // Depois:
 * await seuSistema.atualizarImovel(id, dados);
 * await syncImovelWithStrapi({ action: 'update', imovelId: id });
 * 
 * EXEMPLO 3 - Exclusão:
 * 
 * // Antes:
 * await seuSistema.deletarImovel(id);
 * 
 * // Depois:
 * await seuSistema.deletarImovel(id);
 * await syncImovelWithStrapi({ action: 'delete', imovelId: id });
 */