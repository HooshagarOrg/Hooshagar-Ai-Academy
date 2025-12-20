#!/usr/bin/env tsx
/**
 * اسکریپت راه‌اندازی کلیدهای Gemini در database
 * 
 * این اسکریپت کلیدهای Gemini را از environment variables می‌خواند
 * و در جدول ai_general_settings ذخیره می‌کند.
 * 
 * استفاده:
 * npm run setup-gemini-keys
 * یا
 * npx tsx scripts/setup-gemini-keys.ts
 */

import { createClient } from '@supabase/supabase-js'
import { loadGeminiApiKeys, validateAllGeminiKeys } from '../lib/ai/gemini-keys'
import * as dotenv from 'dotenv'

// بارگذاری environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY تنظیم نشده است')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupGeminiKeys() {
  console.log('🚀 شروع راه‌اندازی کلیدهای Gemini...\n')
  
  // 1. خواندن کلیدها از env
  console.log('📖 خواندن کلیدهای Gemini از environment variables...')
  const keys = loadGeminiApiKeys()
  
  if (keys.length === 0) {
    console.error('❌ هیچ کلید Gemini معتبری پیدا نشد!')
    console.log('\n💡 راهنما:')
    console.log('   در فایل .env.local کلیدهای زیر را تنظیم کنید:')
    console.log('   GOOGLE_API_KEY_1=AIzaSy...')
    console.log('   GOOGLE_API_KEY_2=AIzaSy...')
    console.log('   ...')
    console.log('   GOOGLE_API_KEY_10=AIzaSy...')
    process.exit(1)
  }
  
  console.log(`✅ ${keys.length} کلید خوانده شد\n`)
  
  // 2. اعتبارسنجی کلیدها (اختیاری - ممکن است زمان‌بر باشد)
  console.log('🔍 آیا می‌خواهید کلیدها را اعتبارسنجی کنید؟ (y/n)')
  console.log('   (این فرآیند ممکن است چند ثانیه طول بکشد)')
  
  // برای سادگی، فرض می‌کنیم کاربر y را وارد کرده
  const shouldValidate = process.env.VALIDATE_KEYS === 'true'
  
  let validKeys = keys
  if (shouldValidate) {
    console.log('\n⏳ در حال اعتبارسنجی کلیدها...')
    validKeys = await validateAllGeminiKeys()
    
    if (validKeys.length === 0) {
      console.error('❌ هیچ کلید معتبری پیدا نشد!')
      process.exit(1)
    }
    
    if (validKeys.length < keys.length) {
      console.warn(`⚠️ فقط ${validKeys.length} از ${keys.length} کلید معتبر هستند`)
    }
  } else {
    console.log('⏭️ اعتبارسنجی رد شد (برای فعال‌سازی: VALIDATE_KEYS=true)\n')
  }
  
  // 3. ذخیره در database
  console.log('💾 ذخیره کلیدها در database...')
  
  // دریافت تنظیمات فعلی
  const { data: existingSettings } = await supabase
    .from('ai_general_settings')
    .select('*')
    .limit(1)
    .single()
  
  if (existingSettings) {
    // بروزرسانی
    const { error } = await supabase
      .from('ai_general_settings')
      .update({
        gemini_api_keys: validKeys,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings.id)
    
    if (error) {
      console.error('❌ خطا در بروزرسانی:', error.message)
      process.exit(1)
    }
    
    console.log('✅ کلیدها با موفقیت بروزرسانی شدند')
  } else {
    console.error('❌ تنظیمات AI در database یافت نشد')
    console.log('💡 ابتدا migration 044_ai_6_tier_system.sql را اجرا کنید')
    process.exit(1)
  }
  
  // 4. نمایش خلاصه
  console.log('\n✅ راه‌اندازی با موفقیت انجام شد!\n')
  console.log('📊 خلاصه:')
  console.log(`   - تعداد کلیدهای ذخیره شده: ${validKeys.length}`)
  console.log(`   - Load Balancing: فعال (Round-Robin)`)
  console.log(`   - ظرفیت تخمینی: ${validKeys.length * 15} درخواست در دقیقه`)
  console.log('\n💡 نکات:')
  console.log('   - هر کلید Gemini: 15 RPM رایگان')
  console.log(`   - مجموع ظرفیت شما: ${validKeys.length * 15 * 60 * 24} درخواست در روز`)
  console.log('   - برای بررسی وضعیت: Admin Panel > AI System')
  console.log('\n')
}

// اجرا
setupGeminiKeys().catch(error => {
  console.error('❌ خطای غیرمنتظره:', error)
  process.exit(1)
})




