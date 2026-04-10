"use client"

import { useEffect, useState } from "react"

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Check if user has already seen loading screen
    const hasSeenLoading = sessionStorage.getItem("hasSeenLoading")
    if (hasSeenLoading) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          // Mark as seen and complete
          sessionStorage.setItem("hasSeenLoading", "true")
          onComplete()
          return 100
        }
        return prev + 10 // Incremento más rápido
      })
    }, 50) // Intervalo más corto

    return () => clearInterval(timer)
  }, [onComplete])

  // Timeout de seguridad para forzar completado
  useEffect(() => {
    const hasSeenLoading = sessionStorage.getItem("hasSeenLoading")
    if (hasSeenLoading) return

    const safetyTimer = setTimeout(() => {
      sessionStorage.setItem("hasSeenLoading", "true")
      onComplete()
    }, 3000) // Forzar completado después de 3 segundos

    return () => clearTimeout(safetyTimer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary">
      <div className="flex flex-col items-center gap-8">
        {/* Logo simplificado */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-primary rounded-full animate-pulse"></div>
          <div className="text-2xl font-bold text-white">Rafaela Hoy</div>
        </div>

        {/* Loading Bar */}
        <div className="w-64">
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-white/70 text-sm mt-3">
            Cargando... {progress}%
          </p>
        </div>
      </div>
    </div>
  )
}
