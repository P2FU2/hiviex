'use client'

import { motion } from 'framer-motion'
import { ArrowDown, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Light effect that follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: `radial-gradient(circle at ${50 + mousePosition.x}% ${50 + mousePosition.y}%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none block dark:hidden"
        style={{
          background: `radial-gradient(circle at ${50 + mousePosition.x}% ${50 + mousePosition.y}%, rgba(0,0,0,0.05) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-7xl md:text-9xl font-bold mb-6 gradient-text glow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            HIVIEX
          </motion.h1>
        </motion.div>

        <motion.p
          className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-4 font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          An autonomous creation ecosystem
        </motion.p>

        <motion.div
          className="mt-12 space-y-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3"
            whileHover={{ scale: 1.05, x: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Sparkles className="w-6 h-6 text-black dark:text-white" />
            <p>Models that learn from each other.</p>
          </motion.div>
          
          <motion.div
            className="flex items-center justify-center gap-3"
            whileHover={{ scale: 1.05, x: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Sparkles className="w-6 h-6 text-black dark:text-white" />
            <p>Systems that refine style, voice, and identity.</p>
          </motion.div>
          
          <motion.div
            className="flex items-center justify-center gap-3"
            whileHover={{ scale: 1.05, x: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Sparkles className="w-6 h-6 text-black dark:text-white" />
            <p>Creation that continues while you sleep.</p>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <motion.a
            href="#content"
            className="inline-flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm">Explore more</span>
            <ArrowDown className="w-6 h-6" />
          </motion.a>
        </motion.div>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-black dark:bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </section>
  )
}

