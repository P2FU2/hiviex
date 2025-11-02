import Scene3D from '@/components/Scene3D'
import Hero from '@/components/Hero'
import ContentSection from '@/components/ContentSection'
import AboutSection from '@/components/AboutSection'
import PricingSection from '@/components/PricingSection'
import Footer from '@/components/Footer'
import BlurBackground from '@/components/BlurBackground'
import Header from '@/components/Header'

export default function Home() {
  return (
    <main className="relative bg-white dark:bg-black min-h-screen">
      <Header />
      <BlurBackground />
      <Scene3D />
      <Hero />
      <ContentSection />
      <AboutSection />
      <PricingSection />
      <Footer />
    </main>
  )
}

