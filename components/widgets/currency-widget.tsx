'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchCurrencyRates } from '@/lib/api'
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrencyRate {
  compra: number
  venta: number
  fecha: string
}

interface CurrencyData {
  dolar_oficial: CurrencyRate
  dolar_blue: BlueRate
  euro: CurrencyRate
}

interface BlueRate extends CurrencyRate {
  brecha?: number
}

export function CurrencyWidget() {
  const [currencyData, setCurrencyData] = useState<CurrencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCurrencyData()
    
    // Update every 30 minutes
    const interval = setInterval(loadCurrencyData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadCurrencyData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCurrencyRates()
      
      if (data) {
        // Calculate spread for blue dollar
        const blueWithSpread = {
          ...data.dolar_blue,
          brecha: data.dolar_blue.venta - data.dolar_oficial.venta
        }
        
        setCurrencyData({
          ...data,
          dolar_blue: blueWithSpread
        })
      } else {
        setError('No se pudieron cargar las cotizaciones')
      }
    } catch (err) {
      setError('Error al cargar cotizaciones')
      console.error('Currency error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getTrendIcon = (compra: number, venta: number) => {
    const spread = venta - compra
    if (spread > 0) {
      return <TrendingUp className="h-3 w-3 text-green-400" />
    } else if (spread < 0) {
      return <TrendingDown className="h-3 w-3 text-red-400" />
    }
    return null
  }

  if (loading) {
    return (
      <Card className="bg-secondary text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cotizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-white/20 rounded w-24"></div>
                <div className="h-4 bg-white/20 rounded w-16"></div>
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
            <DollarSign className="h-5 w-5" />
            Cotizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-white/70 text-sm">{error}</p>
            <button 
              onClick={loadCurrencyData}
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
          <DollarSign className="h-5 w-5" />
          Cotizaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Dólar Oficial */}
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Dólar Oficial</div>
              <div className="text-xs text-white/70">Compra/Venta</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-blue-300">
                {currencyData ? formatCurrency(currencyData.dolar_oficial.venta) : '---'}
              </div>
              <div className="text-sm text-white/70">
                {currencyData ? formatCurrency(currencyData.dolar_oficial.compra) : '---'}
              </div>
            </div>
          </div>

          {/* Dólar Blue */}
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Dólar Blue</div>
              <div className="text-xs text-white/70">
                Brecha: {currencyData ? formatCurrency(currencyData.dolar_blue.brecha || 0) : '---'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-green-400">
                {currencyData ? formatCurrency(currencyData.dolar_blue.venta) : '---'}
              </div>
              <div className="text-sm text-white/70">
                {currencyData ? formatCurrency(currencyData.dolar_blue.compra) : '---'}
              </div>
            </div>
          </div>

          {/* Euro */}
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">Euro</div>
              <div className="text-xs text-white/70">Compra/Venta</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-yellow-300">
                {currencyData ? formatCurrency(currencyData.euro.venta) : '---'}
              </div>
              <div className="text-sm text-white/70">
                {currencyData ? formatCurrency(currencyData.euro.compra) : '---'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Fuente: DolarApi</span>
            <span>
              Actualizado: {currencyData ? 
                new Date(currencyData.dolar_oficial.fecha).toLocaleTimeString('es-AR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 
                '---'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
