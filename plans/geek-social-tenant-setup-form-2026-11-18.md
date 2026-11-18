# Plan: a multi-step form where each tenant sets up its own Facebook app

## Why

GeekSocial is a sellable multi-tenant product. Jeff, 2026-11-18, in conversation: "There should be a
multi-step form to configure." Each tenant sets up its own Facebook app through GeekSocial. This
agrees with `GeekBackend/docs/PLATFORM-CAPABILITIES.md` section 1a item 8, which says the tenant
registers their own app and gives GeekSocial its keys "through the onboarding wizard".

The code does something else. One Facebook app serves every tenant:
- Its settings are four environment variables on GeekAPI (`MetaOptions.cs:10-13`).
- Those are read once at startup into a singleton (`SocialServiceRegistration.cs:70`).
- That singleton is used by `MetaAccountConnector` (connect, token exchange, token status, webhook
  subscription), `MetaEngagementReader` (webhook handshake and signature check) and
  `SocialController` (the Activity screen's "Meta app settings").
- There is no form, no per-tenant storage of app keys, and one webhook address for everyone
  (`SocialWebhooksController.cs:38`, `:57`).

The 2026-11-18 test on the deployed site stopped at this point: the Connect button cannot work, and
the only way to make it work today is for the operator to put one app's keys into Railway. That is
the wrong model, so those Railway steps are not done.

## What the tenant does (the form)

A new screen, **Setup**, at `/setup/facebook`. The Accounts screen's Connect button stays disabled
and links here until setup is complete. Each step is saved on the server when it passes, so a
tenant can leave and come back. The step shown comes from the server's record, and no step can be
skipped.

1. **Create a Facebook app.** Plain instructions with a link to `developers.facebook.com/apps`,
   saying which app type and use case to choose. Nothing to enter.
2. **App ID and App secret.** The tenant pastes both. GeekAPI checks them with Meta before saving:
   it requests an app token with the ID and secret, and reads the app back. A wrong pair is refused
   with Meta's reason. The secret is never shown again after it is saved.
3. **Login configuration.** Instructions for Facebook Login for Business: User access token, Pages,
   and the six permissions in `MetaAccountConnector.RequiredPermissions`. The tenant pastes the
   Configuration ID.
4. **Redirect address.** Shows `https://geek-social.geekatyourspot.com/connect/meta/callback` with a
   copy button and where to paste it in the app. This address is the same for every tenant.
5. **Webhook.** Shows this tenant's own callback address and a verify token that GeekSocial
   generates for them, each with a copy button, and says to subscribe the Page object to `feed`.
   The step completes only when Facebook's check reaches GeekAPI and passes. The form updates on
   its own when it does, and shows the refusal if the token was wrong.
6. **Connect a Page.** The existing Meta connect flow, now using this tenant's app.

## Backend (GeekBackend)

1. **Storage.** A new table `geek_social.platform_apps`, through GeekRepository (the only data
   plane):
   - Columns: `tenant_id`, `platform`, `app_id`, `app_secret` (encrypted), `login_config_id`,
     `verify_token` (encrypted), `webhook_key` (a random public id for the address),
     `secret_checked_at`, `webhook_checked_at`, created and updated times.
   - Uniqueness: one row per tenant per platform, and a unique `webhook_key`.
   - Encryption: the existing `SocialCredentialProtector` (AES-GCM, `GEEK_SOCIAL_ENCRYPTION_KEY`,
     already set on Railway) seals the secret and the token.
   - Data path: migration, `SocialRepository` methods and GeekRepository endpoints, then
     `HttpSocialRepository` in GeekAPI.
2. **The app comes from the tenant, not the environment.** A `MetaAppResolver` looks an app up by
   tenant (for connect and tokens) or by `webhook_key` (for deliveries). The connector, the reader
   and the token provider take the resolved app per call instead of the singleton.
   - A tenant with no finished setup gets `not_configured`, which the screens show with a link to
     Setup.
   - The `GEEK_SOCIAL_META_*` variables and `MetaOptions.FromEnvironment` are deleted, not kept as a
     fallback.
3. **One webhook address per tenant app:** `/api/social/webhooks/meta/{webhookKey}`.
   - The handshake checks that app's verify token and stamps `webhook_checked_at`.
   - A delivery is verified with that app's secret. Events are accepted only for Pages connected
     under that tenant; any other Page is refused and logged.
   - An unknown key gets 404. The old shared `/meta` route is removed.
4. **Setup endpoints**, tenant-scoped and behind the same sign-in as the other social routes:
   - read the setup state (each step's status, never the secret);
   - save and check the ID and secret;
   - save the login configuration ID;
   - issue or reissue the verify token and webhook address.
5. **Activity.** "Meta app settings" reports this tenant's setup, not a global flag.

## Environment variables: only GeekSocial's own

A tenant's values are never environment variables. An environment variable has one value for the whole
service, so each new client would mean editing Railway and restarting GeekAPI.

- **Per tenant, in `platform_apps`:** app ID, app secret, login configuration ID, verify token,
  webhook key. Each is read when it is used, so a new or changed tenant takes effect at once.
- **Encryption:** the app secret and the verify token are encrypted by GeekAPI before they reach
  GeekRepository, the same way Page tokens are today (`SocialCredentialProtector.cs:3-7`). The database
  holds ciphertext only, and the key exists only on GeekAPI.
- **Stay as environment variables:** values that belong to GeekSocial itself, with one value for the
  whole service.
  - `GEEK_SOCIAL_ENCRYPTION_KEY`
  - the Anthropic key
  - `GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS`
  - geek-social's sign-in client secret and session secret on Vercel
- **Deleted:** the four `GEEK_SOCIAL_META_*` variables.
- **Other platforms:** they use the same table. Each has a client ID and secret pair plus a few settings
  of its own, such as Meta's login configuration ID. Proposal, not decided: common columns for the
  ID, secret and webhook parts, and a per-platform settings field for the rest. Each platform's
  exact fields are settled when its connector is built.
- **The encryption key belongs to the service, not to a person.** It is generated by a machine and
  sent straight to GeekAPI's Railway variables, and nobody types it, sees it or hands it over. Jeff,
  2026-11-18: "The encryption key is not mine to give."
- **Key rotation, to build.** An encrypted value carries no key version today (`SocialEncryptedToken`
  is `Cipher`, `Iv`, `Tag`). Changing `GEEK_SOCIAL_ENCRYPTION_KEY` would make every stored secret
  and Page token unreadable at once. That fails closed, but every tenant would have to re-enter its
  keys and reconnect. So each encrypted value stores the ID of the key that sealed it. A new key is
  added beside the old one, existing values are re-encrypted, and the old key is removed only when
  nothing still uses it. This covers Page tokens as well as app secrets.
- **The current key is exposed.** `GeekBackend/plans/geek-social-handoff-2026-11-12.md` says the
  value was generated in a Claude session and printed in its transcript, so treat it as exposed.
  Replace it while nothing is encrypted with it.

## Frontend (geek-social)

- `src/app/(app)/setup/facebook/`: a Server Component reads the setup state, and each step's save is
  a Server Action, matching how the other screens work since `472c7a8`.
- The webhook step listens to the live-updates stream for the check. That needs finding 5 (live
  updates broken in production) fixed first.
- Accounts: Connect is disabled until setup is complete. The developer instruction about "the Meta
  app" (finding 7) is removed.
- The welcome page sends a new tenant to Setup after the AI terms.

## Tests

- **GeekBackend** (unit, against fakes; no local database is installed):
  - the resolver by tenant and by key;
  - a handshake with the right and wrong token;
  - a delivery signed with the right app's secret and with another tenant's;
  - a Page that belongs to another tenant refused;
  - no setup gives `not_configured`;
  - the secret never returned by the read endpoint;
  - the ID-and-secret check refusing a wrong pair (fake Graph client).
- **geek-social** (node:test + jsdom):
  - each step's states (not started, refused with the reason, passed);
  - resuming at the right step;
  - Connect disabled until setup is complete.
- **Live**, on the deployed site with Jeff entering his own credentials: Geek @ Your Spot LLC goes
  through the form with its existing app (1952063012160616), connects its Page, and a comment
  reaches the Inbox as a draft.

## Not known yet (checked 2026-11-18, not settled)

1. **Whether Meta allows it.** Can a business's own app be used through another company's product?
   The capabilities doc says this "was not read". Meta's Platform Terms have rules for Tech Providers
   acting for clients; a search did not find the wording. Read `developers.facebook.com/terms` and
   the Tech Provider pages before building.
2. **Development mode and webhooks.** Does an app in Development mode receive `feed` webhooks for a
   Page its own admin connected? Meta's webhooks getting-started page does not say. If Live mode is
   required, the tenant's app needs a privacy policy address and Data Use Checkup, and the form
   gains a step.
3. **Other platforms.** Instagram uses the same Meta app later. LinkedIn, Google Business Profile,
   X and TikTok each get their own form when they are built.

## Order

1. Settle "Not known yet" 1 and 2.
2. Fix live updates (finding 5).
3. Backend steps 1 to 5.
4. Frontend.
5. Live test with Jeff.
