import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan credenciales de Supabase. Exporta SUPABASE_URL y SUPABASE_KEY o define NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  process.exit(1)
}

const bucketName = 'media'
const startPrefix = 'article-media'
const outDir = path.join(process.cwd(), 'backup_fotos')
const maxRetries = 5
const retryDelayMs = 1000

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function downloadFile(filePath) {
  const dest = path.join(outDir, filePath)
  if (await fileExists(dest)) {
    return { ok: true, skipped: true }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${attempt}/${maxRetries}] Downloading: ${filePath}`)
      const { data, error } = await supabase.storage.from(bucketName).download(filePath)
      if (error) {
        throw error
      }
      await ensureDir(dest)
      const buffer = Buffer.from(await data.arrayBuffer())
      await fs.writeFile(dest, buffer)
      return { ok: true, skipped: false }
    } catch (err) {
      if (attempt === maxRetries) {
        console.error('FAILED', filePath, err.message || err)
        return { ok: false, skipped: false }
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt))
    }
  }
}

async function listAndProcess(prefix, stats) {
  const limit = 1000
  let offset = 0
  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, { limit, offset })
    if (error) throw error
    if (!data || data.length === 0) break

    for (const item of data) {
      const name = item.name
      const itemPath = prefix ? `${prefix}/${name}` : name
      if (name.includes('.')) {
        const result = await downloadFile(itemPath)
        stats.filesProcessed += 1
        if (result.ok && !result.skipped) {
          stats.downloaded += 1
        }
      } else {
        await listAndProcess(itemPath, stats)
      }
    }

    if (data.length < limit) break
    offset += limit
  }
}

async function main() {
  const stats = { filesProcessed: 0, downloaded: 0 }
  console.log('Starting backup from', `${bucketName}/${startPrefix}`, 'to', outDir)
  try {
    await fs.mkdir(outDir, { recursive: true })
    await listAndProcess(startPrefix, stats)
    console.log('Backup completo.', stats)
  } catch (err) {
    console.error('Error during backup:', err.message || err)
    process.exitCode = 1
  }
}

main()
