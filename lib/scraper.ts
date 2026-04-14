import { createClient } from './supabase/client'

interface PharmacyData {
  name: string
  address: string
  phone?: string
}

export async function scrapePharmaciesOnDuty(): Promise<PharmacyData[]> {
  try {
    const response = await fetch('https://circulorafaela.com.ar/farmacias', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    })

    if (!response.ok) {
      console.log(`Scraping falló con status ${response.status}, usando datos de ejemplo`)
      return getFallbackPharmacies()
    }

    const html = await response.text()
    
    const pharmacies = parsePharmacyData(html)
    
    if (pharmacies.length === 0) {
      console.log('No se encontraron farmacias en el HTML, usando datos de ejemplo')
      return getFallbackPharmacies()
    }
    
    return pharmacies
  } catch (error) {
    console.error('Error scraping pharmacies:', error)
    return getFallbackPharmacies()
  }
}

function parsePharmacyData(html: string): PharmacyData[] {
  const pharmacies: PharmacyData[] = []
  
  const patterns = [
    /<[^>]*>Farmacia[^<]*<\/[^>]*>/gi,
    /Farmacia[^<\n]*(?:\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4})?[^<\n]*/gi,
    /(Farmacia\s+[^<\n]*(?:calle|avenida|av\.|ruta)[^<\n]*)/gi
  ]
  
  for (const pattern of patterns) {
    const matches = html.match(pattern)
    if (matches) {
      for (const match of matches) {
        const pharmacy = extractPharmacyFromText(match)
        if (pharmacy && !pharmacies.find(p => p.name === pharmacy.name)) {
          pharmacies.push(pharmacy)
        }
      }
    }
  }
  
  return pharmacies.slice(0, 5)
}

function extractPharmacyFromText(text: string): PharmacyData | null {
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  
  const phoneMatch = cleanText.match(/(\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4})/)
  const phone = phoneMatch ? phoneMatch[1] : undefined
  
  let name = cleanText.split(/(?:calle|avenida|av\.|ruta|km|\d{4,})/i)[0].trim()
  if (!name || name.length < 3) return null
  
  let address = ''
  const addressMatch = cleanText.match(/(?:calle|avenida|av\.|ruta|km)[^<\n]*/i)
  if (addressMatch) {
    address = addressMatch[0].trim()
  }
  
  if (!address && phoneMatch) {
    address = cleanText.replace(name, '').replace(phoneMatch[0], '').trim()
  }
  
  return {
    name: name.replace('Farmacia', '').trim() || name,
    address: address || 'Dirección no disponible',
    phone
  }
}

function getFallbackPharmacies(): PharmacyData[] {
  return [
    {
      name: "Del Centro",
      address: "25 de Mayo 870, Rafaela",
      phone: "3492-426622"
    },
    {
      name: "San Jorge",
      address: "Belgrano 1435, Rafaela", 
      phone: "3492-425466"
    },
    {
      name: "Del Pueblo",
      address: "San Martín 246, Rafaela",
      phone: "3492-423874"
    }
  ]
}

export async function savePharmaciesToDatabase(pharmacies: PharmacyData[]): Promise<void> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  try {
    // Delete existing pharmacies for today
    await supabase
      .from('pharmacies_on_duty')
      .delete()
      .eq('date', today)
    
    // Insert new pharmacies
    for (const pharmacy of pharmacies) {
      await supabase
        .from('pharmacies_on_duty')
        .insert({
          name: pharmacy.name,
          address: pharmacy.address,
          phone: pharmacy.phone,
          date: today
        })
    }
    
    console.log(`Successfully saved ${pharmacies.length} pharmacies for ${today}`)
  } catch (error) {
    console.error('Error saving pharmacies to database:', error)
    throw new Error('Failed to save pharmacy data to database')
  }
}

export async function getPharmaciesOnDuty(): Promise<PharmacyData[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  try {
    const { data, error } = await supabase
      .from('pharmacies_on_duty')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching pharmacies:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    return []
  }
}

// Server Action for scraping and saving
export async function updatePharmaciesOnDuty(): Promise<{ success: boolean; message: string }> {
  try {
    const pharmacies = await scrapePharmaciesOnDuty()
    await savePharmaciesToDatabase(pharmacies)
    
    return {
      success: true,
      message: `Se actualizaron ${pharmacies.length} farmacias de turno`
    }
  } catch (error) {
    console.error('Error updating pharmacies:', error)
    return {
      success: false,
      message: 'Error al actualizar las farmacias de turno'
    }
  }
}
