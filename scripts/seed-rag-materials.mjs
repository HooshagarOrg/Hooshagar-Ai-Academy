/**
 * Seed نمونه RAG برای ۲ مدرسه + محتوای سراسری
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-rag-materials.mjs
 *   node --env-file=.env.local scripts/seed-rag-materials.mjs --school-a=<uuid> --school-b=<uuid>
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleKey =
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_API_KEY_1 ||
  process.env.GEMINI_API_KEY_1

const DEFAULT_SCHOOL_A = 'ec37f0e3-f422-4429-989f-6fe63f8ff86e' // دبستان آزمایشی هوشاگر
const DEFAULT_SCHOOL_B = 'b6ddceb5-2ed7-46ed-b845-fea71c0fcb5b' // مدرسه تستی هوشاگر

function argValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : null
}

const schoolA = argValue('school-a') || DEFAULT_SCHOOL_A
const schoolB = argValue('school-b') || DEFAULT_SCHOOL_B

/** @type {Array<{title:string, content:string, grade:number, subject:string, school_id:string|null, tag:string}>} */
const MATERIALS = [
  // ── سراسری ──
  {
    tag: 'global',
    school_id: null,
    title: 'قواعد املای فارسی (سراسری)',
    grade: 6,
    subject: 'persian',
    content: `قواعد مهم املای فارسی برای همه مدارس:

1. همزه: سؤال، مسئول، رئیس
2. تشدید: معلّم، مکّه
3. ت و ط: در فارسی معمولاً «ت»؛ در عربی وام‌واژه «ط»
4. جمع: بی‌جان با «ها»، جاندار اغلب با «ان»

تمرین: هر کلمه را یک‌بار با املای درست بنویسید.`,
  },
  {
    tag: 'global',
    school_id: null,
    title: 'چرخه آب در طبیعت (سراسری)',
    grade: 7,
    subject: 'science',
    content: `چرخه آب: تبخیر → تعرق → تراکم → بارش → جریان.
این فرآیند حیات روی زمین را ممکن می‌کند و در همه کتاب‌های علوم مشترک است.`,
  },

  // ── مدرسه A ──
  {
    tag: 'school-a',
    school_id: schoolA,
    title: 'معادله درجه اول — ویژه دبستان آزمایشی',
    grade: 8,
    subject: 'math',
    content: `محتوای اختصاصی مدرسه «دبستان آزمایشی هوشاگر»:

معادله ax + b = 0
مثال مدرسه A: 3x + 9 = 0 → x = -3

نکته معلم این مدرسه: همیشه دو طرف معادله را با یک رنگ مشخص کنید.
کد داخلی جزوه: SCHOOL-A-MATH-8`,
  },
  {
    tag: 'school-a',
    school_id: schoolA,
    title: 'فتوسنتز — جزوه مدرسه A',
    grade: 8,
    subject: 'science',
    content: `جزوه اختصاصی مدرسه A درباره فتوسنتز:
6CO₂ + 6H₂O + نور → C₆H₁₂O₆ + 6O₂

آزمایش کلاس: برگ گیاه در تاریکی و روشنایی.
کد داخلی: SCHOOL-A-SCI-8`,
  },
  {
    tag: 'school-a',
    school_id: schoolA,
    title: 'انواع مثلث — مدرسه A',
    grade: 7,
    subject: 'math',
    content: `مثلث متساوی‌الاضلاع، متساوی‌الساقین، مختلف‌الاضلاع.
مجموع زوایا 180 درجه.
جزوه هندسه مدرسه A — کد: SCHOOL-A-GEO-7`,
  },

  // ── مدرسه B ──
  {
    tag: 'school-b',
    school_id: schoolB,
    title: 'معادله درجه اول — ویژه مدرسه تستی هوشاگر',
    grade: 8,
    subject: 'math',
    content: `محتوای اختصاصی «مدرسه تستی هوشاگر»:

معادله ax + b = 0
مثال مدرسه B: 5x - 20 = 0 → x = 4

نکته معلم این مدرسه: ابتدا عدد ثابت را جابه‌جا کنید.
کد داخلی جزوه: SCHOOL-B-MATH-8`,
  },
  {
    tag: 'school-b',
    school_id: schoolB,
    title: 'اعداد گویا — جزوه مدرسه B',
    grade: 9,
    subject: 'math',
    content: `اعداد گویا: قابل نوشتن به صورت a/b
نمونه مدرسه B: 0.75 = 3/4
کد داخلی: SCHOOL-B-MATH-9`,
  },
  {
    tag: 'school-b',
    school_id: schoolB,
    title: 'فتوسنتز — جزوه مدرسه B',
    grade: 8,
    subject: 'science',
    content: `جزوه اختصاصی مدرسه B:
کلروفیل نور را جذب می‌کند و اکسیژن آزاد می‌شود.
کد داخلی: SCHOOL-B-SCI-8`,
  },
]

