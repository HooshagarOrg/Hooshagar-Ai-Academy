'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { TalentNode } from '@/components/talent/talent-galaxy'

const COLOR_MAP: Record<string, string> = {
  academic: '#8B7CFF',
  art: '#FF4DA6',
  sport: '#39D98A',
  social: '#54D2FF',
  tech: '#C9A962',
}

function Particles() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return arr
  }, [])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0004
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#8B7CFF" transparent opacity={0.5} />
    </points>
  )
}

function TalentSphere({
  node,
  position,
  onSelect,
}: {
  node: TalentNode
  position: [number, number, number]
  onSelect: (n: TalentNode) => void
}) {
  const scale = 0.1 + (node.score / 100) * 0.3
  const color = COLOR_MAP[node.category] ?? '#8B7CFF'

  return (
    <mesh position={position} onClick={() => onSelect(node)}>
      <sphereGeometry args={[scale, 24, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      <Html distanceFactor={12} center>
        <span className="whitespace-nowrap rounded-lg bg-[var(--lux-glass)] px-2 py-0.5 text-[10px] font-bold text-[var(--lux-text)] opacity-0 transition-opacity group-hover:opacity-100">
          {node.label}
        </span>
      </Html>
    </mesh>
  )
}

function Connections({ nodes, positions }: { nodes: TalentNode[]; positions: Map<string, [number, number, number]> }) {
  const lines = useMemo(() => {
    const segs: number[] = []
    nodes.forEach((n) => {
      n.related?.forEach((rid) => {
        const a = positions.get(n.id)
        const b = positions.get(rid)
        if (a && b) segs.push(...a, ...b)
      })
    })
    return new Float32Array(segs)
  }, [nodes, positions])

  if (lines.length === 0) return null

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[lines, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#8B7CFF" transparent opacity={0.3} />
    </lineSegments>
  )
}

function SceneInner({
  nodes,
  onSelect,
}: {
  nodes: TalentNode[]
  onSelect: (n: TalentNode) => void
}) {
  const group = useRef<THREE.Group>(null)

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>()
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2
      const r = 2.2 + (i % 3) * 0.4
      map.set(n.id, [Math.cos(angle) * r, (i % 2) * 0.6 - 0.3, Math.sin(angle) * r])
    })
    return map
  }, [nodes])

  useFrame(() => {
    if (group.current) group.current.rotation.y += 0.001
  })

  return (
    <group ref={group}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#8B7CFF" />
      <Particles />
      <Connections nodes={nodes} positions={positions} />
      {nodes.map((n) => (
        <TalentSphere key={n.id} node={n} position={positions.get(n.id)!} onSelect={onSelect} />
      ))}
      <OrbitControls enableDamping dampingFactor={0.08} />
    </group>
  )
}

export function TalentGalaxyScene({
  nodes,
  onSelect,
}: {
  nodes: TalentNode[]
  onSelect: (n: TalentNode) => void
}) {
  return (
    <div className="h-[60vh] min-h-[360px] w-full">
      <Canvas camera={{ position: [0, 1.5, 6], fov: 50 }}>
        <SceneInner nodes={nodes} onSelect={onSelect} />
      </Canvas>
    </div>
  )
}
