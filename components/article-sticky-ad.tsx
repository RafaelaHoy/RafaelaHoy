"use client"

import { useState } from "react"
import { X } from "lucide-react"

export function ArticleStickyAd() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-sm border-t shadow-lg p-2 md:p-3 flex justify-center items-center transform transition-transform duration-300">
      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 md:top-4 md:right-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full p-1.5 transition-colors"
        aria-label="Cerrar publicidad"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Ad Image */}
      <img
        src="/images/publicidad/Publicidad Kantera (825x77).jpeg"
        alt="Publicidad"
        className="w-full max-w-4xl h-auto object-contain"
      />
    </div>
  )
}
