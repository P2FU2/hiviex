/**
 * Onboarding Component
 * 
 * 5-step onboarding guide for new users
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Check, Users, Bot, Workflow, Zap, Shield } from 'lucide-react'
import { useSession } from 'next-auth/react'

const steps = [
  {
    id: 1,
    title: 'Bem-vindo ao HIVIEX',
    description: 'Sua plataforma de criação autônoma com IA. Agentes que aprendem e criam continuamente.',
    icon: Zap,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          O HIVIEX é um ecossistema onde modelos de IA aprendem uns com os outros,
          refinando estilo, voz e identidade continuamente.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
          <li>Criação autônoma 24/7</li>
          <li>Agentes que aprendem e evoluem</li>
          <li>Sistemas que se refinam constantemente</li>
        </ul>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Workspaces',
    description: 'Organize seus projetos em workspaces colaborativos',
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Crie workspaces para organizar seus projetos e colaborar com sua equipe.
        </p>
        <div className="bg-white/50 dark:bg-black/50 p-4 rounded-lg border border-gray-200/50 dark:border-white/10">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Dica:</strong> Você pode ter múltiplos workspaces para diferentes projetos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Agentes de IA',
    description: 'Crie e configure agentes inteligentes que trabalham para você',
    icon: Bot,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Agentes são modelos de IA especializados que podem criar conteúdo,
          processar informações e executar tarefas automaticamente.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
          <li>Configure agentes para tarefas específicas</li>
          <li>Eles aprendem com cada interação</li>
          <li>Trabalham de forma autônoma</li>
        </ul>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Workflows',
    description: 'Automatize processos complexos com workflows inteligentes',
    icon: Workflow,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Crie workflows que conectam múltiplos agentes e processos,
          criando sistemas de criação totalmente automatizados.
        </p>
        <div className="bg-white/50 dark:bg-black/50 p-4 rounded-lg border border-gray-200/50 dark:border-white/10">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Exemplo:</strong> Um workflow pode gerar conteúdo, revisar e publicar automaticamente.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Pronto para começar!',
    description: 'Você está pronto para explorar o poder da criação autônoma',
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Agora você conhece o básico da plataforma. Comece criando seu primeiro workspace
          e experimente o poder da criação autônoma com IA.
        </p>
        <div className="bg-white/50 dark:bg-black/50 p-4 rounded-lg border border-gray-200/50 dark:border-white/10">
          <p className="text-sm font-medium text-black dark:text-white mb-2">
            Próximos passos:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Crie seu primeiro workspace</li>
            <li>Configure um agente</li>
            <li>Explore os workflows</li>
          </ul>
        </div>
      </div>
    ),
  },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      if (!session?.user?.id) return

      try {
        const response = await fetch('/api/user/onboarding-status')
        const data = await response.json()
        
        if (!data.completed) {
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        // If error, show onboarding anyway for first-time users
        setIsOpen(true)
      }
    }

    checkOnboarding()
  }, [session])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      await fetch('/api/user/complete-onboarding', {
        method: 'POST',
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setIsOpen(false)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isOpen) return null

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed inset-0 bg-black/70 z-[9998] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-white dark:bg-black rounded-2xl shadow-2xl border border-gray-200 dark:border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/10 dark:bg-white/10 rounded-lg">
                      <Icon className="w-6 h-6 text-black dark:text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-black dark:text-white">
                        {currentStepData.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Passo {currentStep + 1} de {steps.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="bg-black dark:bg-white h-2 rounded-full"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                      {currentStepData.description}
                    </p>
                    {currentStepData.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentStep
                          ? 'bg-black dark:bg-white'
                          : index < currentStep
                          ? 'bg-gray-400 dark:bg-gray-600'
                          : 'bg-gray-200 dark:bg-gray-800'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Concluir
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

