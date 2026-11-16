# geek-social handoff, 2026-11-15

Where the GeekSocial operator screen stands. Read `README.md` for what the app is and how it talks
to GeekAPI. This file is what the README does not say: what was checked, what was not, and what
comes next.

The setup detail (Meta app, Railway variables, platform list) is recorded in
`GeekBackend/plans/geek-social-handoff-2026-11-12.md`. That file is the source for everything
outside this repo and is not repeated here, so the two cannot drift. It is three days old: re-check
any state it describes before acting on it.

## Verified on 2026-11-15

Run from this repo on `main` (`github.com/jmartinemployment/geek-social`). The commits after
`0720473` are local and not pushed:

- `npm run typecheck`: clean.
- `npm run lint`: clean.
- `npm test`: 30 of 30 pass (API client, inbox logic, wording, proxy path, hub retry rules, outcome
  rules, and the source rules).
- `npm run build`: succeeds; 13 routes, `src/proxy.ts` registered.

## What is built

Every page in the README table exists: Inbox (`/`), `/comments`, `/accounts`,
`/connect/meta/callback`, `/posts`, `/activity`, plus GeekOAuth sign-in (PKCE, httpOnly cookies),
the `/api/social/[...path]` Bearer proxy, and SignalR live updates with a banner when the
connection is down.

## What has not been done or checked

- **It has never run against a real GeekAPI or a real Facebook Page.** Passing checks above are
  unit tests and a build, not a sign-in or a draft going through. This is the open gate (Phase 6 in
  the GeekBackend handoff).
- **Deployed, never signed in to.** Vercel project `geek-social` has a READY production deployment
  at `0720473` on `geek-social.geekatyourspot.com`, and `/api/auth/start` there redirects to
  GeekOAuth with the right client and redirect URI. The GeekBackend handoff's "no Vercel project yet"
  is out of date. There is no `.env.local` in this checkout.
- **Registrations outside this repo.** GeekAPI answers `api/social/*` and the hub (401 without a
  token), so GeekBackend `e2c0229` is live. The Meta app settings and Railway variables were not
  checked.
- **`https://geek-social.vercel.app` is not this project.** This project's Vercel addresses are
  `geek-social-coral.vercel.app` and `geek-social.geekatyourspot.com`; that host serves a different
  app. The README and `.env.example` no longer list it. Its entries are removed in uncommitted edits to
  GeekOAuth (`OidcPublicClientSeeds.cs`, `SecurityHeadersMiddleware.cs`) and GeekBackend
  (`CorsOriginParser.cs`, `docs/GEEK-SOCIAL-API.md`, the 2026-11-12 handoff). Until GeekOAuth is
  redeployed the live client still accepts it, and the Meta app console entry still has to be removed
  by hand. See `AUDIT.md`.
- **No component or page tests.** `DraftCard`, the six pages and the hooks are covered only by
  typecheck, lint and build.
- **Facebook Pages only.** Other platforms are connectors in GeekAPI, not work in this repo; the
  screen is platform-neutral.

## Run it locally

```bash
cp .env.example .env.local   # then set NEXT_PUBLIC_APP_URL=http://localhost:3006
npm install
npm run dev                  # http://localhost:3006
```

Sign-in needs `http://localhost:3006/auth/callback` and `http://localhost:3006/signed-out`
registered on the GeekOAuth `geek-social` client. The token must carry the `geeksocial.manage`
scope or every `api/social` route answers 403.

## Rules this repo enforces

`src/test/source-rules.test.ts` fails the test run on: an em dash anywhere in the source, a timer
used to poll, a raw `WebSocket` or `EventSource`, and anything kept in browser storage. Live updates
are SignalR only; after every connect and reconnect each page re-reads what it shows through REST.
Do not work around these; change the design instead.

Failures are shown, not swallowed: the proxy returns the upstream status and message (plain text is
displayed as it came), and a refused token is never replaced with another credential.

## Next steps, in order

1. Confirm the external state: GeekAPI Railway variables, Meta app login configuration and webhook,
   GeekOAuth client redirect URIs (GeekBackend handoff, "Railway variables" and "Meta app settings").
2. Run locally, sign in, connect a Page on `/accounts`, read `/activity`.
3. Comment on a post, watch the draft arrive over SignalR, edit and approve it. Leave auto-send off
   until several drafts have been reviewed.
4. Review, commit and deploy the GeekOAuth and GeekBackend edits that remove `geek-social.vercel.app`,
   and remove it from the Meta app console (`AUDIT.md` finding 1).
5. Add tests for the draft actions in `src/components/social/DraftCard.tsx`.
