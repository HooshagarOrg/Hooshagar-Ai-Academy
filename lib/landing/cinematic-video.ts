/**
 * ویدیوی لندینگ نباید در SSR و اولین رندر کلاینت فرق داشته باشد.
 * useReducedMotion روی سرور null است و در HeadlessChrome اغلب true — همان hydration mismatch.
 */
export function shouldRenderCinematicVideo(
  hasMounted: boolean,
  reduceMotion: boolean | null | undefined,
): boolean {
  return hasMounted && reduceMotion !== true
}
