/**
 * پس‌زمینهٔ استاتیک ورود/مارکتینگ — بدون JS و بدون ویدیو روی first paint
 */

interface StaticCinematicBackdropProps {
  className?: string
}

export function StaticCinematicBackdrop({
  className = '',
}: StaticCinematicBackdropProps): JSX.Element {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(139,124,255,0.22), transparent 58%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(84,210,255,0.14), transparent 52%), radial-gradient(ellipse 55% 45% at 0% 80%, rgba(201,169,98,0.1), transparent 50%), var(--lux-void)',
        }}
      />
      <div className="lp-beam right-[12%] top-0 h-full opacity-50" />
      <div className="lp-beam left-[18%] top-0 h-full opacity-35" />
    </div>
  )
}
