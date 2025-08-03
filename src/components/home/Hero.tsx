'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Home, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const Hero = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cidades, setCidades] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [stats, setStats] = useState({
    imoveis: 0,
    cidades: 0,
    anos: 0
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirecionar para página de resultados com filtros
    const params = new URLSearchParams()
    if (searchTerm) params.set('busca', searchTerm)
    if (selectedCity) params.set('cidades', selectedCity)
    window.location.href = `/imoveis?${params.toString()}`
  }

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

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }
    
    fetchCidades()
    fetchStats()
  }, [])

  const statsDisplay = [
    { icon: Home, label: 'Imóveis Disponíveis', value: `${stats.imoveis}+` },
    { icon: MapPin, label: 'Cidades Atendidas', value: `${stats.cidades}+` },
    { icon: Star, label: 'Anos de Experiência', value: `${stats.anos}+` },
  ]

  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')" }} />
      
      <div className="relative container py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Título Principal */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Encontre o
            <span className="text-yellow-400"> Imóvel Perfeito</span>
            <br />para Você
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Mais de 10 anos conectando pessoas aos seus sonhos. 
            Tecnologia moderna, atendimento humanizado.
          </motion.p>

          {/* Formulário de Busca */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto mb-16"
          >
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Busque por bairro, cidade, tipo de imóvel ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="md:w-64">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 appearance-none"
                    disabled={loadingCidades}
                  >
                    <option value="">Todas as cidades</option>
                    {loadingCidades ? (
                      <option disabled>Carregando cidades...</option>
                    ) : (
                      cidades.map((cidade) => (
                        <option key={cidade} value={cidade}>{cidade}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-lg"
              >
                Buscar
              </button>
            </form>
          </motion.div>

          {/* Estatísticas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {statsDisplay.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
                    <Icon className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero