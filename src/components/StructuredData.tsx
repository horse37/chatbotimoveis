'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  data: object
}

export default function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [data])

  return null
}

// Dados estruturados para a organização
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Cooperativa de Corretores",
  "description": "Cooperativa especializada em imóveis com os melhores preços da região. Casas, apartamentos, terrenos e muito mais.",
  "url": process.env.NEXT_PUBLIC_BASE_URL || "https://cooperativa.com.br",
  "logo": {
    "@type": "ImageObject",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://cooperativa.com.br"}/logo.jpg`
  },
  "image": `${process.env.NEXT_PUBLIC_BASE_URL || "https://cooperativa.com.br"}/logo.jpg`,
  "telephone": ["+55 43 99133-4100", "+55 43 99143-9947", "+55 43 99983-3258", "+55 43 99984-4526"],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "BR",
    "addressLocality": "Sua Cidade",
    "addressRegion": "Paraná"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+55 43 99133-4100",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+55 43 99143-9947",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+55 43 99983-3258",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+55 43 99984-4526",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    }
  ],
  "sameAs": [
    // Adicione aqui links para redes sociais quando disponíveis
  ],
  "areaServed": {
    "@type": "Country",
    "name": "Brasil"
  },
  "serviceType": [
    "Venda de Imóveis",
    "Aluguel de Imóveis",
    "Consultoria Imobiliária"
  ]
}

// Dados estruturados para website
export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Cooperativa de Corretores",
  "url": process.env.NEXT_PUBLIC_BASE_URL || "https://cooperativa.com.br",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${process.env.NEXT_PUBLIC_BASE_URL || "https://cooperativa.com.br"}/imoveis?busca={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
}