import { NextRequest, NextResponse } from 'next/server'
import { getCurrentDutyPharmacies, normalizePharmacyName } from '@/lib/pharmacy-rotation'
import { createClient } from '@/lib/supabase/server'

// This endpoint will be called by Vercel Cron Jobs
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('Cron authentication failed');
      console.log('Auth header received:', authHeader);
      console.log('Expected Bearer:', process.env.CRON_SECRET ? 'Bearer [REDACTED]' : 'NOT_SET');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Cron authentication successful');
    console.log('Starting scheduled pharmacy update with rotation system...')
    
    // Obtener farmacias de turno según el sistema matemático
    const dutyPharmacies = getCurrentDutyPharmacies()
    const normalizedDutyPharmacies = dutyPharmacies.map(pharmacy => normalizePharmacyName(pharmacy))
    
    console.log('Duty pharmacies calculated:', dutyPharmacies)
    
    // Conectar a Supabase
    const supabase = await createClient()
    
    // Primero, establecer todas las farmacias como no están de turno
    const { error: resetError } = await supabase
      .from('pharmacies')
      .update({ is_on_duty: false })
    
    if (resetError) {
      throw new Error(`Error resetting pharmacy duties: ${resetError.message}`)
    }
    
    // Luego, activar solo las farmacias que están de turno
    if (dutyPharmacies.length > 0) {
      // Obtener todas las farmacias para comparar nombres normalizados
      const { data: allPharmacies, error: fetchError } = await supabase
        .from('pharmacies')
        .select('id, name')
      
      if (fetchError) {
        throw new Error(`Error fetching pharmacies: ${fetchError.message}`)
      }
      
      // Encontrar IDs de las farmacias que están de turno
      const dutyPharmacyIds = allPharmacies
        .filter(pharmacy => {
          const normalizedPharmacyName = normalizePharmacyName(pharmacy.name)
          return normalizedDutyPharmacies.includes(normalizedPharmacyName)
        })
        .map(pharmacy => pharmacy.id)
      
      // Actualizar farmacias de turno
      if (dutyPharmacyIds.length > 0) {
        const { error: updateError } = await supabase
          .from('pharmacies')
          .update({ is_on_duty: true })
          .in('id', dutyPharmacyIds)
        
        if (updateError) {
          throw new Error(`Error updating duty pharmacies: ${updateError.message}`)
        }
        
        console.log(`Updated ${dutyPharmacyIds.length} pharmacies to duty status`)
      } else {
        console.log('No matching pharmacies found for duty rotation')
      }
    }
    
    const result = {
      dutyPharmacies,
      normalizedDutyPharmacies,
      timestamp: new Date().toISOString()
    }
    
    console.log('Pharmacy update completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Pharmacies updated successfully with rotation system',
      ...result
    })
  } catch (error) {
    console.error('Error in scheduled pharmacy update:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update pharmacies',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
