import type { MetadataRoute } from 'next'
import { query } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Buscar todos os imóveis ativos
    const imoveis = await query(`
      SELECT id, created_at, updated_at 
      FROM imoveis 
      WHERE status IN ('disponivel', 'vendido', 'alugado')
      ORDER BY created_at DESC
    `)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br'
    
    // URLs estáticas
    const staticUrls: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/imoveis`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9
      },
      {
        url: `${baseUrl}/contato`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7
      }
    ]

    // URLs dinâmicas dos imóveis
    const imovelUrls: MetadataRoute.Sitemap = imoveis.map((imovel: any) => ({
      url: `${baseUrl}/imovel/${imovel.id}`,
      lastModified: new Date(imovel.updated_at || imovel.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))

    return [...staticUrls, ...imovelUrls]
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error)
    // Retorna pelo menos as URLs estáticas em caso de erro
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br'
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/imoveis`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9
      },
      {
        url: `${baseUrl}/contato`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7
      }
    ]
  }
}