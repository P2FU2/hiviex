import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
          Terms & Conditions
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Agreement to Terms</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              By accessing or using HIVIEX, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, then you may not access the service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Use License</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of HIVIEX for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on HIVIEX</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or mirror the materials on any other server</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">User Accounts</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Intellectual Property</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of HIVIEX and its licensors. The Service is protected by copyright, trademark, and other laws.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Limitation of Liability</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              In no event shall HIVIEX, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Governing Law</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which HIVIEX operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Email: legal@hiviex.com
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}

