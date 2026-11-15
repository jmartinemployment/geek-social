# geek-social handoff, 2026-11-15

Where the GeekSocial operator screen stands. Read `README.md` for what the app is and how it talks
to GeekAPI. This file is what the README does not say: what was checked, what was not, and what
comes next.

The setup detail (Meta app, Railway variables, platform list) is recorded in
`GeekBackend/plans/geek-social-handoff-2026-11-12.md`. That file is the source for everything
outside this repo and is not repeated here, so the two cannot drift. It is three days old: re-check
any state it describes before acting on it.

## Verified on 2026-11-15

Run from this repo at `0720473` on `main`, clean and in sync with `origin/main`
(`github.com/jmartinemployment/geek-social`):

- `npm run typecheck`: clean.
- `npm run lint`: clean.
- `npm test`: 15 of 15 pass (API client, inbox logic, wording, and the source rules).
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
  token), so GeekBackend `e2c0229` is live. GeekOAuth does not reject the `geek-social` client for
  the three redirect URIs the README lists. The Meta app settings and Railway variables were not
  checked.
- **`https://geek-social.vercel.app` is not this project.** This project's Vercel addresses are
  `geek-social-coral.vercel.app` and `geek-social.geekatyourspot.com`. The README lists
  `geek-social.vercel.app` as an address to register on GeekOAuth and Meta; it serves a different
  app (no `/api/auth/start`). See `AUDIT.md`.
- **No component or page tests.** `DraftCard` and the six pages are covered only by typecheck, lint
  and build.
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
4. Remove `geek-social.vercel.app` from the GeekOAuth client, the Meta app and the README
   (`AUDIT.md` finding 1).
5. Add tests for the draft actions in `src/components/social/DraftCard.tsx`.
