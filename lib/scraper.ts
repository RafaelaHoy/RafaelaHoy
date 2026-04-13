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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    
    // Parse the HTML to extract pharmacy data
    // This is a basic implementation - you may need to adjust based on the actual HTML structure
    const pharmacies: PharmacyData[] = []
    
    // Look for pharmacy information patterns
    // Common patterns for pharmacy data
    const pharmacyPatterns = [
      // Pattern 1: Look for divs with pharmacy information
      /<div[^>]*>([^<]*(?:farmacia|Farmacia)[^<]*)<\/div>/gi,
      // Pattern 2: Look for list items with pharmacy data
      /<li[^>]*>([^<]*(?:farmacia|Farmacia)[^<]*)<\/li>/gi,
      // Pattern 3: Look for table rows with pharmacy data
      /<tr[^>]*>([^<]*(?:farmacia|Farmacia)[^<]*)<\/tr>/gi
    ]

    // Try different patterns to extract pharmacy data
    for (const pattern of pharmacyPatterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 0) {
        for (const match of matches) {
          // Clean HTML tags and extract text
          const cleanText = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          
          // Try to extract name, address, and phone
          const pharmacy = parsePharmacyInfo(cleanText)
          if (pharmacy) {
            pharmacies.push(pharmacy)
          }
        }
        break // Stop after first successful pattern match
      }
    }

    // If no patterns worked, try a more generic approach
    if (pharmacies.length === 0) {
      // Look for any text that might contain pharmacy information
      const lines = html.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      for (const line of lines) {
        if (line.toLowerCase().includes('farmacia') || 
            line.toLowerCase().includes('de turno') ||
            line.match(/\d{4,}/)) { // Look for lines with phone numbers
          
          const pharmacy = parsePharmacyInfo(line)
          if (pharmacy) {
            pharmacies.push(pharmacy)
          }
        }
      }
    }

    return pharmacies.slice(0, 10) // Limit to 10 pharmacies maximum
  } catch (error) {
    console.error('Error scraping pharmacies:', error)
    throw new Error('Failed to scrape pharmacy data')
  }
}

function parsePharmacyInfo(text: string): PharmacyData | null {
  try {
    // Remove HTML tags and clean text
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Look for phone numbers
    const phoneMatch = cleanText.match(/(\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4})/)
    const phone = phoneMatch ? phoneMatch[1] : undefined
    
    // Remove phone from text to get name and address
    let nameAndAddress = cleanText.replace(phoneMatch?.[0] || '', '').trim()
    
    // Try to separate name and address
    let name = ''
    let address = ''
    
    // Look for common address patterns
    const addressPatterns = [
      /(?:calle|avenida|av\.|ruta|km|n°|no\.|numero)\s+[^\n]+/i,
      /\d+\s+[^\n]*(?:calle|avenida|av|calle|esquina)/i,
      /[^\n]*(?:calle|avenida|av|esquina)[^\n]*/i
    ]
    
    for (const pattern of addressPatterns) {
      const addressMatch = nameAndAddress.match(pattern)
      if (addressMatch) {
        address = addressMatch[0].trim()
        name = nameAndAddress.replace(address, '').trim()
        break
      }
    }
    
    // If no address found, try to split by common separators
    if (!address) {
      const separators = ['|', '-', '–', '•', '·', ':']
      for (const sep of separators) {
        if (nameAndAddress.includes(sep)) {
          const parts = nameAndAddress.split(sep).map(p => p.trim())
          if (parts.length >= 2) {
            name = parts[0]
            address = parts.slice(1).join(' ')
            break
          }
        }
      }
    }
    
    // If still no clear separation, use the whole text as name and address
    if (!name) {
      name = nameAndAddress.split(' ').slice(0, 3).join(' ')
      address = nameAndAddress
    }
    
    // Clean up the data
    name = name.replace(/^(farmacia|de|turno|del|dia|hoY)/gi, '').trim()
    address = address.replace(/^(farmacia|de|turno|del|dia|hoY)/gi, '').trim()
    
    if (name.length < 3) return null
    
    return {
      name: name || 'Farmacia de Turno',
      address: address || 'Dirección no disponible',
      phone
    }
  } catch (error) {
    console.error('Error parsing pharmacy info:', error)
    return null
  }
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
