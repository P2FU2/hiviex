'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-200 dark:border-white/10 py-12 px-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-4 gradient-text"
            >
              HIVIEX
            </motion.h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              An autonomous creation ecosystem
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#content" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">Company</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Building the future of autonomous creation
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center pt-8 border-t border-gray-200 dark:border-white/10"
        >
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} HIVIEX. All rights reserved.
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

