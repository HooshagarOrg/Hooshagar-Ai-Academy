/** کد ملی ایرانی با رقم کنترل معتبر */
export function iranNationalCodeFromBase9(base9: string): string {
  const base = base9.replace(/\D/g, '').padStart(9, '0').slice(0, 9)
  let sum = 0
  for (let i = 0; i < 9; i += 1) {
    sum += Number(base[i]) * (10 - i)
  }
  const remainder = sum % 11
  const check = remainder < 2 ? remainder : 11 - remainder
  return `${base}${check}`
}

export function uniqueIranNationalCode(salt = 0): string {
  const rand = Math.floor(Math.random() * 80_000_000)
  const n = 10_000_000 + ((rand + salt * 97) % 80_000_000)
  return iranNationalCodeFromBase9(String(n).padStart(9, '0'))
}
