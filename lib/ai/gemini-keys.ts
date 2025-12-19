/**
 * مدیریت کلیدهای API Gemini
 * 
 * این ماژول مسئول خواندن و مدیریت 10 کلید API Gemini
 * برای Load Balancing و جلوگیری از Rate Limiting است.
 */

/**
 * خواندن تمام کلیدهای Gemini از environment variables
 * 
 * @returns آرایه‌ای از کلیدهای معتبر (حداکثر 10 تا)
 */
export function loadGeminiApiKeys(): string[] {
  const keys: string[] = []
  
  // تلاش برای خواندن 10 کلید
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GOOGLE_API_KEY_${i}`]
    if (key && key.trim() !== '' && !key.includes('your-key')) {
      keys.push(key.trim())
    }
  }
  
  // Fallback: اگر کلیدی با شماره پیدا نشد، کلید قدیمی را چک کن
  if (keys.length === 0) {
    const legacyKey = process.env.GOOGLE_API_KEY
    if (legacyKey && legacyKey.trim() !== '' && !legacyKey.includes('your-key')) {
      keys.push(legacyKey.trim())
      console.warn('⚠️ از GOOGLE_API_KEY قدیمی استفاده می‌شود. برای Load Balancing، 10 کلید GOOGLE_API_KEY_1 تا GOOGLE_API_KEY_10 تنظیم کنید.')
    }
  }
  
  if (keys.length === 0) {
    console.warn('⚠️ هیچ کلید Gemini معتبری پیدا نشد!')
  } else {
    console.log(`✅ ${keys.length} کلید Gemini بارگذاری شد`)
  }
  
  return keys
}

/**
 * چک کردن صحت یک کلید API Gemini
 * 
 * @param apiKey کلید API برای چک کردن
 * @returns true اگر کلید معتبر باشد
 */
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
    return response.ok
  } catch (error) {
    console.error('خطا در اعتبارسنجی کلید Gemini:', error)
    return false
  }
}

/**
 * چک کردن صحت تمام کلیدها و برگرداندن کلیدهای معتبر
 * 
 * @returns آرایه‌ای از کلیدهای معتبر
 */
export async function validateAllGeminiKeys(): Promise<string[]> {
  const keys = loadGeminiApiKeys()
  const validKeys: string[] = []
  
  console.log(`🔍 در حال بررسی ${keys.length} کلید Gemini...`)
  
  for (let i = 0; i < keys.length; i++) {
    const isValid = await validateGeminiKey(keys[i])
    if (isValid) {
      validKeys.push(keys[i])
      console.log(`✅ کلید ${i + 1} معتبر است`)
    } else {
      console.warn(`❌ کلید ${i + 1} نامعتبر است`)
    }
  }
  
  console.log(`✅ ${validKeys.length} از ${keys.length} کلید معتبر هستند`)
  
  return validKeys
}

/**
 * آمار استفاده از کلیدها
 */
interface KeyUsageStats {
  keyIndex: number
  requestCount: number
  successCount: number
  errorCount: number
  lastUsed: Date
}

const keyUsageStats = new Map<number, KeyUsageStats>()

/**
 * ثبت استفاده از یک کلید
 */
export function recordKeyUsage(keyIndex: number, success: boolean) {
  const stats = keyUsageStats.get(keyIndex) || {
    keyIndex,
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    lastUsed: new Date()
  }
  
  stats.requestCount++
  if (success) {
    stats.successCount++
  } else {
    stats.errorCount++
  }
  stats.lastUsed = new Date()
  
  keyUsageStats.set(keyIndex, stats)
}

/**
 * دریافت آمار استفاده از کلیدها
 */
export function getKeyUsageStats(): KeyUsageStats[] {
  return Array.from(keyUsageStats.values())
}

/**
 * ریست کردن آمار
 */
export function resetKeyUsageStats() {
  keyUsageStats.clear()
}

