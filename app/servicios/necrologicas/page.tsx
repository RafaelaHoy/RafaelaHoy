"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Loader2, Home } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"

export interface Obituary {
  id: number
  full_name: string
  age: number
  service_info: string
  date: string
  created_at: string
  updated_at: string
}

export default function NecrologicasPage() {
  const [obituaries, setObituaries] = useState<Obituary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadObituaries()
  }, [])

  const loadObituaries = async () => {
    try {
      console.log('Loading obituaries from page...')
      const response = await fetch('/api/obituaries')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Received obituaries data:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setObituaries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading obituaries:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <User className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
            <p className="text-white/80">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header con branding */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <div className="text-white text-center">
              <h1 className="text-3xl font-bold">Necrológicas</h1>
              <p className="text-white/80">Recordando a quienes nos han dejado</p>
            </div>
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Volver al sitio</span>
            </Link>
          </div>
        </div>

        {obituaries.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No hay necrológicas disponibles</h2>
            <p className="text-white/80">En este momento no hay información para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {obituaries.map((obituary) => (
              <Card key={obituary.id} className="bg-white border-2 border-red-600 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-3 bg-gradient-to-b from-red-50 to-white">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    En memoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4 p-4">
                  <div className="flex justify-center">
                    <User className="h-12 w-12 text-gray-500" />
                  </div>
                  
                  {/* Nombre y edad */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {obituary.full_name}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-600">Edad:</span>
                      <span className="text-lg font-semibold text-red-600">
                        {obituary.age} años
                      </span>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(obituary.date)}</span>
                  </div>

                  {/* Información del servicio */}
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Servicio:</p>
                    <p>{obituary.service_info}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
