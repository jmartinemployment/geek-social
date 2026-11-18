# geek-social handoff, 2026-11-15

Where the GeekSocial operator screen stands. Read `README.md` for what the app is and how it talks
to GeekAPI. This file is what the README does not say: what was checked, what was not, and what
comes next.

The setup detail (Meta app, Railway variables, platform list) is recorded in
`GeekBackend/plans/geek-social-handoff-2026-11-12.md`. That file is the source for everything
outside this repo and is not repeated here, so the two cannot drift. It is three days old: re-check
any state it describes before acting on it.

## 2026-11-18: the AI provider is replaceable (roadmap Phase 0, item 1)

Deployed: GeekBackend `b5fd0ede` (Railway deployment `5880ee59`, started cleanly) and this repo `68b8e37`
(Vercel `dpl_E4Kf9znTTYXJLWrC8jt3qVdzrUAS`, READY). Before the GeekAPI deploy, on Railway:
- `GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS` (`facebook`, cleared for Claude) was removed, because the new GeekAPI
  refuses to start while it is set;
- `GEEK_SOCIAL_AI_CLEARED_PLATFORMS` was set to `anthropic:facebook`, the same clearance in the new form.

`LlmProviders__DefaultProvider` is `OpenAI` (Content Creator's setting) and was left as it is. GeekSocial now
follows it, so it calls OpenAI. OpenAI is not cleared for Facebook, so every Facebook comment is held
(`blocked_no_clearance`) and no comment text is sent until `openai:facebook` is added (after M4 is checked for
OpenAI), or the provider is changed. Post copy needs no clearance and goes to OpenAI. Proven by tests only (fake
HTTP handlers for all five providers); no live AI call has been made since the deploy.

## 2026-11-18: Phase 0 items 2 to 7 deployed

Each was deployed backend first, then this repo; every Railway deploy ended SUCCESS on all three services, and
every Vercel production deployment is READY.

| Item | GeekBackend | This repo |
|---|---|---|
| 2. Auto-send removed: a person approves every reply | `3f2a7ca8` | `fbe66b7` |
| 3. Status is per tenant, failures kept 30 days (migration 0073 applied at GeekRepository startup) | `6582f02d` | `bdef3d2` |
| 4. `connect/meta/start` and `posts/copy` check the tenant; `posts/copy` needs the AI terms | `22598962` | (none) |
| 5. The post form offers only what the network accepts, read from `GET /api/social/platforms` | `d2a661b1` | `2e80e0c` |
| 6. Wording: no setting names or Meta setup steps on the screens, "accounts" not "Pages", the AI terms name the commenter's name and the post-suggestion data, post copy names the tenant's business | `63304119` | `4860e39` |
| 7. Cross-tenant tests for every GeekAPI social route (`SocialRouteTenantIsolationTests`); they gate every release | `dd6f20aa` | (none) |

Proven by tests only, not yet on the live site: none of these has been used signed in. The status queries
(item 3) run only against Railway's Postgres; CI does not run the integration tests. The AI terms' text changed
in item 6; a tenant that accepted before then accepted the earlier text, and nothing asks them again (roadmap
Q18).

**Legal pages, drafted and not published.** `/privacy` and `/terms` are on the local branch `legal-pages`
(`9aa80c4`), not pushed, because main deploys publicly and the text needs the owner's approval. Before they
can go public:
- The 30-day deletion they promise is not built: only LinkedIn sets `text_expires_at`, Facebook comment text
  and names are never purged, and drafts are not deleted with their comment. No Phase 0 item builds it.
- Governing law is proposed as Florida (Palm Beach County) and is not confirmed.
- The owner accepts the process promises: deletion within 30 days on request by email, notice before an AI
  provider change, and the Facebook menu path for removing the app.
- The tenant-isolation statement is now backed by items 4 and 7.

## 2026-11-18: Phase 0 walkthrough, part 1, and the feasibility documents

**Walkthrough, signed in on `geek-social.geekatyourspot.com`** (this repo at `a0d6baf`):
- Live updates connected, with no "Live updates are off" banner.
- Activity shows this tenant's own counts (item 3's queries work against Railway's Postgres) and names the AI
  provider as OpenAI, `gpt-4.1`.
- No auto-send setting appears.
- `/robots.txt` disallows everything.
- The post form loads the capability matrix from GeekAPI.

**Not reached:** connecting a Page, a comment arriving, a draft and its approval. Three things block them:
- GeekAPI lacks `GEEK_SOCIAL_META_VERIFY_TOKEN` and `GEEK_SOCIAL_META_LOGIN_CONFIG_ID`, so no Page can connect.
  Activity says so.
- No platform is cleared for OpenAI, so a comment would be held.
- The Meta app has no Pages use case or test Page yet (`GeekBackend/docs/PLATFORM-CAPABILITIES.md:580-582`).

**Feasibility documents (no product code):**

| Item | Where | Commit |
|---|---|---|
| 8. Platform access register: one row per network, cited | `GeekBackend/docs/PLATFORM-ACCESS-REGISTER.md` | `245cd4d6`, `3c32867e`, `f677585a` |
| 11. Connector contract, Facebook checked clause by clause | `GeekBackend/docs/SOCIAL-CONNECTOR-CONTRACT.md` | `34bde5cf`, `245cd4d6` |
| 10. Verified capability matrix, operation by operation, every network | `GeekBackend/docs/PLATFORM-CAPABILITY-MATRIX.md` | `a619b824` |
| 12. Unit-economics model | `plans/geek-social-unit-economics-2026-11-18.md` | `99818f0` |

What they found that needs a decision:
- **Meta's permission name.** Meta's Pages guides now name `pages_read_user_engagement` for reading comments.
  The permissions reference and the connector (`MetaAccountConnector.cs:26`) use `pages_read_user_content`. If
  the Login for Business configuration offers only the new name, every connect fails, naming the missing
  permission. Check this when creating the configuration.
- **Most networks have no native scheduling.** Only Facebook, Google Business Profile and YouTube schedule
  natively, so GeekSocial's own scheduler is the general path for Phase 2.
- **Media transport is split.** LinkedIn, X and YouTube take only bytes. Instagram, Nextdoor and TikTok's
  Business API take only URLs, and TikTok's must be on a verified domain. Phase 2's media design has to serve
  both.
- **The configured model shuts down.** OpenAI shuts `gpt-4.1` down on 2027-01-14 and names `gpt-6-luna` as the
  replacement, which costs a twentieth as much. Changing `GEEK_SOCIAL_AI_MODEL` is a Railway change. Run one live
  triage first, to check that its 400-token output limit is enough.
- **Nextdoor's Publish API form excludes GeekSocial's use.** It says the API "is not available for promoting your
  own business or your clients' businesses". Nextdoor's Share Plugin needs no approval, which the roadmap's
  Nextdoor line does not reflect. See the register's Nextdoor section.
- **X is the largest per-tenant cost for any tenant that uses it.** A link post costs $0.200. A flat price loses
  money on a heavy X tenant below $99 (input to Q2).
- **AI token counts are not kept.** Every model client returns them, and no caller keeps them. So the cost model
  and the planned daily AI cap cannot be checked against real use.
- **Connector contract gaps 1 and 2.**
  - Gap 1: a refused token does not mark the account `reconnect_required`.
  - Gap 2: there is no disconnect, and no Meta deauthorize or data-deletion callback. Meta's review needs a
    deletion URL or callback.
  - Gap 2 can be met for the review by the draft privacy policy's `#delete` section, once it is published.
- **`PLATFORM-CAPABILITIES.md` corrected.** Three LinkedIn lines now match its own section 2j: webhooks need the
  Standard tier, the payload can carry comment text, and whether technical sign-off gates Standard is UNVERIFIED.

## Where it stands at the end of 2026-11-16

Every screen now renders on the server (Server Components read GeekAPI through `src/lib/server/social-api.ts`;
changes are Server Actions that hand GeekAPI's refusals back as data). Inbox shipped in `5e2a708`.
Comments, Accounts, Posts, Activity and the Meta callback shipped in `472c7a8` and `9cb8c38`, pushed and
deployed to `geek-social.geekatyourspot.com` (Vercel deployment `dpl_12Qa97Z84cUjrpMBAzzEBKLnhNBp`, READY).
Checks that passed before the push: 207 tests, typecheck, lint, build.

**None of the five screens has been used against the real GeekOAuth and GeekAPI.** The tests inject fake
actions and a fake `EventSource`; the one browser run (Inbox, `5e2a708`) was against a local stand-in for
GeekOAuth and GeekAPI, which proves nothing about the real services. The only live check of the new build is
that `/comments` without a session redirects to the GeekOAuth sign-in page. The browser used for that was
not signed in, and nobody has signed in or signed up to GeekSocial yet.

How to test, decided by Jeff: on the deployed site, never on localhost, and never with installed or
throwaway infrastructure (no local Postgres, Docker or stand-in services). Sign in by hand in Chrome, then
drive `/`, `/comments`, `/accounts`, `/posts`, `/activity` and `/connect/meta/callback`. Registration
needs the confirmation email, so it cannot be done by an agent alone.

Not verified at all:

- Migration 0064 (`geek_seo`/tenant tables) applied on Railway Postgres, and the tenant isolation
  integration tests (all 10 failed before running: the helper applies only SQL scripts and `geek_seo` comes
  from EF migrations). Railway `get-logs` needs a permission rule from Jeff.
- The server pages' rendering. What they decide is tested without a request, in `src/lib/social/page-reads.ts`
  (which account the address names and the unknown-account warning, the Inbox reads and the truncation flag, and
  whether a failed panel read is shown or rethrown). The JSX around it is not: the pages read GeekAPI through the
  session cookie, so they only run inside a real request.
- The Meta connect and callback round trip against Meta.

Removed on 2026-11-17: the `/api/social/[...path]` proxy route, `proxy-path.ts`, the browser exports in
`src/services/social-api.ts` and the `proxyDraftActions` / `proxyCommentActions` adapters. Nothing in the browser
can reach GeekAPI's social routes now; only the server does. The draft and social-api tests run over a fake
transport (`src/test/fake-api.ts`) instead of a stubbed `fetch`.

## Verified on 2026-11-16 (sign-in)

`main` (`github.com/jmartinemployment/geek-social`) carries the confidential Backend-for-Frontend
sign-in, deployed to `geek-social.geekatyourspot.com` (`8cff9f7`) together with GeekOAuth `1880409`,
which seeds `geek-social` as a confidential client. The five variables are set in Vercel (Production
only) and `GEEK_SOCIAL_CLIENT_SECRET` in Railway. Live checks after the deploy: `/api/auth/login`
redirects to GeekOAuth with S256 PKCE, state, nonce and the new callback; GeekOAuth accepts that
request and sends it to its login page; `/api/auth/register` lands on `/Account/Register` carrying the
authorize request as `returnUrl`; a page with no session redirects to sign-in; `/api/live-updates`
answers 401 without a session; the old `/api/auth/start` and `/api/auth/hub-token` are gone.

The checks on that code:

- `npm run typecheck`: clean. `npm run lint`: clean.
- `npm test`: 165 of 165 pass (2026-11-16, with the component tests below). They include the real login, register, callback and logout routes and
  `src/proxy.ts` run against a stand-in GeekOAuth (`src/test/mock-idp.ts`) that enforces the client
  secret, the PKCE verifier and single-use refresh tokens. They cover state, nonce, audience and
  signature refusals, a refused refresh token, GeekOAuth being unreachable, and two requests sharing
  one refresh.
- `npm run build`: succeeds with the five variables set, and stops naming each one when they are not.
- Against the real GeekAPI: a session carrying an invalid token opens `/api/live-updates`, which
  answers `off` with "GeekAPI refused the live connection's sign-in (401)" and closes. This is what
  found that a first-connect 401 was being retried forever; it is fixed and tested.

## What is built

Every page in the README table exists: Inbox (`/`), `/comments`, `/accounts`,
`/connect/meta/callback`, `/posts`, `/activity`, plus GeekOAuth sign-in as a confidential BFF client (PKCE, state and nonce, ID token
verified against the JWKS, encrypted httpOnly session cookie, sign-up through `/Account/Register`),
and live updates (the server holds the SignalR connection
and streams it to the browser over Server-Sent Events) with a banner when the connection is down.

## What has not been done or checked

- **It has never run against a real GeekOAuth, GeekAPI or Facebook Page.** The sign-in was run only
  against a stand-in GeekOAuth, and the live stream only as far as GeekAPI refusing a bad token. No
  real sign-in, no successful hub connection, no draft going through. This is the open gate (Phase 6
  in the GeekBackend handoff).
- **GeekOAuth's Register flow is untested end to end.** `Register`, the confirmation email link and
  `ConfirmEmail` now carry the authorize request as `returnUrl` (GeekOAuth `1880409`, deployed;
  `AuthorizeReturnUrl` has unit tests, the Razor pages have none, and no one has yet signed up or
  signed in through it). Registration does not sign
  the person in, because email confirmation is required: they register, confirm, and sign in once.
- **Deployed, never signed in to.** Vercel project `geek-social` serves `main` on
  `geek-social.geekatyourspot.com`. The GeekBackend handoff's "no Vercel project yet" is
  out of date. There is no `.env.local` in this checkout.
- **Registrations outside this repo.** GeekAPI answers `api/social/*` and the hub (401 without a
  token), so GeekBackend `e2c0229` is live. The Meta app settings and Railway variables were not
  checked.
- **`https://geek-social.vercel.app` is not this project.** This project's Vercel addresses are
  `geek-social-coral.vercel.app` and `geek-social.geekatyourspot.com`; that host serves a different
  app. It is removed from the README, `.env.example`, GeekOAuth (`9b02de5`) and GeekBackend
  (`346dfe3`), both pushed and deployed on 2026-11-16; GeekOAuth now answers 400 for it. The Meta app
  console entry still has to be removed by hand. See `AUDIT.md`.
- **Tests are against injected fakes.** In a jsdom harness (`src/test/dom.ts`) each client view takes an
  `actions` prop and a thin wrapper binds the real Server Actions (tests cannot import server-action
  modules: env validation throws). Covered: `DraftCard`, `InboxView`, `CommentsView`, `AccountsView`,
  `PostWriter`, `StatusView` with `LiveRefresh` and `ReloadButton`, `MetaCallbackView`, `Time`,
  `SocialHubProvider`, `useServerRefresh` (idle path and the coalescing of a burst), `ActionResult`, `page-reads`. Not covered: the server pages,
  `AppNavbar` and the UI primitives.
- **CI on GitHub.** `.github/workflows/ci.yml` runs typecheck, lint, tests, the build and `npm run
  check:trace` on every push and pull request.
  - **Fonts:** on 2026-11-16, two of five runs failed in `next build` while fetching Fraunces from Google Fonts. The fonts are now served from the `@fontsource-variable` packages, and the runs since (2026-11-17, 2026-11-18) are green.
  - **check:trace:** it rebuilds the SignalR hub connection from only the files Vercel would ship for `/api/live-updates`, and fails on a missing module. The deployed function had been failing with "Cannot find module 'ws'"; `next.config.ts` `outputFileTracingIncludes` fixes that (`f9745fe`).
- **Only the Facebook connector is built.** GeekSocial is multi-platform and never was a Facebook
  tool: Instagram, LinkedIn, Google Business Profile, X, TikTok, YouTube and Pinterest are in scope, and
  Nextdoor as plan-and-approve (README, "Platforms"; `plans/geek-social-roadmap-2026-11-18.md`).
  Their connectors are GeekAPI work, not this repo's; the screens are platform-neutral apart from the
  Facebook connect flow on `/accounts`.
- **No billing yet.** GeekSocial is a paid SaaS that uses PayPal (README, "Billing"). Sign-up is open
  and free today: anyone who registers on GeekOAuth and finds the site gets a tenant at `/welcome`.

## Run it locally

This is how the app is started, not how it is tested: Jeff tests on the deployed site only (see above).

```bash
cp .env.example .env.local   # then set the five variables; OAUTH_REDIRECT_URI=http://localhost:3006/api/auth/callback
npm install
npm run dev                  # http://localhost:3006
```

Sign-in needs `http://localhost:3006/api/auth/callback` and `http://localhost:3006/signed-out`
registered on the GeekOAuth `geek-social` client (its seed does this). The token must carry the
`geeksocial.manage` scope or every `api/social` route answers 403.

## Rules this repo enforces

`src/test/source-rules.test.ts` fails the test run on: an em dash anywhere in the source, a timer
used to poll, a raw `WebSocket`, a raw `EventSource` anywhere except `src/services/live-stream.ts`,
anything kept in browser storage, and a `<form>` whose `action` or `method` is a string (a function is
allowed: that is a Server Action, with no page reload). Live updates
come over the one stream from `/api/live-updates`; after every connect and reconnect each page
re-reads what it shows through REST.
Do not work around these; change the design instead.

Failures are shown, not swallowed: a refusal carries GeekAPI's own status, code and message (plain text is
displayed as it came), and a refused token is never replaced with another credential.

## Next steps, in order

1. What the owner does or decides before the walkthrough can go on:
   - In the Meta app, create the Facebook Login for Business configuration and give its id, for
     `GEEK_SOCIAL_META_LOGIN_CONFIG_ID`. Note whether it offers `pages_read_user_content` or only
     `pages_read_user_engagement`.
   - Approve generating `GEEK_SOCIAL_META_VERIFY_TOKEN`; it is set on Railway and entered in the Meta webhook
     settings.
   - Choose the AI provider and model, given `gpt-4.1`'s shutdown, and clear it for Facebook. Either add
     `openai:facebook` once M4 is checked for OpenAI, or switch to Anthropic, which is cleared.
   - Approve the legal pages' text and governing law, and their push (this repo is public).
   - Decide whether connector contract gaps 1 and 2, and keeping the AI token counts, are built now.
   - Decide Nextdoor's plan.
2. Phase 0's live walkthrough, part 2 (part 1 is above): connect a Page on `/accounts`, read `/activity`, comment
   on a post, watch the draft arrive over SignalR, edit and approve it. A person approves every reply.
3. Confirm the external state: GeekAPI Railway variables, migration 0064 on Railway, the Meta app's login
   configuration and webhook, and GeekOAuth's client redirect URIs (GeekBackend handoff, "Railway variables"
   and "Meta app settings").
4. Remove `geek-social.vercel.app` from the Meta app console (`AUDIT.md` finding 1).
5. Later gates: image storage (7c), connectors one platform at a time, the 30-day retention purge,
   and the confirmed-email onboarding check and 403 handling from 7b.
