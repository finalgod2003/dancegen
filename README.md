# DanceClip AI

DanceClip AI is a web framework for a conservative AI dance video generator. The product flow follows `mvp PRD.md`: upload one clear adult solo photo, choose a low-risk template, generate a 5-second silent watermarked preview, then subscribe for HD/no-watermark downloads.

## Current Scope

- Next.js App Router + TypeScript + Tailwind web shell
- Public pages: `/`, `/ai-dance-generator`, `/ai-twerk-generator`, `/pricing`, `/terms`, `/privacy`, `/refund-policy`, `/payment/success`, `/payment/cancel`
- Internal scaffold: `/admin`
- API routes for Google login gate, upload pre-check, generation submission/status, Creem checkout/webhook, templates, and complaints
- `ModelProvider` abstraction with Viggle as the default public generator and EvoLink Seedance for member generation
- Conservative template catalog with public low-risk templates and internal-only twerk block
- Task status machine matching the PRD lifecycle

## Not Connected Yet

Database persistence, real Google OAuth, real Creem payment settlement, R2 transfer, and real safety classifiers are intentionally stubbed or pending production hardening. Fill `.env.local` from `.env.example` when integrating those services.

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

## Cloudflare Workers deployment

The app uses OpenNext to run its Next.js pages and API routes on Cloudflare Workers. Node.js compatibility, static assets, image optimization, and the self-service binding are configured in `wrangler.jsonc`. The adapter is pinned to a release compatible with this project's Next.js version.

```bash
pnpm install --frozen-lockfile
pnpm build:cloudflare
pnpm exec opennextjs-cloudflare deploy
```

For Cloudflare Workers Git integration, select `finalgod2003/dancegen`, production branch `main`, build command `pnpm build:cloudflare`, and deploy command `pnpm exec opennextjs-cloudflare deploy`. Use Node.js 24 and pnpm 10.33.1. `pnpm preview` runs the built app in the Workers runtime locally.

The build script handles Windows directory links and font paths, and removes bundled environment values so server credentials are supplied only by Worker secrets. Use Node.js 24 or newer on Windows.

Copy the existing production environment settings from Vercel before changing domain routing. Add public `NEXT_PUBLIC_*` values to the Cloudflare build environment; add server-side credentials from `.env.example` as Worker secrets (including the existing `BETTER_AUTH_SECRET`, database, Google OAuth, video provider, and payment credentials). Keep the canonical URL as `https://www.danceclip.org` when moving that domain so existing login and payment callbacks retain their URLs. Never commit secret values. For local Workers preview, use an ignored `.dev.vars` file.

Viggle driving videos are read through the `ASSETS` binding in Workers and from `public/` in ordinary Next.js development. No incremental cache storage is configured because the current app does not use ISR or data-cache revalidation.

Verify the Worker URL and API routes before assigning the production domains. Keep the existing Vercel deployment available until Cloudflare environment variables, domain routing, login, and payment callbacks have been verified.

## Template Decisions

The `liuxiaopai-demo` template is used as the architectural reference, not copied wholesale. This project keeps the SaaS layers that match the PRD and removes generic chat, image generation, docs, newsletter, credit packs, annual billing, password auth, and full i18n from the first version.
