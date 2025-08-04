'use client'

import { useState, useEffect } from 'react'

interface User {
  id: number
  nome: string
  email: string
  role: string
  isAdmin?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('admin_token')
        
        if (!token) {
          setUser(null)
          setLoading(false)
          return
        }

        const response = await fetch('/api/admin/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Dados do usuário autenticado:', data)
          setUser({
            ...data.user,
            isAdmin: data.user.role === 'admin'
          })
        } else {
          console.log('Erro na autenticação:', response.status)
          setUser(null)
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return { user, loading }
}