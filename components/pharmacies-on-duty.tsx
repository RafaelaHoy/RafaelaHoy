"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, RefreshCw, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PharmacyData {
  id: string
  name: string
  address: string
  phone?: string
  date: string
  created_at: string
}

export function PharmaciesOnDuty() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchPharmacies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/pharmacies-on-duty')
      const result = await response.json()
      
      if (result.success) {
        setPharmacies(result.data)
      } else {
        setError(result.message || 'Error al cargar las farmacias')
      }
    } catch (err) {
      console.error('Error fetching pharmacies:', err)
      setError('No se pudieron cargar las farmacias de turno')
    } finally {
      setLoading(false)
    }
  }

  const updatePharmacies = async () => {
    try {
      setUpdating(true)
      
      const response = await fetch('/api/pharmacies-on-duty', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        // Refresh the data after update
        await fetchPharmacies()
      } else {
        setError(result.message || 'Error al actualizar las farmacias')
      }
    } catch (err) {
      console.error('Error updating pharmacies:', err)
      setError('No se pudieron actualizar las farmacias')
    } finally {
      setUpdating(false)
    }
  }

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
  }

  const openCirculoWebsite = () => {
    window.open('https://circulorafaela.com.ar/farmacias', '_blank')
  }

  useEffect(() => {
    fetchPharmacies()
  }, [])

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-muted-foreground">Cargando farmacias...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={fetchPharmacies}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button 
                onClick={openCirculoWebsite}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver en Círculo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-red-600 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Farmacias de Turno
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {today}
            </Badge>
            <Button
              onClick={updatePharmacies}
              disabled={updating}
              size="sm"
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pharmacies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No hay farmacias de turno disponibles para hoy
            </p>
            <Button 
              onClick={openCirculoWebsite}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver en Círculo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pharmacies.map((pharmacy) => (
              <div 
                key={pharmacy.id} 
                className="border border-blue-200 rounded-lg p-4 bg-blue-50/30 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-600 mb-2">
                      {pharmacy.name}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>{pharmacy.address}</span>
                      </div>
                      {pharmacy.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0 text-blue-600" />
                          <span>{pharmacy.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => openGoogleMaps(pharmacy.address)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Cómo llegar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
