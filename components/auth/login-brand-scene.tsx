/**
 * صحنهٔ بصری پنل ورود — فقط CSS، بدون تصویر سنگین
 */

export function LoginBrandScene(): JSX.Element {
  return (
    <div className="lp-login-scene" aria-hidden="true">
      <div className="lp-login-scene-orb lp-login-scene-orb--a" />
      <div className="lp-login-scene-orb lp-login-scene-orb--b" />
      <div className="lp-login-scene-orb lp-login-scene-orb--c" />
      <div className="lp-login-scene-ring" />
      <div className="lp-login-scene-chip lp-login-scene-chip--1">مدرسه</div>
      <div className="lp-login-scene-chip lp-login-scene-chip--2">والدین</div>
      <div className="lp-login-scene-chip lp-login-scene-chip--3">دانش‌آموز</div>
      <div className="lp-login-scene-chip lp-login-scene-chip--4">کارکنان</div>
    </div>
  )
}
