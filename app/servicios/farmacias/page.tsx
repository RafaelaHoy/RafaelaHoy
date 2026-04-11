"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Phone, Loader2, Home } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"

export interface Pharmacy {
  id: number
  name: string
  phone: string
  cell_phone?: string
  address: string
  created_at: string
  updated_at: string
}

export default function FarmaciasServiciosPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPharmacies()
  }, [])

  const loadPharmacies = async () => {
    try {
      const response = await fetch('/api/pharmacies')
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies')
      }
      const data = await response.json()
      setPharmacies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading pharmacies:', error)
      setError('Error al cargar las farmacias')
    }
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
              <p className="text-white/80">Farmacias disponibles en Rafaela</p>
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

        {error ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
            <p className="text-white/80">{error}</p>
          </div>
        ) : pharmacies.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No hay farmacias disponibles</h2>
            <p className="text-white/80">En este momento no hay información de farmacias de turno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pharmacies.map((pharmacy) => (
              <Card key={pharmacy.id} className="bg-white border-2 border-red-600 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-3 bg-gradient-to-b from-red-50 to-white">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
                    <Building className="h-5 w-5 text-red-600" />
                    {pharmacy.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4 p-4">
                  <div className="flex justify-center">
                    <Building className="h-12 w-12 text-gray-500" />
                  </div>
                  
                  {/* Teléfono principal */}
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">{pharmacy.phone}</span>
                  </div>

                  {/* Celular (si existe) */}
                  {pharmacy.cell_phone && (
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{pharmacy.cell_phone}</span>
                    </div>
                  )}

                  {/* Dirección */}
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Dirección:</p>
                    <p>{pharmacy.address}</p>
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
