# geek-social

The GeekSocial operator screen. GeekSocial is a multi-tenant, multi-platform product that runs inside
GeekAPI: it watches comments on each tenant's connected social accounts, has the AI classify each
comment and draft a reply, and holds every draft for a person to approve, edit or reject before it is
sent. It also publishes link posts. This app is the operator's inbox and controls. It has no database
and no platform credentials of its own.

**Plan of work.** `plans/geek-social-roadmap-2026-11-18.md` (revision 3, frozen 2026-11-18): the scope,
the phases, and the open decisions. The research behind it is in `GeekBackend/docs/market-research-2026-11-18/`,
and competitor pricing is in `plans/geek-social-competitor-pricing-2026-11-18.md`.

**Platforms.** In scope: Facebook, Instagram, LinkedIn (organisation and member), Google Business
Profile, X, TikTok, YouTube and Pinterest, and Nextdoor as plan-and-approve. GeekSocial owns the app on
each network, and a tenant connects by signing in. Only the Facebook Pages connector is built so far; the
others are connectors still to build in GeekAPI. The screens are platform-neutral, apart from the Facebook
connect flow on `/accounts`.

**AI.** The AI provider is replaceable by configuration (roadmap Phase 0, item 1): GeekAPI calls whichever of
Anthropic, OpenAI, Gemini, Perplexity or Groq `LlmProviders__DefaultProvider` names, with no default. Activity
shows the provider, its model, whether its key is set, and which platforms are cleared for it; the other screens
say "the AI provider" and quote no setting names. The settings are in `GeekBackend/docs/GEEK-SOCIAL-API.md`.

**Billing.** GeekSocial is a paid SaaS, and tenants pay through PayPal. None of that is built yet: today
`/welcome` creates a tenant for any signed-in person, free of charge. GeekBackend already has a PayPal
subscription flow for Geek Receptionist (`GeekBackend/docs/Geek-Receptionist.md`, onboarding and billing
sections).

The contract it is built against is `GeekBackend/docs/GEEK-SOCIAL-API.md`.

## Pages

| Path | What it does |
|---|---|
| `/` | Inbox: drafts by tab (Pending, For a person, Refused, Rejected, Approved and held, Sent, Failed). Edit (saved only by Save), Approve and send, Send, Reject. |
| `/comments` | Comments that did not become a draft: Held, Failed, Waiting, No reply needed. Run again, Like. |
| `/accounts` | Connect a Facebook Page, Pause sends (saved only by Save), Resync. There is no auto-send: a person approves every reply. |
| `/connect/meta/callback` | Where Meta returns after a connect; completes it with GeekAPI. |
| `/posts` | Suggest copy, edit, Publish a link post; the published posts. |
| `/activity` | Status (your comment and draft counts, failures of the last 30 days, the AI provider and its clearance, Meta settings, send limits) and the audit. Only your own counts and failures, plus GeekSocial-wide failures. |

Every code and Reviewer rule is put into plain words in one place, `src/lib/social/words.ts`.

## How it talks to GeekAPI

- **Sign-in:** GeekOAuth, Authorization Code with PKCE (S256), as a confidential Backend-for-Frontend
  client `geek-social` (`openid-client` and `jose`, no Auth.js). `/api/auth/login` and
  `/api/auth/register` generate the PKCE verifier, state and nonce on the server, seal them in a
  short-lived encrypted cookie, and redirect; `/api/auth/callback` checks the state, exchanges the
  code with the client secret and the verifier, verifies the ID token against GeekOAuth's JWKS
  (signature, issuer, audience, expiry, nonce), and stores the session in an encrypted `HttpOnly`,
  `SameSite=Lax` cookie (a JWE split across `gs_session.0`, `.1`, ...). No token reaches the
  browser's JavaScript. `/api/auth/logout` (POST by `fetch`, same origin only) clears the cookies and
  answers `{ redirectTo }`, GeekOAuth's `end_session_endpoint` with the ID token as the hint, which the
  browser then navigates to. Sign out is never a form post, so it does not reload the page.
- **Sign-up:** never handled here. `/api/auth/register` redirects to GeekOAuth's `/Account/Register`
  with the whole `/connect/authorize` request as `returnUrl`. GeekOAuth requires a confirmed email
  before sign-in, so the person registers, confirms, signs in once at GeekOAuth, and OpenIddict then
  issues the code to `/api/auth/callback` with the original challenge and state. The sign-up cookie
  lives an hour for that reason; a sign-in cookie lives ten minutes.
- **Session renewal:** `src/proxy.ts` renews the access token before a page renders and stores the
  rotated refresh token in the same response. `fetchWithAuth()` (`src/lib/api-client.ts`) does the
  same in Route Handlers and Server Actions, and retries once on a 401. Requests that arrive together
  share one refresh. GeekOAuth refusing the refresh token (`invalid_grant`) ends the session; any
  other failure (GeekOAuth unreachable) does not, and is reported to the person. `src/lib/dal.ts`
  `verifySession()` re-checks the session wherever a Server Component reads data.
