import { NextRequest, NextResponse } from 'next/server'
import { updatePharmaciesOnDuty } from '@/lib/scraper'

// This endpoint will be called by Vercel Cron Jobs
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting scheduled pharmacy update...')
    const result = await updatePharmaciesOnDuty()
    console.log('Pharmacy update completed:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Pharmacies updated successfully',
      timestamp: new Date().toISOString(),
      result
    })
  } catch (error) {
    console.error('Error in scheduled pharmacy update:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update pharmacies',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
