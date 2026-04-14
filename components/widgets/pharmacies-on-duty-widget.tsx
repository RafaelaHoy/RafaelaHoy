'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, MapPin, Phone, Loader2, RefreshCw } from 'lucide-react'

interface PharmacyOnDuty {
  id: string
  name: string
  address: string
  phone?: string
  date: string
}

export function PharmaciesOnDutyWidget() {
  const [pharmacies, setPharmacies] = useState<PharmacyOnDuty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadPharmacies()
  }, [])

  const loadPharmacies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/pharmacies-on-duty')
      if (!response.ok) {
        throw new Error('Error al cargar farmacias')
      }
      
      const data = await response.json()
      setPharmacies(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch (err) {
      setError('Error al cargar farmacias')
      console.error('Error loading pharmacies:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePharmacies = async () => {
    try {
      setUpdating(true)
      const response = await fetch('/api/pharmacies-on-duty', { method: 'POST' })
      if (response.ok) {
        await loadPharmacies() // Recargar datos actualizados
      }
    } catch (err) {
      console.error('Error updating pharmacies:', err)
    } finally {
      setUpdating(false)
    }
  }

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else {
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  if (loading) {
    return (
      <Card className="bg-secondary text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-white/20 rounded w-24"></div>
                <div className="h-4 bg-white/20 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-secondary text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/70 text-sm">{error}</p>
            <button 
              onClick={loadPharmacies}
              className="text-white/90 text-sm hover:underline mt-2"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="bg-secondary text-white h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5" />
          Farmacias de Turno
          <button
            onClick={updatePharmacies}
            disabled={updating}
            className="ml-auto text-white/70 hover:text-white transition-colors"
            title="Actualizar farmacias"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-white/70" />
                  <span className="font-medium text-sm">{pharmacy.name}</span>
                </div>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {formatDate(pharmacy.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{pharmacy.address}</span>
              </div>
              {pharmacy.phone && (
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Phone className="h-3 w-3" />
                  <span>{pharmacy.phone}</span>
                </div>
              )}
              <button
                onClick={() => openGoogleMaps(pharmacy.address)}
                className="text-xs text-white/90 hover:text-white hover:underline transition-colors"
              >
                Cómo llegar →
              </button>
            </div>
          ))}
        </div>

        {pharmacies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <Link 
              href="/servicios/farmacias"
              className="text-white/90 text-sm hover:underline inline-flex items-center gap-1"
            >
              Ver todas las farmacias
              <span>»</span>
            </Link>
          </div>
        )}

        {pharmacies.length === 0 && (
          <div className="text-center py-4">
            <span className="text-white text-6xl mb-2">+</span>
            <p className="text-white/70 text-sm">No hay farmacias de turno disponibles</p>
          </div>
        )}
      </CardContent>
    </div>
  )
}
