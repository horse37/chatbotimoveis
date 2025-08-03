'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import dynamic from 'next/dynamic'

const Header = dynamic(() => import('@/components/layout/Header'), { ssr: true })

const ContatoPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/contatos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tipo: 'geral'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        setFormData({
          nome: '',
          email: '',
          telefone: '',
          assunto: '',
          mensagem: ''
        })
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Entre em Contato
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Estamos aqui para ajudar você a encontrar o imóvel dos seus sonhos
            </motion.p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Informações de Contato
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Endereço
                    </h3>
                    <p className="text-gray-600">

                      Av. Europa, 559<br />
                      Jardim Piza - Londrina/PR<br />
                      CEP: 86041-000
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Telefone
                    </h3>
                    <div className="text-gray-600 space-y-1">
                      <a href="tel:+554399133-4100" className="hover:text-primary-600 transition-colors block">
                         <div>(43) 99133-4100</div>
                      </a>
                      <a href="tel:+554399143-9947" className="hover:text-primary-600 transition-colors block">
                         <div>(43) 99143-9947</div>
                      </a>
                      <a href="tel:+554399983-3258" className="hover:text-primary-600 transition-colors block">
                         <div>(43) 99983-3258</div>
                      </a>
                      <a href="tel:+554399984-4526" className="hover:text-primary-600 transition-colors block">
                         <div>(43) 99984-4526</div>
                      </a>
                    </div>
                    <p className="text-gray-600">
                      <a href="tel:+551133333333" className="hover:text-primary-600 transition-colors">
                        
                      </a>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Email
                    </h3>
                    <p className="text-gray-600">
                      <a href="mailto:contato@imobiliaria.com" className="hover:text-primary-600 transition-colors">
                        
                      </a>
                    </p>
                   
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Horário de Funcionamento
                    </h3>
                    <div className="text-gray-600 space-y-1">
                      <p>Segunda a Sexta: 8h às 18h</p>
                      <p>Sábado: 8h às 14h</p>
                      <p>Domingo: Fechado</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <MessageCircle className="w-6 h-6 text-green-600 mr-2" />
                    WhatsApp
                  </h3>
                  <div className="space-y-2">
                    <a 
                      href="https://wa.me/5543991334100" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center hover:bg-green-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-600 hover:text-green-600 transition-colors">(43) 99133-4100</span>
                    </a>
                    <a 
                      href="https://wa.me/5543991439947" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center hover:bg-green-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-600 hover:text-green-600 transition-colors">(43) 99143-9947</span>
                    </a>
                    <a 
                      href="https://wa.me/5543999833258" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center hover:bg-green-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-600 hover:text-green-600 transition-colors">(43) 99983-3258</span>
                    </a>
                    <a 
                      href="https://wa.me/5543999844526" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center hover:bg-green-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-600 hover:text-green-600 transition-colors">(43) 99984-4526</span>
                    </a>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Atendimento rápido via WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Envie sua Mensagem
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Seu nome completo"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto *
                  </label>
                  <select
                    id="assunto"
                    name="assunto"
                    required
                    value={formData.assunto}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="compra">Interesse em Compra</option>
                    <option value="venda">Quero Vender meu Imóvel</option>
                    <option value="locacao">Interesse em Locação</option>
                    <option value="avaliacao">Avaliação de Imóvel</option>
                    <option value="financiamento">Financiamento</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem *
                </label>
                <textarea
                  id="mensagem"
                  name="mensagem"
                  required
                  rows={6}
                  value={formData.mensagem}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Descreva como podemos ajudá-lo..."
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Enviando...</span>
                    </>
                  ) : (
                    'Enviar Mensagem'
                  )}
                </button>
              </div>
              
              <p className="text-sm text-gray-500 text-center">
                Ao enviar esta mensagem, você concorda com nossa{' '}
                <a href="/privacidade" className="text-primary-600 hover:text-primary-700">
                  Política de Privacidade
                </a>
              </p>
            </form>
          </motion.div>
        </div>
        
        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Nossa Localização
            </h2>
            <p className="text-gray-600 mb-6">
              Visite nosso escritório para um atendimento personalizado
            </p>
          </div>
          
          {/* Google Maps Embed */}
          <div className="h-96 relative">
            <iframe
              src="https://maps.google.com/maps?q=Av.+Europa,+559+-+Jardim+Piza,+Londrina+-+PR,+86041-000&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização da Imobiliária - Av. Europa, 559, Jardim Piza, Londrina/PR"
            />
          </div>
          
          {/* Address and Actions */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Av. Europa, 559</p>
                  <p className="text-gray-600">Jardim Piza - Londrina/PR</p>
                  <p className="text-gray-600">CEP: 86041-000</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://www.google.com/maps/dir//Av.+Europa,+559+-+Jardim+Piza,+Londrina+-+PR,+86041-000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Como Chegar
                </a>
                
                <a
                  href="https://www.google.com/maps/place/Av.+Europa,+559+-+Jardim+Piza,+Londrina+-+PR,+86041-000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Ver no Google Maps
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  )
}

export default ContatoPage