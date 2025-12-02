/**
 * =====================================================
 * اسکریپت تولید آیکون‌های PWA
 * =====================================================
 * 
 * این اسکریپت از یک تصویر لوگو، آیکون‌های PWA در سایزهای مختلف تولید می‌کند.
 * 
 * استفاده:
 *   1. فایل لوگوی اصلی را در public/logo.png قرار دهید
 *   2. اجرا کنید: node scripts/generate-icons.js
 * 
 * یا با npm:
 *   npm run generate-icons
 * 
 * پیش‌نیازها:
 *   npm install sharp --save-dev
 */

const fs = require('fs')
const path = require('path')

// =====================================================
// تنظیمات
// =====================================================

const CONFIG = {
  // فایل لوگوی اصلی (حداقل 512x512 پیکسل)
  inputFile: path.join(__dirname, '../public/logo.png'),
  
  // پوشه خروجی
  outputDir: path.join(__dirname, '../public/icons'),
  
  // سایزهای آیکون PWA
  sizes: [72, 96, 128, 144, 152, 192, 384, 512],
  
  // سایزهای Shortcut
  shortcutSizes: [96],
  
  // رنگ پس‌زمینه (برای آیکون‌های بدون شفافیت)
  backgroundColor: { r: 255, g: 255, b: 255, alpha: 0 },
  
  // آیا آیکون‌های maskable جداگانه ساخته شوند
  generateMaskable: true,
  
  // آیا favicon هم تولید شود
  generateFavicon: true,
}

// =====================================================
// تابع اصلی
// =====================================================

async function generateIcons() {
  console.log('🎨 شروع تولید آیکون‌های PWA...\n')
  
  // بررسی sharp
  let sharp
  try {
    sharp = require('sharp')
  } catch (error) {
    console.error('❌ کتابخانه sharp نصب نیست!')
    console.log('   نصب کنید: npm install sharp --save-dev')
    process.exit(1)
  }
  
  // بررسی فایل ورودی
  if (!fs.existsSync(CONFIG.inputFile)) {
    console.error(`❌ فایل لوگو پیدا نشد: ${CONFIG.inputFile}`)
    console.log('   یک فایل logo.png (حداقل 512x512) در پوشه public قرار دهید.')
    
    // ساخت یک لوگوی پیش‌فرض ساده
    console.log('\n📝 در حال ساخت لوگوی پیش‌فرض...')
    await createDefaultLogo(sharp)
  }
  
  // ایجاد پوشه خروجی
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true })
    console.log(`📁 پوشه ایجاد شد: ${CONFIG.outputDir}`)
  }
  
  // تولید آیکون‌ها
  console.log('\n📱 تولید آیکون‌های PWA:')
  
  for (const size of CONFIG.sizes) {
    const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}.png`)
    
    await sharp(CONFIG.inputFile)
      .resize(size, size, {
        fit: 'contain',
        background: CONFIG.backgroundColor,
      })
      .png()
      .toFile(outputPath)
    
    console.log(`   ✅ icon-${size}x${size}.png`)
  }
  
  // تولید آیکون‌های Maskable (با padding)
  if (CONFIG.generateMaskable) {
    console.log('\n🎭 تولید آیکون‌های Maskable:')
    
    for (const size of CONFIG.sizes) {
      const outputPath = path.join(CONFIG.outputDir, `icon-${size}x${size}-maskable.png`)
      const innerSize = Math.floor(size * 0.8) // 80% از سایز اصلی
      const padding = Math.floor((size - innerSize) / 2)
      
      // ایجاد تصویر با padding
      const resizedImage = await sharp(CONFIG.inputFile)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: CONFIG.backgroundColor,
        })
        .toBuffer()
      
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 59, g: 130, b: 246, alpha: 1 }, // آبی هوشاگر
        },
      })
        .composite([
          {
            input: resizedImage,
            top: padding,
            left: padding,
          },
        ])
        .png()
        .toFile(outputPath)
      
      console.log(`   ✅ icon-${size}x${size}-maskable.png`)
    }
  }
  
  // تولید آیکون‌های Shortcut
  console.log('\n🔗 تولید آیکون‌های Shortcut:')
  
  const shortcuts = [
    { name: 'dashboard', icon: '📊' },
    { name: 'messages', icon: '💬' },
    { name: 'reports', icon: '📈' },
  ]
  
  for (const shortcut of shortcuts) {
    for (const size of CONFIG.shortcutSizes) {
      const outputPath = path.join(CONFIG.outputDir, `shortcut-${shortcut.name}.png`)
      
      // برای حالا فقط کپی از لوگوی اصلی
      await sharp(CONFIG.inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: CONFIG.backgroundColor,
        })
        .png()
        .toFile(outputPath)
      
      console.log(`   ✅ shortcut-${shortcut.name}.png`)
    }
  }
  
  // تولید Badge (برای نوتیفیکیشن)
  console.log('\n🔔 تولید Badge:')
  
  const badgePath = path.join(CONFIG.outputDir, 'badge-72x72.png')
  await sharp(CONFIG.inputFile)
    .resize(72, 72, {
      fit: 'contain',
      background: CONFIG.backgroundColor,
    })
    .png()
    .toFile(badgePath)
  
  console.log('   ✅ badge-72x72.png')
  
  // تولید Favicon
  if (CONFIG.generateFavicon) {
    console.log('\n🌐 تولید Favicon:')
    
    // favicon.ico (32x32)
    const faviconPath = path.join(__dirname, '../public/favicon.ico')
    await sharp(CONFIG.inputFile)
      .resize(32, 32, {
        fit: 'contain',
        background: CONFIG.backgroundColor,
      })
      .png()
      .toFile(faviconPath)
    
    console.log('   ✅ favicon.ico')
    
    // apple-touch-icon (180x180)
    const appleTouchIconPath = path.join(__dirname, '../public/apple-touch-icon.png')
    await sharp(CONFIG.inputFile)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(appleTouchIconPath)
    
    console.log('   ✅ apple-touch-icon.png')
  }
  
  console.log('\n🎉 تمام آیکون‌ها با موفقیت تولید شدند!')
  console.log(`   پوشه: ${CONFIG.outputDir}`)
}

// =====================================================
// ساخت لوگوی پیش‌فرض
// =====================================================

async function createDefaultLogo(sharp) {
  const size = 512
  const logoPath = CONFIG.inputFile
  
  // ایجاد یک لوگوی ساده با حرف "ه" (هوشاگر)
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6"/>
          <stop offset="100%" style="stop-color:#8b5cf6"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="100" fill="url(#bg)"/>
      <text 
        x="50%" 
        y="55%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        font-family="Tahoma, Arial, sans-serif" 
        font-size="280" 
        font-weight="bold" 
        fill="white"
      >ه</text>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(logoPath)
  
  console.log(`   ✅ لوگوی پیش‌فرض ایجاد شد: ${logoPath}`)
}

// =====================================================
// اجرا
// =====================================================

generateIcons().catch((error) => {
  console.error('❌ خطا:', error)
  process.exit(1)
})







