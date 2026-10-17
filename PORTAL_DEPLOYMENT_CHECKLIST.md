# Justin's Operation — Portal Deployment and Verification

Current branch: `feature/client-portal-foundation`. **Do not merge or label production-ready until all checks below pass.**

## Pricing (confirmed October 17, 2026)
- Setup payment: **$499.99**
- Deposit option: **$249.99** now + **$250.00** before launch
- Monthly management: **$249.99/month** after launch and separate authorization
- Existing Stripe payment links remain unchanged. Do not create or initiate subscriptions on signup.

## Existing Supabase project
- Name: `justins-operation-portal`
- URL: `https://vnllbqjwqcudxwpydqcq.supabase.co`
- Existing database uses RLS and server-provisioned `restaurant_memberships` and `portal_staff`.
- Do not create a second database or assign users to roles through untrusted frontend submissions.

## Vercel Preview configuration
Configure environment variables on the **exact Preview branch** being deployed:
- `NEXT_PUBLIC_SUPABASE_URL`: existing Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key (not the service-role key)
- `NEXT_PUBLIC_SITE_URL`: complete HTTPS hostname of the deployed portal without path or trailing slash

For webhook integration only, use **server-only** values `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`. Never paste these into GitHub, `NEXT_PUBLIC_*`, screenshots, or client code.

In Supabase Authentication -> URL Configuration, set the Site URL to the intended site and explicitly authorize `https://YOUR-PORTAL-HOST/auth/callback` under Redirect URLs. For changing preview deployment hostnames, use one stable approved preview alias. Avoid broad wildcard URLs.

## Deployment acceptance tests
1. Preview build is `Ready` and runs against the intended branch.
2. `/login` loads over HTTPS.
3. An **invited** account receives its sign-in email and the callback reaches `/portal`.
4. Uninvited account cannot automatically create an account or access private data.
5. Owner/manager can submit a request only for their own restaurant; viewer cannot.
6. Requests appear in the correct restaurant and admin queue; staff can change status.
7. A user assigned to restaurant A cannot read restaurant B requests or reports.
8. Published reports appear only when verified; drafts are hidden.
9. Stripe webhooks: verify signatures, deduplication, failed deliveries and correct event persistence in a nonproduction test. Receipt of an event alone must not mark setup paid or start a subscription.
10. Confirm pricing, payment destinations, agreement terms, consent, authorized payment events and business approval before moving to production.

## Not yet complete
Persisted client onboarding/assets; signed agreement records; client approval and deployment-version tracking; verified account-specific invoice/subscription dashboard; robust webhook-to-client association; end-to-end tests; live deployment. These features must not be advertised as working.

## Access blocker
The connected Vercel integration currently returns `403 forbidden` when retrieving detailed deployments under the `justinsoperation-del` scope. A screenshot showing a Ready deployment does not verify login or database behavior. Restore the connector's access to the correct Vercel scope for automated deployment validation.
