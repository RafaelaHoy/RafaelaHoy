'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchObituaries, type Obituary } from '@/lib/api'
import { Calendar, User, Plus } from 'lucide-react'

export function ObituariesWidget() {
  const [obituaries, setObituaries] = useState<Obituary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadObituaries()
  }, [])

  const loadObituaries = async () => {
    try {
      const data = await fetchObituaries()
      // Mostrar solo los últimos 5 fallecidos
      setObituaries(data.slice(0, 5))
      setError(null)
    } catch (err) {
      setError('Error al cargar necrológicas')
      console.error('Error loading obituaries:', err)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha'
    
    // Asegurarse de que la fecha se interprete correctamente en zona horaria local
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Resetear horas para comparar solo fechas
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Hoy'
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Mañana'
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <Card className="bg-secondary text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-white text-2xl">†</span>
            Necrológicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/70 text-sm">{error}</p>
            <button 
              onClick={loadObituaries}
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
          <span className="text-white text-2xl">†</span>
          Necrológicas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {obituaries.slice(0, 5).map((obituary) => (
            <div key={obituary.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/70" />
                <h4 className="font-medium text-sm">{obituary.full_name}</h4>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {obituary.age} años
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(obituary.death_date)}</span>
              </div>
              <p className="text-xs text-white/80 line-clamp-2">
                {obituary.service_info}
              </p>
            </div>
          ))}
        </div>

        {obituaries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <Link 
              href="/servicios/necrologicas"
              className="text-white/90 text-sm hover:underline inline-flex items-center gap-1"
            >
              Ver todas las necrológicas
              <span>»</span>
            </Link>
          </div>
        )}

        {obituaries.length === 0 && (
          <div className="text-center py-4">
            <span className="text-white text-6xl mb-2">+</span>
            <p className="text-white/70 text-sm">No hay necrológicas recientes</p>
          </div>
        )}
      </CardContent>
    </div>
  )
}
