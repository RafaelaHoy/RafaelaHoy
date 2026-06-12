"use client"

import { useEffect, useState } from "react"
import { X } from 'lucide-react'
import { useAdContext } from '@/contexts/ad-context'

export function AdModal() {
  const [isVisible, setIsVisible] = useState(false)
  const { setIsModalClosed, setShouldShowSticky } = useAdContext()

  useEffect(() => {
    // Mostrar el modal después de 5 segundos al montar el componente
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setIsModalClosed(true)
    setShouldShowSticky(true)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-10 right-0 z-50 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          aria-label="Cerrar publicidad"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Ad Image Container */}
        <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-2xl">
          <img
            src="/images/publicidad/Publicidad Kantera (1600x547).jpeg"
            alt="Publicidad"
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  )
}
