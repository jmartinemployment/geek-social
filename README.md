# geek-social

The GeekSocial operator screen. GeekSocial runs inside GeekAPI: it watches comments on connected
Facebook Pages, has Claude classify each comment and draft a reply, and holds every draft for a
person to approve, edit or reject before it is sent. It also publishes link posts. This app is the
operator's inbox and controls. It has no database and no platform credentials of its own.

The contract it is built against is `GeekBackend/docs/GEEK-SOCIAL-API.md`.

## Pages

| Path | What it does |
|---|---|
| `/` | Inbox: drafts by tab (Pending, For a person, Refused, Rejected, Approved and held, Sent, Failed). Edit (saved only by Save), Approve and send, Send, Reject. |
| `/comments` | Comments that did not become a draft: Held, Failed, Waiting, No reply needed. Run again, Like. |
| `/accounts` | Connect a Facebook Page, auto-send categories, Pause sends (saved only by Save), Resync. |
| `/connect/meta/callback` | Where Meta returns after a connect; completes it with GeekAPI. |
| `/posts` | Suggest copy, edit, Publish a link post; the published posts. |
| `/activity` | Status (clearance, Meta settings, send limits, orchestrator counts and failures) and the audit. |

Every code and Reviewer rule is put into plain words in one place, `src/lib/social/words.ts`.

## How it talks to GeekAPI

- **Sign-in:** GeekOAuth, Authorization Code with PKCE, public client `geek-social`, the same
  arrangement as Content Creator. Tokens live in httpOnly cookies; `src/proxy.ts` refreshes the
  access token before a page renders.
- **REST:** the browser calls `/api/social/<path>` on this app, which forwards to
  `<GeekAPI>/api/social/<path>` with the signed-in person's Bearer token. Scopes asked for:
  `openid profile email offline_access geeksocial.manage`.
- **Live updates:** SignalR only, to `<GeekAPI>/hubs/social-realtime`, with the access token from
  `/api/auth/hub-token` as `accessTokenFactory`. A message (`draftChanged`, `commentChanged`,
  `accountChanged`) carries ids and states; the page then reads the item again through REST. After
  every connect and reconnect each page reads again what it shows. Nothing polls on a timer. When
  the connection is down, a banner says so on every page.

## Environment variables

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_AUTH_URL` | GeekOAuth base URL. Default `https://auth.geekatyourspot.com`. |
| `NEXT_PUBLIC_APP_URL` | This app's origin; builds the redirect and post-logout URIs. If unset, `https://$VERCEL_PROJECT_PRODUCTION_URL` on Vercel, else `http://localhost:3006`. Set it on every deployment. |
| `NEXT_PUBLIC_OAUTH_CLIENT_ID` | GeekOAuth public client id. Default `geek-social`. |
| `NEXT_PUBLIC_GEEK_API_URL` | GeekAPI base URL: the REST proxy target and the hub host. Default `https://api.geekatyourspot.com`. |

See `.env.example`. Copy it to `.env.local` for local work.

## Addresses to register

GeekOAuth client `geek-social`:

| | Redirect URI | Post-logout redirect URI |
|---|---|---|
| Production | `https://social.geekatyourspot.com/auth/callback` | `https://social.geekatyourspot.com/signed-out` |
| Vercel default | `https://geek-social.vercel.app/auth/callback` | `https://geek-social.vercel.app/signed-out` |
| Local | `http://localhost:3006/auth/callback` | `http://localhost:3006/signed-out` |

Meta app, Valid OAuth Redirect URIs: `<origin>/connect/meta/callback` for each origin above. The
address is taken from the origin the browser is on, so the connect returns to the same signed-in
session.

GeekAPI must allow these origins for the hub: `https://social.geekatyourspot.com`,
`https://geek-social.vercel.app`, `http://localhost:3006`.

## Commands

```bash
npm run dev        # http://localhost:3006
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # unit tests and the source rules (no em dash, no timers, no raw sockets, no browser storage)
```
