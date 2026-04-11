import { NextRequest, NextResponse } from 'next/server'
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

export async function GET() {
  try {
    console.log('=== API OBITUARIES CALLED ===')
    
    const supabase = createClient()
    
    // Simple fetch - no complex checks for now
    const { data, error } = await supabase
      .from('obituaries')
      .select('*')
      .order('date', { ascending: false })
      .limit(20)
    
    console.log('Supabase response:', { data, error })
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    // If no data, create samples
    if (!data || data.length === 0) {
      console.log('No data found, creating samples...')
      
      const sampleData = [
        {
          full_name: 'María Elena Rodríguez de Pérez',
          age: 78,
          service_info: 'Servicio religioso en Iglesia San José, Av. San Martín 1234, Rafaela. Hora: 10:00 hs.',
          date: new Date().toISOString()
        },
        {
          full_name: 'Juan Carlos Pérez',
          age: 65,
          service_info: 'Crematorio Municipal, Calle 25 de Mayo 567, Rafaela. Hora: 15:00 hs.',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          full_name: 'Ana María González de Martínez',
          age: 82,
          service_info: 'Parroquia Nuestra Señora del Carmen, Calle Belgrano 890, Rafaela. Hora: 11:30 hs.',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          full_name: 'Roberto Carlos Martínez',
          age: 71,
          service_info: 'Capilla del Cementerio Local, Ruta 34 Km 12, Rafaela. Hora: 16:00 hs.',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          full_name: 'Carmen Luisa Fernández de Sánchez',
          age: 89,
          service_info: 'Iglesia Catedral, Plaza 25 de Mayo, Rafaela. Hora: 09:00 hs.',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      const { data: insertData, error: insertError } = await supabase
        .from('obituaries')
        .insert(sampleData)
        .select()
      
      console.log('Insert result:', { insertData, insertError })
      
      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ 
          error: 'Failed to insert sample data', 
          details: insertError.message 
        }, { status: 500 })
      }
      
      return NextResponse.json(insertData || [])
    }
    
    console.log(`Returning ${data.length} obituaries`)
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('=== CATCH BLOCK ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : error)
    console.error('Full error:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('obituaries')
      .insert(body)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating obituary:', error)
      return NextResponse.json({ 
        error: 'Failed to create obituary', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in obituaries POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
