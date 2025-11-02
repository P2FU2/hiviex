'use client'

/**
 * 3D Scene Component
 * 
 * Renders an interactive 3D background using React Three Fiber.
 * Features an animated sphere with distortion material and floating particles.
 * 
 * @component
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { SCENE_3D } from '@/lib/constants'

/**
 * AnimatedSphere Component
 * 
 * A 3D sphere with distortion material that rotates and floats.
 */
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Continuous rotation on multiple axes
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      // Floating animation using sine wave
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5
    }
  })

  return (
    <Sphere 
      ref={meshRef} 
      args={[SCENE_3D.SPHERE.RADIUS, SCENE_3D.SPHERE.SEGMENTS, SCENE_3D.SPHERE.SEGMENTS]}
    >
      <MeshDistortMaterial
        color="#ffffff"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.1}
        metalness={0.8}
      />
    </Sphere>
  )
}

/**
 * FloatingParticle Component
 * 
 * Individual floating particle with glowing effect.
 * Each particle has its own animation phase.
 * 
 * @param index - Unique index for animation offset
 */
function FloatingParticle({ index }: { index: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  // Memoize initial position to prevent recalculation on each render
  const initialPosition = useMemo(() => [
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
  ], []) as [number, number, number]
  
  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation with unique phase per particle
      meshRef.current.position.y = 
        initialPosition[1] + Math.sin(state.clock.elapsedTime + index) * 0.5
      // Continuous rotation
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })
  
  return (
    <Sphere
      ref={meshRef}
      args={[SCENE_3D.PARTICLES.SIZE, 8, 8]}
      position={initialPosition}
    >
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.5 + Math.sin(index) * 0.3}
      />
    </Sphere>
  )
}

/**
 * FloatingParticles Component
 * 
 * Container for multiple floating particles with unique animations.
 */
function FloatingParticles() {
  const particles = Array.from({ length: SCENE_3D.PARTICLES.COUNT })
  
  return (
    <>
      {particles.map((_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}
    </>
  )
}

/**
 * Scene3D Component
 * 
 * Main 3D scene container with canvas, lighting, and controls.
 */
export default function Scene3D() {
  return (
    <div className="w-full h-screen fixed inset-0 -z-10">
      <Canvas
        camera={{ 
          position: SCENE_3D.CAMERA.POSITION, 
          fov: SCENE_3D.CAMERA.FOV 
        }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
        <directionalLight position={[0, 10, 0]} intensity={0.5} />
        
        {/* Background stars */}
        <Stars 
          radius={SCENE_3D.STARS.RADIUS}
          depth={SCENE_3D.STARS.DEPTH}
          count={SCENE_3D.STARS.COUNT}
          factor={SCENE_3D.STARS.FACTOR}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Main animated elements */}
        <AnimatedSphere />
        <FloatingParticles />
        
        {/* Camera controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}
