import { Metadata } from 'next'
import { query } from '@/lib/db'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const imovelResult = await query(
      'SELECT * FROM imoveis WHERE id = $1',
      [params.id]
    )

    if (!imovelResult || imovelResult.length === 0) {
      return {
        title: 'Imóvel não encontrado - Cooperativa de Corretores',
        description: 'O imóvel solicitado não foi encontrado.'
      }
    }

    const imovel = imovelResult[0]
    const precoFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(imovel.preco)

    const title = `${imovel.titulo} - ${precoFormatado} | Cooperativa de Corretores`
    const description = `${imovel.tipo} com ${imovel.quartos} quartos, ${imovel.banheiros} banheiros em ${imovel.cidade}, ${imovel.estado}. ${imovel.descricao?.substring(0, 150)}...`

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br'
    const imageUrl = imovel.imagens && imovel.imagens.length > 0 
      ? `${baseUrl}${imovel.imagens[0]}` 
      : `${baseUrl}/placeholder-property.svg`

    return {
      title,
      description,
      keywords: `${imovel.tipo}, ${imovel.cidade}, ${imovel.estado}, ${imovel.quartos} quartos, ${imovel.banheiros} banheiros, imóvel, ${imovel.status}`,
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'pt_BR',
        url: `${baseUrl}/imovel/${params.id}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: imovel.titulo
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl]
      },
      alternates: {
        canonical: `${baseUrl}/imovel/${params.id}`
      },
      robots: {
        index: imovel.status === 'disponivel',
        follow: true
      }
    }
  } catch (error) {
    console.error('Erro ao gerar metadata:', error)
    return {
      title: 'Erro - Cooperativa de Corretores',
      description: 'Erro ao carregar informações do imóvel.'
    }
  }
}