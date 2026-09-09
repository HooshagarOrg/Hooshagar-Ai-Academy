/**
 * لندینگ — هیرو سرورساید برای LCP؛ زیرِ فولد بعد از اسکرول
 */

import { AmbientVectors } from './ambient-vectors'
import { LandingNav } from './landing-nav'
import LandingHero from './hero'
import { LandingBelowFoldGate } from './landing-chrome'

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
        <LandingBelowFoldGate />
      </div>
    </main>
  )
}
