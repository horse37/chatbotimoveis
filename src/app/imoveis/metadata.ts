import { Metadata } from 'next'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br'
  
  // Extrair parâmetros de busca
  const busca = searchParams.busca as string
  const tipo = searchParams.tipo as string
  const cidade = searchParams.cidade as string
  const status = searchParams.status as string
  
  // Construir título dinâmico
  let title = 'Imóveis'
  let description = 'Encontre o imóvel ideal na Cooperativa de Corretores.'
  
  const titleParts = []
  const descriptionParts = []
  
  if (tipo) {
    titleParts.push(tipo.charAt(0).toUpperCase() + tipo.slice(1) + 's')
    descriptionParts.push(tipo + 's')
  }
  
  if (cidade) {
    titleParts.push(`em ${cidade}`)
    descriptionParts.push(`em ${cidade}`)
  }
  
  if (status) {
    const statusMap: { [key: string]: string } = {
      'disponivel': 'disponíveis',
      'vendido': 'vendidos',
      'alugado': 'alugados'
    }
    titleParts.push(statusMap[status] || status)
    descriptionParts.push(`para ${status === 'disponivel' ? 'venda e aluguel' : status}`)
  }
  
  if (busca) {
    titleParts.push(`"${busca}"`)
    descriptionParts.push(`relacionados a "${busca}"`)
  }
  
  if (titleParts.length > 0) {
    title = titleParts.join(' ') + ' | Cooperativa de Corretores'
    description = `Encontre ${descriptionParts.join(' ')} na Cooperativa de Corretores. Os melhores imóveis da região com preços competitivos.`
  } else {
    title = 'Imóveis | Cooperativa de Corretores'
    description = 'Encontre casas, apartamentos, terrenos e mais na Cooperativa de Corretores. Os melhores imóveis da região com preços competitivos.'
  }
  
  // Construir keywords
  const keywords = [
    'imóveis',
    'casas',
    'apartamentos',
    'terrenos',
    'venda',
    'aluguel',
    'cooperativa',
    'corretores'
  ]
  
  if (tipo) keywords.push(tipo)
  if (cidade) keywords.push(cidade)
  if (busca) keywords.push(busca)
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      url: `${baseUrl}/imoveis`,
      images: [
        {
          url: `${baseUrl}/logo.jpg`,
          width: 1200,
          height: 630,
          alt: 'Cooperativa de Corretores'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/logo.jpg`]
    },
    alternates: {
      canonical: `${baseUrl}/imoveis`
    },
    robots: {
      index: true,
      follow: true
    }
  }
}