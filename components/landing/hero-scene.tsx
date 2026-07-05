'use client'

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

const COLORS = ['#8B7CFF', '#54D2FF', '#FF4DA6', '#C9A962'] as const

function ParticleCloud({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Points>(null)
  const count = 1800

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi) - 1
      const hex = COLORS[i % COLORS.length]
      const c = new THREE.Color(hex)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = t * 0.04 + mouse.current.x * 0.15
    ref.current.rotation.x = mouse.current.y * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} vertexColors transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function CoreOrb({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.x = mouse.current.x * 0.4
    ref.current.position.y = mouse.current.y * 0.3
    ref.current.rotation.x = t * 0.15
    ref.current.rotation.z = t * 0.1
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.85, 64, 64]} />
      <MeshDistortMaterial
        color="#8B7CFF"
        emissive="#54D2FF"
        emissiveIntensity={0.35}
        roughness={0.15}
        metalness={0.6}
        distort={0.35}
        speed={2.5}
      />
    </mesh>
  )
}

function Scene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#8B7CFF" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#54D2FF" />
      <pointLight position={[0, -3, 3]} intensity={0.5} color="#FF4DA6" />
      <ParticleCloud mouse={mouse} />
      <CoreOrb mouse={mouse} />
    </>
  )
}

export function HeroSceneStatic({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="lux-hero-gradient absolute inset-0" />
      <div
        className="absolute left-1/2 top-1/2 h-[min(60vw,420px)] w-[min(60vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(139,124,255,0.45) 0%, rgba(84,210,255,0.2) 40%, transparent 70%)',
        }}
      />
    </div>
  )
}

export function HeroScene({ className }: { className?: string }) {
  const mouse = useRef({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)

    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    setReady(true)

    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  if (!ready || reduceMotion) {
    return <HeroSceneStatic className={className} />
  }

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene mouse={mouse} />
      </Canvas>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(15,17,23,0.75) 100%)',
        }}
      />
    </div>
  )
}
