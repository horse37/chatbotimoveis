'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiltrosImovel, TipoImovel, StatusImovel } from '@/types'

const PropertyFilters = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FiltrosImovel>({})

  // Opções para os filtros
  const tiposImovel: { value: TipoImovel; label: string }[] = [
    { value: 'casa', label: 'Casa' },
    { value: 'apartamento', label: 'Apartamento' },
    { value: 'terreno', label: 'Terreno' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'rural', label: 'Rural' },
    { value: 'cobertura', label: 'Cobertura' },
    { value: 'studio', label: 'Studio' },
  ]

  const statusImovel: { value: StatusImovel; label: string }[] = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'vendido', label: 'Vendido' },
    { value: 'alugado', label: 'Alugado' },
    { value: 'reservado', label: 'Reservado' },
  ]

  const quartosOptions = [1, 2, 3, 4, 5]
  const banheirosOptions = [1, 2, 3, 4, 5]
  const vagasOptions = [0, 1, 2, 3, 4, 5]

  const [cidades, setCidades] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)

  // Carregar cidades disponíveis
  useEffect(() => {
    const fetchCidades = async () => {
      setLoadingCidades(true)
      try {
        const response = await fetch('/api/cidades')
        const data = await response.json()
        if (data.success) {
          setCidades(data.cidades)
        }
      } catch (error) {
        console.error('Erro ao carregar cidades:', error)
      } finally {
        setLoadingCidades(false)
      }
    }

    fetchCidades()
  }, [])

  // Carregar filtros da URL
  useEffect(() => {
    const newFilters: FiltrosImovel = {}
    
    const tipos = searchParams.get('tipos')
    if (tipos) newFilters.tipo = tipos.split(',') as TipoImovel[]
    
    const status = searchParams.get('status')
    if (status) newFilters.status = status.split(',') as StatusImovel[]
    
    const precoMin = searchParams.get('precoMin')
    if (precoMin) newFilters.preco_min = Number(precoMin)
    
    const precoMax = searchParams.get('precoMax')
    if (precoMax) newFilters.preco_max = Number(precoMax)
    
    const quartos = searchParams.get('quartos')
    if (quartos) newFilters.quartos = quartos.split(',').map(Number)
    
    const banheiros = searchParams.get('banheiros')
    if (banheiros) newFilters.banheiros = banheiros.split(',').map(Number)
    
    const vagas = searchParams.get('vagas')
    if (vagas) newFilters.vagas_garagem = vagas.split(',').map(Number)
    
    const areaMin = searchParams.get('areaMin')
    if (areaMin) newFilters.area_min = Number(areaMin)
    
    const areaMax = searchParams.get('areaMax')
    if (areaMax) newFilters.area_max = Number(areaMax)
    
    const cidades = searchParams.get('cidades')
    if (cidades) newFilters.cidade = cidades.split(',')
    
    const busca = searchParams.get('busca')
    if (busca) newFilters.busca = busca

    setFilters(newFilters)
  }, [searchParams])

  // Aplicar filtros
  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (filters.tipo?.length) params.set('tipos', filters.tipo.join(','))
    if (filters.status?.length) params.set('status', filters.status.join(','))
    if (filters.preco_min) params.set('precoMin', filters.preco_min.toString())
    if (filters.preco_max) params.set('precoMax', filters.preco_max.toString())
    if (filters.quartos?.length) params.set('quartos', filters.quartos.join(','))
    if (filters.banheiros?.length) params.set('banheiros', filters.banheiros.join(','))
    if (filters.vagas_garagem?.length) params.set('vagas', filters.vagas_garagem.join(','))
    if (filters.area_min) params.set('areaMin', filters.area_min.toString())
    if (filters.area_max) params.set('areaMax', filters.area_max.toString())
    if (filters.cidade?.length) params.set('cidades', filters.cidade.join(','))
    if (filters.busca) params.set('busca', filters.busca)
    
    router.push(`/?${params.toString()}`)
    setIsOpen(false)
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters({})
    router.push('/')
    setIsOpen(false)
  }

  // Contar filtros ativos
  const activeFiltersCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
  ).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header dos Filtros */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              Limpar
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors duration-200"
          >
            <span className="text-sm font-medium">
              {isOpen ? 'Ocultar' : 'Mostrar'} Filtros
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filtros Expandidos */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Busca Textual */}
            <div>
              <label className="label">Busca</label>
              <input
                type="text"
                placeholder="Digite palavras-chave, código do imóvel..."
                value={filters.busca || ''}
                onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tipo de Imóvel */}
              <div>
                <label className="label">Tipo de Imóvel</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tiposImovel.map((tipo) => (
                    <label key={tipo.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.tipo?.includes(tipo.value) || false}
                        onChange={(e) => {
                          const currentTipos = filters.tipo || []
                          if (e.target.checked) {
                            setFilters({ ...filters, tipo: [...currentTipos, tipo.value] })
                          } else {
                            setFilters({ ...filters, tipo: currentTipos.filter(t => t !== tipo.value) })
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{tipo.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="label">Status</label>
                <div className="space-y-2">
                  {statusImovel.map((status) => (
                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status.value) || false}
                        onChange={(e) => {
                          const currentStatus = filters.status || []
                          if (e.target.checked) {
                            setFilters({ ...filters, status: [...currentStatus, status.value] })
                          } else {
                            setFilters({ ...filters, status: currentStatus.filter(s => s !== status.value) })
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quartos */}
              <div>
                <label className="label">Quartos</label>
                <div className="flex flex-wrap gap-2">
                  {quartosOptions.map((num) => (
                    <label key={num} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.quartos?.includes(num) || false}
                        onChange={(e) => {
                          const currentQuartos = filters.quartos || []
                          if (e.target.checked) {
                            setFilters({ ...filters, quartos: [...currentQuartos, num] })
                          } else {
                            setFilters({ ...filters, quartos: currentQuartos.filter(q => q !== num) })
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{num}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Banheiros */}
              <div>
                <label className="label">Banheiros</label>
                <div className="flex flex-wrap gap-2">
                  {banheirosOptions.map((num) => (
                    <label key={num} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.banheiros?.includes(num) || false}
                        onChange={(e) => {
                          const currentBanheiros = filters.banheiros || []
                          if (e.target.checked) {
                            setFilters({ ...filters, banheiros: [...currentBanheiros, num] })
                          } else {
                            setFilters({ ...filters, banheiros: currentBanheiros.filter(b => b !== num) })
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{num}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vagas de Garagem */}
              <div>
                <label className="label">Vagas de Garagem</label>
                <div className="flex flex-wrap gap-2">
                  {vagasOptions.map((num) => (
                    <label key={num} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.vagas_garagem?.includes(num) || false}
                        onChange={(e) => {
                          const currentVagas = filters.vagas_garagem || []
                          if (e.target.checked) {
                            setFilters({ ...filters, vagas_garagem: [...currentVagas, num] })
                          } else {
                            setFilters({ ...filters, vagas_garagem: currentVagas.filter(v => v !== num) })
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{num}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cidade */}
              <div>
                <label className="label">Cidade</label>
                <select
                  multiple
                  value={filters.cidade || []}
                  onChange={(e) => {
                    const selectedCidades = Array.from(e.target.selectedOptions, option => option.value)
                    setFilters({ ...filters, cidade: selectedCidades })
                  }}
                  className="input h-32"
                  disabled={loadingCidades}
                >
                  {loadingCidades ? (
                    <option disabled>Carregando cidades...</option>
                  ) : cidades.length > 0 ? (
                    cidades.map((cidade) => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))
                  ) : (
                    <option disabled>Nenhuma cidade com imóveis disponíveis</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingCidades 
                    ? 'Carregando cidades disponíveis...' 
                    : 'Segure Ctrl para selecionar múltiplas cidades'
                  }
                </p>
              </div>
            </div>

            {/* Faixa de Preço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Preço Mínimo (R$)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.preco_min || ''}
                  onChange={(e) => setFilters({ ...filters, preco_min: Number(e.target.value) || undefined })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Preço Máximo (R$)</label>
                <input
                  type="number"
                  placeholder="Sem limite"
                  value={filters.preco_max || ''}
                  onChange={(e) => setFilters({ ...filters, preco_max: Number(e.target.value) || undefined })}
                  className="input"
                />
              </div>
            </div>

            {/* Faixa de Área */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Área Mínima (m²)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.area_min || ''}
                  onChange={(e) => setFilters({ ...filters, area_min: Number(e.target.value) || undefined })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Área Máxima (m²)</label>
                <input
                  type="number"
                  placeholder="Sem limite"
                  value={filters.area_max || ''}
                  onChange={(e) => setFilters({ ...filters, area_max: Number(e.target.value) || undefined })}
                  className="input"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Limpar Filtros
              </button>
              <button
                onClick={applyFilters}
                className="btn-primary"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PropertyFilters