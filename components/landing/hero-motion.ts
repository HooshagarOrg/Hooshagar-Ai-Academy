import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function runHeroMotion(section: HTMLElement): () => void {
  const tween = gsap.to('[data-hero-content]', {
    opacity: 0,
    y: -90,
    scale: 0.96,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '75% top',
      scrub: 0.5,
    },
  })
  return () => {
    tween.kill()
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.trigger === section) trigger.kill()
    })
  }
}
