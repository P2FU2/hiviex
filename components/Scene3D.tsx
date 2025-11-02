'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Stars } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null!)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.5
    }
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
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

function FloatingParticle({ index }: { index: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const initialPosition = useMemo(() => [
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
  ], [])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = initialPosition[1] + Math.sin(state.clock.elapsedTime + index) * 0.5
      meshRef.current.rotation.x += 0.01
      meshRef.current.rotation.y += 0.01
    }
  })
  
  return (
    <Sphere
      ref={meshRef}
      args={[0.02, 8, 8]}
      position={initialPosition as [number, number, number]}
    >
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.5 + Math.sin(index) * 0.3}
      />
    </Sphere>
  )
}

function FloatingParticles() {
  const particles = Array.from({ length: 50 })
  
  return (
    <>
      {particles.map((_, i) => (
        <FloatingParticle key={i} index={i} />
      ))}
    </>
  )
}

export default function Scene3D() {
  return (
    <div className="w-full h-screen fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
        <directionalLight position={[0, 10, 0]} intensity={0.5} />
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <AnimatedSphere />
        <FloatingParticles />
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

