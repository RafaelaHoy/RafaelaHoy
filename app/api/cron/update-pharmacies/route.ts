import { NextRequest, NextResponse } from 'next/server'
import { getCurrentDutyPharmacies, normalizePharmacyName } from '@/lib/pharmacy-rotation'
import { createAdminClient } from '@/lib/supabase/admin'

// This endpoint will be called by Vercel Cron Jobs
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('🔒 Cron authentication failed');
      console.log('Auth header received:', authHeader);
      console.log('Expected Bearer:', process.env.CRON_SECRET ? 'Bearer [REDACTED]' : 'NOT_SET');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('✅ Cron authentication successful');
    console.log('🔄 Starting scheduled pharmacy update with rotation system...');
    
    // Obtener farmacias de turno según el sistema matemático
    const dutyPharmacies = getCurrentDutyPharmacies()
    const normalizedDutyPharmacies = dutyPharmacies.map(pharmacy => normalizePharmacyName(pharmacy))
    
    console.log('📋 Duty pharmacies calculated:', dutyPharmacies)
    console.log('🔍 Normalized duty pharmacies:', normalizedDutyPharmacies)
    
    // Conectar a Supabase con cliente admin (bypass RLS)
    const supabase = createAdminClient()
    
    // Primero, establecer todas las farmacias como no están de turno
    console.log('🔄 Resetting all pharmacy duties...');
    const { error: resetError } = await supabase
      .from('pharmacies')
      .update({ is_on_duty: false })
    
    if (resetError) {
      console.error('❌ Error resetting pharmacy duties:', resetError);
      throw new Error(`Error resetting pharmacy duties: ${resetError.message}`)
    }
    
    console.log('✅ All pharmacy duties reset successfully');
    
    // Luego, activar solo las farmacias que están de turno
    if (dutyPharmacies.length > 0) {
      console.log('🔍 Fetching all pharmacies for comparison...');
      // Obtener todas las farmacias para comparar nombres normalizados
      const { data: allPharmacies, error: fetchError } = await supabase
        .from('pharmacies')
        .select('id, name')
      
      if (fetchError) {
        console.error('❌ Error fetching pharmacies:', fetchError);
        throw new Error(`Error fetching pharmacies: ${fetchError.message}`)
      }
      
      console.log(`📊 Found ${allPharmacies?.length || 0} total pharmacies`);
      
      // Encontrar IDs de las farmacias que están de turno
      const dutyPharmacyIds = allPharmacies
        .filter(pharmacy => {
          const normalizedPharmacyName = normalizePharmacyName(pharmacy.name)
          const isOnDuty = normalizedDutyPharmacies.includes(normalizedPharmacyName)
          if (isOnDuty) {
            console.log(`✅ Match found: "${pharmacy.name}" -> "${normalizedPharmacyName}"`);
          }
          return isOnDuty
        })
        .map(pharmacy => pharmacy.id)
      
      console.log(`🎯 Found ${dutyPharmacyIds.length} pharmacies to activate:`, dutyPharmacyIds);
      
      // Actualizar farmacias de turno
      if (dutyPharmacyIds.length > 0) {
        console.log('🔄 Updating duty pharmacies...');
        const { error: updateError } = await supabase
          .from('pharmacies')
          .update({ is_on_duty: true })
          .in('id', dutyPharmacyIds)
        
        if (updateError) {
          console.error('❌ Error updating duty pharmacies:', updateError);
          throw new Error(`Error updating duty pharmacies: ${updateError.message}`)
        }
        
        console.log(`✅ Successfully updated ${dutyPharmacyIds.length} pharmacies to duty status`);
      } else {
        console.log('⚠️ No matching pharmacies found for duty rotation');
      }
    } else {
      console.log('⚠️ No duty pharmacies calculated for today');
    }
    
    const result = {
      dutyPharmacies,
      normalizedDutyPharmacies,
      timestamp: new Date().toISOString(),
      success: true
    }
    
    console.log('🎉 Pharmacy update completed successfully:', result);
    
    return NextResponse.json({
      message: 'Pharmacies updated successfully with rotation system',
      ...result
    })
  } catch (error) {
    console.error('🔥 ERROR CRÍTICO EN CRON:', error);
    console.error('📍 Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
