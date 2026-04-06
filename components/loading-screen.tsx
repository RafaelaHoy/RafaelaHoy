"use client"

import { useEffect, useState } from "react"

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 300)
          return 100
        }
        return prev + 5
      })
    }, 80)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-4">
          {/* Map Pin Icon */}
          <div className="relative">
            <svg
              width="60"
              height="80"
              viewBox="0 0 60 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-pulse-slow"
            >
              <path
                d="M30 0C13.4315 0 0 13.4315 0 30C0 52.5 30 80 30 80C30 80 60 52.5 60 30C60 13.4315 46.5685 0 30 0Z"
                className="fill-primary"
              />
              <circle cx="30" cy="28" r="12" fill="white" />
            </svg>
            {/* Shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
          </div>
          
          {/* Text */}
          <div className="flex flex-col">
            <span className="text-5xl font-bold text-white tracking-tight">
              Rafaela
            </span>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-8 bg-primary" />
              <span className="text-3xl font-bold text-primary">hoy</span>
              <div className="h-0.5 w-8 bg-primary" />
            </div>
          </div>
        </div>

        {/* Slogan */}
        <p className="text-white text-xl font-light animate-pulse">
          Donde la noticia ocurre
        </p>

        {/* Loading Bar */}
        <div className="w-64 mt-4">
          <div className="h-1 w-full bg-secondary-foreground/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-150 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-white/70 text-sm mt-3">
            Cargando noticias...
          </p>
        </div>
      </div>
    </div>
  )
}
