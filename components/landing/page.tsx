/**
 * لندینگ — هیرو سرورساید برای LCP؛ تزئینات کلاینت بعد از اسکرول
 */

import { AmbientVectors } from './ambient-vectors'
import { LandingBelowFoldGate, LandingChrome } from './landing-chrome'
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
      <LandingChrome />
      <div className="relative z-10">
        <LandingHero />
        <LandingBelowFoldGate />
      </div>
    </main>
  )
}
