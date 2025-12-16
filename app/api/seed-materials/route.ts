import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const openrouterKey = process.env.OPENROUTER_API_KEY!
const googleApiKey = process.env.GOOGLE_API_KEY

// محتوای نمونه
const sampleMaterials = [
  {
    title: 'حل معادلات درجه اول',
    content: `معادله درجه اول به شکل ax + b = 0 است که در آن a و b اعداد ثابت و x مجهول است.

برای حل معادله درجه اول:
1. ابتدا عبارت‌های حاوی x را به یک طرف و اعداد ثابت را به طرف دیگر ببرید
2. ضرایب x را با هم جمع کنید
3. طرفین را بر ضریب x تقسیم کنید

مثال: 2x + 6 = 10
- مرحله 1: 2x = 10 - 6
- مرحله 2: 2x = 4
- مرحله 3: x = 4 ÷ 2 = 2

نکته مهم: هر عملی که روی یک طرف معادله انجام می‌دهید، باید روی طرف دیگر هم انجام دهید.`,
    grade: 8,
    subject: 'math'
  },
  {
    title: 'چرخه آب در طبیعت',
    content: `چرخه آب یا چرخه هیدرولوژیکی فرآیندی است که آب در طبیعت طی می‌کند.

مراحل چرخه آب:
1. تبخیر: آب دریاها، رودخانه‌ها و اقیانوس‌ها با گرمای خورشید تبخیر می‌شود
2. تعرق: گیاهان هم آب را از برگ‌های خود تبخیر می‌کنند
3. تراکم: بخار آب در هوا سرد شده و به قطرات ریز تبدیل می‌شود و ابر تشکیل می‌دهد
4. بارش: قطرات آب در ابرها بزرگ شده و به صورت باران یا برف می‌بارند
5. جریان: آب باران به رودخانه‌ها، دریاچه‌ها و زیرزمین جریان می‌یابد

این چرخه مدام تکرار می‌شود و حیات روی زمین را ممکن می‌سازد.`,
    grade: 7,
    subject: 'science'
  },
  {
    title: 'قواعد املای فارسی',
    content: `قواعد مهم املای فارسی:

1. همزه (ء):
- همزه در آخر کلمه روی کرسی الف می‌نشیند: سؤال، مسئول
- همزه در وسط کلمه معمولاً با ی نوشته می‌شود: رئیس، هیئت

2. تشدید (ّ):
- وقتی حرفی دوبار تلفظ شود: معلّم، مکّه

3. ت و ط:
- در کلمات فارسی از "ت" استفاده می‌کنیم: تیر، تاب
- در کلمات عربی از "ط" استفاده می‌شود: طلا، طبیعت

4. ث، س، ص:
- هر سه صدای "س" می‌دهند اما املای متفاوت دارند
- ثروت، سلام، صبر

5. جمع با "ها" و "ان":
- برای بیجان: ها (کتاب‌ها، خانه‌ها)
- برای جاندار: ان (پرندگان، معلمان)`,
    grade: 6,
    subject: 'persian'
  },
  {
    title: 'اعداد گویا و حقیقی',
    content: `اعداد گویا (Rational Numbers):
عددی که بتوان آن را به صورت کسر a/b نوشت (b ≠ 0) عدد گویاست.
مثال: 1/2, 3/4, -5/7, 2 (که برابر 2/1 است)

ویژگی‌های اعداد گویا:
- تمام اعداد صحیح، گویا هستند
- اعشاری‌های متناهی گویا هستند (0.5 = 1/2)
- اعشاری‌های متناوب گویا هستند (0.333... = 1/3)

اعداد گنگ (Irrational Numbers):
اعدادی که نمی‌توان آنها را به صورت کسر نوشت.
مثال: √2, √3, π (پی)

اعداد حقیقی (Real Numbers):
مجموعه تمام اعداد گویا و گنگ را اعداد حقیقی می‌گویند.
روی محور اعداد، هر نقطه یک عدد حقیقی را نشان می‌دهد.`,
    grade: 9,
    subject: 'math'
  },
  {
    title: 'فتوسنتز در گیاهان',
    content: `فتوسنتز فرآیندی است که گیاهان با استفاده از نور خورشید، غذا می‌سازند.

معادله فتوسنتز:
آب + دی‌اکسید کربن + نور → گلوکز + اکسیژن
6H₂O + 6CO₂ + نور → C₆H₁₂O₆ + 6O₂

مراحل فتوسنتز:
1. جذب نور توسط کلروفیل (رنگیزه سبز) در برگ
2. جذب آب از ریشه و انتقال به برگ
3. جذب CO₂ از هوا توسط روزنه‌های برگ
4. تبدیل انرژی نوری به انرژی شیمیایی
5. تولید گلوکز (قند) و آزادسازی اکسیژن

اهمیت فتوسنتز:
- تولید اکسیژن برای تنفس موجودات
- تولید غذا برای گیاه و سایر موجودات
- جذب CO₂ و کاهش گازهای گلخانه‌ای`,
    grade: 8,
    subject: 'science'
  },
  {
    title: 'انواع مثلث‌ها',
    content: `مثلث شکلی هندسی با سه ضلع و سه زاویه است.

دسته‌بندی بر اساس اضلاع:

1. مثلث متساوی‌الاضلاع:
- هر سه ضلع برابرند
- هر سه زاویه 60 درجه است

2. مثلث متساوی‌الساقین:
- دو ضلع برابر دارد
- دو زاویه قاعده برابرند

3. مثلث مختلف‌الاضلاع:
- هر سه ضلع متفاوتند
- هر سه زاویه متفاوتند

دسته‌بندی بر اساس زوایا:

1. مثلث حاده:
- هر سه زاویه کمتر از 90 درجه

2. مثلث قائمه:
- یک زاویه 90 درجه دارد
- قضیه فیثاغورس: a² + b² = c²

3. مثلث منفرجه:
- یک زاویه بیشتر از 90 درجه

نکته: مجموع زوایای هر مثلث 180 درجه است.`,
    grade: 7,
    subject: 'math'
  }
]

