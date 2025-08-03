'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Bed, Bath, Car, Maximize, Heart, Share2, Phone, Mail, X, MessageCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatImovelId } from '@/lib/utils';

interface Property {
  id: number;
  codigo?: number;
  titulo: string;
  descricao: string;
  preco: number;
  tipo: string;
  status: string;
  area: number;
  quartos: number;
  banheiros: number;
  vagas_garagem: number;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  fotos: string[];
  videos: string[];
  created_at: string;
  updated_at: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    mensagem: '',
    tipo: 'contato'
  });
  const [submittingContact, setSubmittingContact] = useState(false);

  // Função para enviar o formulário de contato
  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingContact(true);
    
    console.log('Enviando formulário:', { ...contactForm, imovel_id: params.id });
    
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
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        toast.success(data.message || 'Mensagem enviada com sucesso!');
        setContactForm({ nome: '', email: '', telefone: '', mensagem: '', tipo: 'contato' });
        setShowContactForm(false);
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      console.error('Erro ao enviar contato:', err);
    } finally {
      setSubmittingContact(false);
    }
  }

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/imoveis/${params.id}`);
        if (!response.ok) {
          throw new Error('Imóvel não encontrado');
        }
        const data = await response.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar imóvel');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Imóvel não encontrado</h1>
          <p className="text-gray-600 mb-6">{error || 'O imóvel solicitado não existe ou foi removido.'}</p>
          <Button onClick={() => router.push('/imoveis')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a lista
          </Button>
        </div>
      </div>
    );
  }

  const images = property.fotos && property.fotos.length > 0 ? property.fotos : ['/placeholder-property.svg'];
  const videos = property.videos && property.videos.length > 0 ? property.videos : [];
  const allMedia = [...images.map(img => ({ type: 'image', src: img })), ...videos.map(vid => ({ type: 'video', src: vid }))];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'disponivel':
        return 'bg-green-100 text-green-800';
      case 'vendido':
        return 'bg-red-100 text-red-800';
      case 'alugado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? 'text-red-600 border-red-600' : ''}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite ? 'Favoritado' : 'Favoritar'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Galeria de Mídia (Fotos e Vídeos) */}
          <div className="lg:col-span-2">
            <div className="relative">
              {allMedia.length > 0 && (
                <>
                  <div className="aspect-video relative overflow-hidden rounded-lg">
                    {allMedia[currentMediaIndex].type === 'image' ? (
                      <Image
                        src={allMedia[currentMediaIndex].src}
                        alt={property.titulo}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-property.svg';
                        }}
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-full object-cover"
                        poster="/placeholder-property.svg"
                        key={allMedia[currentMediaIndex].src}
                      >
                        <source src={allMedia[currentMediaIndex].src} type="video/mp4" />
                        Seu navegador não suporta vídeos.
                      </video>
                    )}
                  </div>
                  
                  {allMedia.length > 1 && (
                    <div className="flex mt-4 space-x-2 overflow-x-auto">
                      {allMedia.map((media, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMediaIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden border-2 ${
                            index === currentMediaIndex ? 'border-blue-600' : 'border-gray-200'
                          }`}
                        >
                          {media.type === 'image' ? (
                            <Image
                              src={media.src}
                              alt={`${property.titulo} - ${index + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-property.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Informações do Imóvel */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={getStatusColor(property.status)}>
                    {property.status}
                  </Badge>
                  <Badge variant="outline">
                    {property.tipo}
                  </Badge>
                </div>
                
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  ID: {formatImovelId(property.codigo)}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {property.titulo}
                </h1>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">
                    {property.endereco}, {property.cidade} - {property.estado}
                  </span>
                </div>
                
                <div className="text-3xl font-bold text-blue-600 mb-6">
                  {formatPrice(property.preco)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <Bed className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {property.quartos} {property.quartos === 1 ? 'quarto' : 'quartos'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {property.banheiros} {property.banheiros === 1 ? 'banheiro' : 'banheiros'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Car className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {property.vagas_garagem} {property.vagas_garagem === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Maximize className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {property.area}m²
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setContactForm(prev => ({ ...prev, tipo: 'contato' }));
                      setShowContactForm(true);
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Entrar em contato
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setContactForm(prev => ({ ...prev, tipo: 'informacao' }));
                      setShowContactForm(true);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Solicitar informações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Descrição */}
        {property.descricao && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
                <p className="text-gray-600 leading-relaxed">
                  {property.descricao}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  placeholder={`Olá! Tenho interesse no imóvel "${property?.titulo}". Gostaria de mais informações.`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submittingContact ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}