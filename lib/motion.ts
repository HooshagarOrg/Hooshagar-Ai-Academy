/** Motion System — هوشاگر (زنده، آرام، سریع، غیرحواس‌پرت‌کن) */

export const MOTION_DURATION_MS = 220

export const MOTION_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

/** استاندارد CSS — معادل transition: all 220ms cubic-bezier(0.16, 1, 0.3, 1) */
export const MOTION_TRANSITION = `all ${MOTION_DURATION_MS}ms ${MOTION_EASE}`

/** برای استفاده در style یا framer-motion */
export const MOTION_TRANSITION_PROPS = {
  duration: MOTION_DURATION_MS / 1000,
  ease: [0.16, 1, 0.3, 1] as const,
}
