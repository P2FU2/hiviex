'use client'

/**
 * Pricing Section Component
 * 
 * Displays pricing plans with interactive cards that respond to mouse movement.
 * Features 3D hover effects and mouse reflection.
 * 
 * @component
 */

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useElementMouse3D } from '@/hooks/useElementMouse3D'

interface PricingCardProps {
  plan: {
    name: string
    price: string
    period: string
    description: string
    features: string[]
    popular: boolean
  }
  index: number
  isInView: boolean
}

function PricingCard({ plan, index, isInView }: PricingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { rotation, mousePosition } = useElementMouse3D(cardRef)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className={`relative ${
        plan.popular
          ? 'md:-mt-4 md:mb-4'
          : ''
      }`}
    >
      <div
        ref={cardRef}
        className={`relative p-8 rounded-3xl h-full overflow-hidden group cursor-pointer transition-all duration-300 ${
          plan.popular
            ? 'bg-gradient-to-br from-white/80 dark:from-white/10 to-white/50 dark:to-white/5 border-2 border-gray-300 dark:border-white/30 shadow-2xl scale-105'
            : 'bg-gradient-to-br from-white/50 dark:from-white/5 to-white/0 dark:to-white/0 border border-gray-200 dark:border-white/10'
        } backdrop-blur-sm hover:scale-110 hover:shadow-2xl hover:border-gray-400 dark:hover:border-white/40`}
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${plan.popular ? 'scale(1.05)' : 'scale(1)'}`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
          boxShadow: `
            ${mousePosition.x * 0.05}px ${mousePosition.y * 0.05}px 20px rgba(0, 0, 0, 0.1),
            0 0 40px rgba(255, 255, 255, 0.1),
            0 0 60px rgba(255, 255, 255, 0.05),
            inset 0 0 30px rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        {/* Efeito de brilho animado base */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/0 via-white/20 dark:via-white/10 to-white/0 animate-gradient opacity-60 pointer-events-none" />
        
        {/* Brilho que segue o mouse */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-200 group-hover:opacity-100 opacity-0"
          style={{
            background: `radial-gradient(circle 400px at ${50 + (mousePosition.x / 20)}% ${50 + (mousePosition.y / 20)}%, rgba(255,255,255,0.3) 0%, transparent 70%)`,
          }}
        />
        
        {/* Brilho pulsante */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)',
          }}
        />
        
        {/* Reflexos nos cantos */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/15 dark:bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/15 dark:bg-white/8 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2 text-black dark:text-white transform-gpu" style={{ transform: 'translateZ(20px)' }}>
              {plan.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 transform-gpu" style={{ transform: 'translateZ(15px)' }}>
              {plan.description}
            </p>
            <div className="flex items-baseline transform-gpu" style={{ transform: 'translateZ(25px)' }}>
              <span className="text-5xl font-bold text-black dark:text-white">
                {plan.price}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                {plan.period}
              </span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            {plan.features.map((feature, featureIndex) => (
              <li 
                key={featureIndex} 
                className="flex items-start gap-3 transform-gpu"
                style={{ transform: 'translateZ(10px)' }}
              >
                <Check className="w-5 h-5 text-black dark:text-white flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <button
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform-gpu relative z-10 ${
              plan.popular
                ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                : 'bg-gray-100 dark:bg-white/10 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
            style={{ transform: 'translateZ(30px)' }}
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const plans = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      description: 'Perfect for individuals and small projects',
      features: [
        '5 AI models',
        '100 generations/month',
        'Basic templates',
        'Community support',
        'Standard processing speed',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing teams and serious creators',
      features: [
        '20 AI models',
        'Unlimited generations',
        'Advanced templates',
        'Priority support',
        'Fast processing',
        'Custom integrations',
        'Analytics dashboard',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited AI models',
        'Unlimited generations',
        'Custom templates',
        'Dedicated support',
        'Ultra-fast processing',
        'Advanced integrations',
        'Full analytics suite',
        'Custom training',
        'SLA guarantee',
      ],
      popular: false,
    },
  ]

  return (
    <section id="pricing" ref={ref} className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Flexible pricing plans designed to scale with your creative needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
