/**
 * آماده‌سازی لوگوی اصلی: حذف پس‌زمینهٔ لبه (سفید یا تیره) + 1024×1024 شفاف
 * Usage: node scripts/prepare-logo.js [path-to-source.png]
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const SOURCE = process.argv[2] || path.join(__dirname, '../assets/logo-source.png')

const OUT_MASTER = path.join(__dirname, '../public/logo.png')
const OUT_BRAND = path.join(__dirname, '../public/brand/logo-full.png')
const MASTER_SIZE = 1024
/** نزدیک سفید — فقط نواحی متصل به لبهٔ تصویر شفاف می‌شوند */
const WHITE_THRESHOLD = 238
/** نزدیک مشکی/تیره — برای لوگوی ۳D با پس‌زمینهٔ تیره */
const DARK_THRESHOLD = 55

function removeEdgeConnected(raw, width, height, channels, matches) {
  const visited = new Uint8Array(width * height)
  const queue = []

  const tryPush = (x, y) => {
    const cell = y * width + x
    if (visited[cell]) return
    const pi = cell * channels
    if (!matches(pi)) return
    visited[cell] = 1
    queue.push(x, y)
  }

  for (let x = 0; x < width; x++) {
    tryPush(x, 0)
    tryPush(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y)
    tryPush(width - 1, y)
  }

  while (queue.length > 0) {
    const x = queue.pop()
    const y = queue.pop()
    const pi = (y * width + x) * channels
    raw[pi + 3] = 0

    if (x > 0) tryPush(x - 1, y)
    if (x < width - 1) tryPush(x + 1, y)
    if (y > 0) tryPush(x, y - 1)
    if (y < height - 1) tryPush(x, y + 1)
  }
}

function isNearWhite(pi, raw) {
  const r = raw[pi]
  const g = raw[pi + 1]
  const b = raw[pi + 2]
  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD
}

function isNearDark(pi, raw) {
  const r = raw[pi]
  const g = raw[pi + 1]
  const b = raw[pi + 2]
  return r <= DARK_THRESHOLD && g <= DARK_THRESHOLD && b <= DARK_THRESHOLD
}

function detectBackgroundMode(raw, width, height, channels) {
  const samples = [
    0,
    (width - 1) * channels,
    (height - 1) * width * channels,
    ((height - 1) * width + (width - 1)) * channels,
  ]
  let sum = 0
  for (const pi of samples) {
    sum += (raw[pi] + raw[pi + 1] + raw[pi + 2]) / 3
  }
  const avg = sum / samples.length
  return avg < 100 ? 'dark' : 'light'
}

async function processLogoBuffer(inputPath) {
  const trimmed = await sharp(inputPath)
    .trim({ threshold: 15 })
    .ensureAlpha()
    .toBuffer()

  const { data, info } = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  const mode = detectBackgroundMode(data, info.width, info.height, info.channels)
  const matcher =
    mode === 'dark'
      ? (pi) => isNearDark(pi, data)
      : (pi) => isNearWhite(pi, data)

  removeEdgeConnected(data, info.width, info.height, info.channels, matcher)

  return {
    buffer: await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .resize(MASTER_SIZE, MASTER_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer(),
    mode,
  }
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Source not found: ${SOURCE}`)
    process.exit(1)
  }

  fs.mkdirSync(path.dirname(OUT_BRAND), { recursive: true })

  const meta = await sharp(SOURCE).metadata()
  console.log(`📷 Source: ${SOURCE} (${meta.width}×${meta.height})`)

  const { buffer, mode } = await processLogoBuffer(SOURCE)
  console.log(
    mode === 'dark'
      ? `🎨 Removing edge-connected dark (threshold ${DARK_THRESHOLD})…`
      : `🎨 Removing edge-connected white (threshold ${WHITE_THRESHOLD})…`,
  )

  await sharp(buffer).toFile(OUT_MASTER)
  await sharp(buffer).toFile(OUT_BRAND)

  const outMeta = await sharp(OUT_MASTER).metadata()
  console.log(`✅ ${OUT_MASTER} (${outMeta.width}×${outMeta.height}, alpha)`)
  console.log(`✅ ${OUT_BRAND}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
