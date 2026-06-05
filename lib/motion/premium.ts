/** انیمیشن‌های پریمیوم — الهام از Liquid Glass + editorial calm (DESIGN.md spacing) */

export const EASE_LUXURY = [0.16, 1, 0.3, 1] as const

export const DURATION = {
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
  ambient: 0.7,
} as const

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
}

export const slideFromRight = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
}

export function motionTransition(delay = 0) {
  return {
    duration: DURATION.base,
    ease: EASE_LUXURY,
    delay,
  }
}
