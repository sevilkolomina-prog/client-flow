# ClientFlow

ClientFlow is a client, project, and invoice workspace for independent businesses. It helps freelancers, consultants, and small operators keep client work, project status, and billing in one place.

This repository is a production-ready v1 demo. Stripe currently runs in **Sandbox / Test mode**, not Live mode.

## Target users

- Independent consultants and freelancers
- Small service businesses tracking a modest client roster
- Portfolio / product-demo reviewers who want a realistic SaaS flow

## Main features

- Email/password authentication with signup, login, logout, and password reset
- First-run onboarding
- Dashboard snapshot of clients, projects, and invoices
- Client, project, and invoice CRUD
- Settings for profile details and subscription status
- Free / Pro / Business plans
- Free-plan limits: 3 clients and 3 projects
- Stripe Sandbox checkout, signed webhooks, and Customer Portal
- Pro ↔ Business switching through the billing portal
- Row-level security plus locked billing columns on `profiles`

## Tech stack

- Next.js App Router (v16) and React 19
- TypeScript
- Tailwind CSS v4 and shadcn/ui (Base UI)
- Supabase Auth and Postgres
- Stripe Checkout, Billing Portal, and webhooks (Sandbox)

## Demo / portfolio

- **Demo URL:** [https://client-flow-neon.vercel.app](https://client-flow-neon.vercel.app)
- **Stripe mode:** Sandbox / Test. Do not use real payment cards. Use Stripe test cards only.
- **Demo credentials:** Not published. Create your own account, or ask the owner for a review login.

### Screenshots

Add product screenshots here when you are ready to publish the portfolio write-up:

- Dashboard
- Clients
- Projects
- Invoices
- Pricing
- Settings / billing

### Suggested demo flow

1. Sign up and complete onboarding.
2. Add a client, then a project, then an invoice.
3. Review the dashboard snapshot.
4. Hit the Free-plan limit (3 clients or 3 projects) and follow the upgrade CTA to `/pricing`.
5. Start Stripe Checkout with a test card, return to Pricing, and wait for the webhook to confirm the plan.
6. Open Settings and use **Manage / Upgrade** or **Manage / Downgrade** to switch plans in the Customer Portal.
7. Cancel checkout once to confirm the cancelled-state message.

## Local setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project.

3. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Fill in `.env.local` with your own values. Never paste production secrets into the README or commit `.env.local`.

5. Run the SQL files in the [Supabase SQL Editor](#supabase-sql-files) in the order below.

6. Configure Stripe Sandbox and the webhook endpoint.

7. Start the app:

   ```bash
   npm run dev
   ```

Next.js may serve the app on port 3000. If that port is taken, it will use the next free port (this project has used `http://localhost:3001` for local auth redirects).

## Required environment variables

Copy names from `.env.example`. Use placeholder values there, never real secrets.

| Name | Where it is used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Safe to expose in the browser; still do not commit real keys in git history if you can avoid it |
| `STRIPE_SECRET_KEY` | Server only | Sandbox/test secret (`sk_test_...`). Live keys are rejected |
| `STRIPE_PRO_PRICE_ID` | Server only | Sandbox Pro monthly price ID |
| `STRIPE_BUSINESS_PRICE_ID` | Server only | Sandbox Business monthly price ID |
| `STRIPE_WEBHOOK_SECRET` | Server only | Signing secret (`whsec_...`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Webhook profile updates. Never prefix with `NEXT_PUBLIC_` |

Optional:

| Name | Notes |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Local auth origin override, for example `http://localhost:3000` |

Production auth redirects currently use `https://client-flow-neon.vercel.app`. Keep Vercel env vars in the Vercel dashboard, not in git.

## Supabase SQL files

Do **not** run these files from the app. Paste each file into the Supabase SQL Editor and run them in this order.

Verified execution order from table and trigger dependencies:

1. `supabase/profiles.sql` — `profiles` table, RLS, and the signup trigger
2. `supabase/onboarding.sql` — onboarding columns on `profiles`
3. `supabase/clients.sql` — `clients` table and RLS
4. `supabase/projects.sql` — `projects` table; depends on `clients`
5. `supabase/invoices.sql` — `invoices` table; depends on `clients` and `projects`
6. `supabase/subscriptions.sql` — plan and Stripe columns on `profiles`
7. `supabase/protect-profile-billing.sql` — column-level grants so users cannot write billing fields
8. `supabase/plan-limits.sql` — Free-plan insert limits for clients and projects
9. `supabase/fix-profile-billing-trigger.sql` — makes the billing-protection trigger safe for onboarding/settings writes

Notes:

- `profiles.sql` is independent of `clients.sql`. Running profiles first is correct.
- `plan-limits.sql` needs the `clients` and `projects` tables **and** `profiles.plan` from `subscriptions.sql`.
- If you re-run `profiles.sql` later, run `protect-profile-billing.sql` and `fix-profile-billing-trigger.sql` again.

## Stripe Sandbox setup

Do not switch this project to Stripe Live mode until you are ready for real charges.

1. Create a Stripe Sandbox (test) account.
2. Create two monthly USD prices that match the in-app amounts:
   - Pro: `$19 / month`
   - Business: `$49 / month`
3. Put the test secret key and price IDs in `.env.local` / Vercel:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_BUSINESS_PRICE_ID`
4. Checkout upgrades Free users only. Paid users who switch Pro ↔ Business are sent to the Customer Portal so they do not start a second subscription.

## Webhook setup

Checkout success does **not** upgrade the plan by itself. The signed webhook updates `profiles`.

1. Point a Stripe Sandbox webhook at:
   - Local: `https://<your-tunnel>/api/stripe/webhook` or the Stripe CLI forwarder
   - Production: `https://client-flow-neon.vercel.app/api/stripe/webhook`
2. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Set `STRIPE_WEBHOOK_SECRET` to the endpoint signing secret.
4. Set `SUPABASE_SERVICE_ROLE_KEY` so the webhook can write billing columns.

After checkout, Pricing may briefly say the subscription is still confirming. That is expected until the webhook lands.

## Local development commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
```

## Deployment notes

- The production demo is on Vercel: [https://client-flow-neon.vercel.app](https://client-flow-neon.vercel.app)
- Set the same env vars in Vercel as in `.env.example`
- Confirm the Stripe webhook URL matches the deployed origin
- Confirm Supabase Auth redirect URLs include the production origin and `/auth/callback`
- Password reset uses `/auth/recovery`
- Keep Stripe in Sandbox until you intentionally go live

## Security notes

- `.env*` is gitignored except `.env*.example`
- Billing columns on `profiles` are not writable by authenticated clients
- RLS remains enabled on app tables
- The Stripe webhook verifies `stripe-signature` before processing
- Live Stripe secret keys are rejected by the app
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-only
- Do not log request bodies, Stripe customers, or env values in the client

## Known limitations

- Stripe is Sandbox / Test only
- Invoices are records, not emailed payment links
- Business “team features” and “advanced reporting” are placeholders
- Free-plan limits apply to clients and projects, not invoices
- Plan upgrades can lag a few seconds behind checkout while the webhook runs
- There is no self-serve account deletion UI
- There is no team/multi-user workspace yet

## Roadmap

- Stripe Live mode, after a dedicated live-key and webhook pass
- Invoice sending / payment collection
- Client portal
- Team seats on Business
- Stronger reporting and saved views
- Account deletion and data export

## License

Private / portfolio project. Ask before reusing.