const EMBEDDING_MODEL = 'gemini-embedding-001'
const EMBEDDING_DIM = 768

function l2Normalize(values) {
  let sumSq = 0
  for (const v of values) sumSq += v * v
  const norm = Math.sqrt(sumSq)
  if (!norm || !Number.isFinite(norm)) return values
  return values.map((v) => v / norm)
}

async function getEmbedding(text) {
  if (!googleKey) throw new Error('GOOGLE_API_KEY / GOOGLE_API_KEY_1 تنظیم نشده')

  const proxy =
    process.env.NEXT_PUBLIC_GEMINI_PROXY ||
    'https://generativelanguage.googleapis.com'

  const res = await fetch(
    `${proxy}/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${googleKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: text.slice(0, 8000) }] },
        outputDimensionality: EMBEDDING_DIM,
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding failed ${res.status}: ${body}`)
  }

  const data = await res.json()
  const values = data.embedding?.values
  if (!values?.length) throw new Error('Embedding خالی بود')
  if (values.length !== EMBEDDING_DIM) {
    throw new Error(`Embedding dim=${values.length}, expected ${EMBEDDING_DIM}`)
  }
  return l2Normalize(values)
}

async function main() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL یا SUPABASE_SERVICE_ROLE_KEY موجود نیست')
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  console.log('🏫 School A:', schoolA)
  console.log('🏫 School B:', schoolB)
  console.log(`📦 Seeding ${MATERIALS.length} materials...\n`)

  const results = []

  for (const m of MATERIALS) {
    process.stdout.write(`→ ${m.tag} | ${m.title} ... `)
    try {
      const embedding = await getEmbedding(`${m.title}\n\n${m.content}`)

      const { data, error } = await supabase
        .from('study_materials')
        .insert({
          title: m.title,
          content: m.content,
          grade: m.grade,
          subject: m.subject,
          school_id: m.school_id,
          embedding,
          is_active: true,
          metadata: {
            seeded: true,
            seed_tag: m.tag,
            seeded_at: new Date().toISOString(),
            embedding_model: EMBEDDING_MODEL,
            smoke_test_marker:
              m.school_id === schoolA
                ? 'SCHOOL-A'
                : m.school_id === schoolB
                  ? 'SCHOOL-B'
                  : 'GLOBAL',
          },
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      console.log(`OK (${data.id})`)
      results.push({ title: m.title, tag: m.tag, ok: true, id: data.id })
    } catch (err) {
      console.log(`FAIL`)
      console.error('  ', err.message || err)
      results.push({ title: m.title, tag: m.tag, ok: false, error: String(err.message || err) })
    }

    await new Promise((r) => setTimeout(r, 400))
  }

  const ok = results.filter((r) => r.ok).length
  console.log(`\n✅ Done: ${ok}/${results.length} ingested`)

  const { data: counts } = await supabase
    .from('study_materials')
    .select('school_id')

  const summary = { global: 0, a: 0, b: 0, other: 0 }
  for (const row of counts || []) {
    if (!row.school_id) summary.global++
    else if (row.school_id === schoolA) summary.a++
    else if (row.school_id === schoolB) summary.b++
    else summary.other++
  }

  console.log('📊 Counts now:', summary)

  if (ok < MATERIALS.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
