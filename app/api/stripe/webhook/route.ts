import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// This route is deliberately inactive until all server-only secrets are configured.
export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Signature required' }, { status: 400 });

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  const supported = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'charge.refunded',
    'charge.dispute.created',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.deleted'
  ]);
  if (!supported.has(event.type)) return NextResponse.json({ received: true });

  // Payment-link checkouts can produce unlinked events. Never infer a client from an email.
  const object = event.data.object as unknown as Record<string, unknown>;
  const stripeObjectId = typeof object.id === 'string' ? object.id : null;
  const paymentLinkId = typeof object.payment_link === 'string' ? object.payment_link : null;
  const reference = typeof object.client_reference_id === 'string' ? object.client_reference_id : null;
  const amount = typeof object.amount_total === 'number' ? object.amount_total :
    typeof object.amount_paid === 'number' ? object.amount_paid : null;
  const currency = typeof object.currency === 'string' ? object.currency : null;
  const allowedLinks = new Set([
    'plink_1UPOrJ08xwifcp7VwPIkNM5D',
    'plink_1UPOtm08xwifcp7VM8zFNlkx',
    'plink_1UPOvh08xwifcp7VBGGe1mnG',
    'plink_1UPOxb08xwifcp7VeVuUCtyN'
  ]);
  const paidCheckout = event.type === 'checkout.session.completed' &&
    object.payment_status === 'paid';
  const asyncPaid = event.type === 'checkout.session.async_payment_succeeded';
  const recognized = Boolean(paymentLinkId && allowedLinks.has(paymentLinkId));
  const status = (recognized && (paidCheckout || asyncPaid) && reference) ? 'matched' : 'needs_review';

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  // Stripe can retry deliveries; event_id is a primary key.
  const { error } = await db.from('stripe_payment_events').upsert({
    event_id: event.id,
    stripe_account: event.account ?? null,
    event_type: event.type,
    stripe_object_id: stripeObjectId,
    payment_link_id: paymentLinkId,
    client_reference: reference,
    amount_cents: amount,
    currency,
    processed_status: status,
    processed_at: new Date().toISOString()
  }, { onConflict: 'event_id', ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: 'Unable to record event' }, { status: 500 });
  // A later worker must validate client association and amount before updating Airtable.
  // Recording an event is NOT approval to start onboarding or to publish.
  return NextResponse.json({ received: true });
}
