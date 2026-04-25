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
      },
      {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        temp_min: 14,
        temp_max: 23,
        weather: {
          main: 'Clouds',
          description: 'nublado',
          icon: '03d'
        }
      },
      {
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        temp_min: 17,
        temp_max: 25,
        weather: {
          main: 'Sun',
          description: 'cielo despejado',
          icon: '01d'
        }
      }
    ]
  }
  
  try {
    console.log('Fetching weather data for:', city)
    
    // Get 5-day forecast (3-hour intervals)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=es`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      }
    )
    
    console.log('Weather API response status:', response.status)
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Weather API: Invalid API key')
      } else if (response.status === 404) {
        console.error('Weather API: City not found')
      } else if (response.status === 429) {
        console.error('Weather API: Rate limit exceeded')
      } else {
        console.error('Weather API: HTTP error', response.status, response.statusText)
      }
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Weather API data received:', data)
    
    // Process the data to get daily forecasts with proper min/max temperatures
    const dailyForecasts = data.list.reduce((acc: any[], forecast: any) => {
      const date = new Date(forecast.dt * 1000)
      const dateStr = date.toDateString()
      
      if (!(acc as any)[dateStr]) {
        (acc as any)[dateStr] = {
          date: date,
          temp_min: forecast.main.temp_min,
          temp_max: forecast.main.temp_max,
          weather: forecast.weather[0]
        }
      } else {
        // Update min and max temperatures
        (acc as any)[dateStr].temp_min = Math.min((acc as any)[dateStr].temp_min, forecast.main.temp_min);
        (acc as any)[dateStr].temp_max = Math.max((acc as any)[dateStr].temp_max, forecast.main.temp_max);
      }
      
      return (acc as any)
    }, {})
    
    // Get next 5 days
    const next5Days = Object.values(dailyForecasts)
      .sort((a: any, b: any) => a.date - b.date)
      .slice(0, 5)
    
    return next5Days.map((day: any) => ({
      date: day.date,
      temp_min: day.temp_min,
      temp_max: day.temp_max,
      weather: {
        main: day.weather.main,
        description: day.weather.description,
        icon: day.weather.icon
      }
    }))
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    
    // If it's a network error or timeout, return mock data as fallback
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Weather API request timed out, using mock data')
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('Weather API network error, using mock data')
      } else {
        console.warn('Weather API error, using mock data:', error.message)
      }
    }
    
    // Return mock data as fallback
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
      },
      {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        temp_min: 14,
        temp_max: 23,
        weather: {
          main: 'Clouds',
          description: 'nublado',
          icon: '03d'
        }
      },
      {
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        temp_min: 17,
        temp_max: 25,
        weather: {
          main: 'Sun',
          description: 'cielo despejado',
          icon: '01d'
        }
      }
    ]
  }
}

// Supabase - Get obituaries
import { createClient } from '@/lib/supabase/client'

export interface Obituary {
  id: number
  full_name: string
  age: number
  death_date: string
  service_info: string
  created_at: string
  updated_at: string
}

export async function fetchObituaries(): Promise<Obituary[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('obituaries')
      .select('*')
      .order('death_date', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Error fetching obituaries:', error)
      return []
    }
    
    // Return data even if empty - no auto-insertion
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
