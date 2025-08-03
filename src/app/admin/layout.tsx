'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'react-hot-toast'
import { fetchAuthApi } from '@/lib/api'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface User {
  id: number
  nome: string
  email: string
  role: string
  ativo: boolean
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetchAuthApi('admin/auth/me')

      if (response.ok) {
        const userData = await response.json()
        
        // Processar o campo foto se for um Buffer
         let processedUser = userData.user
         if (processedUser.foto && typeof processedUser.foto === 'object' && processedUser.foto.type === 'Buffer') {
           let fotoPath = Buffer.from(processedUser.foto.data).toString('utf8')
           
           // Remover o prefixo '/uploads/corretores/' se existir
           const prefix = '/uploads/corretores/'
           if (fotoPath.startsWith(prefix)) {
             fotoPath = fotoPath.substring(prefix.length)
           }
           
           processedUser = { ...processedUser, foto: fotoPath }
         }
        
        setUser(processedUser)
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      localStorage.removeItem('token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Page Content */}
      <main>
        {children}
      </main>
    </div>
  )
}