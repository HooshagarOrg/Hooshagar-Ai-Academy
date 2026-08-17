import { VIRTUAL_CLASS_IMPORT_HEADERS } from '@/lib/virtual-class/import-spreadsheet'

/** نمونهٔ دبستان تالش — شناسهٔ اتاق را از نوار آدرس پنل اسکای‌روم کامل کنید */
export const VIRTUAL_CLASS_SAMPLE_ROWS: string[][] = [
  ['1', 'اول خانم کرد', 'کلاس اول خانم کرد', '182457', 'kord', 'https://skyroom.online/ch/omidan/kord'],
  ['1', 'اول خانم لشکربلوکی', 'کلاس اول خانم لشکربلوکی', '', 'lashkarbolouki', 'https://skyroom.online/ch/omidan/lashkarbolouki'],
  ['1', 'اول خانم ابراهیمی', 'کلاس اول خانم ابراهیمی', '', 'ebrahimi', 'https://skyroom.online/ch/omidan/ebrahimi'],
  ['1', 'اول خانم رادحسینی', 'کلاس اول خانم رادحسینی', '', 'radhosseini', 'https://skyroom.online/ch/omidan/radhosseini'],
  ['2', 'دوم خانم هزارجریبی', 'کلاس دوم خانم هزارجریبی', '', 'hezargaribi', 'https://skyroom.online/ch/omidan/hezargaribi'],
  ['2', 'دوم خانم ناصری', 'کلاس دوم خانم ناصری', '', 'nasery', 'https://skyroom.online/ch/omidan/nasery'],
  ['2', 'دوم خانم ثروتی', 'کلاس دوم خانم ثروتی', '', 'servati', 'https://skyroom.online/ch/omidan/servati'],
  ['2', 'دوم خانم مهرداد', 'کلاس دوم خانم مهرداد', '', 'mehrdad', 'https://skyroom.online/ch/omidan/mehrdad'],
  ['3', 'سوم خانم باقری', 'کلاس سوم خانم باقری', '', 'bagheri', 'https://skyroom.online/ch/omidan/bagheri'],
  ['3', 'سوم خانم بنی‌عامری', 'کلاس سوم خانم بنی‌عامری', '', 'baniameri', 'https://skyroom.online/ch/omidan/baniameri'],
  ['3', 'سوم خانم ذبیحی', 'کلاس سوم خانم ذبیحی', '', 'zabihi', 'https://skyroom.online/ch/omidan/zabihi'],
  ['4', 'چهارم خانم آلوستانی', 'کلاس چهارم خانم آلوستانی', '', 'aloostani', 'https://skyroom.online/ch/omidan/aloostani'],
  ['4', 'چهارم خانم عباسی', 'کلاس چهارم خانم عباسی', '', 'abbasi', 'https://skyroom.online/ch/omidan/abbasi'],
  ['4', 'چهارم خانم یزدانی', 'کلاس چهارم خانم یزدانی', '', 'yazdani', 'https://skyroom.online/ch/omidan/yazdani'],
  ['5', 'پنجم خانم مصلحی', 'کلاس پنجم خانم مصلحی', '', 'moslehi', 'https://skyroom.online/ch/omidan/moslehi'],
  ['5', 'پنجم خانم بنی‌هاشم', 'کلاس پنجم خانم بنی‌هاشم', '', 'banihashem', 'https://skyroom.online/ch/omidan/banihashem'],
  ['5', 'پنجم خانم نسیمی', 'کلاس پنجم خانم نسیمی', '', 'nasimi', 'https://skyroom.online/ch/omidan/nasimi'],
  ['6', 'ششم آقای فخرالدین', 'کلاس ششم آقای فخرالدین', '', 'fakhreddin', 'https://skyroom.online/ch/omidan/fakhreddin'],
  ['6', 'ششم خانم نجفی', 'کلاس ششم خانم نجفی', '', 'najafy', 'https://skyroom.online/ch/omidan/najafy'],
  ['6', 'ششم خانم پورجعفر', 'کلاس ششم خانم پورجعفر', '', 'poorjafaar', 'https://skyroom.online/ch/omidan/poorjafaar'],
  ['7', 'هفتم الف', 'کلاس هفتم الف', '', '', ''],
  ['8', 'هشتم الف', 'کلاس هشتم الف', '', '', ''],
  ['9', 'نهم الف', 'کلاس نهم الف', '', '', ''],
  ['10', 'دهم الف', 'کلاس دهم الف', '', '', ''],
  ['11', 'یازدهم الف', 'کلاس یازدهم الف', '', '', ''],
  ['12', 'دوازدهم الف', 'کلاس دوازدهم الف', '', '', ''],
]

const GUIDE_ROWS: string[][] = [
  ['ستون', 'اجباری', 'توضیح'],
  ['پایه', 'بله', 'عدد ۱ تا ۱۲ یا فارسی: اول تا دوازدهم'],
  ['کلاس', 'بله', 'باید دقیقاً با نام کلاس در هوشاگر یکی باشد (واردسازی دانش‌آموزان)'],
  ['عنوان', 'خیر', 'عنوان نمایشی در داشبورد؛ اگر خالی باشد از نام کلاس ساخته می‌شود'],
  ['شناسه_اتاق', 'اگر نام لاتین خالی باشد', 'عدد نوار آدرس پنل: skyroom.online/panel/channel/182457/edit → 182457'],
  ['نام_لاتین_اتاق', 'اگر شناسه خالی باشد', 'انتهای لینک عمومی: …/ch/omidan/kord → kord'],
  ['لینک_اتاق', 'خیر', 'فقط برای یادداشت؛ اگر نام لاتین خالی باشد از انتهای لینک برداشته می‌شود'],
  ['', '', ''],
  ['نکته', '', 'یوزر و پسورد اسکای‌روم را در این فایل نگذارید؛ ورود از داخل هوشاگر است.'],
  ['نکته', '', 'اتاق‌های مشاور/ورزش/هنر/قرآن کلاس درسی جدا نیستند و در این شیت نیستند.'],
  ['نکته', '', 'اگر شناسه خالی باشد، سرور اتاق را با نام لاتین از API اسکای‌روم پیدا می‌کند.'],
]

export async function buildVirtualClassTemplateXlsx(): Promise<Buffer> {
  const { utils, write } = await import('xlsx')
  const wb = utils.book_new()
  const dataSheet = utils.aoa_to_sheet([
    [...VIRTUAL_CLASS_IMPORT_HEADERS],
    ...VIRTUAL_CLASS_SAMPLE_ROWS,
  ])
  dataSheet['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 32 },
    { wch: 14 },
    { wch: 18 },
    { wch: 48 },
  ]
  utils.book_append_sheet(wb, dataSheet, 'کلاس‌های مجازی')
  const guideSheet = utils.aoa_to_sheet(GUIDE_ROWS)
  guideSheet['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 80 }]
  utils.book_append_sheet(wb, guideSheet, 'راهنما')
  return write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
