// Configurações do Strapi

interface StrapiImovel {
  id?: number;
  title: string;
  description: string;
  price: number;
  tipo_contrato: 'venda' | 'aluguel';
  tipo_imovel: string;
  active: boolean;
  bairro: string;
  cidade: string;
  tipologia: string;
  images?: any[];
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface LocalImovel {
  id: number;
  title: string;
  description: string;
  price: number;
  tipo_contrato: 'venda' | 'aluguel';
  tipo_imovel: string;
  active: boolean;
  bairro: string;
  cidade: string;
  images: string[];
  caracteristicas: string[];
  created_at: Date;
  updated_at: Date;
}

class StrapiSyncService {
  private strapiUrl = 'https://whatsapp-strapi.xjueib.easypanel.host';
  private apiToken = process.env.STRAPI_SERVER_API_TOKEN || '';

  private async uploadImage(imagePath: string): Promise<any> {
    try {
      const formData = new FormData();
      
      // Para imagens locais, precisamos ler o arquivo
      if (imagePath.startsWith('/')) {
        const fs = require('fs');
        const path = require('path');
        
        if (fs.existsSync(imagePath)) {
          const fileBuffer = fs.readFileSync(imagePath);
          const fileName = path.basename(imagePath);
          
          formData.append('files', new Blob([fileBuffer]), fileName);
          
          const response = await fetch(`${this.strapiUrl}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
            },
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            return result[0]; // Retorna a primeira imagem enviada
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    }
  }

  private async uploadImages(imagePaths: string[]): Promise<any[]> {
    const uploadedImages = [];
    
    for (const imagePath of imagePaths) {
      const uploadedImage = await this.uploadImage(imagePath);
      if (uploadedImage) {
        uploadedImages.push(uploadedImage);
      }
    }
    
    return uploadedImages;
  }

  private formatTipologia(caracteristicas: string[]): string {
    if (!caracteristicas || caracteristicas.length === 0) {
      return '';
    }
    
    return caracteristicas.join(', ').toUpperCase();
  }

  private mapLocalToStrapi(imovel: LocalImovel, uploadedImages?: any[]): StrapiImovel {
    return {
      title: imovel.title,
      description: imovel.description,
      price: imovel.price,
      tipo_contrato: imovel.tipo_contrato,
      tipo_imovel: imovel.tipo_imovel,
      active: imovel.active,
      bairro: imovel.bairro,
      cidade: imovel.cidade,
      tipologia: this.formatTipologia(imovel.caracteristicas),
      images: uploadedImages || [],
      published_at: new Date().toISOString()
    };
  }

  async createImovel(imovel: LocalImovel): Promise<any> {
    try {
      // Primeiro faz upload das imagens
      const uploadedImages = await this.uploadImages(imovel.images);
      
      // Prepara os dados para o Strapi
      const strapiImovel = this.mapLocalToStrapi(imovel, uploadedImages);
      
      const response = await fetch(`${this.strapiUrl}/imoveis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({ data: strapiImovel })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao criar imóvel: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar imóvel no Strapi:', error);
      throw error;
    }
  }

  async updateImovel(strapiId: number, imovel: LocalImovel): Promise<any> {
    try {
      // Primeiro faz upload das novas imagens
      const uploadedImages = await this.uploadImages(imovel.images);
      
      // Prepara os dados para o Strapi
      const strapiImovel = this.mapLocalToStrapi(imovel, uploadedImages);
      
      const response = await fetch(`${this.strapiUrl}/imoveis/${strapiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({ data: strapiImovel })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar imóvel: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar imóvel no Strapi:', error);
      throw error;
    }
  }

  async deleteImovel(strapiId: number): Promise<any> {
    try {
      const response = await fetch(`${this.strapiUrl}/imoveis/${strapiId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao deletar imóvel: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao deletar imóvel no Strapi:', error);
      throw error;
    }
  }

  async findImovelByLocalId(localId: number): Promise<any> {
    try {
      const response = await fetch(`${this.strapiUrl}/imoveis?local_id=${localId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar imóvel: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data?.[0] || null;
    } catch (error) {
      console.error('Erro ao buscar imóvel no Strapi:', error);
      return null;
    }
  }

  async syncImovel(imovel: LocalImovel, action: 'create' | 'update' | 'delete'): Promise<any> {
    try {
      switch (action) {
        case 'create':
          return await this.createImovel(imovel);
        
        case 'update':
          const existingImovel = await this.findImovelByLocalId(imovel.id);
          if (existingImovel) {
            return await this.updateImovel(existingImovel.id, imovel);
          } else {
            return await this.createImovel(imovel);
          }
        
        case 'delete':
          const imovelToDelete = await this.findImovelByLocalId(imovel.id);
          if (imovelToDelete) {
            return await this.deleteImovel(imovelToDelete.id);
          }
          return null;
        
        default:
          throw new Error('Ação inválida');
      }
    } catch (error) {
      console.error('Erro ao sincronizar imóvel:', error);
      throw error;
    }
  }
}

export const strapiSyncService = new StrapiSyncService();