import Stripe from 'stripe'

let stripeSingleton: Stripe | null = null

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim()
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY não configurada')
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      typescript: true,
    })
  }
  return stripeSingleton
}
