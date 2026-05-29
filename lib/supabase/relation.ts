/** Supabase nested relations may return object or array depending on cardinality. */
export function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? value[0] ?? null : value
}
