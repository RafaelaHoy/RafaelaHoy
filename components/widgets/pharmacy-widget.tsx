"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building } from "lucide-react"

export interface Pharmacy {
  id: number
  name: string
  phone: string
  cell_phone?: string
  address: string
  created_at: string
  updated_at: string
}

export function PharmacyWidget() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPharmacies()
  }, [])

  const loadPharmacies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pharmacies')
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies')
      }
      const data = await response.json()
      setPharmacies(data)
    } catch (error) {
      console.error('Error loading pharmacies:', error)
      setError('Error al cargar farmacias')
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
      <div className="bg-secondary text-white h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-white/20 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-secondary text-white h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/80">{error}</p>
          </div>
        </CardContent>
      </div>
    )
  }

  if (pharmacies.length === 0) {
    return (
      <div className="bg-secondary text-white h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/80">No hay farmacias de turno disponibles</p>
          </div>
        </CardContent>
      </div>
    )
  }

  return (
    <div className="bg-secondary text-white h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5" />
          Farmacias de Turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-white/70" />
                <h4 className="font-medium text-sm">{pharmacy.name}</h4>
              </div>
              <div className="space-y-1 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Celular:</span>
                  <span>{pharmacy.phone}</span>
                </div>
                {pharmacy.cell_phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Teléfono:</span>
                    <span>{pharmacy.cell_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Dirección:</span>
                  <span>{pharmacy.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="text-center">
            <a 
              href="/servicios/farmacias" 
              className="text-white/90 text-sm hover:underline inline-flex items-center gap-1"
            >
              Ver todas las farmacias
              <span>»</span>
            </a>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
