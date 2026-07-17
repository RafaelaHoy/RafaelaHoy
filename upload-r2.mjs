import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

dotenv.config({ path: '.env.local' })

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ENDPOINT = process.env.R2_ENDPOINT
let R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME) {
  console.error('Faltan variables de entorno. Asegurate de tener R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT y R2_BUCKET_NAME en .env.local')
  process.exit(1)
}

R2_BUCKET_NAME = R2_BUCKET_NAME.trim().replace(/^"|"$/g, '')

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
})

const fallbackDir = path.join(process.cwd(), 'backup_fotos')
const articleMediaDir = path.join(fallbackDir, 'article-media')

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function normalizeKey(relativePath) {
  return relativePath.split(path.sep).join('/')
}

const mimeMap = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.heic': 'image/heic',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return mimeMap[ext] || 'application/octet-stream'
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(entryPath))
    } else if (entry.isFile()) {
      files.push(entryPath)
    }
  }

  return files
}

async function uploadFile(sourceDir, filePath) {
  const relativePath = path.relative(sourceDir, filePath)
  const key = normalizeKey(relativePath)
  const contentType = getContentType(filePath)
  const body = await fs.readFile(filePath)

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  })

  await client.send(command)
  console.log('Uploaded:', key)
}

async function main() {
  const sourceDir = (await pathExists(articleMediaDir)) ? articleMediaDir : fallbackDir

  if (!(await pathExists(sourceDir))) {
    console.error('No se encontró la carpeta de origen para subir. Buscando:', sourceDir)
    process.exit(1)
  }

  console.log('Usando carpeta:', sourceDir)
  const files = await collectFiles(sourceDir)
  if (files.length === 0) {
    console.log('No se encontraron archivos para subir en', sourceDir)
    return
  }

  console.log(`Subiendo ${files.length} archivos a ${R2_BUCKET_NAME}`)

  const concurrency = 8
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency)
    await Promise.all(batch.map((filePath) => uploadFile(sourceDir, filePath)))
  }

  console.log('Subida completada.')
}

main().catch((error) => {
  console.error('Error durante la subida:', error)
  process.exit(1)
})
