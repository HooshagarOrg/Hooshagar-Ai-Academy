/**
 * میدان پلاسما/گرید — fallback Canvas 2D برای ScholarPlasmaShader
 * رنگ‌ها هماهنگ با Scholar Blue / Knowledge Universe
 */

function pseudoRandom(t: number) {
  return (Math.cos(t) + Math.cos(t * 1.3 + 1.3) + Math.cos(t * 1.4 + 1.4)) / 3
}

export function drawScholarPlasmaField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time = 0,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const w = width / dpr
  const h = height / dpr

  ctx.clearRect(0, 0, w, h)

  // گرادیان پس‌زمینه (معادل bgColor1/bgColor2 شیدر — با پالت هوشاگر)
  const bg = ctx.createLinearGradient(0, 0, w, 0)
  bg.addColorStop(0, 'rgba(5, 7, 13, 0.92)')
  bg.addColorStop(0.45, 'rgba(15, 23, 42, 0.88)')
  bg.addColorStop(1, 'rgba(30, 27, 75, 0.85)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // هاله مرکزی AI
  const aura = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.min(w, h) * 0.55)
  aura.addColorStop(0, 'rgba(59, 130, 246, 0.14)')
  aura.addColorStop(0.5, 'rgba(99, 102, 241, 0.06)')
  aura.addColorStop(1, 'transparent')
  ctx.fillStyle = aura
  ctx.fillRect(0, 0, w, h)

  const scale = 4.2
  const linesPerGroup = 14
  const frozenTime = time

  // گرید آکادمیک (drawGrid شیدر)
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.06)'
  ctx.lineWidth = 0.5
  const gridStep = w / 24
  for (let gx = 0; gx < w; gx += gridStep) {
    ctx.beginPath()
    ctx.moveTo(gx, 0)
    ctx.lineTo(gx, h)
    ctx.stroke()
  }
  const gridStepY = h / 16
  for (let gy = 0; gy < h; gy += gridStepY) {
    ctx.beginPath()
    ctx.moveTo(0, gy)
    ctx.lineTo(w, gy)
    ctx.stroke()
  }

  // خطوط پلاسما — فریز در زمان ثابت
  for (let l = 0; l < linesPerGroup; l++) {
    const normalizedLineIndex = l / linesPerGroup
    const offsetPosition = l
    const rand =
      pseudoRandom(offsetPosition + frozenTime) * 0.5 + 0.5
    const lineColor = `rgba(${Math.round(99 + rand * 40)}, ${Math.round(130 + rand * 30)}, ${Math.round(246 - rand * 20)}, ${0.06 + rand * 0.14})`

    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 0.6 + rand * 1.2
    ctx.shadowBlur = 6
    ctx.shadowColor = 'rgba(147, 197, 253, 0.25)'

    let started = false
    for (let px = 0; px <= w; px += 3) {
      const uvx = px / w
      const horizontalFade = 1 - (Math.cos(uvx * Math.PI * 2) * 0.5 + 0.5)
      const spaceX = ((px - w / 2) / w) * 2 * scale

      const warpX =
        pseudoRandom(spaceX * 0.5 + frozenTime * 0.2 + 2) * 0.35 * horizontalFade
      const spaceY =
        pseudoRandom(spaceX * 0.2 + frozenTime) * horizontalFade * 0.9 +
        pseudoRandom(offsetPosition + frozenTime * (1 + normalizedLineIndex)) *
          (0.6 + horizontalFade * 1.2)

      const canvasY = ((spaceY + warpX) / scale / 2) * h + h * 0.48

      if (!started) {
        ctx.moveTo(px, canvasY)
        started = true
      } else {
        ctx.lineTo(px, canvasY)
      }
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // نقاط دایره‌ای کوچک (circle در شیدر)
    const circleX = ((l * 47) % w)
    const cUvx = circleX / w
    const cFade = 1 - (Math.cos(cUvx * Math.PI * 2) * 0.5 + 0.5)
    const cSpaceX = ((circleX - w / 2) / w) * 2 * scale
    const cY =
      ((pseudoRandom(cSpaceX * 0.2) * cFade +
        pseudoRandom(offsetPosition)) /
        scale /
        2) *
        h +
      h * 0.48

    ctx.beginPath()
    ctx.fillStyle = `rgba(191, 219, 254, ${0.15 + rand * 0.2})`
    ctx.arc(circleX, cY, 2 + rand * 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // vignette
  const vignette = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    h * 0.15,
    w * 0.5,
    h * 0.48,
    Math.max(w, h) * 0.75,
  )
  vignette.addColorStop(0, 'transparent')
  vignette.addColorStop(1, 'rgba(5, 7, 13, 0.75)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}