- **REST:** the browser never calls GeekAPI. Server Components and Server Actions call
  `<GeekAPI>/api/social/<path>` with the signed-in person's Bearer token from the session cookie.
  There is no REST proxy route. Scopes asked for:
  `openid profile email roles offline_access geeksocial.manage`.
- **Live updates:** the server holds the SignalR connection to `<GeekAPI>/hubs/social-realtime`
  (WebSockets, token in the Authorization header) and forwards each message down a Server-Sent
  Events stream at `/api/live-updates`. The browser's `EventSource` sends only its cookie. A message
  (`draftChanged`, `commentChanged`, `accountChanged`) carries ids and states; the page then reads
  the item again through REST. The stream ends on schedule about every 280 seconds so the next one
  starts with a renewed sign-in (a stream cannot store a rotated refresh token), and after every
  connect each page reads again what it shows. A refusal that retrying cannot fix (401, 403) stops
  the stream with its reason. Nothing polls on a timer. When the connection is down, a banner says
  so on every page.

## How the screen behaves

- **No page reloads for a write.** Every action (approve, edit, reject, publish, sign out) is a `fetch`
  to a route, and a test fails the run on a `<form>` with an `action` or `method`. The only navigations
  are the ones OAuth requires: to GeekOAuth to sign in, register or end its session, and back.
- **Loading is skeletons** shaped like the cards they stand for, with the words for a screen reader.
- **Toasts are non-blocking** and sit outside the page. A success goes away by itself; an error stays
  until dismissed. Anything the person must act on is also said inline where it happened.
- **Optimistic where it is safe, and only there.** Rejecting a draft shows it rejected at once, then is
  confirmed, or put back to what the server holds (or, if that cannot be read, to how it was, with the
  words "may have been rejected"). Approve, Send, Publish and the send kill switch are never
  optimistic: they act on a platform or on whether replies go out, a lost answer leaves the outcome
  unknown, and a screen that said "Sent" first would be saying something nobody confirmed.

## Environment variables

All five are required. They are checked when the server starts and when the app is built, so a missing
or malformed one stops the start or the build and names the variable; values are never printed.

| Name | What it is |
|---|---|
| `OAUTH_ISSUER_URL` | GeekOAuth's issuer, e.g. `https://auth.geekatyourspot.com`. https, except localhost. |
| `OAUTH_CLIENT_ID` | The confidential client's id: `geek-social`. |
| `OAUTH_CLIENT_SECRET` | The client's secret, at least 16 characters. Server only. GeekOAuth holds the same value as `GEEK_SOCIAL_CLIENT_SECRET`. |
| `OAUTH_REDIRECT_URI` | This app's callback: `<origin>/api/auth/callback`. Must equal a redirect URI registered on the client. The origin also builds the post-logout address `<origin>/signed-out`. |
| `SESSION_SECRET` | At least 32 characters; the key for the session and sign-in cookies. Changing it signs everyone out. |

`NEXT_PUBLIC_GEEK_API_URL` (optional) is GeekAPI's base URL, the target of the server's REST calls and the hub host.
Default `https://api.geekatyourspot.com`.

Generate a secret with `openssl rand -base64 32`. See `.env.example`; copy it to `.env.local` for
local work.

## Addresses to register

GeekOAuth client `geek-social` (confidential, PKCE required, set by GeekOAuth's seed when
`GEEK_SOCIAL_CLIENT_SECRET` is set there):

| | Redirect URI | Post-logout redirect URI |
|---|---|---|
| Production | `https://geek-social.geekatyourspot.com/api/auth/callback` | `https://geek-social.geekatyourspot.com/signed-out` |
| Local | `http://localhost:3006/api/auth/callback` | `http://localhost:3006/signed-out` |

Meta app, Valid OAuth Redirect URIs: `<origin>/connect/meta/callback` for each origin above. The
address is taken from the origin the browser is on, so the connect returns to the same signed-in
session.

The browser does not call GeekAPI at all (pages and changes go through the server, live updates through
`/api/live-updates`), so GeekAPI's CORS list does not need this app's origins.

Do not register `https://geek-social.vercel.app`: that host is not this project's (this project's
Vercel addresses are `geek-social-coral.vercel.app` and the production host), so a redirect there
would hand sign-in codes to whoever owns it. See `AUDIT.md`.

## Commands

```bash
npm run dev        # http://localhost:3006
npm run build      # production build (needs the five variables above)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # unit tests, the sign-in flow against a stand-in GeekOAuth, and the source rules
```
