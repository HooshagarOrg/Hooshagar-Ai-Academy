/**
 * آماده‌سازی لوگوی اصلی از فایل منبع (trim + 1024×1024)
 * Usage: node scripts/prepare-logo.js [path-to-source.png]
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SOURCE = process.argv[2] || path.join(__dirname, '../assets/logo-source.png')

const OUT_MASTER = path.join(__dirname, '../public/logo.png')
const OUT_BRAND = path.join(__dirname, '../public/brand/logo-full.png')
const MASTER_SIZE = 1024

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Source not found: ${SOURCE}`)
    process.exit(1)
  }

  fs.mkdirSync(path.dirname(OUT_BRAND), { recursive: true })

  const meta = await sharp(SOURCE).metadata()
  console.log(`📷 Source: ${SOURCE} (${meta.width}×${meta.height})`)

  const trimmed = sharp(SOURCE).trim({ threshold: 12 })

  const buffer = await trimmed
    .resize(MASTER_SIZE, MASTER_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()

  await sharp(buffer).toFile(OUT_MASTER)
  await sharp(buffer).toFile(OUT_BRAND)

  const outMeta = await sharp(OUT_MASTER).metadata()
  console.log(`✅ ${OUT_MASTER} (${outMeta.width}×${outMeta.height})`)
  console.log(`✅ ${OUT_BRAND}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
