/**
 * صفحه‌بندی PostgREST — سقف پیش‌فرض ۱۰۰۰ ردیف در هر پاسخ.
 * تنها منبع حلقهٔ «همهٔ صفحات» تا لیست ادمین با ۱۲۰۰ دانش‌آموز ناقص نشود.
 */

export const POSTGREST_PAGE_SIZE = 1000

const MAX_PAGES = 50

interface PageResult<T> {
  data: T[] | null
  error: { message: string } | null
}

export function parseListPage(
  searchParams: URLSearchParams,
  defaults?: { limit?: number; max?: number }
): { limit: number; offset: number } {
  const max = defaults?.max ?? POSTGREST_PAGE_SIZE
  const fallback = defaults?.limit ?? 50
  const rawLimit = parseInt(searchParams.get('limit') || String(fallback), 10)
  const rawOffset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : fallback, 1), max)
  const offset = Math.max(Number.isFinite(rawOffset) ? rawOffset : 0, 0)
  return { limit, offset }
}

export async function fetchAllPaged<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * POSTGREST_PAGE_SIZE
    const to = from + POSTGREST_PAGE_SIZE - 1
    const { data, error } = await fetchPage(from, to)
    if (error) {
      return { data: rows, error: error.message }
    }
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < POSTGREST_PAGE_SIZE) {
      break
    }
  }
  return { data: rows, error: null }
}
