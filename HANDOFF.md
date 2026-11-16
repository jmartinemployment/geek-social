# geek-social handoff, 2026-11-15

Where the GeekSocial operator screen stands. Read `README.md` for what the app is and how it talks
to GeekAPI. This file is what the README does not say: what was checked, what was not, and what
comes next.

The setup detail (Meta app, Railway variables, platform list) is recorded in
`GeekBackend/plans/geek-social-handoff-2026-11-12.md`. That file is the source for everything
outside this repo and is not repeated here, so the two cannot drift. It is three days old: re-check
any state it describes before acting on it.

## Verified on 2026-11-16

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
`/connect/meta/callback`, `/posts`, `/activity`, plus GeekOAuth sign-in as a confidential BFF client (PKCE, state and nonce, ID token
verified against the JWKS, encrypted httpOnly session cookie, sign-up through `/Account/Register`),
the `/api/social/[...path]` Bearer proxy, and live updates (the server holds the SignalR connection
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
- **No component or page tests.** `DraftCard`, the six pages and the hooks are covered only by
  typecheck, lint and build.
- **Facebook Pages only.** Other platforms are connectors in GeekAPI, not work in this repo; the
  screen is platform-neutral.

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

1. Confirm the external state: GeekAPI Railway variables, Meta app login configuration and webhook,
   GeekOAuth client redirect URIs (GeekBackend handoff, "Railway variables" and "Meta app settings").
2. Run locally, sign in, connect a Page on `/accounts`, read `/activity`.
3. Comment on a post, watch the draft arrive over SignalR, edit and approve it. Leave auto-send off
   until several drafts have been reviewed.
4. Remove `geek-social.vercel.app` from the Meta app console (`AUDIT.md` finding 1).
5. Add tests for the draft actions in `src/components/social/DraftCard.tsx`.
