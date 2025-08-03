import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import StructuredData, { organizationStructuredData, websiteStructuredData } from '@/components/StructuredData'

// Importação dinâmica dos componentes para evitar problemas de renderização no EasyPanel
const Header = dynamic(() => import('@/components/layout/Header'), { ssr: true })

const PropertyList = dynamic(() => import('@/components/properties/PropertyList'), { ssr: true })
const PropertyFilters = dynamic(() => import('@/components/properties/PropertyFilters'), { ssr: true })
const Hero = dynamic(() => import('@/components/home/Hero'), { ssr: true })

export default function HomePage() {
  return (
    <>
      <StructuredData data={organizationStructuredData} />
      <StructuredData data={websiteStructuredData} />
      <Header />
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* Filtros e Listagem de Imóveis */}
        <section className="py-12 bg-white">
          <div className="container">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Imóveis Disponíveis
              </h2>
              <p className="text-gray-600 max-w-2xl">
                Encontre o imóvel perfeito para você. Use os filtros abaixo para refinar sua busca.
              </p>
            </div>
            
            {/* Filtros */}
            <div className="mb-8">
              <Suspense fallback={<LoadingSpinner />}>
                <PropertyFilters />
              </Suspense>
            </div>
            
            {/* Lista de Imóveis */}
            <Suspense fallback={<LoadingSpinner />}>
              <PropertyList />
            </Suspense>
          </div>
        </section>
      </main>
      

    </>
  )
}