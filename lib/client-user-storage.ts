/**
 * کلید localStorage وابسته به کاربر — روی رایانهٔ مشترک مدرسه
 * تاریخچهٔ کاربر دیگر نباید دیده شود.
 */
export function userScopedStorageKey(base: string, userId: string): string {
  return `${base}:${userId}`
}

export function readUserScopedJson<T>(base: string, userId: string): T | null {
  if (typeof window === 'undefined' || !userId) return null
  try {
    const raw = localStorage.getItem(userScopedStorageKey(base, userId))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeUserScopedJson(base: string, userId: string, value: unknown): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    localStorage.setItem(userScopedStorageKey(base, userId), JSON.stringify(value))
  } catch {
    // quota
  }
}

export function clearUserScopedItem(base: string, userId: string): void {
  if (typeof window === 'undefined' || !userId) return
  try {
    localStorage.removeItem(userScopedStorageKey(base, userId))
    localStorage.removeItem(base)
  } catch {
    // ignore
  }
}
