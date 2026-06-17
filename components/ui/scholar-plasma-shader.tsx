'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  createPlasmaProgram,
  PLASMA_QUAD,
  type PlasmaVariant,
} from '@/lib/knowledge-universe/scholar-plasma-shader'
import { drawScholarPlasmaField } from '@/lib/knowledge-universe/plasma-canvas'

interface ScholarPlasmaShaderProps {
  className?: string
  variant?: PlasmaVariant
}

/**
 * میدان پلاسما WebGL — با fallback به Canvas 2D متحرک
 */
export function ScholarPlasmaShader({
  className,
  variant = 'landing',
}: ScholarPlasmaShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let disposed = false
    const start = performance.now()

    const parent = canvas.parentElement
    if (!parent) return

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    })

    if (gl) {
      const programInfo = createPlasmaProgram(gl, variant)
      if (programInfo) {
        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, PLASMA_QUAD, gl.STATIC_DRAW)

        const render = (now: number) => {
          if (disposed) return
          const t = reduceMotion ? 0 : (now - start) / 1000

          gl.viewport(0, 0, canvas.width, canvas.height)
          gl.clearColor(0, 0, 0, 1)
          gl.clear(gl.COLOR_BUFFER_BIT)
          gl.useProgram(programInfo.program)
          gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height)
          gl.uniform1f(programInfo.uniformLocations.time, t)
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
          gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0)
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

          if (!reduceMotion) raf = requestAnimationFrame(render)
        }

        raf = requestAnimationFrame(render)

        return () => {
          disposed = true
          cancelAnimationFrame(raf)
          ro.disconnect()
          gl.deleteBuffer(positionBuffer)
          gl.deleteProgram(programInfo.program)
        }
      }
    }

    // Canvas 2D fallback
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      ro.disconnect()
      return
    }

    const render2d = (now: number) => {
      if (disposed) return
      const t = reduceMotion ? 0 : (now - start) / 1000
      drawScholarPlasmaField(ctx, canvas.width, canvas.height, t)
      if (!reduceMotion) raf = requestAnimationFrame(render2d)
    }

    raf = requestAnimationFrame(render2d)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [variant, reduceMotion])

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 block h-full w-full', className)}
      aria-hidden
    />
  )
}
