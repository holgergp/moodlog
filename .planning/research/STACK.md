# Stack Research

**Domain:** Mobile-first single-user personal mood/energy tracker (web app)
**Researched:** 2026-04-20
**Confidence:** HIGH (core stack verified via Context7, npm, and official docs; auth section MEDIUM)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Svelte 5 + SvelteKit 2 | Svelte 5.55.x / SvelteKit 2.57.x | Full-stack web framework | Smallest shipped bundles of any mainstream meta-framework (65% smaller than Next.js on equivalent pages). Mobile-first daily logging means every KB matters on 4G. SvelteKit's form actions provide server-side mutation + progressive enhancement out of the box — the check-in form works without JS hydration delay. Runes ($state, $derived) are the stable Svelte 5 reactivity model and work outside .svelte files. No build complexity premium vs React. |
| Tailwind CSS v4 | 4.2.x | Utility-first styling | v4.0 (stable Jan 2025) is zero-config, 5x faster full builds, 100x faster incremental, replaces JS config with CSS-native @theme. Mobile-first breakpoints are default. Works with SvelteKit via @tailwindcss/vite. No separate PostCSS step. |
| Turso (LibSQL) | @libsql/client 0.17.x | Cloud SQLite database | Single SQLite file semantics + edge replication. Free tier covers this use case completely (5 GB, 500M row reads/month, 100 DBs). Cross-device sync is built in — phone writes to the same remote DB that desktop reads from. No Postgres operational overhead for a single-user app. |
| Drizzle ORM | 0.45.x | Type-safe DB queries + migrations | Native LibSQL/Turso dialect. Type-safe schema → TypeScript inference all the way to the query. Lightweight (no runtime overhead vs Prisma). `npx sv add drizzle` installs it via the official SvelteKit CLI. Drizzle Studio for inspecting data during development. |
| shadcn-svelte | latest (Svelte 5 branch) | Copy-paste UI primitives | Not an npm dependency — components are owned code you can freely resize, restyle, and extend. Built on Tailwind. Touch-target sizes are correct by default (44px minimum). Avoids the "looks like every other app" problem of full component libraries. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-activity-calendar | 3.2.x | GitHub-style calendar heatmap | The dedicated calendar heatmap component for mood/energy color-coding. Active maintenance (last publish Apr 15 2026), SSR-compatible, supports custom color scales, dark mode, tooltips. NOTE: This is a React component — see Architecture note below on using it inside Svelte. |
| Recharts | 3.3.x | Line/bar charts for insight views | Weekly trend lines, workload-vs-mood scatter. `ResponsiveContainer` handles mobile width automatically. Lighter than Chart.js for React-tree components. Built on SVG for crisp retina rendering. Same note as above re: React island. |
| @simplewebauthn/browser + @simplewebauthn/server | latest | Passkey authentication | For the single-user auth gate (see Auth section). Browser API wrapper with no external service dependency. Works over HTTPS and localhost. |
| vite-plugin-pwa | latest | PWA / add-to-homescreen | Enables "Add to Home Screen" on iPhone (the fastest path to a near-native mobile logging experience). Generates service worker, caches app shell. Integrates via SvelteKit Vite config. |
| @sveltejs/adapter-cloudflare | latest | Deployment adapter | Deploy SvelteKit to Cloudflare Pages (see Deployment section). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | Faster installs, disk-efficient for monorepo-style workspaces |
| Drizzle Kit | Schema migration CLI | `drizzle-kit generate` + `drizzle-kit migrate` — keeps schema in sync with Turso |
| Drizzle Studio | Local DB GUI | `drizzle-kit studio` — inspect, edit, and query your Turso DB during development |
| Vite | Dev server and bundler | Provided by SvelteKit; no additional config needed |
| TypeScript | Type checking | SvelteKit template ships with it; run `tsc --noEmit` as type-check step |

---

## Installation

```bash
# Scaffold
pnpm create svelte@latest moodlog
cd moodlog

# Add Drizzle via official SvelteKit CLI (handles config wiring)
npx sv add drizzle

# Database client
pnpm add drizzle-orm @libsql/client

# Tailwind CSS v4
pnpm add -D tailwindcss @tailwindcss/vite

# UI components (shadcn-svelte — run interactively to pick components)
npx shadcn-svelte@latest init

# Charts (React island approach — see Architecture section)
pnpm add react react-dom recharts react-activity-calendar

# Auth
pnpm add @simplewebauthn/browser @simplewebauthn/server

# PWA
pnpm add -D vite-plugin-pwa

# Deployment
pnpm add -D @sveltejs/adapter-cloudflare
```

---

## Alternatives Considered

