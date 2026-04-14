import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { updatePharmaciesOnDuty, getPharmaciesOnDuty } from '@/lib/scraper'

export async function GET() {
  try {
    // Primero intentar obtener de la tabla pharmacies_on_duty
    try {
      const pharmacies = await getPharmaciesOnDuty()
      return NextResponse.json(pharmacies)
    } catch (tableError) {
      console.log('Tabla pharmacies_on_duty no existe, usando fallback a pharmacies')
      
      // Fallback: usar la tabla pharmacies existente
      const supabase = createClient()
      const { data: pharmacies, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('name')

      if (error) throw error
      
      // Transformar los datos al formato esperado
      const transformedPharmacies = pharmacies?.map(pharmacy => ({
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        date: new Date().toISOString().split('T')[0], // Fecha de hoy
        created_at: pharmacy.created_at,
        updated_at: pharmacy.updated_at
      })) || []

      return NextResponse.json(transformedPharmacies)
    }
  } catch (error) {
    console.error('Error fetching pharmacies on duty:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al obtener las farmacias de turno' 
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const result = await updatePharmaciesOnDuty()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating pharmacies on duty:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error al actualizar las farmacias de turno' 
      },
      { status: 500 }
    )
  }
}
