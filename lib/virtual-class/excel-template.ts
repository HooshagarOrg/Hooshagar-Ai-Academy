import { VIRTUAL_CLASS_IMPORT_HEADERS } from '@/lib/virtual-class/import-map'

/** نمونهٔ دبستان تالش — شناسهٔ اتاق را از نوار آدرس پنل اسکای‌روم کامل کنید */
export const VIRTUAL_CLASS_SAMPLE_ROWS: string[][] = [
  ['1', 'خانم کرد', 'کلاس اول خانم کرد', '182457', 'kord', 'https://skyroom.online/ch/omidan/kord'],
  ['1', 'خانم لشکربلوکی', 'کلاس اول خانم لشکربلوکی', '182440', 'lashkarbolouki', 'https://skyroom.online/ch/omidan/lashkarbolouki'],
  ['1', 'خانم ابراهیمی', 'کلاس اول خانم ابراهیمی', '182450', 'ebrahimi', 'https://skyroom.online/ch/omidan/ebrahimi'],
  ['1', 'خانم راد حسینی', 'کلاس اول خانم راد حسینی', '182454', 'radhosseini', 'https://skyroom.online/ch/omidan/radhosseini'],
  ['2', 'خانم هزارجریبی', 'کلاس دوم خانم هزارجریبی', '181524', 'hezargaribi', 'https://skyroom.online/ch/omidan/hezargaribi'],
  ['2', 'خانم ناصری', 'کلاس دوم خانم ناصری', '182517', 'nasery', 'https://skyroom.online/ch/omidan/nasery'],
  ['2', 'خانم ثروتی', 'کلاس دوم خانم ثروتی', '617564', 'servati', 'https://skyroom.online/ch/omidan/servati'],
  ['2', 'خانم مهرداد', 'کلاس دوم خانم مهرداد', '182513', 'mehrdad', 'https://skyroom.online/ch/omidan/mehrdad'],
  ['3', 'خانم باقری', 'کلاس سوم خانم باقری', '120533', 'bagheri', 'https://skyroom.online/ch/omidan/bagheri'],
  ['3', 'خانم بنی عامری', 'کلاس سوم خانم بنی عامری', '120535', 'baniameri', 'https://skyroom.online/ch/omidan/baniameri'],
  ['3', 'خانم ذبیحی', 'کلاس سوم خانم ذبیحی', '120530', 'zabihi', 'https://skyroom.online/ch/omidan/zabihi'],
  ['4', 'خانم آلوستانی', 'کلاس چهارم خانم آلوستانی', '120527', 'aloostani', 'https://skyroom.online/ch/omidan/aloostani'],
  ['4', 'خانم عباسی', 'کلاس چهارم خانم عباسی', '120521', 'abbasi', 'https://skyroom.online/ch/omidan/abbasi'],
  ['4', 'خانم یزدانی', 'کلاس چهارم خانم یزدانی', '120524', 'yazdani', 'https://skyroom.online/ch/omidan/yazdani'],
  ['5', 'خانم مصلحی', 'کلاس پنجم خانم مصلحی', '120516', 'moslehi', 'https://skyroom.online/ch/omidan/moslehi'],
  ['5', 'خانم بنی هاشمی', 'کلاس پنجم خانم بنی هاشمی', '120513', 'banihashem', 'https://skyroom.online/ch/omidan/banihashem'],
  ['5', 'خانم نسیمی', 'کلاس پنجم خانم نسیمی', '123147', 'nasimi', 'https://skyroom.online/ch/omidan/nasimi'],
  ['6', 'آقای فخرالدین', 'کلاس ششم آقای فخرالدین', '120505', 'fakhreddin', 'https://skyroom.online/ch/omidan/fakhreddin'],
  ['6', 'خانم نجفی', 'کلاس ششم خانم نجفی', '120510', 'najafy', 'https://skyroom.online/ch/omidan/najafy'],
  ['6', 'خانم پورجعفر', 'کلاس ششم خانم پورجعفر', '503908', 'poorjafaar', 'https://skyroom.online/ch/omidan/poorjafaar'],
  ['7', 'هفتم الف', 'کلاس هفتم الف', '', '', ''],
  ['8', 'هشتم الف', 'کلاس هشتم الف', '', '', ''],
  ['9', 'نهم الف', 'کلاس نهم الف', '', '', ''],
  ['10', 'دهم الف', 'کلاس دهم الف', '', '', ''],
  ['11', 'یازدهم الف', 'کلاس یازدهم الف', '', '', ''],
  ['12', 'دوازدهم الف', 'کلاس دوازدهم الف', '', '', ''],
]

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => {
        const value = cell ?? ''
        if (/[",\n]/.test(value)) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    .join('\n')
}

export async function buildVirtualClassTemplateXlsx(): Promise<Buffer> {
  const csv = toCsv([[...VIRTUAL_CLASS_IMPORT_HEADERS], ...VIRTUAL_CLASS_SAMPLE_ROWS])
  return Buffer.from(`\uFEFF${csv}\n`, 'utf8')
}
