export function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return '***'
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}
