# Client portal development branch

This branch adds a **new** /login, /portal, and /auth/callback flow to the existing Justin's Operation onboarding app. Existing / route and Stripe links are untouched.

## Existing database
Supabase project: justins-operation-portal (vnllbqjwqcudxwpydqcq).
Migration already applied: portal_phase1_tenants_reports_requests_rls.
Tables: restaurants, restaurant_memberships, monthly_reports, service_requests, request_messages, client_audit_events.
All tables have RLS. No client records have been provisioned.

## Required configuration (Vercel preview first)
Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable/anon only), NEXT_PUBLIC_SITE_URL (the exact HTTPS preview domain).
Do not add the database password or service_role key to browser variables.
Supabase Authentication > URL Configuration: add https://YOUR_PREVIEW_DOMAIN/auth/callback to allowed redirect URLs.
Install the new dependencies and regenerate package-lock.json with npm install, then build and run typecheck.

## Critical testing before merge
1. Confirm / still shows the unchanged existing onboarding page and Stripe links.
2. Confirm /login handles email link sign-in and refuses uninvited addresses (Auth option shouldCreateUser=false).
3. Provision two test users via authenticated Supabase administration, two restaurants, and distinct memberships using trusted admin credentials. Never create memberships from a browser.
4. User A cannot see user B's restaurant, reports or tickets, including by swapping UUIDs.
5. Manager/owner can submit service requests; viewer cannot.
6. Only published reports are visible; unknown data is never shown as zero or attributed orders.
7. Confirm service tickets cannot be edited/published without trusted admin work.
8. Test redirects, expired email links, browser refresh, sign out, and mobile.
9. Run Supabase security advisors and retry/monitor failed login behavior.

This code is an implementation foundation, not a live service: no sales-team backend, verified Stripe webhook, real analytics integration, AI communications, or automated deployment workflows yet.
