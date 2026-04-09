"use client"

import { useState, useEffect } from "react"

export default function Loading() {
  const [progress, setProgress] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + Math.random() * 10
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="text-center max-w-sm mx-auto px-4">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
            {/* Fallback text while image loads */}
            {!imageLoaded && (
              <div className="text-white/60 text-lg font-bold">
                RAFAELA HOY
              </div>
            )}
            <img 
              src="/images/logo.jpg" 
              alt="Rafaela Hoy" 
              className={`w-24 h-24 md:w-32 md:h-32 object-contain transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error('Logo failed to load:', e)
              }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-white text-lg md:text-xl font-medium mb-6">
          Cargando Rafaela Hoy...
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-white/60 mb-2">
            <span>Cargando contenido</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
