'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  gaId: string
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  if (!gaId) {
    return null
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  )
}

// Função para rastrear eventos personalizados
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Função para rastrear visualizações de imóveis
export const trackPropertyView = (propertyId: string, propertyTitle: string) => {
  trackEvent('view_item', 'property', `${propertyId} - ${propertyTitle}`)
}

// Função para rastrear contatos
export const trackContact = (method: string, propertyId?: string) => {
  trackEvent('contact', 'engagement', `${method}${propertyId ? ` - Property ${propertyId}` : ''}`)
}

// Função para rastrear buscas
export const trackSearch = (searchTerm: string, filters?: any) => {
  trackEvent('search', 'property_search', searchTerm)
}

// Declaração de tipos para TypeScript
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}