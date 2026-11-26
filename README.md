# Assistar AI

AI customer experience platform: build assistants, give them your knowledge, put them on your website,
hand difficult conversations to your team, and see what to improve.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase (Auth, Postgres, RLS), Recharts.

## 1. Database

The Supabase project may be shared with other apps. Everything here is prefixed `assistar_` and the signup
trigger only acts on Assistar signups, so other apps are untouched. In the Supabase SQL Editor, paste and run,
in order (both are safe to re-run):

1. `supabase/migrations/0001_auth_foundation.sql`
2. `supabase/migrations/0002_platform.sql`

(`supabase/check_existing_schema.sql` is an optional read only check to run first on an old project.)

## 2. Environment variables

Copy `.env.example` to `.env.local` for local work, and add the same variables in your host (for example Vercel).
`NEXT_PUBLIC_*` values are compiled in at build time, so redeploy after changing them.

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Login, signup, everything |
| `NEXT_PUBLIC_SITE_URL` | Links in the dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Website widget conversations, Selar webhook |
| `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` | Agent replies, tests |
| `SELAR_WEBHOOK_SECRET` | Verified subscription activation |

Settings, then Server configuration, in the dashboard shows which of these are set (never their values).

## 3. Supabase Auth settings

Authentication, URL Configuration: set the Site URL to your deployed address and add
`https://YOUR-APP/auth/callback` to the redirect URLs.

## 4. Billing with Selar

Prices come from the three Selar checkout pages (USD 47, 57 and 97 per month). `src/config/plans.ts` holds the
links, names and feature lists. Names and features are placeholders because Selar does not publish them.

A subscription is activated only by `POST /api/webhooks/selar` when the request carries `SELAR_WEBHOOK_SECRET`
(header `x-webhook-secret` or `?secret=`), reports a successful payment, the buyer email matches an account, and the
amount matches a plan. Every event is stored in `assistar_payment_events`. The payload field names Selar sends are not
documented publicly, so send one real test payment and check `src/lib/selar.ts` against what was stored.

## 5. What works

Public site (home, platform, solutions, features, pricing), signup, login, password reset, invitations, onboarding,
and the dashboard: agents and templates, Agent Studio with versions and a publish step, knowledge base (PDF, DOCX,
TXT, MD, CSV, JSON), shared inbox with handoff and notes, customer memory, website widget, webhook actions with
approval, testing, analytics, monitoring, team and roles, Slack notifications, billing and settings.

Not connected (needs provider credentials and testing): email, WhatsApp, SMS, voice, HubSpot, Salesforce, Shopify,
Google Calendar. They are shown as not connected, never as working.

## Development

```
npm install
npm run dev
npm run typecheck
```
