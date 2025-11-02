import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="relative bg-white dark:bg-black min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-32">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-5xl md:text-6xl font-bold mb-8 gradient-text">
          Privacy Policy
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Introduction</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              At HIVIEX, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Information We Collect</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              We may collect information about you in various ways. The information we may collect on the Site includes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Personal data you voluntarily provide to us</li>
              <li>Derivative data collected automatically when you access the site</li>
              <li>Financial data necessary for processing payments</li>
              <li>Mobile device data if you access our site via mobile</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Use of Your Information</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Create and manage your account</li>
              <li>Process your transactions and send you related information</li>
              <li>Email you regarding your account or order</li>
              <li>Fulfill and manage purchases, orders, payments, and other transactions</li>
              <li>Generate a personalized profile about you</li>
              <li>Increase the efficiency and operation of the Site</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Disclosure of Your Information</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>By Law or to Protect Rights</li>
              <li>Third-Party Service Providers</li>
              <li>Business Transfers</li>
              <li>Marketing Communications</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>The right to access – You have the right to request copies of your personal data.</li>
              <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate.</li>
              <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
              <li>The right to restrict processing – You have the right to request that we restrict the processing of your personal data.</li>
              <li>The right to object to processing – You have the right to object to our processing of your personal data.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Email: privacy@hiviex.com
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}

