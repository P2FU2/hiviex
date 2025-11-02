import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
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
          Cookie Policy
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">What Are Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">How We Use Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              HIVIEX uses cookies for several purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.</li>
              <li><strong>Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
              <li><strong>Preference Cookies:</strong> These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, personalized features.</li>
              <li><strong>Marketing Cookies:</strong> These cookies are used to track visitors across websites to display relevant advertisements.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Session Cookies</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  These are temporary cookies that are deleted when you close your browser. They help maintain your session while you navigate through the website.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Persistent Cookies</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  These cookies remain on your device for a set period or until you delete them. They help us recognize you when you return to our website.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Managing Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your experience using our website. You can:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Delete cookies that have already been set</li>
              <li>Prevent cookies from being placed on your device</li>
              <li>Set your browser to notify you when cookies are being sent</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Third-Party Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service and refine marketing efforts.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about our use of cookies, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Email: cookies@hiviex.com
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}

