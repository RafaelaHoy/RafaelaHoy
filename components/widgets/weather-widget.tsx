'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchWeatherForecast } from '@/lib/api'
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WeatherData {
  date: Date
  temp_min: number
  temp_max: number
  weather: {
    main: string
    description: string
    icon: string
  }
}

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWeatherData()
  }, [])

  const loadWeatherData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWeatherForecast()
      
      if (data) {
        setWeatherData(data)
      } else {
        setError('No se pudo cargar el pronóstico')
      }
    } catch (err) {
      setError('Error al cargar el clima')
      console.error('Weather error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear':
        return <Sun className="h-5 w-5" />
      case 'clouds':
        return <Cloud className="h-5 w-5" />
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-5 w-5" />
      case 'snow':
        return <CloudSnow className="h-5 w-5" />
      default:
        return <Cloud className="h-5 w-5" />
    }
  }

  const getDayLabel = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana'
    } else if (date.toDateString() === dayAfter.toDateString()) {
      return 'Pasado'
    } else {
      return date.toLocaleDateString('es-AR', { weekday: 'short' })
    }
  }

  if (loading) {
    return (
      <Card className="bg-secondary text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Clima Extendido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-white/20 rounded w-16"></div>
                <div className="h-4 bg-white/20 rounded w-12"></div>
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
            <Cloud className="h-5 w-5" />
            Clima Extendido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/70 text-sm">{error}</p>
            <button 
              onClick={loadWeatherData}
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
          <Sun className="h-5 w-5" />
          Clima Extendido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weatherData.map((day, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {getWeatherIcon(day.weather.main)}
                <span className="text-sm font-medium">{getDayLabel(day.date)}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">
                  {Math.round(day.temp_max)}°
                </span>
                <span className="text-white/70 ml-1">
                  /{Math.round(day.temp_min)}°
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Rafaela, Argentina</span>
            <span>Actualizado: {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
