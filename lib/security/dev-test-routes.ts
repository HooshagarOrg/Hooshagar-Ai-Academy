/**
 * صفحات /test-* فقط برای development هستند.
 */
export function shouldBlockDevTestPath(
  pathname: string,
  nodeEnv: string | undefined
): boolean {
  return nodeEnv === 'production' && pathname.startsWith('/test-')
}
