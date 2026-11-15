# geek-social engineering audit, 2026-11-15

Scope: the unfinished items in `plans/geek-social-engagement-agent-2026-11-08.md`, and this repo at
`0720473`. Each finding says how it was checked. "Not verified" means no check was run.

## Status of the findings

| # | Finding | Status |
|---|---|---|
| 1 | `geek-social.vercel.app` redirect URI | Removed from this README and `.env.example`. **Still registered on the GeekOAuth client and the Meta app; only you can remove it.** |
| 2 | Outage signs everyone out | Fixed: `proxy.ts` clears the cookies only on `invalid_grant` and the like (test added) |
| 3 | Hub gives up after about 19 seconds | Fixed: it retries every 30 seconds for as long as it is down (test added) |
| 4 | Phase 6 proof and its tests | Open |
| 5 | Proxy leaves `/api/social/` | Fixed: `.` and `..` segments answer 400 (test added) |
| 6 | Contract drift | Fixed except the `spam` auto-send question, which is yours to decide |
| 7 | Refresh-token rotation race | Open, unverified |
| 8 | No CI, no component tests | Open |

After the fixes: typecheck and lint clean, 22 of 22 tests pass, build succeeds.

## Findings, most severe first

### 1. A redirect URI points at a domain this project does not own (high)

`README.md` and `.env.example` list `https://geek-social.vercel.app/auth/callback` as a GeekOAuth
redirect URI, and the Meta app list names the same host. Vercel's `geek-social` project has the
addresses `geek-social-coral.vercel.app` and `geek-social.geekatyourspot.com`, not
`geek-social.vercel.app`. That host serves a different app (`/api/auth/start` answers 404). GeekOAuth
does not reject it: an authorize request for client `geek-social` with that redirect URI is
redirected to the login page like the other two.

Failure scenario: whoever controls that host sends a person an authorize link with
`redirect_uri=https://geek-social.vercel.app/auth/callback` and their own PKCE challenge. The person
signs in, the code lands on the other party's site, and they exchange it with their own verifier for
a token carrying `geeksocial.manage`. This needs a phishing step, but the registration makes it
possible.

Fix: remove the address from the GeekOAuth client, the Meta app and this README and `.env.example`.
If a Vercel address is wanted, use `geek-social-coral.vercel.app`.
Checked by: `get_project` domains, `curl` of both hosts, an authorize probe against GeekOAuth.

### 2. A GeekOAuth outage signs everyone out (medium)

`src/proxy.ts` clears both cookies when the token endpoint answers any non-2xx, including 5xx. The
same file's sibling, `getAccessTokenWithRefresh` in `src/lib/auth/session.ts`, clears them only for
`invalid_grant`, and throws otherwise. A GeekOAuth restart during an access-token expiry (every
5 to 10 minutes) therefore destroys a refresh token that was still valid.

Fix: in `proxy.ts`, clear only when the body is a session-dead error (`isSessionDeadError`), and let
the request through otherwise.
Checked by: reading both files.

### 3. The live connection gives up after about 19 seconds (medium)

`src/services/social-hub.ts` reconnects at 0, 1, 3, 5 and 10 seconds, then `onclose` sets the state
to `off` and the screen waits for a person to click reconnect. A GeekAPI redeploy on Railway takes
longer than that, and the operator then sees no new drafts until they notice the banner. A retry
policy that keeps retrying is not polling, so it does not break the no-timers rule.
Checked by: reading the code. Not run against a real outage.

### 4. Phase 6, the proof, has not been done, and its tests do not exist (medium)

- `GeekBackend.IntegrationTests/SocialSchemaIntegrationTests.cs` has 7 tests, all about the schema.
  Nothing tests a draft going to a platform, or an expired token giving a failure plus an audit row.
- The plan's "a webhook replayed twice yields exactly one row" has only a unit test that the same
  delivery parses to the same event id (`MetaEngagementReaderTests.cs:346`), not a store-level test.
- The Meta app settings and Railway variables were not checked, so whether GeekAPI can connect a
  Page is unknown.
- The plan's optional MCP tools (`api/social/internal/*`) do not exist in GeekBackend or
  `Geek-GTM-MCP`.

### 5. The proxy can leave `/api/social/` (low)

`src/app/api/social/[...path]/route.ts` builds the target with `new URL()`. A segment of `..`
survives `encodeURIComponent` and is normalised away: `["..","..","health"]` becomes
`https://api.geekatyourspot.com/health`. This is not exercised through Next (a signed-in session is
needed), and it gives no new privilege, since `/api/auth/hub-token` already hands the token to the
page. It does defeat the stated purpose of the proxy.

Fix: answer 400 for a `.` or `..` segment.
Checked by: a `node` URL test of the same construction.

### 6. The client has drifted from the contract (low)

- `OrchestratorStatus` in `src/lib/social/types.ts` lacks `draftsAutoApproved` and `sendsHeld`,
  which `docs/GEEK-SOCIAL-API.md` lists, so the Activity page cannot show held sends.
- The comments on `saveDraftText`, `rejectDraft` and `sendDraft` say the contract does not state
  their answers. It does: the draft view, the draft view, and `{ draft, send }`.
- `sendDraft` also accepts a bare send outcome, which the contract never promises. That is a
  tolerant second path where the contract says one shape.
- `AUTO_SEND_CATEGORIES` includes `spam`. The backend only forbids `complaint` and `sensitive`, so
  an account can auto-send replies to spam. Whether that is wanted is a decision for you.

### 7. Refresh tokens are rotated while requests run in parallel (low, unverified)

On the first load after the access cookie expires, `proxy.ts`, `/api/auth/hub-token` and the API
proxy can each refresh with the same rotating refresh token. GeekOAuth sets only
`SetRefreshTokenLifetime(14 days)` (`OpenIddictExtensions.cs:41`) and no reuse leeway, so this
depends on OpenIddict's default, which was not checked. If reuse is refused, the loser gets
`invalid_grant` and `session.ts` clears the cookies. The refresh cookie also lives 30 days against a
14-day token.
Check: expire the access cookie and open `/` with DevTools open.

### 8. No automated checks outside Vercel's build (low)

There is no `.github` directory, so typecheck, lint and tests do not run on push. There are no tests
for the pages, `DraftCard`, the hub provider or the auth routes.

## Unfinished plan items

| Item | State |
|---|---|
| Phase 6 proof on a real Page | Not done; no tests written (finding 4) |
| Instagram | Capabilities modelled in GeekBackend; no connector; waits on I1 to I6 |
| LinkedIn | Post-writing code only; no connector; waits on the app and L1 to L5 |
| Comment-text clearance for LinkedIn, Instagram | Open; `GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS` is the gate |
| Optional MCP tools | Not built |
| Daily retention job vs on-event | Open decision |
| Plan status "committed, not pushed" | Out of date: `e2c0229` and `d6568df` are on `origin/main` and GeekAPI serves the routes |
| GeekBackend handoff "no Vercel project yet" | Out of date: deployed at `0720473` |

## Not verified

Meta app settings, Railway variables on GeekAPI and GeekRepository, a real sign-in, a real
connect, GeekOAuth's reuse leeway, and whether the Vercel environment variables beyond the
resulting redirect URI are set.
