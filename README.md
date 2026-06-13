# PalmInsight 🔮✋

AI-powered palm reading web app. Upload or capture a photo of your palm and the
app detects your hand, highlights your four major palm lines, and generates
instant, shareable interpretations — with a premium "Deep Report" upgrade.

Built per the Product Requirements Document. **It runs with zero configuration**
(mock payments + in-memory storage) so you can demo immediately, and becomes
fully production-grade by adding Polar and Supabase keys.

---

## Features

| PRD feature | Status |
| --- | --- |
| Landing page (`Scan Your Palm. Discover Your Story.`) | ✅ |
| Upload **and** mobile camera capture | ✅ |
| AI pipeline: hand detection → palm region → line geometry → rule engine → results | ✅ |
| Four palm lines: **Life** (red), **Heart** (blue), **Head** (yellow), **Fate** (green) | ✅ |
| Interactive colored SVG overlays, tap-a-line to expand, per-line toggle | ✅ |
| Result cards: title, pattern, interpretation, **confidence %**, overlay toggle | ✅ |
| Freemium: free = Life + Heart · premium ($5) = Head + Fate + reports | ✅ |
| **Server-side paywall gating** (premium text never leaves the server unpaid) | ✅ |
| Full destiny report · Career tendency report | ✅ |
| Love compatibility (two palms **or** partner birth date) | ✅ |
| Shareable Instagram-story card + share link (Web Share API) | ✅ |
| Polar.sh checkout + webhook | ✅ (mock fallback) |
| Supabase persistence + image storage | ✅ (in-memory fallback) |
| Privacy notice (images analyzed on-device, may be deleted) | ✅ |
| **User accounts** (email+password) + sessions, anonymous→account claiming | ✅ |
| **Reading history** ("My Readings"), per-user persistence | ✅ |
| **Optional palm-image storage** (opt-in consent) | ✅ |
| **Analytics + conversion dashboard** (`/admin`, tracks the 3–5% goal) | ✅ |
| **API rate limiting** (per-IP, all mutating routes) | ✅ |

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript** — frontend + API routes (replaces a separate Express server; one deployable unit).
- **Tailwind CSS** — styling.
- **@mediapipe/tasks-vision** `HandLandmarker` — **client-side** hand detection (privacy-friendly; palm photos are analyzed in the browser).
- **SVG overlays** — interactive, colored palm lines.
- **Polar.sh** — payments (Merchant of Record). **Supabase** — persistence. Both optional via env.

## How the AI works

Palm photos are analyzed **in the browser** with MediaPipe's hand-landmark model
(21 landmarks). The rule engine (`lib/palmistry.ts`) then:

1. Anchors anatomically-correct geometry for each line to the real landmarks
   (orientation-independent — works for left/right hands and mirrored photos).
2. Extracts geometric features (thumb spread, finger arch, palm width, middle-
   finger alignment, line length/curvature).
3. Maps features to discrete palmistry patterns using PRD-derived rules.
4. Generates interpretation text, confidence, and a premium narrative report.

Everything is **deterministic** — the same hand always produces the same reading
(it's "based on" the real detected hand, not random).

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — app runs without it
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Configuration

All keys are optional. See `.env.example`. Without them:

- **Payments** → a built-in **mock checkout** unlocks the Deep Report instantly.
- **Storage** → an **in-memory store** (per server process) holds readings.

### Enable real Polar.sh payments

1. Create a [Polar](https://polar.sh) organization and a **one-time product**
   for the Deep Report (set its price, e.g. $5).
2. Set `POLAR_ACCESS_TOKEN` (org access token) and `POLAR_PRODUCT_ID` (the
   product's id). Set `POLAR_SERVER=sandbox` to test, `production` to go live.
3. Set `NEXT_PUBLIC_BASE_URL` to your deployed URL.
4. (Recommended) Add a webhook endpoint at `/api/webhook/polar` for the
   `checkout.updated` and `order.paid` events and set `POLAR_WEBHOOK_SECRET`.
   The `/api/confirm` route also retrieves the checkout directly, so unlock
   works even before the webhook lands.
5. Set a strong `UNLOCK_TOKEN_SECRET`.

> Polar is a Merchant of Record — it handles sales tax/VAT for you, so no
> separate tax setup is needed.

### Enable Supabase persistence

1. Create a project and run [`supabase/schema.sql`](supabase/schema.sql).
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`. The server uses the service-role key; the table
   has RLS enabled with no public policies.

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/analyze` | Run the rule engine on landmarks → free result + `scanId` |
| `POST /api/checkout` | Start Polar checkout (or mock unlock) |
| `POST /api/confirm` | Confirm payment after Polar redirect → unlock token |
| `POST /api/report` | Return full premium result (requires paid + valid token) |
| `POST /api/compatibility` | Premium love compatibility |
| `POST /api/webhook/polar` | Polar webhook → mark scan paid |
| `GET /api/scan/[id]` | Public free portion of a reading (share links) |
| `POST /api/auth/signup` · `login` · `logout` · `GET me` | Accounts + sessions |
| `GET /api/history` | Current identity's saved readings |
| `POST /api/event` | Client funnel events (paywall viewed, share created) |
| `GET /api/admin/stats` | Analytics summary (admin-only) |

### Accounts, history & the analytics dashboard

- **Anonymous-first**: every visitor gets a signed anonymous id, so readings are
  saved and listed under **My Readings** without signing up. On signup/login,
  those anonymous readings are **claimed** into the account.
- **Auth** is self-contained: email + password, scrypt-hashed, with an
  HMAC-signed `httpOnly` session cookie. No external auth provider needed.
- **Optional image storage**: on the scan screen, a consent checkbox lets a user
  save the palm photo with the reading (off by default, per the privacy notice).
- **Dashboard** (`/admin`): set `ADMIN_EMAILS` (comma-separated) in your env;
  sign in with one of those emails to see users, scans, the conversion funnel,
  conversion rate vs. the 3–5% goal, and revenue.
- **Rate limiting**: per-IP sliding windows on `analyze`, `checkout`,
  `compatibility`, `auth`, and `event` (in-memory; swap for Redis in `lib/ratelimit.ts` for multi-instance).

## Security & privacy

- Premium content is stored server-side and **only returned with a valid,
  HMAC-signed unlock token after payment** — it never ships to free clients.
- Palm photos are analyzed on-device and are **not** included in share links or
  share cards (only the generated reading text is shared).

## Deploy

Deploys cleanly to **Vercel** (or any Node host). Set environment variables in
the dashboard and point `NEXT_PUBLIC_BASE_URL` at your domain.

## Project structure

```
app/            Pages (/, /scan, /privacy, /result/[id]) + API routes
components/      UI (capture, overlay, cards, paywall, compatibility, share)
lib/            palmistry rule engine, geometry, mediapipe, store, polar, etc.
supabase/       schema.sql
```

---

PalmInsight is for entertainment and self-reflection — readings are AI-generated
and not predictions of the future.