| Our Choice | Alternative | Why Not |
|------------|-------------|---------|
| SvelteKit 2 | Next.js 15 | Next ships 65% larger bundles on comparable pages; App Router complexity is wasted on a single-user app with no team, no SEO requirement; React Server Components add mental overhead with no benefit here |
| SvelteKit 2 | Remix | Same React bundle overhead; Remix's loader/action model is SvelteKit's load/actions but heavier |
| Turso (LibSQL) | Supabase (Postgres) | Supabase is correct for multi-tenant apps; Postgres has no marginal benefit over SQLite at one user and one table of ~1,000 rows/year; Supabase free tier pauses after 1 week inactivity |
| Turso (LibSQL) | Cloudflare D1 | D1 is a good option if you're all-in on Cloudflare Workers; cross-device access requires HTTP API (more moving parts); Turso's TypeScript client is richer and Drizzle has a first-class Turso dialect |
| Turso (LibSQL) | PocketBase | PocketBase is a binary server you must host yourself; adds operational overhead; no official SvelteKit integration; overkill for single-user |
| Drizzle ORM | Prisma | Prisma's query engine is a separate binary; cold starts are slower; Drizzle is schema-first TypeScript, lighter, and has native LibSQL dialect |
| shadcn-svelte | Skeleton UI | Skeleton is a full component library (npm dep); harder to customise touch targets; shadcn gives you owned code |
| shadcn-svelte | DaisyUI | DaisyUI is Tailwind plugin-based; fine choice but fewer interactive primitives; shadcn-svelte has better accessible dialog/drawer patterns |
| Passkey (WebAuthn) | Magic Link | Magic link requires an email service (Resend, Postmark), an additional dependency; passkey on iPhone/iOS prompts with Face ID in one tap, which is lower friction for a daily check-in |
| Passkey (WebAuthn) | Shared secret / private URL | A private URL in a bookmark or password manager is acceptable for zero-auth, but provides no session expiry, no second-device protection, and is trivially leaked; passkey is one-tap on enrolled device with no UX cost after setup |
| Cloudflare Pages | Vercel | Both have generous free tiers; Cloudflare Pages has unlimited bandwidth (Vercel caps at 100 GB/month and technically restricts commercial use on Hobby); SvelteKit's adapter-cloudflare is official and well-maintained |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Chart.js | ~200 KB bundle, imperative canvas API, requires custom wrappers for React/Svelte, poor SSR story | Recharts (React, SVG-based, composable) |
| D3.js (direct) | Requires writing low-level DOM manipulation for every chart type; too much boilerplate for standard line/heatmap charts | Recharts (wraps D3 internally) or react-activity-calendar |
| ApexCharts / Highcharts / AG Grid | Commercial licensing for non-trivial use; heavy bundles (ApexCharts ~700 KB); designed for dashboards with dozens of chart types, not a 4-screen personal app | Recharts + react-activity-calendar |
| Prisma | ~40 MB query engine binary, slower cold starts, no native LibSQL dialect | Drizzle ORM |
| Supabase Auth | Designed for multi-tenant; brings an Auth UI, email templates, and JWT machinery that are wasted on one user; also couples you to Supabase for DB | @simplewebauthn |
| Auth.js / NextAuth | NextAuth is tightly coupled to Next.js session model; Auth.js SvelteKit port works but adds unnecessary session complexity for one-user passkey setup | @simplewebauthn/server direct integration |
| Expo / React Native | Native app for a single-user productivity tool has app-store overhead with no benefit; mobile-first web + PWA covers the use case | SvelteKit + vite-plugin-pwa |
| Tailwind CSS v3 | v3 requires PostCSS config, tailwind.config.js, and slower rebuild; v4 is the maintained path (v4.2 as of Feb 2026) | Tailwind CSS v4 |
| Next.js | ~65% larger baseline bundle than SvelteKit on equivalent pages; App Router has significant learning curve; no benefit for single-user non-public app | SvelteKit 2 |

---

## Auth Pattern: Passkey for Single-User

**Chosen approach: WebAuthn Passkey via @simplewebauthn**

For a single-user personal app accessed from phone + desktop, the constraints are:

1. No email service dependency (magic link requires one)
2. Must work on iPhone (Face ID), Android (biometric), and desktop (Touch ID / Windows Hello)
3. Must persist sessions across devices without a password
4. Setup cost is one-time; daily use is one biometric tap

**Implementation outline:**
- On first visit: register a passkey using `@simplewebauthn/browser` `startRegistration()` + server-side `verifyRegistrationResponse()` from `@simplewebauthn/server`. Store the credential in a `credentials` table in Turso.
- On subsequent visits: `startAuthentication()` + `verifyAuthenticationResponse()`. Issue a session cookie (HTTPOnly, Secure, SameSite=Strict) valid for 30 days.
- Server-side session check in SvelteKit's `hooks.server.ts` using `event.cookies`.
- The passkey syncs to iCloud Keychain (iOS/macOS) and Google Password Manager (Android/Chrome), so the second device is automatically enrolled after first setup.

**Session storage:** A `sessions` table in the same Turso DB (session_id, credential_id, expires_at). SvelteKit hooks validate on every request.

**Confidence:** MEDIUM — @simplewebauthn is the standard library for this pattern, but the full server-side SvelteKit integration requires a small amount of custom glue. No fully-integrated SvelteKit passkey template exists; follow the @simplewebauthn server guide directly.

---

## Architecture Note: React Chart Islands in SvelteKit

