# geek-social handoff, 2026-11-15

Where the GeekSocial operator screen stands. Read `README.md` for what the app is and how it talks
to GeekAPI. This file is what the README does not say: what was checked, what was not, and what
comes next.

The setup detail (Meta app, Railway variables, platform list) is recorded in
`GeekBackend/plans/geek-social-handoff-2026-11-12.md`. That file is the source for everything
outside this repo and is not repeated here, so the two cannot drift. It is three days old: re-check
any state it describes before acting on it.

## Verified on 2026-11-16

`main` (`github.com/jmartinemployment/geek-social`) is at the code that was deployed on 2026-11-16
and signs in with a public client. The branch `bff-auth` replaces that with a confidential
Backend-for-Frontend client (below). It is committed and **not merged or pushed**: pushing it to
`main` deploys it, and the build fails until the five variables exist (see "To switch over").

On `bff-auth`:

- `npm run typecheck`: clean. `npm run lint`: clean.
- `npm test`: 80 of 80 pass. They include the real login, register, callback and logout routes and
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
`/connect/meta/callback`, `/posts`, `/activity`, plus GeekOAuth sign-in as a confidential BFF client (`bff-auth`: PKCE, state and nonce, ID token
verified against the JWKS, encrypted httpOnly session cookie, sign-up through `/Account/Register`),
the `/api/social/[...path]` Bearer proxy, and live updates (the server holds the SignalR connection
and streams it to the browser over Server-Sent Events) with a banner when the connection is down.

## What has not been done or checked

- **It has never run against a real GeekOAuth, GeekAPI or Facebook Page.** The sign-in was run only
  against a stand-in GeekOAuth, and the live stream only as far as GeekAPI refusing a bad token. No
  real sign-in, no successful hub connection, no draft going through. This is the open gate (Phase 6
  in the GeekBackend handoff).
- **GeekOAuth's Register flow is untested end to end.** `Register`, the confirmation email link and
  `ConfirmEmail` now carry the authorize request as `returnUrl` (GeekOAuth, committed locally, not
  pushed; `AuthorizeReturnUrl` has unit tests, the Razor pages have none). Registration does not sign
  the person in, because email confirmation is required: they register, confirm, and sign in once.
- **Deployed, never signed in to.** Vercel project `geek-social` has a READY production deployment of
  `main` on `geek-social.geekatyourspot.com`. The GeekBackend handoff's "no Vercel project yet" is
  out of date. There is no `.env.local` in this checkout.
- **Registrations outside this repo.** GeekAPI answers `api/social/*` and the hub (401 without a
  token), so GeekBackend `e2c0229` is live. The Meta app settings and Railway variables were not
  checked.
- **`https://geek-social.vercel.app` is not this project.** This project's Vercel addresses are
  `geek-social-coral.vercel.app` and `geek-social.geekatyourspot.com`; that host serves a different
  app. It is removed from the README, `.env.example`, GeekOAuth (`9b02de5`) and GeekBackend
  (`346dfe3`), both pushed and deployed on 2026-11-16; GeekOAuth now answers 400 for it. The Meta app
  console entry still has to be removed by hand. See `AUDIT.md`.
- **No component or page tests.** `DraftCard`, the six pages and the hooks are covered only by
  typecheck, lint and build.
- **Facebook Pages only.** Other platforms are connectors in GeekAPI, not work in this repo; the
  screen is platform-neutral.

## To switch over to `bff-auth`

In this order; the first two are safe on their own.

1. **Generate one secret** and keep it for steps 2 and 3: `openssl rand -base64 32`.
2. **GeekOAuth** (Railway project GeekOAuth): set `GEEK_SOCIAL_CLIENT_SECRET` to that value, then
   deploy the GeekOAuth commit that carries the confidential-client seed and the Register
   `returnUrl` change. Until the variable is set, the seed logs an error and leaves the client as it
   is, so sign-in keeps working. When it is set, the seed makes `geek-social` confidential, registers
   `/api/auth/callback` and grants the `roles` scope.
3. **Vercel** (project `geek-social`, Production and Preview): set `OAUTH_ISSUER_URL`,
   `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` (the same value), `OAUTH_REDIRECT_URI`
   (`https://geek-social.geekatyourspot.com/api/auth/callback`) and `SESSION_SECRET` (a second,
   different `openssl rand -base64 32`).
4. **Merge `bff-auth` into `main` and push.** The Vercel build fails if a variable is missing, which
   leaves the previous deployment serving.
5. Sign in, then sign up with a new address, and check `/api/live-updates` stays open in DevTools.

The old public-client sign-in stops working at step 2 (a public client has no secret to send), so do
2 and 4 close together.

## Run it locally

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
and anything kept in browser storage. Live updates
come over the one stream from `/api/live-updates`; after every connect and reconnect each page
re-reads what it shows through REST.
Do not work around these; change the design instead.

Failures are shown, not swallowed: the proxy returns the upstream status and message (plain text is
displayed as it came), and a refused token is never replaced with another credential.

## Next steps, in order

0. Switch over to `bff-auth` (above).
1. Confirm the external state: GeekAPI Railway variables, Meta app login configuration and webhook,
   GeekOAuth client redirect URIs (GeekBackend handoff, "Railway variables" and "Meta app settings").
2. Run locally, sign in, connect a Page on `/accounts`, read `/activity`.
3. Comment on a post, watch the draft arrive over SignalR, edit and approve it. Leave auto-send off
   until several drafts have been reviewed.
4. Remove `geek-social.vercel.app` from the Meta app console (`AUDIT.md` finding 1).
5. Add tests for the draft actions in `src/components/social/DraftCard.tsx`.
