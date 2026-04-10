'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchObituaries, type Obituary } from '@/lib/api'
import { Flame, Loader2, Calendar, User } from 'lucide-react'

export function ObituariesWidget() {
  const [obituaries, setObituaries] = useState<Obituary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadObituaries()
  }, [])

  const loadObituaries = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchObituaries()
      setObituaries(data.slice(0, 3)) // Show only 3 most recent
    } catch (err) {
      setError('Error al cargar necrológicas')
      console.error('Obituaries error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana'
    } else if (date.toDateString() === yesterday.toDateString()) {
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

  if (loading) {
    return (
      <Card className="bg-secondary text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Necrológicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                <div className="h-3 bg-white/20 rounded w-full"></div>
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
            <Flame className="h-5 w-5" />
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
          <Flame className="h-5 w-5" />
          Necrológicas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {obituaries.map((obituary) => (
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
                <span>{formatDate(obituary.date)}</span>
                <span>·</span>
                <span>{formatTime(obituary.date)}</span>
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
              href="/necrologicas" 
              className="text-white/90 text-sm hover:underline inline-flex items-center gap-1"
            >
              Ver todas las necrológicas
              <span>»</span>
            </Link>
          </div>
        )}

        {obituaries.length === 0 && (
          <div className="text-center py-4">
            <Flame className="h-8 w-8 text-white/50 mx-auto mb-2" />
            <p className="text-white/70 text-sm">No hay necrológicas recientes</p>
          </div>
        )}
      </CardContent>
    </div>
  )
}
