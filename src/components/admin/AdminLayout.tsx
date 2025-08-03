'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Building, 
  Home, 
  Users, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X,
  Plus,
  Settings,
  Database
} from 'lucide-react'
import { fetchAuthApi } from '@/lib/api'
import { getMenuItems, usePermissions } from '@/lib/permissions'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface CorretorInfo {
  id: number
  nome: string
  email: string
  foto?: string | null
  role?: string
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [corretor, setCorretor] = useState<CorretorInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Decodificar token para obter informações do corretor
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      // Buscar informações atualizadas do corretor
      const fetchCorretorInfo = async () => {
        setIsLoading(true)
        try {
          const response = await fetchAuthApi(`admin/corretores/${payload.id}`);
          
          if (response.ok) {
            const data = await response.json();
            let corretorData = data.corretor;
            
            // Processar o campo foto se for um Buffer
            if (corretorData?.foto && typeof corretorData.foto === 'object' && corretorData.foto.type === 'Buffer') {
              let fotoPath = Buffer.from(corretorData.foto.data).toString('utf8');
              
              // Remover o prefixo '/uploads/corretores/' se existir
              const prefix = '/uploads/corretores/';
              if (fotoPath.startsWith(prefix)) {
                fotoPath = fotoPath.substring(prefix.length);
              }
              
              corretorData = { ...corretorData, foto: fotoPath };
            }
            
            setCorretor({
              id: payload.id,
              nome: payload.nome,
              email: payload.email,
              foto: corretorData?.foto || null,
              role: payload.role || 'corretor'
            });
            setUserRole(payload.role || 'corretor');
          } else {
            // Se a resposta não for bem-sucedida, verificar se é um erro de autenticação
            if (response.status === 401) {
              console.error('Erro de autenticação ao buscar informações do corretor');
              localStorage.removeItem('token');
              router.push('/login');
              return;
            }
            
            // Fallback para informações do token se a API falhar por outro motivo
            setCorretor({
              id: payload.id,
              nome: payload.nome,
              email: payload.email,
              foto: payload.foto || null,
              role: payload.role || 'corretor'
            });
            setUserRole(payload.role || 'corretor');
          }
        } catch (error) {
          console.error('Erro ao buscar informações do corretor:', error);
          // Fallback para informações do token
          setCorretor({
              id: payload.id,
              nome: payload.nome,
              email: payload.email,
              foto: payload.foto || null,
              role: payload.role || 'corretor'
          });
          setUserRole(payload.role || 'corretor');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCorretorInfo();
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  // Obter itens do menu baseado nas permissões
  const menuItems = userRole ? getMenuItems(userRole) : []
  
  // Mapear ícones
  const getMenuIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      dashboard: Home,
      home: Building,
      users: Users,
      message: MessageSquare,
      database: Database
    }
    return iconMap[iconName] || Home
  }
  
  // Converter para formato do navigation
  const navigation = menuItems.map(item => {
    const Icon = getMenuIcon(item.icon)
    return {
      name: item.name,
      href: item.href,
      icon: Icon,
      current: item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href),
      submenu: item.submenu
    }
  })

  const quickActions = [
    {
      name: 'Novo Imóvel',
      href: '/admin/imoveis/cadastrar',
      icon: Plus,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-gray-900 to-gray-800 shadow-xl">
          <div className="flex flex-1 flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6">
              <Building className="h-10 w-10 text-blue-400" />
              <span className="ml-3 text-xl font-bold text-white">
                Administração
              </span>
            </div>
            <nav className="mt-8 flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                  >
                    <Icon
                      className={`${
                        item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      } mr-3 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            
            {/* Ações rápidas */}
            <div className="px-4 mt-8">
              <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Ações Rápidas
              </h3>
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={action.name}
                      href={action.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-all duration-200"
                    >
                      <Icon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-white" />
                      {action.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Informações do usuário */}
          <div className="flex-shrink-0 border-t border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg overflow-hidden">
                  {corretor?.foto ? (
                      <Image 
                        src={corretor.foto?.startsWith('http') || corretor.foto?.startsWith('/uploads') ? corretor.foto : `/uploads/corretores/${corretor.foto}`} 
                        alt={corretor?.nome || 'Usuário'} 
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {corretor?.nome?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white truncate">{corretor?.nome}</p>
                <p className="text-xs text-gray-300 truncate">{corretor?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-200 flex items-center justify-center"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            {/* Conteúdo da sidebar mobile (mesmo conteúdo da desktop) */}
            <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800">
              <div className="flex-shrink-0 flex items-center px-6">
                <Building className="h-10 w-10 text-blue-400" />
                <span className="ml-3 text-xl font-bold text-white">
                Administração
                </span>
              </div>
              <nav className="mt-8 px-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`${
                        item.current
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200`}
                    >
                      <Icon
                        className={`${
                          item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        } mr-3 h-5 w-5`}
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header mobile */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-200">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        {/* Conteúdo da página */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}