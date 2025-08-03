'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Bath, Car, Square, Eye, Heart, Mail, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Imovel, PaginatedResponse, FiltrosImovel } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { formatImovelId } from '@/lib/utils'

const PropertyList = () => {
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<PaginatedResponse<Imovel> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])

  // Carregar imóveis
  const loadProperties = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', page.toString())
      params.set('limit', '12')
      
      const response = await fetch(`/api/imoveis?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar imóveis')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar imóveis')
      }
      
      // Adaptar a estrutura da resposta para o formato esperado
      const data = {
        data: result.data.imoveis,
        pagination: result.data.pagination
      }
      
      setProperties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  // Carregar favoritos do localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  // Recarregar quando os parâmetros de busca mudarem
  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  // Toggle favorito
  const toggleFavorite = (propertyId: number) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId]
    
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
  }

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Formatar área
  const formatArea = (area: number | null | undefined) => {
    if (!area) return null
    return `${area.toLocaleString('pt-BR')} m²`
  }

  // Obter status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponivel: { label: 'Disponível', className: 'bg-green-100 text-green-800' },
      vendido: { label: 'Vendido', className: 'bg-red-100 text-red-800' },
      alugado: { label: 'Alugado', className: 'bg-blue-100 text-blue-800' },
      reservado: { label: 'Reservado', className: 'bg-yellow-100 text-yellow-800' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disponivel
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => loadProperties()}
          className="btn-primary"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (!properties || properties.data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          Nenhum imóvel encontrado com os filtros selecionados.
        </div>
        <Link href="/" className="btn-primary">
          Ver Todos os Imóveis
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Resultados Info */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Mostrando {properties.data.length} de {properties.pagination.total} imóveis
        </p>
        <div className="text-sm text-gray-500">
          Página {properties.pagination.page} de {properties.pagination.totalPages}
        </div>
      </div>

      {/* Grid de Imóveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {properties.data.map((property, index) => {
          // Obter primeira foto disponível
          let mainImage = '/placeholder-property.svg'
          if (property.fotos && property.fotos.length > 0) {
            mainImage = property.fotos[0]
          }
          
          const isFavorite = favorites.includes(property.id)
          
          return (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card group hover:shadow-lg transition-all duration-300 h-full flex flex-col"
            >
              {/* Imagem */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={mainImage}
                  alt={property.titulo}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  {getStatusBadge(property.status)}
                </div>
                
                {/* Botão Favorito */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    toggleFavorite(property.id)
                  }}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isFavorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                
                {/* Botão Ver Detalhes */}
                <Link
                  href={`/imoveis/${property.id}`}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </Link>
              </div>
              
              {/* Conteúdo */}
              <div className="p-4 flex-1 flex flex-col">
                {/* ID e Preço */}
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    ID: {formatImovelId(property.codigo)}
                  </div>
                  <div className="text-2xl font-bold text-primary-600">
                    {formatPrice(property.preco)}
                  </div>
                </div>
                
                {/* Título */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14 flex items-start">
                  {property.titulo}
                </h3>
                
                {/* Conteúdo principal que cresce */}
                <div className="flex-grow">
                  {/* Localização */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="text-sm truncate">
                      {property.cidade}, {property.estado}
                    </span>
                  </div>
                  
                  {/* Características */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      {property.quartos && (
                        <div className="flex items-center space-x-1">
                          <Bed className="w-4 h-4" />
                          <span>{property.quartos}</span>
                        </div>
                      )}
                      {property.banheiros && (
                        <div className="flex items-center space-x-1">
                          <Bath className="w-4 h-4" />
                          <span>{property.banheiros}</span>
                        </div>
                      )}
                      {property.vagas_garagem !== null && property.vagas_garagem !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Car className="w-4 h-4" />
                          <span>{property.vagas_garagem}</span>
                        </div>
                      )}
                    </div>
                    
                    {property.area_total && (
                      <div className="flex items-center space-x-1">
                        <Square className="w-4 h-4" />
                        <span>{formatArea(property.area_total)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tipo */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {property.tipo}
                    </span>
                  </div>
                </div>
              
                {/* Botão de ação */}
                <div className="mt-4">
                  <Link
                    href={`/imoveis/${property.id}`}
                    className="flex items-center justify-center p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Paginação */}
      {properties.pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={properties.pagination.page}
            totalPages={properties.pagination.totalPages}
            onPageChange={(page) => loadProperties(page)}
          />
        </div>
      )}
    </div>
  )
}

export default PropertyList