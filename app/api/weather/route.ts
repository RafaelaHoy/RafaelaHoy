import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const apiKey = process.env.WEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY
    const city = 'Rafaela,AR'
    
    if (!apiKey) {
      console.warn('Weather API key not found, using mock data')
      // Return mock data when API key is not available
      const mockData = [
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
      
      return NextResponse.json(mockData)
    }
    
    // Get 5-day forecast (3-hour intervals)
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=es`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather forecast')
    }
    
    const data = await response.json()
    
    // Process data to get daily forecasts with proper min/max temperatures
    const dailyForecasts = data.list.reduce((acc: any[], forecast: any) => {
      const date = new Date(forecast.dt * 1000)
      const dateStr = date.toDateString()
      
      // @ts-ignore
      if (!acc[dateStr]) {
        // @ts-ignore
        acc[dateStr] = {
          date: date,
          temp_min: forecast.main.temp_min,
          temp_max: forecast.main.temp_max,
          weather: forecast.weather[0]
        }
      } else {
        // Update min and max temperatures
        // @ts-ignore
        acc[dateStr].temp_min = Math.min(acc[dateStr].temp_min, forecast.main.temp_min)
        // @ts-ignore
        acc[dateStr].temp_max = Math.max(acc[dateStr].temp_max, forecast.main.temp_max)
      }
      
      return acc
    }, {})
    
    // Get next 5 days
    const next5Days = Object.values(dailyForecasts)
      .sort((a: any, b: any) => a.date - b.date)
      .slice(0, 5)
    
    const result = next5Days.map((day: any) => ({
      date: day.date,
      temp_min: day.temp_min,
      temp_max: day.temp_max,
      weather: {
        main: day.weather.main,
        description: day.weather.description,
        icon: day.weather.icon
      }
    }))
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    return NextResponse.json({ error: 'Failed to fetch weather forecast' }, { status: 500 })
  }
}
