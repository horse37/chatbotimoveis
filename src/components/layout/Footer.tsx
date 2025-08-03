import Link from 'next/link'
import Image from 'next/image'
import { Building, Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image 
                  src="/logo.jpg" 
                  alt="Logo Cooperativa de Corretores" 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold">
              Cooperativa de Corretores
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Há mais de 10 anos no mercado imobiliário, oferecendo os melhores imóveis 
              com atendimento personalizado e tecnologia de ponta.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/imoveis" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Todos os Imóveis
                </Link>
              </li>
              <li>
                <Link href="/imoveis?tipo=casa" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Casas
                </Link>
              </li>
              <li>
                <Link href="/imoveis?tipo=apartamento" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Apartamentos
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Serviços</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Venda de Imóveis</li>
              <li className="text-gray-400">Avaliação Imobiliária</li>
              <li className="text-gray-400">Consultoria Imobiliária</li>
              <li className="text-gray-400">Financiamento</li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  Av. Europa, 559<br />
                  Jardim Piza - Londrina/PR<br />
                  CEP: 86041-000
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
                <div className="text-gray-400 text-sm space-y-1">
                  <a href="https://wa.me/5543991334100" target="_blank" rel="noopener noreferrer" className="block hover:text-green-400 transition-colors">
                    (43) 99133-4100
                  </a>
                  <a href="https://wa.me/5543991439947" target="_blank" rel="noopener noreferrer" className="block hover:text-green-400 transition-colors">
                    (43) 99143-9947
                  </a>
                  <a href="https://wa.me/5543999833258" target="_blank" rel="noopener noreferrer" className="block hover:text-green-400 transition-colors">
                    (43) 99983-3258
                  </a>
                  <a href="https://wa.me/5543999844526" target="_blank" rel="noopener noreferrer" className="block hover:text-green-400 transition-colors">
                    (43) 99984-4526
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  coopercorretores@gmail.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} Cooperativa de Corretores. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacidade" className="text-gray-400 hover:text-white transition-colors duration-200">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="text-gray-400 hover:text-white transition-colors duration-200">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer