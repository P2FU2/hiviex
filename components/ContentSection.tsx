'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Brain, Palette, Moon } from 'lucide-react'

function QuoteCard({ isInView }: { isInView: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLQuoteElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      
      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const mouseX = e.clientX - centerX
      const mouseY = e.clientY - centerY
      
      setMousePosition({ x: mouseX, y: mouseY })
      
      // Calcular rotação 3D baseada na posição do mouse
      const rotateX = (mouseY / rect.height) * -15
      const rotateY = (mouseX / rect.width) * 15
      
      setRotation({ x: rotateX, y: rotateY })
      
      // Atualizar posição do reflexo no texto
      if (textRef.current) {
        const textRect = textRef.current.getBoundingClientRect()
        const textCenterX = textRect.left + textRect.width / 2
        const textCenterY = textRect.top + textRect.height / 2
        
        const textMouseX = ((e.clientX - textCenterX) / textRect.width) * 100
        const textMouseY = ((e.clientY - textCenterY) / textRect.height) * 100
        
        textRef.current.style.setProperty('--mouse-x', `${50 + textMouseX}%`)
        textRef.current.style.setProperty('--mouse-y', `${50 + textMouseY}%`)
      }
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener('mousemove', handleMouseMove)
      card.addEventListener('mouseleave', () => {
        setRotation({ x: 0, y: 0 })
        setMousePosition({ x: 0, y: 0 })
        if (textRef.current) {
          textRef.current.style.setProperty('--mouse-x', '50%')
          textRef.current.style.setProperty('--mouse-y', '50%')
        }
      })
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 1, delay: 0.6 }}
      className="mt-32 text-center"
    >
      <div
        ref={cardRef}
        className="relative p-12 rounded-3xl bg-gradient-to-br from-gray-50 dark:from-white/10 to-white dark:to-white/5 border border-gray-200 dark:border-white/20 backdrop-blur-xl transform-gpu overflow-hidden group"
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
          boxShadow: `
            ${mousePosition.x * 0.08}px ${mousePosition.y * 0.08}px 30px rgba(0, 0, 0, 0.15),
            0 0 50px rgba(255, 255, 255, 0.15),
            0 0 80px rgba(255, 255, 255, 0.1),
            inset 0 0 40px rgba(255, 255, 255, 0.1),
            0 0 120px rgba(255, 255, 255, 0.05)
          `,
          filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.25))',
        }}
      >
        {/* Efeito de brilho animado base */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/0 via-white/30 dark:via-white/15 to-white/0 animate-gradient opacity-70 pointer-events-none" />
        
        {/* Brilho que segue o mouse */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-200 group-hover:opacity-100 opacity-0"
          style={{
            background: `radial-gradient(circle 400px at ${50 + (mousePosition.x / 20)}% ${50 + (mousePosition.y / 20)}%, rgba(255,255,255,0.4) 0%, transparent 70%)`,
          }}
        />
        
        {/* Brilho pulsante */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25) 0%, transparent 65%)',
          }}
        />
        
        {/* Reflexos nos cantos */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 dark:bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 dark:bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/15 dark:bg-white/8 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/15 dark:bg-white/8 rounded-full blur-2xl pointer-events-none" />

        <blockquote 
          ref={textRef}
          className="relative text-3xl md:text-4xl font-light italic leading-relaxed transform-gpu z-10"
          style={{ 
            transform: 'translateZ(30px)',
            '--mouse-x': '50%',
            '--mouse-y': '50%',
          } as React.CSSProperties}
        >
          <span className="relative block text-black dark:text-white">
            &ldquo;Creation is not a destination, it&apos;s an infinite journey of discovery and evolution.&rdquo;
          </span>
          {/* Reflexo no texto que segue o mouse - similar aos cards */}
          <span 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle 400px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.5) 0%, transparent 50%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mixBlendMode: 'screen',
              opacity: 0.8,
            }}
          >
            &ldquo;Creation is not a destination, it&apos;s an infinite journey of discovery and evolution.&rdquo;
          </span>
        </blockquote>
      </div>
    </motion.div>
  )
}

const features = [
  {
    icon: Brain,
    title: 'Autonomous Learning',
    description: 'Models that evolve and adapt continuously, learning from each other in an infinite cycle of improvement.',
  },
  {
    icon: Palette,
    title: 'Perpetual Refinement',
    description: 'Intelligent systems that autonomously enhance style, voice, and identity, creating increasingly refined works.',
  },
  {
    icon: Moon,
    title: 'Continuous Creation',
    description: 'The creative process never stops. While you rest, intelligence continues working, producing new ideas and content.',
  },
]

export default function ContentSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section id="content" ref={ref} className="relative min-h-screen py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            The Future of Creation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A new era where artificial intelligence doesn&apos;t just assist, but creates autonomously,
            establishing an ecosystem of continuous innovation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/50 dark:from-white/5 to-white/0 dark:to-white/0 border border-gray-200 dark:border-white/10 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300">
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-gray-100 dark:via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-gray-100 dark:from-white/10 to-gray-50 dark:to-white/5"
                >
                  <feature.icon className="w-8 h-8 text-black dark:text-white" />
                </motion.div>

                <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Linha decorativa */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/20 to-transparent group-hover:via-gray-400 dark:group-hover:via-white/40 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Seção de citação destacada */}
        <QuoteCard isInView={isInView} />
      </div>
    </section>
  )
}

