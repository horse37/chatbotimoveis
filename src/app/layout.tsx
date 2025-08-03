import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000'),
  title: {
    default: 'Cooperativa de Corretores - Encontre seu imóvel ideal',
    template: '%s | Cooperativa de Corretores'
  },
  description: 'Site moderno para imobiliária com os melhores imóveis da região. Casas, apartamentos, terrenos e muito mais. Encontre seu imóvel ideal conosco.',
  keywords: 'imobiliária, imóveis, casas, apartamentos, terrenos, venda, aluguel, cooperativa, corretores, brasil',
  authors: [{ name: 'Cooperativa de Corretores' }],
  creator: 'Cooperativa de Corretores',
  publisher: 'Cooperativa de Corretores',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Cooperativa de Corretores - Encontre seu imóvel ideal',
    description: 'Site moderno para imobiliária com os melhores imóveis da região. Casas, apartamentos, terrenos e muito mais.',
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br',
    siteName: 'Cooperativa de Corretores',
    images: [
      {
        url: '/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'Cooperativa de Corretores'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cooperativa de Corretores - Encontre seu imóvel ideal',
    description: 'Site moderno para imobiliária com os melhores imóveis da região.',
    images: ['/logo.jpg']
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br'
  }
}
export const viewport = {
  width: 'device-width',
  initialScale: 1
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />}
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  )
}