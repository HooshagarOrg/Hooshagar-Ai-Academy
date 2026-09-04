import { shouldRenderCinematicVideo } from '@/lib/landing/cinematic-video'

describe('shouldRenderCinematicVideo', () => {
  it('keeps SSR and first client paint identical (no video)', () => {
    expect(shouldRenderCinematicVideo(false, null)).toBe(false)
    expect(shouldRenderCinematicVideo(false, false)).toBe(false)
    expect(shouldRenderCinematicVideo(false, true)).toBe(false)
  })

  it('shows video only after mount when motion is allowed', () => {
    expect(shouldRenderCinematicVideo(true, false)).toBe(true)
    expect(shouldRenderCinematicVideo(true, null)).toBe(true)
  })

  it('hides video after mount when the user prefers reduced motion', () => {
    expect(shouldRenderCinematicVideo(true, true)).toBe(false)
  })
})
