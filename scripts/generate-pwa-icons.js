/**
 * Script تولید آیکون‌های PWA
 * 
 * نحوه استفاده:
 * 1. نصب Sharp: npm install sharp --save-dev
 * 2. قرار دادن لوگوی اصلی در public/logo.png (حداقل 512×512)
 * 3. اجرا: npm run generate-icons
 * 
 * یا دستی:
 * node scripts/generate-pwa-icons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// ============================================
// تنظیمات
// ============================================

const CONFIG = {
  inputFile: 'public/logo.png',
  outputDir: 'public/icons',
  backgroundColor: { r: 59, g: 130, b: 246, alpha: 1 }, // آبی #3b82f6
}

// سایزهای آیکون PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// آیکون‌های Shortcut
const SHORTCUT_ICONS = [
  { name: 'shortcut-dashboard', emoji: '📊' },
  { name: 'shortcut-messages', emoji: '💬' },
  { name: 'shortcut-reports', emoji: '📄' },
]

// ============================================
// توابع کمکی
// ============================================

/**
 * ایجاد پوشه اگر وجود ندارد
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${dir}`)
  }
}

/**
 * تولید آیکون با سایز مشخص
 */
async function generateIcon(inputPath, outputPath, size, options = {}) {
  const { padding = 0.1, background = null } = options

  try {
    const image = sharp(inputPath)
    const metadata = await image.metadata()

    // محاسبه padding
    const paddedSize = Math.floor(size * (1 - padding * 2))

    let pipeline = image.resize(paddedSize, paddedSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })

    // اگر background می‌خواهیم
    if (background) {
      pipeline = pipeline.flatten({ background })
    }

    // اگر padding می‌خواهیم، روی کانواس بزرگتر بذار
    if (padding > 0) {
      const padPixels = Math.floor(size * padding)
      pipeline = pipeline.extend({
        top: padPixels,
        bottom: padPixels,
        left: padPixels,
        right: padPixels,
        background: background || { r: 0, g: 0, b: 0, alpha: 0 },
      })
    }

    await pipeline.png().toFile(outputPath)

    console.log(`✅ Generated: ${outputPath} (${size}×${size})`)
    return true
  } catch (error) {
    console.error(`❌ Failed to generate ${outputPath}:`, error.message)
    return false
  }
}

/**
 * تولید آیکون با حرف فارسی
 */
async function generateLetterIcon(outputPath, size, letter = 'ه') {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.5}px" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${letter}</text>
    </svg>
  `

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath)

    console.log(`✅ Generated letter icon: ${outputPath}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to generate letter icon:`, error.message)
    return false
  }
}

/**
 * تولید آیکون با ایموجی
 */
async function generateEmojiIcon(outputPath, size, emoji) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#f3f4f6"/>
      <text 
        x="50%" 
        y="50%" 
        font-size="${size * 0.5}px" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${emoji}</text>
    </svg>
  `

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath)

    console.log(`✅ Generated emoji icon: ${outputPath}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to generate emoji icon:`, error.message)
    return false
  }
}

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('🎨 PWA Icon Generator')
  console.log('='.repeat(50))

  // ایجاد پوشه icons
  ensureDir(CONFIG.outputDir)

  // چک وجود فایل ورودی
  const inputExists = fs.existsSync(CONFIG.inputFile)

  if (inputExists) {
    console.log(`\n📌 Using logo file: ${CONFIG.inputFile}`)

    // تولید آیکون‌های اصلی
    console.log('\n📱 Generating PWA icons...')
    for (const size of ICON_SIZES) {
      const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`)
      await generateIcon(CONFIG.inputFile, outputPath, size, {
        padding: 0.1,
      })
    }

    // تولید آیکون‌های Maskable (با padding بیشتر)
    console.log('\n🎭 Generating maskable icons...')
    for (const size of [192, 512]) {
      const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}-maskable.png`)
      await generateIcon(CONFIG.inputFile, outputPath, size, {
        padding: 0.2,
        background: CONFIG.backgroundColor,
      })
    }
  } else {
    console.log(`\n⚠️ Logo file not found: ${CONFIG.inputFile}`)
    console.log('Generating placeholder icons with letter "ه"...')

    // تولید آیکون با حرف
    for (const size of ICON_SIZES) {
      const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`)
      await generateLetterIcon(outputPath, size, 'ه')
    }
  }

  // تولید آیکون‌های Shortcut
  console.log('\n⚡ Generating shortcut icons...')
  for (const { name, emoji } of SHORTCUT_ICONS) {
    const outputPath = path.join(CONFIG.outputDir, `${name}.png`)
    await generateEmojiIcon(outputPath, 96, emoji)
  }

  // تولید Favicon
  console.log('\n🔖 Generating favicon...')
  if (inputExists) {
    await generateIcon(
      CONFIG.inputFile,
      'public/favicon.ico',
      32,
      { padding: 0 }
    )
  } else {
    await generateLetterIcon('public/favicon.ico', 32, 'ه')
  }

  // تولید Apple Touch Icon
  console.log('\n🍎 Generating Apple Touch Icon...')
  const appleTouchPath = path.join(CONFIG.outputDir, 'apple-touch-icon.png')
  if (inputExists) {
    await generateIcon(CONFIG.inputFile, appleTouchPath, 180, {
      padding: 0.1,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
  } else {
    await generateLetterIcon(appleTouchPath, 180, 'ه')
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 All icons generated successfully!')
  console.log('\n📝 Next steps:')
  console.log('1. Add your logo to public/logo.png')
  console.log('2. Run this script again to generate custom icons')
  console.log('3. Update manifest.json if needed')
}

// ============================================
// اجرا
// ============================================

main().catch((error) => {
  console.error('💥 Error:', error)
  process.exit(1)
})

