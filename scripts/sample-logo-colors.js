const sharp = require('sharp')
const path = require('path')

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')

async function main() {
  const p = path.join(__dirname, '../public/logo.png')
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const ch = info.channels
  const idx = (x, y) => (y * w + x) * ch

  const colors = new Map()
  let minA = 255
  let maxA = 0
  let transparent = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y)
      const a = data[i + 3]
      if (a < 16) {
        transparent++
        continue
      }
      minA = Math.min(minA, a)
      maxA = Math.max(maxA, a)
      const key = [data[i], data[i + 1], data[i + 2]].join(',')
      colors.set(key, (colors.get(key) || 0) + 1)
    }
  }

  const top = [...colors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
  const edge = idx(0, 0)
  const edgePx = [data[edge], data[edge + 1], data[edge + 2], data[edge + 3]]

  console.log(
    JSON.stringify(
      {
        file: 'public/logo.png',
        size: `${w}x${h}`,
        transparentPixels: transparent,
        opaqueAlphaRange: [minA, maxA],
        cornerEdgeRGBA: edgePx,
        cornerEdgeHex: hex(edgePx.slice(0, 3)),
        topOpaqueColors: top.map(([k, c]) => ({
          hex: hex(k.split(',').map(Number)),
          count: c,
        })),
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
