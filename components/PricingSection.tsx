'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check } from 'lucide-react'

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
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className={`relative ${
                plan.popular
                  ? 'md:-mt-4 md:mb-4'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-black dark:text-white border border-white/20">
                  Most Popular
                </div>
              )}
              
              <div
                className={`relative p-8 rounded-3xl h-full transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-white/80 dark:from-white/10 to-white/50 dark:to-white/5 border-2 border-gray-300 dark:border-white/30 shadow-2xl scale-105'
                    : 'bg-gradient-to-br from-white/50 dark:from-white/5 to-white/0 dark:to-white/0 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                } backdrop-blur-sm`}
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-black dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
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
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-black dark:text-white flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                      : 'bg-gray-100 dark:bg-white/10 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

