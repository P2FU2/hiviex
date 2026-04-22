/**
 * Webhook Stripe — sincroniza Subscription no Postgres.
 * Configure o endpoint no Dashboard Stripe com o mesmo STRIPE_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/billing/stripe-client'
import {
  syncSubscriptionFromStripe,
  downgradeSubscriptionToFree,
} from '@/lib/billing/sync-stripe-subscription'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET em falta')
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 503 })
  }

  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Assinatura em falta' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('[stripe webhook] verify failed:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object as Stripe.Checkout.Session
        if (sess.mode !== 'subscription' || !sess.subscription) break
        const stripe = getStripe()
        const subId =
          typeof sess.subscription === 'string'
            ? sess.subscription
            : sess.subscription.id
        const sub = await stripe.subscriptions.retrieve(subId)
        await syncSubscriptionFromStripe(sub)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await syncSubscriptionFromStripe(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const tenantId = sub.metadata?.tenantId
        if (tenantId) {
          await downgradeSubscriptionToFree(tenantId)
        }
        break
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const subRef = inv.subscription
        const subId =
          typeof subRef === 'string' ? subRef : subRef?.id
        if (subId) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: 'PAST_DUE' },
          })
        }
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[stripe webhook] handler error:', event.type, e)
    return NextResponse.json({ error: 'Erro ao processar evento' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
