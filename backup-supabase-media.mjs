import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsuwpxnzdayupczabafs.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXdweG56ZGF5dXBjemFiYWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTgzNDAsImV4cCI6MjA5MTA3NDM0MH0.mg2CUZkhF7FuCVHBfpbd9fFm4k9LhrbvuiNqijykVJs'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan credenciales de Supabase. Exporta SUPABASE_URL y SUPABASE_KEY o define NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

const bucketName = 'media'
const startPrefix = 'article-media'
const outDir = path.join(process.cwd(), 'backup_fotos')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function downloadFile(filePath) {
  try {
    console.log('Downloading:', filePath)
    const { data, error } = await supabase.storage.from(bucketName).download(filePath)
    if (error) {
      console.error('Download error for', filePath, error.message || error)
      return
    }
    const dest = path.join(outDir, filePath)
    await ensureDir(dest)
    const buffer = Buffer.from(await data.arrayBuffer())
    await fs.writeFile(dest, buffer)
  } catch (err) {
    console.error('Failed to save', filePath, err)
  }
}

async function listAndProcess(prefix) {
  const limit = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, { limit, offset })
    if (error) throw error
    if (!data || data.length === 0) break
    for (const item of data) {
      const name = item.name
      // Heurística: si tiene punto es probablemente un archivo
      if (name.includes('.')) {
        const filePath = prefix ? `${prefix}/${name}` : name
        await downloadFile(filePath)
      } else {
        // carpeta -> recorrer recursivamente
        const subPrefix = prefix ? `${prefix}/${name}` : name
        await listAndProcess(subPrefix)
      }
    }
    if (data.length < limit) break
    offset += limit
  }
}

async function main() {
  console.log('Starting backup from', `${bucketName}/${startPrefix}`, 'to', outDir)
  try {
    await listAndProcess(startPrefix)
    console.log('Backup completo.')
  } catch (err) {
    console.error('Error during backup:', err.message || err)
    process.exitCode = 1
  }
}

main()
