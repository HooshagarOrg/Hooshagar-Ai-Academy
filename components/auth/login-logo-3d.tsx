'use client'

/**
 * لوگوی سه‌بعدی شیشه‌ای صفحه ورود
 * چرخش ۳۶۰° حول محور Y (~۸ ثانیه)، شناوری، Pulse Glow، Bloom، Reflection، ذرات محیطی.
 * Bloom با لایه‌های درخشان افزایشی پیاده شده تا وابستگی سنگین لازم نباشد.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { ContactShadows, Environment, Float, Lightformer, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'

const LOGO_SRC = '/brand/logo-3d.png?v=20260709'
const REVOLUTION_SECONDS = 8
const ROTATION_SPEED = (Math.PI * 2) / REVOLUTION_SECONDS

const GLOW_LAYERS = [
  { scale: 1.06, opacity: 0.24, color: '#8fb4ff' },
  { scale: 1.16, opacity: 0.12, color: '#8B7CFF' },
  { scale: 1.32, opacity: 0.06, color: '#54D2FF' },
]

function GlassLogo(): JSX.Element {
  const groupRef = useRef<THREE.Group>(null)
  const frontMat = useRef<THREE.MeshPhysicalMaterial>(null)
  const glowGroup = useRef<THREE.Group>(null)

  const texture = useLoader(TextureLoader, LOGO_SRC)

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
  }, [texture])

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useFrame((state, delta) => {
    if (groupRef.current && !reduced) {
      groupRef.current.rotation.y += ROTATION_SPEED * delta
    }
    const t = state.clock.elapsedTime
    const pulse = 0.35 + Math.sin(t * 1.4) * 0.2
    if (frontMat.current) frontMat.current.emissiveIntensity = pulse
    if (glowGroup.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.03
      glowGroup.current.scale.set(s, s, 1)
    }
  })

  const size: [number, number] = [2.6, 2.6]
  const thickness = 0.14

  return (
    <group ref={groupRef}>
      {/* هالهٔ نرم چندلایه پشت لوگو (Bloom feel) */}
      <group ref={glowGroup} position={[0, 0, -0.06]}>
        {GLOW_LAYERS.map((layer) => (
          <mesh key={layer.scale} scale={[layer.scale, layer.scale, 1]}>
            <planeGeometry args={size} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={layer.opacity}
              color={layer.color}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* وجه جلو — شیشه‌ای */}
      <mesh position={[0, 0, thickness / 2]}>
        <planeGeometry args={size} />
        <meshPhysicalMaterial
          ref={frontMat}
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={0.35}
          transparent
          alphaTest={0.05}
          roughness={0.16}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.12}
          transmission={0.35}
          thickness={0.6}
          ior={1.4}
          envMapIntensity={1.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* وجه پشت */}
      <mesh position={[0, 0, -thickness / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={size} />
        <meshPhysicalMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.2}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.15}
          envMapIntensity={1.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function MovingLights(): JSX.Element {
  const p1 = useRef<THREE.PointLight>(null)
  const p2 = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (p1.current) p1.current.position.set(Math.sin(t * 0.8) * 3, Math.cos(t * 0.6) * 2, 3)
    if (p2.current) p2.current.position.set(Math.cos(t * 0.7) * -3, Math.sin(t * 0.5) * 2, 2.5)
  })

  return (
    <>
      <pointLight ref={p1} color="#8B7CFF" intensity={22} distance={12} />
      <pointLight ref={p2} color="#54D2FF" intensity={18} distance={12} />
    </>
  )
}

interface LoginLogo3DProps {
  className?: string
  /** اندازه کوچک‌تر برای موبایل — ذرات و کیفیت رندر کمتر */
  compact?: boolean
}

export default function LoginLogo3D({ className = '', compact = false }: LoginLogo3DProps): JSX.Element {
  const sizeClass = compact ? 'h-[200px] w-[200px]' : 'h-[300px] w-[300px]'

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <Canvas
        camera={{ position: [0, 0, compact ? 4.6 : 4.2], fov: compact ? 36 : 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: compact ? 'default' : 'high-performance' }}
        dpr={compact ? [1, 1.5] : [1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1} />
        <directionalLight position={[2, 4, 5]} intensity={2} />
        <MovingLights />

        <Float
          speed={1.3}
          rotationIntensity={0}
          floatIntensity={0.7}
          floatingRange={[-0.06, 0.06]}
        >
          <GlassLogo />
        </Float>

        <Sparkles
          count={compact ? 24 : 44}
          scale={compact ? [4.5, 4.5, 3] : [6, 6, 4]}
          size={compact ? 2 : 2.4}
          speed={0.3}
          opacity={0.5}
          color="#9db4ff"
        />

        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.35}
          scale={8}
          blur={2.6}
          far={4}
          color="#050810"
        />

        {/* محیط نوری داخلی — بدون fetch خارجی (HDR آفلاین) */}
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#ffffff"
            position={[0, 3, 4]}
            scale={[8, 4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.6}
            color="#8B7CFF"
            position={[-4, 1, 2]}
            scale={[4, 6, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.4}
            color="#54D2FF"
            position={[4, -1, 2]}
            scale={[4, 6, 1]}
          />
          <Lightformer
            form="circle"
            intensity={2}
            color="#ffd18a"
            position={[0, -3, 3]}
            scale={[4, 4, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  )
}
