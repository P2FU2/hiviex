'use client'

/**
 * Cookie Consent Popup Component
 * 
 * Displays a GDPR/CCPA compliant cookie consent banner when user first visits.
 * Allows users to accept/reject cookies and stores their preference.
 * 
 * @component
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie } from 'lucide-react'
import Link from 'next/link'
import { setCookieConsent, getCookieConsent, hasCookieConsent } from '@/lib/utils/cookies'
import { ANIMATION_DURATION } from '@/lib/constants'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const consent = getCookieConsent()
    
    // Show popup only if no consent has been recorded
    if (!consent) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    setCookieConsent(true)
    setIsVisible(false)
  }

  const handleReject = () => {
    setCookieConsent(false)
    setIsVisible(false)
  }

  const handleClose = () => {
    // Store rejection if user closes without accepting
    setCookieConsent(false)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[9998] backdrop-blur-sm"
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: ANIMATION_DURATION.MEDIUM }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-white dark:bg-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 p-6"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Icon */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Cookie className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">
                Cookie Consent
              </h3>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, 
                and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. 
                You can also manage your preferences or reject non-essential cookies.
              </p>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                This website complies with GDPR (General Data Protection Regulation) and CCPA 
                (California Consumer Privacy Act) requirements. Your privacy is important to us.
              </p>

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                <p className="font-semibold text-gray-700 dark:text-gray-300">How we use cookies:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Essential:</strong> Required for website functionality</li>
                  <li><strong>Analytics:</strong> Help us understand how visitors interact</li>
                  <li><strong>Functional:</strong> Remember your preferences</li>
                  <li><strong>Advertising:</strong> Personalize ads (if applicable)</li>
                </ul>
              </div>

              <div className="text-xs">
                <Link 
                  href="/cookies" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Learn more about our Cookie Policy
                </Link>
                {' • '}
                <Link 
                  href="/privacy" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Privacy Policy
                </Link>
                {' • '}
                <Link 
                  href="/terms" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Terms & Conditions
                </Link>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
              >
                Accept All
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
              You can change your preferences at any time in our{' '}
              <Link href="/cookies" className="underline">
                Cookie Settings
              </Link>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

