'use client'

import { Suspense, useState } from 'react'
import PropertyFilters from '@/components/properties/PropertyFilters'
import PropertyList from '@/components/properties/PropertyList'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Header from '@/components/layout/Header'
import { useAuth } from '@/lib/hooks/useAuth'

const ImoveisPage = () => {
  const { user } = useAuth()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)
    
    try {
      // Obter token do localStorage (mesmo usado no admin)
      const token = localStorage.getItem('admin_token')

      if (!token) {
        setSyncResult('Erro: Token de autenticação não encontrado')
        setIsSyncing(false)
        return
      }

      const response = await fetch('/api/sync-imoveis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setSyncResult(`Sincronização concluída: ${result.successCount} imóveis atualizados`)
        // Recarregar a página após sincronização
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setSyncResult(`Erro na sincronização: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      setSyncResult('Erro ao conectar com o servidor')
    } finally {
      setIsSyncing(false)
    }
  }

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
            
            {/* Botão de sincronização para admin */}
            {user?.isAdmin && (
              <div className="mt-6">
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSyncing ? (
                    <>
                      <div className="mr-2">
                        <LoadingSpinner size="sm" />
                      </div>
                      Sincronizando...
                    </>
                  ) : (
                    'Sincronizar Imóveis'
                  )}
                </button>
                
                {syncResult && (
                  <div className={`mt-2 text-sm ${syncResult.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                    {syncResult}
                  </div>
                )}
              </div>
            )}
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