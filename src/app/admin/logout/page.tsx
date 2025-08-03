'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function LogoutPage() {
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    try {
      // Remover token do localStorage
      localStorage.removeItem('admin_token')
      
      // Mostrar mensagem de sucesso
      toast.success('Logout realizado com sucesso!')
      
      // Aguardar um pouco para mostrar a mensagem
      setTimeout(() => {
        router.push('/admin/login')
      }, 1000)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao fazer logout')
      router.push('/admin/login')
    }
  }, [router])

  useEffect(() => {
    handleLogout()
  }, [handleLogout])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Fazendo logout...</p>
      </div>
    </div>
  )
}