// گرفتن embedding
async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    // اول با Google API
    if (googleApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data.embedding?.values || null
      }
    }

    // Fallback به OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/text-embedding-004',
        input: text
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.data?.[0]?.embedding || null
    }

    return null
  } catch (error) {
    console.error('Embedding error:', error)
    return null
  }
}

export async function GET() {
  try {
    console.log('🌱 Starting seed process...')

    const supabase = createClient(supabaseUrl, supabaseKey)

    // چک کنیم که قبلاً seed نشده باشد
    const { data: existing, error: checkError } = await supabase
      .from('study_materials')
      .select('id')
      .limit(1)

    if (checkError) {
      return NextResponse.json({ 
        error: 'خطا در اتصال به دیتابیس',
        details: checkError.message 
      }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        message: '⚠️ دیتابیس قبلاً seed شده است',
        count: existing.length
      })
    }

    const results = []

    for (const material of sampleMaterials) {
      console.log(`📝 Processing: ${material.title}`)

      // گرفتن embedding
      const embedding = await getEmbedding(material.title + ' ' + material.content)

      // ذخیره در دیتابیس
      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          title: material.title,
          content: material.content,
          grade: material.grade,
          subject: material.subject,
          embedding: embedding,
          metadata: {
            seeded: true,
            seeded_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error inserting ${material.title}:`, error)
        results.push({
          title: material.title,
          success: false,
          error: error.message
        })
      } else {
        console.log(`✅ Inserted: ${material.title}`)
        results.push({
          title: material.title,
          success: true,
          hasEmbedding: !!embedding,
          id: data?.id
        })
      }

      // کمی صبر کنیم تا rate limit نخوریم
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const successCount = results.filter(r => r.success).length
    const withEmbedding = results.filter(r => r.hasEmbedding).length

    return NextResponse.json({
      message: '✅ Seed completed!',
      total: sampleMaterials.length,
      success: successCount,
      withEmbedding,
      results
    })

  } catch (error: any) {
    console.error('❌ Seed error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}


























































