'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface SyncProgress {
  total: number
  current: number
  currentImovel: string
  successCount: number
  errorCount: number
  errors: string[]
}

interface SyncModalProps {
  isOpen: boolean
  onClose: () => void
  progress: SyncProgress
  isComplete: boolean
}

export default function SyncModal({ isOpen, onClose, progress, isComplete }: SyncModalProps) {
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    if (isComplete) {
      setShowReport(true)
    }
  }, [isComplete])

  if (!isOpen) return null

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {showReport ? 'Relatório de Sincronização' : 'Sincronizando Imóveis'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={!isComplete && progress.current < progress.total}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showReport ? (
            /* Progress View */
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progresso: {progress.current} de {progress.total}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Item */}
              {progress.currentImovel && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-800 font-medium">Processando:</span>
                  </div>
                  <p className="text-blue-700 mt-1">{progress.currentImovel}</p>
                </div>
              )}

              {/* Status */}
              <div className="text-center">
                {!isComplete && (
                  <p className="text-gray-600">Sincronizando imóveis com o Strapi...</p>
                )}
                {isComplete && progress.errorCount > 0 && (
                  <p className="text-red-600">Sincronização concluída com erros</p>
                )}
              </div>
            </div>
          ) : (
            /* Report View */
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Sucessos</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {progress.successCount}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Erros</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {progress.errorCount}
                  </p>
                </div>
              </div>

              {/* Error Details */}
              {progress.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    Erros Encontrados
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {progress.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {showReport && (
          <div className="border-t p-6">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}