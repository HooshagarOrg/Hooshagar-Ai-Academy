/**
 * لندینگ — هیرو سرورساید برای LCP؛ بدون کامپوننت کلاینت و بدون RSC زیرِ فولد
 */

import { AmbientVectors } from './ambient-vectors'
import { LandingNav } from './landing-nav'
import LandingHero from './hero'

export default function LandingPage(): JSX.Element {
  return (
    <main
      id="main-content"
      className="lp-noise lp-aurora relative overflow-hidden"
      dir="rtl"
      style={{ background: 'var(--lux-void)' }}
    >
      <AmbientVectors />
      <LandingNav />
      <div className="relative z-10">
        <LandingHero />
        <div id="lp-below-host" className="min-h-[70vh]" />
      </div>
    </main>
  )
}