The recommended charting libraries (Recharts, react-activity-calendar) are React components. SvelteKit is a Svelte framework. This is intentional and manageable:

**Why not Svelte charting libraries?**
The Svelte charting ecosystem (LayerCake, svelte-chartjs) is less mature and has fewer maintained heatmap components. react-activity-calendar is the best standalone calendar heatmap available; Recharts is more ergonomic than any Svelte-native equivalent.

**How to use them in SvelteKit:**
SvelteKit supports React "islands" via a simple wrapper pattern:
1. Install `react`, `react-dom` (already in package.json)
2. Create a `.svelte` component that mounts a React root via `onMount`
3. Mark the component `export const ssr = false` if needed (charts are client-only)
4. This is a well-documented pattern; React and Svelte share the same DOM

**Bundle cost:** React + ReactDOM is ~42 KB gzipped. This is only loaded on the insight/chart pages, not on the check-in form. The check-in route stays at Svelte's ~1.6 KB baseline.

If this feels uncomfortable, `layercake` (Svelte-native, ~15 KB) can substitute for Recharts line charts, and `uiwjs/react-heat-map` has a Svelte port. But the React island approach is the pragmatic choice given the quality gap.

---

## Deployment

**Target: Cloudflare Pages (free tier)**

- Unlimited bandwidth, 500 builds/month, no surprise bills
- `@sveltejs/adapter-cloudflare` is official and actively maintained
- Environment variables (Turso URL + auth token) set via Cloudflare dashboard
- Automatic HTTPS — required for WebAuthn passkeys
- Deploy from GitHub push (zero-config CI)

**Turso DB:** Hosted on Turso free tier. The SvelteKit server functions (Cloudflare Workers) connect via `@libsql/client` using `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables.

---

## Stack Patterns by Variant

**If you want zero external DB dependency (full offline-first, local-only):**
- Replace Turso with `better-sqlite3` (local file) on a self-hosted Node server
- Lose cross-device sync; gain zero cloud dependency
- Not recommended: defeats the "phone + desktop" cross-device requirement

**If you decide auth friction is acceptable and want simpler sessions:**
- Replace passkey with a single hardcoded bcrypt password hash checked in SvelteKit hooks
- Simpler to implement, but password must be stored somewhere; no biometric
- Acceptable if you never access from a shared/public device

**If the React island pattern is a hard no:**
- Replace Recharts with LayerCake (Svelte-native, composable, ~15 KB)
- Replace react-activity-calendar with `uiwjs/react-heat-map` Svelte wrapper or custom SVG calendar component
- Adds ~2-3 days of custom chart work; acceptable if bundle purity matters more

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| svelte@5.55.x | @sveltejs/kit@2.57.x | SvelteKit 2 requires Svelte 5; fully stable together |
| tailwindcss@4.2.x | @tailwindcss/vite (bundled with Tailwind v4) | v4 ships its own Vite plugin; no separate postcss-tailwindcss |
| drizzle-orm@0.45.x | @libsql/client@0.17.x | Turso dialect is stable in 0.45.x; avoid v1.0 beta in production |
| @sveltejs/adapter-cloudflare | SvelteKit 2.x | Official adapter; keep in sync with SvelteKit patch versions |
| react@18.x + react-dom@18.x | recharts@3.3.x | Recharts 3.x requires React 18; do not mix with React 19 (not yet widely tested with Recharts) |
| react-activity-calendar@3.2.x | react@18.x | v3.x supports React 18; SSR-safe |

---

## Sources

- Context7 `/sveltejs/kit` — SvelteKit forms/actions, hooks, adapter patterns (HIGH confidence)
- Context7 `/recharts/recharts` — ResponsiveContainer, LineChart API (HIGH confidence)
- https://github.com/sveltejs/kit/releases — SvelteKit 2.57.1 confirmed latest, Apr 9 2026 (HIGH)
- https://github.com/sveltejs/svelte/releases — Svelte 5.55.4 confirmed latest (HIGH)
- https://turso.tech/pricing — Free tier limits verified: 5 GB, 500M row reads/month (HIGH)
- https://github.com/grubersjoe/react-activity-calendar — v3.2, last publish Apr 15 2026 (HIGH)
- https://orm.drizzle.team/ — Drizzle 0.45.x stable, v1.0 beta (MEDIUM)
- https://www.npmjs.com/package/@libsql/client — 0.17.2, published ~1 month ago (HIGH)
- https://infoq.com/news/2026/04/tailwind-css-4-2-webpack/ — Tailwind 4.2 released Feb 2026 (HIGH)
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/ — Cloudflare Pages + SvelteKit official guide (HIGH)
- WebSearch: SvelteKit vs Next.js bundle size benchmarks 2026 (MEDIUM — multiple sources agree)
- WebSearch: Turso vs D1 comparison 2026 (MEDIUM — multiple sources agree)
- WebSearch: passkey/WebAuthn single-user app patterns 2026 (MEDIUM — verified against @simplewebauthn docs)

---

*Stack research for: MoodLog — mobile-first personal mood/energy tracker*
*Researched: 2026-04-20*
