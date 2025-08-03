'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  toast: {
    success: (title: string, description?: string) => void
    error: (title: string, description?: string) => void
    info: (title: string, description?: string) => void
    warning: (title: string, description?: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (title: string, description?: string) => {
      addToast({ type: 'success', title, description })
    },
    error: (title: string, description?: string) => {
      addToast({ type: 'error', title, description })
    },
    info: (title: string, description?: string) => {
      addToast({ type: 'info', title, description })
    },
    warning: (title: string, description?: string) => {
      addToast({ type: 'warning', title, description })
    }
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          className: 'bg-green-50 border-green-200 text-green-800',
          iconClassName: 'text-green-500'
        }
      case 'error':
        return {
          icon: AlertCircle,
          className: 'bg-red-50 border-red-200 text-red-800',
          iconClassName: 'text-red-500'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconClassName: 'text-yellow-500'
        }
      case 'info':
      default:
        return {
          icon: Info,
          className: 'bg-blue-50 border-blue-200 text-blue-800',
          iconClassName: 'text-blue-500'
        }
    }
  }

  const config = getToastConfig(toast.type)
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative flex items-start p-4 border rounded-lg shadow-lg ${config.className}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${config.iconClassName}`} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm opacity-90">{toast.description}</p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors duration-200"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// Componente Toaster para usar no layout
export const Toaster = () => {
  return null // O ToastProvider já renderiza os toasts
}

// Hook para facilitar o uso fora do contexto
export const createToast = {
  success: (title: string, description?: string) => {
    console.log('Success toast:', title, description)
  },
  error: (title: string, description?: string) => {
    console.log('Error toast:', title, description)
  },
  info: (title: string, description?: string) => {
    console.log('Info toast:', title, description)
  },
  warning: (title: string, description?: string) => {
    console.log('Warning toast:', title, description)
  }
}