"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Loader2, Eye, Gauge, ArrowLeft, Home } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"

export interface WeatherForecast {
  date: Date
  temp_min: number
  temp_max: number
  weather: {
    main: string
    description: string
    icon: string
  }
}

export default function ClimaPage() {
  const [forecast, setForecast] = useState<WeatherForecast[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWeatherForecast()
  }, [])

  const loadWeatherForecast = async () => {
    try {
      const response = await fetch('/api/weather')
      const data = await response.json()
      const forecastWithDates = data.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }))
      setForecast(forecastWithDates)
    } catch (error) {
      console.error('Error loading weather forecast:', error)
      setError('Error al cargar el pronóstico del clima')
    }
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather.toLowerCase()) {
      case 'clear':
        return <Sun className="h-12 w-12 text-yellow-500" />
      case 'clouds':
        return <Cloud className="h-12 w-12 text-gray-500" />
      case 'rain':
        return <CloudRain className="h-12 w-12 text-blue-500" />
      case 'snow':
        return <CloudSnow className="h-12 w-12 text-blue-300" />
      default:
        return <Cloud className="h-12 w-12 text-gray-500" />
    }
  }

  const getDayLabel = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana'
    } else {
      const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' })
      return dayName.charAt(0).toUpperCase() + dayName.slice(1)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTemp = (temp: number) => {
    return temp.toFixed(1)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Cloud className="h-16 w-16 text-white/60 mx-auto mb-4" />
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
              <h1 className="text-3xl font-bold">Clima en Rafaela</h1>
              <p className="text-white/80">Pronóstico extendido para los próximos 5 días</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {forecast.map((day, index) => (
            <Card key={index} className="bg-white border-2 border-red-600 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-3 bg-gradient-to-b from-red-50 to-white">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {getDayLabel(day.date)}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {formatDate(day.date)}
                </p>
              </CardHeader>
              <CardContent className="text-center space-y-4 p-4">
                <div className="flex justify-center">
                  {getWeatherIcon(day.weather.main)}
                </div>
                
                {/* Temperaturas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">Mín:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatTemp(day.temp_min)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">Máx:</span>
                    <span className="text-xl font-bold text-red-600">
                      {formatTemp(day.temp_max)}°
                    </span>
                  </div>
                </div>

                {/* Descripción del clima */}
                <div className="text-sm text-gray-600 font-medium">
                  {day.weather.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
