import { NextRequest, NextResponse } from 'next/server'
import { updatePharmaciesOnDuty, getPharmaciesOnDuty } from '@/lib/scraper'

export async function GET() {
  try {
    const pharmacies = await getPharmaciesOnDuty()
    
    return NextResponse.json({
      success: true,
      data: pharmacies,
      count: pharmacies.length
    })
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
