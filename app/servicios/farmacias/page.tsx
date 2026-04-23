"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, MapPin, Phone, Loader2, Home } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"

export interface Pharmacy {
  id: string
  name: string
  address: string
  phone?: string
  is_on_duty?: boolean
  date: string
  created_at: string
  updated_at: string
}

export default function FarmaciasServiciosPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPharmacies()
  }, [])

  const loadPharmacies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pharmacies-on-duty')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Received pharmacies data:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setPharmacies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading pharmacies:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-white/60 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Cargando</h1>
            <p className="text-white/80">Obteniendo información de farmacias...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Building className="h-16 w-16 text-white/60 mx-auto mb-4" />
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
              <h1 className="text-3xl font-bold">Farmacias de Turno</h1>
              <p className="text-white/80">Farmacias de guardia hoy en Rafaela</p>
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

        {pharmacies.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No hay farmacias de turno disponibles</h2>
            <p className="text-white/80">En este momento no hay información de farmacias de turno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pharmacies.map((pharmacy) => (
              <Card key={pharmacy.id} className="bg-white border-2 border-red-600 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-3 bg-gradient-to-b from-red-50 to-white">
                  <CardTitle className="text-lg font-semibold text-red-600 flex items-center justify-center gap-2">
                    <Building className="h-5 w-5" />
                    {pharmacy.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4 p-4">
                  <div className="flex justify-center">
                    <MapPin className="h-12 w-12 text-gray-500" />
                  </div>
                  
                  {/* Dirección */}
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Dirección:</p>
                    <p>{pharmacy.address}</p>
                  </div>

                  {/* Teléfono */}
                  {pharmacy.phone && (
                    <div className="flex items-center justify-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">{pharmacy.phone}</span>
                    </div>
                  )}

                  {/* Fecha */}
                  <div className="text-xs text-gray-500">
                    {formatDate(pharmacy.date)}
                  </div>

                  {/* Botón Cómo llegar */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Cómo llegar
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
