import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export interface Pharmacy {
  id: number
  name: string
  phone: string
  cell_phone?: string
  address: string
  created_at: string
  updated_at: string
}

export async function GET() {
  try {
    console.log('=== API PHARMACIES CALLED ===')
    
    const supabase = createClient()
    
    // Fetch pharmacies
    const { data, error } = await supabase
      .from('pharmacies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
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
      console.log('No pharmacies found, creating samples...')
      
      const sampleData = [
        {
          name: 'Farmacia del Sol',
          phone: '3492-123456',
          cell_phone: '3492-1234567',
          address: 'Av. San Martín 1234, Rafaela, Santa Fe'
        },
        {
          name: 'Farmacia San José',
          phone: '3492-234567',
          cell_phone: '3492-2345678',
          address: 'Calle Belgrano 890, Rafaela, Santa Fe'
        },
        {
          name: 'Farmacia del Centro',
          phone: '3492-345678',
          address: 'Plaza 25 de Mayo 456, Rafaela, Santa Fe'
        }
      ]
      
      const { data: insertData, error: insertError } = await supabase
        .from('pharmacies')
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
    
    console.log(`Returning ${data.length} pharmacies`)
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
      .from('pharmacies')
      .insert(body)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating pharmacy:', error)
      return NextResponse.json({ error: 'Failed to create pharmacy' }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in pharmacies POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create sample pharmacies data
async function createSamplePharmacies() {
  const supabase = createClient()
  const sampleData = [
    {
      name: 'Farmacia del Sol',
      phone: '3492-123456',
      cell_phone: '3492-1234567',
      address: 'Av. San Martín 1234, Rafaela'
    },
    {
      name: 'Farmacia San José',
      phone: '3492-234567',
      cell_phone: '3492-2345678',
      address: 'Calle Belgrano 890, Rafaela'
    },
    {
      name: 'Farmacia del Centro',
      phone: '3492-345678',
      cell_phone: null,
      address: 'Plaza 25 de Mayo 456, Rafaela'
    }
  ]
  
  try {
    const { error } = await supabase
      .from('pharmacies')
      .insert(sampleData)
    
    if (error) {
      console.error('Error inserting sample pharmacies:', error)
    } else {
      console.log('Sample pharmacies created successfully')
    }
  } catch (error) {
    console.error('Error creating sample pharmacies:', error)
  }
}
