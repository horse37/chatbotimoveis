'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Car, 
  Maximize, 
  Heart, 
  Share2, 
  Phone, 
  MessageCircle, 
  Mail,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { Imovel } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const ImovelDetalhes = () => {
  const params = useParams()
  const [imovel, setImovel] = useState<Imovel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: '',
    tipo: 'interesse' // Valor padrão
  })
  const [submittingContact, setSubmittingContact] = useState(false)

  // Função para gerar dados estruturados JSON-LD
  const generateStructuredData = (imovel: Imovel) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cooperativa.com.br'
    
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": imovel.titulo,
      "description": imovel.descricao,
      "url": `${baseUrl}/imovel/${imovel.id}`,
      "image": imovel.fotos?.map((img: string) => `${baseUrl}${img}`) || [],
      "offers": {
        "@type": "Offer",
        "price": imovel.preco,
        "priceCurrency": "BRL",
        "availability": imovel.status === 'disponivel' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": imovel.endereco,
        "addressLocality": imovel.cidade,
        "addressRegion": imovel.estado,
        "addressCountry": "BR"
      },
      "geo": imovel.latitude && imovel.longitude ? {
        "@type": "GeoCoordinates",
        "latitude": imovel.latitude,
        "longitude": imovel.longitude
      } : undefined,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": imovel.area_total,
        "unitCode": "MTK"
      },
      "numberOfRooms": imovel.quartos,
      "numberOfBathroomsTotal": imovel.banheiros,
      "petsAllowed": false,
      "datePosted": imovel.created_at
    }
  }

  const fetchImovel = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/imoveis/${params.id}`)
      const data = await response.json()
      
      if (data.success) {
        setImovel(data.data.imovel)
      } else {
        setError(data.error || 'Erro ao carregar imóvel')
      }
    } catch (err) {
      setError('Erro ao carregar imóvel')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const checkFavorite = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(Number(params.id)))
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchImovel()
      checkFavorite()
    }
  }, [params.id, fetchImovel, checkFavorite])

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const imovelId = Number(params.id)
    
    if (isFavorite) {
      const newFavorites = favorites.filter((id: number) => id !== imovelId)
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
      setIsFavorite(false)
      toast.success('Removido dos favoritos')
    } else {
      favorites.push(imovelId)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
      toast.success('Adicionado aos favoritos')
    }
  }

  const shareProperty = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: imovel?.titulo,
          text: imovel?.descricao,
          url: window.location.href
        })
      } catch (err) {
        // Fallback para copiar URL
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copiado para a área de transferência')
      } else {
        // Fallback para navegadores que não suportam clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast.success('Link copiado para a área de transferência')
      }
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err)
      toast.error('Erro ao copiar link')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatArea = (area: number) => {
    return `${area.toLocaleString('pt-BR')} m²`
  }

  const nextImage = () => {
    if (imovel?.midias && imovel.midias.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === imovel.midias!.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (imovel?.midias && imovel.midias.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? imovel.midias!.length - 1 : prev - 1
      )
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingContact(true)
    
    try {
      const response = await fetch('/api/contatos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...contactForm,
          imovel_id: params.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setContactForm({ nome: '', email: '', telefone: '', mensagem: '', tipo: 'interesse' })
        setShowContactForm(false)
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSubmittingContact(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando imóvel..." />
      </div>
    )
  }

  if (error || !imovel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Imóvel não encontrado'}
          </h1>
          <Link 
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  const currentImage = imovel.midias?.[currentImageIndex]

  return (
    <div className="min-h-screen bg-gray-50">
      {imovel && (
        <Head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateStructuredData(imovel))
            }}
          />
        </Head>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={shareProperty}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      {imovel.midias && imovel.midias.length > 0 && (
        <div className="relative h-96 md:h-[500px] bg-gray-200">
          <Image
            src={currentImage?.url || '/placeholder-property.jpg'}
            alt={imovel.titulo}
            fill
            className="object-cover cursor-pointer"
            onClick={() => setShowImageModal(true)}
          />
          
          {imovel.midias.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {imovel.midias.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {imovel.titulo}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    {imovel.endereco}, {imovel.bairro}, {imovel.cidade}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {formatPrice(imovel.preco)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {imovel.tipo === 'venda' ? 'À venda' : 'Para alugar'}
                  </div>
                </div>
              </div>
              
              {/* Property Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {imovel.quartos && (
                  <div className="flex items-center">
                    <Bed className="w-5 h-5 text-gray-400 mr-2" />
                    <span>{imovel.quartos} quartos</span>
                  </div>
                )}
                
                {imovel.banheiros && (
                  <div className="flex items-center">
                    <Bath className="w-5 h-5 text-gray-400 mr-2" />
                    <span>{imovel.banheiros} banheiros</span>
                  </div>
                )}
                
                {imovel.vagas_garagem && (
                  <div className="flex items-center">
                    <Car className="w-5 h-5 text-gray-400 mr-2" />
                    <span>{imovel.vagas_garagem} vagas</span>
                  </div>
                )}
                
                {imovel.area_total && (
                  <div className="flex items-center">
                    <Maximize className="w-5 h-5 text-gray-400 mr-2" />
                    <span>{formatArea(imovel.area_total)}</span>
                  </div>
                )}
              </div>
              
              {/* Description */}
              {imovel.descricao && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Descrição</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {imovel.descricao}
                  </p>
                </div>
              )}
            </motion.div>
            
            {/* Characteristics */}
            {imovel.caracteristicas && imovel.caracteristicas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-xl font-semibold mb-4">Características</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {imovel.caracteristicas.map((caracteristica: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mr-3" />
                      <span className="text-gray-700">{caracteristica}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Broker Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-xl font-semibold mb-4">Corretor Responsável</h3>
              
              <div className="flex items-center mb-4">
                {imovel.corretor_foto && (
                  <Image
                    src={imovel.corretor_foto}
                    alt={imovel.corretor_nome || 'Corretor'}
                    width={60}
                    height={60}
                    className="rounded-full mr-4"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {imovel.corretor_nome}
                  </h4>
                  <p className="text-gray-600 text-sm">Corretor de Imóveis</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {imovel.corretor_telefone && (
                  <a
                    href={`tel:${imovel.corretor_telefone}`}
                    className="flex items-center w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Phone className="w-5 h-5 mr-3" />
                    Ligar agora
                  </a>
                )}
                
                <div className="relative group">
                  <button className="flex items-center w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <MessageCircle className="w-5 h-5 mr-3" />
                    WhatsApp
                  </button>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <a
                      href="https://wa.me/5543991334100"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-b border-gray-100"
                    >
                      <MessageCircle className="w-4 h-4 mr-3 text-green-600" />
                      (43) 99133-4100
                    </a>
                    <a
                      href="https://wa.me/5543991439947"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-b border-gray-100"
                    >
                      <MessageCircle className="w-4 h-4 mr-3 text-green-600" />
                      (43) 99143-9947
                    </a>
                    <a
                      href="https://wa.me/5543999833258"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-b border-gray-100"
                    >
                      <MessageCircle className="w-4 h-4 mr-3 text-green-600" />
                      (43) 99983-3258
                    </a>
                    <a
                      href="https://wa.me/5543999844526"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center w-full p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-3 text-green-600" />
                      (43) 99984-4526
                    </a>
                  </div>
                </div>
                
                {/* Botões de ação principais */}
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                  <button
                    onClick={() => {
                      setContactForm(prev => ({ ...prev, tipo: 'contato' }));
                      setShowContactForm(true);
                    }}
                    className="flex-1 flex items-center justify-center p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-3" />
                    Entrar em contato
                  </button>
                  
                  <button
                    onClick={() => {
                      setContactForm(prev => ({ ...prev, tipo: 'informacao' }));
                      setShowContactForm(true);
                    }}
                    className="flex-1 flex items-center justify-center p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mr-3" />
                    Solicitar informações
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && currentImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={currentImage.url}
              alt={imovel.titulo}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
      
      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {contactForm.tipo === 'contato' ? 'Entrar em contato' : 
                 contactForm.tipo === 'informacao' ? 'Solicitar informações' : 
                 'Enviar mensagem'}
              </h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.nome}
                  onChange={(e) => setContactForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={contactForm.telefone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem *
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.mensagem}
                  onChange={(e) => setContactForm(prev => ({ ...prev, mensagem: e.target.value }))}
                  placeholder={`Olá! Tenho interesse no imóvel "${imovel.titulo}". Gostaria de mais informações.`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submittingContact ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ImovelDetalhes