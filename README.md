# Restaurant Client Onboarding — preview

A responsive Next.js/TypeScript/Tailwind **after-call** website for Justin's Operation. This is intentionally a demonstration, not an enabled contract or payment system.

## Run locally

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Deployment

Create a new private GitHub repository named `restaurant-client-onboarding` (do not reuse restaurant website repos). Push these files to `main`. Import the repository into Vercel using its Next.js preset. Leave `NEXT_PUBLIC_CHECKOUT_ENABLED=false`.

## Before any real payment

1. Finalize and obtain approval for legally appropriate agreement terms (revisions, update limits, response times, cancellation/refunds, ownership/IP, service interruptions, third-party fees).
2. Implement an authenticated, persistent server-side record of agreement version and acceptance, authenticated restaurant details, timestamps, and evidence required for the signature process. Consider an e-signature provider if needed.
3. Create server-side Stripe Checkout sessions with fixed whitelisted USD amounts ($500 setup / $250 partial deposit) and merchant-controlled product descriptions; prevent duplicates and replay.
4. Validate Stripe signatures and payment event IDs in a real webhook, persist only verified payment states in a database; use `checkout.session.completed` with verified payment status, and process async payment states when enabled. Never trust redirects as proof of payment.
5. Implement secured, private onboarding forms and file storage after confirmed payment. Never accept restaurant account passwords.
6. Use Stripe test mode, verify real webhook delivery, duplicate events, cancellations, failures and production controls before enabling checkout.
7. Determine how to separately start and cancel $200/month subscriptions *after launch* with proper consent.

## Pricing configuration

The supplied brief specifies **$500 setup; $250 deposit; $200 per month after launch**. The $200 monthly figure differs from prior RA Famous-specific $250/month pricing; verify with Justin before giving this page to a particular restaurant.

This project doesn't process food orders, store data, collect customer payment details, or send email. No payment, signature or onboarding persistence is active.
