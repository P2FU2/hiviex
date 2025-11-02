'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Sparkles, Infinity, Zap } from 'lucide-react'

export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const features = [
    {
      icon: Sparkles,
      title: 'Intelligent Models',
      description: 'AI models that continuously learn and adapt, creating an ever-evolving ecosystem of knowledge and creativity.',
    },
    {
      icon: Infinity,
      title: 'Infinite Possibilities',
      description: 'Unlock unlimited creative potential with systems that never stop improving and expanding their capabilities.',
    },
    {
      icon: Zap,
      title: 'Instant Creation',
      description: 'Generate, refine, and perfect content at unprecedented speeds with autonomous creation systems.',
    },
  ]

  return (
    <section ref={ref} className="relative py-32 px-4 bg-white/50 dark:bg-black/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            Why Choose HIVIEX?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience the next generation of autonomous creation tools designed to amplify your creative potential.
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
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-white/50 dark:from-white/5 to-white/0 dark:to-white/0 border border-gray-200 dark:border-white/10 backdrop-blur-sm hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300 h-full">
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
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

