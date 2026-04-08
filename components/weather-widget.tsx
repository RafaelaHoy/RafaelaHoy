"use client"

import { useState, useEffect } from "react"
import { Sun, Cloud, CloudRain, CloudSnow, Wind, CloudDrizzle } from "lucide-react"

interface WeatherData {
  temperature: number
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "windy" | "drizzle"
  description: string
}

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
  drizzle: CloudDrizzle,
}

const weatherColors = {
  sunny: "text-yellow-400",
  cloudy: "text-gray-300",
  rainy: "text-blue-300",
  snowy: "text-blue-200",
  windy: "text-gray-400",
  drizzle: "text-blue-400",
}

// Mapeo de condiciones de OpenWeatherMap a nuestras condiciones
const mapWeatherCondition = (weatherMain: string, weatherDescription: string): WeatherData["condition"] => {
  switch (weatherMain.toLowerCase()) {
    case "clear":
      return "sunny"
    case "clouds":
      return "cloudy"
    case "rain":
      return weatherDescription.includes("drizzle") ? "drizzle" : "rainy"
    case "drizzle":
      return "drizzle"
    case "snow":
      return "snowy"
    case "thunderstorm":
      return "rainy"
    case "mist":
    case "fog":
    case "haze":
      return "cloudy"
    default:
      return "sunny"
  }
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
        if (!apiKey) {
          throw new Error("API key no configurada")
        }

        // Coordenadas de Rafaela, Argentina
        const lat = -31.2507
        const lon = -61.4984
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`
        )

        if (!response.ok) {
          throw new Error(`Error en API: ${response.status}`)
        }

        const data = await response.json()
        
        const weatherData: WeatherData = {
          temperature: Math.round(data.main.temp),
          condition: mapWeatherCondition(data.weather[0].main, data.weather[0].description),
          description: data.weather[0].description,
        }

        setWeather(weatherData)
        setError(null)
      } catch (err) {
        console.error("Error fetching weather:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
        
        // Fallback a datos simulados
        setWeather({
          temperature: 24,
          condition: "sunny",
          description: "Soleado"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()

    // Refrescar cada 10 minutos
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
        <div className="w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
        <div className="w-8 h-3 bg-white/20 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const WeatherIcon = weatherIcons[weather.condition]

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
      <WeatherIcon className={`h-4 w-4 ${weatherColors[weather.condition]}`} />
      <span className="text-sm font-medium text-white">{weather.temperature}°C</span>
    </div>
  )
}
