"use client"

import { useState, useEffect } from "react"
import { X } from 'lucide-react'
import { useAdContext } from '@/contexts/ad-context'

export function AdStickyBottom() {
  const { shouldShowSticky, isModalClosed } = useAdContext()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Mostrar el sticky bottom después de 6 segundos al montar el componente
    // Este tiempo es suficiente para que el usuario probablemente haya cerrado el modal
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [])

  // Solo mostrar si el modal fue cerrado y el sticky no fue cerrado
  if (!shouldShowSticky || !isModalClosed || !isVisible) return null

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 bg-white/90 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Ad Image */}
        <div className="flex-1">
          <img
            src="/images/publicidad/Publicidad Kantera (825x77).jpeg"
            alt="Publicidad"
            className="w-full h-auto object-contain max-h-20"
            loading="lazy"
          />
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          aria-label="Cerrar publicidad"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
