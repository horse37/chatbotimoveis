'use client'

import { Suspense } from 'react'
import PropertyFilters from '@/components/properties/PropertyFilters'
import PropertyList from '@/components/properties/PropertyList'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Header from '@/components/layout/Header'

const ImoveisPage = () => {



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Encontre seu Imóvel Ideal
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore nossa seleção completa de imóveis para venda e locação
            </p>
            

          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <LoadingSpinner text="Carregando filtros..." />
                </div>
              }>
                <PropertyFilters />
              </Suspense>
            </div>
          </div>
          
          {/* Properties List */}
          <div className="lg:col-span-3">
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Carregando imóveis..." />
              </div>
            }>
              <PropertyList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImoveisPage