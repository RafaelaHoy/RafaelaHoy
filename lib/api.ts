// API functions for fetching external data

// DolarApi - Get currency rates
export async function fetchCurrencyRates() {
  try {
    const response = await fetch('https://dolarapi.com/v1/dolares')
    if (!response.ok) {
      throw new Error('Failed to fetch currency rates')
    }
    const data = await response.json()
    
    // Filter for the rates we need
    const oficial = data.find((rate: any) => rate.casa === 'oficial')
    const blue = data.find((rate: any) => rate.casa === 'blue')
    
    // Get Euro rate from a different endpoint
    const euroResponse = await fetch('https://dolarapi.com/v1/cotizaciones/eur')
    const euroData = await euroResponse.json()
    
    return {
      dolar_oficial: {
        compra: oficial?.compra || 0,
        venta: oficial?.venta || 0,
        fecha: oficial?.fecha_actualizacion || new Date().toISOString()
      },
      dolar_blue: {
        compra: blue?.compra || 0,
        venta: blue?.venta || 0,
        fecha: blue?.fecha_actualizacion || new Date().toISOString()
      },
      euro: {
        compra: euroData?.compra || 0,
        venta: euroData?.venta || 0,
        fecha: euroData?.fecha_actualizacion || new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching currency rates:', error)
    return null
  }
}

// OpenWeather - Get weather forecast for Rafaela
export async function fetchWeatherForecast() {
  const apiKey = process.env.WEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY
  const city = 'Rafaela,AR'
  
  if (!apiKey) {
    console.warn('Weather API key not found, using mock data')
    // Return mock data when API key is not available
    return [
      {
        date: new Date(),
        temp_min: 18,
        temp_max: 28,
        weather: {
          main: 'Clear',
          description: 'cielo despejado',
          icon: '01d'
        }
      },
      {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        temp_min: 16,
        temp_max: 26,
        weather: {
          main: 'Clouds',
          description: 'parcialmente nublado',
          icon: '02d'
        }
      },
      {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        temp_min: 15,
        temp_max: 24,
        weather: {
          main: 'Rain',
          description: 'lluvia ligera',
          icon: '10d'
        }
      }
    ]
  }
  
  try {
    // Get 5-day forecast (3-hour intervals)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=es`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather forecast')
    }
    
    const data = await response.json()
    
    // Process the data to get daily forecasts (we'll take one forecast per day)
    const dailyForecasts = data.list
      .filter((item: any, index: number, self: any[]) => {
        // Get the first forecast of each day (around 12:00)
        const date = new Date(item.dt * 1000)
        const hour = date.getHours()
        return hour >= 12 && hour <= 15 // Take forecasts around noon
      })
      .slice(0, 3) // Get next 3 days
    
    return dailyForecasts.map((forecast: any) => ({
      date: new Date(forecast.dt * 1000),
      temp_min: forecast.main.temp_min,
      temp_max: forecast.main.temp_max,
      weather: {
        main: forecast.weather[0].main,
        description: forecast.weather[0].description,
        icon: forecast.weather[0].icon
      }
    }))
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    return null
  }
}

// Supabase - Get obituaries
import { createClient } from '@/lib/supabase/client'

export interface Obituary {
  id: number
  full_name: string
  age: number
  service_info: string
  date: string
  created_at: string
  updated_at: string
}

export async function fetchObituaries(): Promise<Obituary[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('obituaries')
      .select('*')
      .order('date', { ascending: false })
      .limit(10)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching obituaries:', error)
    return []
  }
}

// Supabase - Create obituary
export async function createObituary(obituary: Omit<Obituary, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('obituaries')
      .insert(obituary)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating obituary:', error)
    throw error
  }
}

// Supabase - Update obituary
export async function updateObituary(id: number, obituary: Partial<Obituary>) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('obituaries')
      .update(obituary)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating obituary:', error)
    throw error
  }
}

// Supabase - Delete obituary
export async function deleteObituary(id: number) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('obituaries')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting obituary:', error)
    throw error
  }
}
