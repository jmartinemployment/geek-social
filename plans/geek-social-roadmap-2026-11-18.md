# Plan: GeekSocial, scoped from the market research and built in phases (revision 3)

Revision 3, 2026-11-18.
- **First review (of revision 1):** 33 findings, and the verdict "proceed with Phase 0, not ready for Phase 1". Revision 2 added what it found missing.
- **Second review (of revision 2):** the verdict "proceed immediately with Phase 0", with five gaps and three points to clarify. This revision adds those.
- **Third review (of revision 3):** "approved to freeze the plan and begin Phase 0", with three cases to watch. They are added to Phase 0, items 1 and 9. The plan is frozen as of 2026-11-18; any change from here on is a recorded revision.
- **New requirement:** a replaceable AI provider, built first.

The requirements the reviews questioned are open items under **Decisions**. The last section maps each finding of both reviews to the place that handles it.

## The system, for a reader outside the code

GeekSocial is a social media management product for small businesses. It has three parts:
- **geek-social:** the Next.js screens, deployed on Vercel.
- **GeekAPI:** a .NET service on Railway that runs GeekSocial's logic and its background worker (the "orchestrator").
- **GeekRepository:** a .NET service that is the only way to reach the Postgres database.

Sign-in goes through Geek Auth (GeekOAuth, OpenIddict). A **tenant** is one customer business. File references like `SocialSendStep.cs:115` point into those repositories so the work can be traced; a reviewer without the code can take them as stated.

## Context

On 2026-11-18 a walkthrough of the deployed site showed what GeekSocial is today:
- **Networks and posts:** one network (Facebook Pages), and link posts only.
- **Scheduling:** none on the screen. The backend can schedule, but the form always sends `scheduledFor: null` (`PostWriter.tsx:113`).
- **Inbox:** comments only. Mentions, shares and reactions are stored but never shown.
- **Team:** one user per tenant (`ux_social_tenants_owner`).
- **AI:** one provider (Anthropic), wired in code.
- **Not built at all:** billing, analytics and email.
- **Twelve defects.** Live updates are broken in production, and the Activity screen shows every tenant's counts to every tenant.

The product is to be a paid, multi-tenant, multi-platform SaaS billed through PayPal. The plan rests on research into 22 tools, in six reports checked 2026-11-18 on the vendors' own pages. Every claim in those reports carries a source link, and the findings this plan relies on are in the scope table below. The reports go to `GeekBackend/docs/market-research-2026-11-18/`, and a pricing table of all 22 is in `plans/geek-social-competitor-pricing-2026-11-18.md`. The tools:
- Hootsuite, Sprout Social
- Buffer, Later, Metricool, Publer
- SocialBee, SocialPilot, Sendible, MeetEdgar
- Agorapulse, Vista Social, Statusbrew
- Meta Business Suite, Nextdoor, Planable, Loomly
- ContentStudio, Lately, Missinglettr, FeedHive, Ocoya, Predis

## Requirements

- **Connecting accounts:** done the way the researched tools do it. GeekSocial owns the app for each network, and a client connects by signing in. This replaces the "tenant brings its own app" form in `plans/geek-social-tenant-setup-form-2026-11-18.md`. A multi-step setup form stays.
- **Email:** do what Constant Contact and Mailchimp do. That means subscriber lists, campaigns, sending, and email ↔ social repurposing.
- **Nextdoor:** posts are planned and approved in GeekSocial; there is no Share Plugin. Publishing goes through Nextdoor's API once access exists.
- **YouTube and Pinterest:** both are in scope. An earlier plan file (2026-11-16) marked them "not supported"; that is withdrawn.
- **Billing:** a paid SaaS through PayPal.
- **Multi-platform:** never a Facebook-only tool.
- **AI use:** a comment goes to an AI model at most twice per reply.
- **Replaceable AI provider:** GeekSocial reaches its AI through one interface, so the provider can be changed by configuration without changing the rest of the product: Anthropic, OpenAI (ChatGPT's models), Google Gemini, Perplexity or another. It is built first (Phase 0, item 1). The AI drafts replies and post copy, and a person approves every one before it is sent. Today, changing provider needs no new consent from clients, just as none was asked while there was one provider. Once GeekSocial is in production, clients are notified of a provider change and given a choice. This may change.
- **No auto-send:** a person approves every reply and every post before it is sent.

The first review questioned four of these: the networks needed at launch, how email is delivered, PayPal, and what one approval covers (see **Decisions**). Until those are answered, the phases follow the requirements as written.

## Standing rules, every phase

- **Tenant isolation is an architecture rule, not a list of fixes.**
  - Every API route, background job, cache key and live-update group carries the tenant and checks it.
  - Data access goes through tenant-scoped queries.
  - Tenant ownership is checked before a signed media URL is issued.
  - Credentials are stored per connected account and never shared between tenants.
  - Cross-tenant tests (another tenant's ids are refused) gate the release of every phase.
- **Retention:**
  - Comments are purged after 30 days. Content is never aggregated across tenants or used for training.
  - Data derived from a comment must not keep it indirectly: drafts, approvals, audit rows, logs, job payloads, copies held by the AI provider, backups. The retention matrix (decision Q5) settles each category.
- **Nothing fails silently:**
  - A transient failure is retried within a stated limit.
  - A permanent failure stops, and the reason is shown to the customer and to monitoring.
  - An outcome that cannot be known, such as a timeout after the platform may have accepted a post, is recorded as unknown. It is checked against the platform and is not retried until a person has looked.
  - There is no silent substitution of another provider, model or data. A failed AI call is never retried with a different AI provider.
- **Inbound events** (webhooks for comments, messages, reviews and billing):
  - Every webhook's signature is verified before anything is stored. Meta's already is (`MetaEngagementReader.cs:182-205`); PayPal's is added in Phase 1.
  - A repeated or stale event is refused, by its event id and its age.
  - Intake goes through a queue with per-tenant rate limits, so one viral post cannot starve the worker or other tenants.
  - Each tenant has a daily cap on AI calls, on top of the two-calls-per-reply limit. Above the cap, comments wait, and the tenant sees why. The cap is part of Q14.
- **Code:**
  - Every AI call goes through the one AI interface; no other code names an AI provider.
  - Postgres is reached only through GeekRepository.
  - Products copy code from each other rather than share it (`AGENTS.md`).
  - Background work wakes on a channel or a due time, never a sleep-and-select loop (`AGENTS.md:75-83`).
  - The model never emits markup; one renderer produces HTML (CLAUDE.md §1b).
- **Testing:** on deployed environments, with the account holder entering their own passwords, and no throwaway local infrastructure. Whether a permanent staging environment is added is decision Q8.

## Scope: what the market does, what GeekSocial will do, where it is today

| Area | Researched tools (examples) | GeekSocial target | Today |
|---|---|---|---|
| Networks | Most support FB, IG, LinkedIn, X, TikTok and YouTube, though Later dropped X (2025-08-28) and Buffer and Later publish YouTube Shorts only. Most support Pinterest; Sendible does not. Threads and Bluesky at SocialBee, SocialPilot, Sendible and MeetEdgar. No small-business tool supports Nextdoor Business Pages | Facebook, Instagram, LinkedIn (page + profile), Google Business Profile, X, TikTok, YouTube, Pinterest; Nextdoor plan-and-approve | Facebook only |
| Connecting | Sign-in through the tool's own app (Planable: "Planable's own OAuth app"); Bluesky app passwords are the only common exception | GeekSocial's app per network; the client signs in | Facebook sign-in through one Meta app |
| Onboarding | Trial sign-up, then connect accounts | Multi-step: business, plan and PayPal, AI terms, connect networks, invite team | Business name and AI terms |
| Publishing | Composer with per-network versions, media, scheduling, calendar, queue and time slots, drafts, first comment, RSS | Same | Facebook link post, publish now |
| Content categories and recycling | Core model of SocialBee and MeetEdgar (categories with time slots, evergreen re-queue, expiry) | Same | None |
| Approvals | Metricool and Publer block publishing until approved; Planable up to 10 levels; no-login client approval (Agorapulse, Vista, SocialPilot, Sprout) | Every post and reply approved by a person; multi-step; client approval link | Replies only, one person |
| AI content and repurposing | Per-network versions (ContentStudio, FeedHive, Ocoya); one blog becomes a year-long drip (Missinglettr); long video becomes clips | Per-network versions from one source; brand voice; email versions | Suggest copy for one link post |
| Inbox | Comments, DMs, mentions, reviews; assignment, saved replies, labels, hide and delete; AI reply suggestions | Same across networks; AI drafts approved by a person, at most 2 AI calls per reply | Facebook comments; Like |
| Reviews | Google Business Profile replies at Hootsuite, Sprout, Buffer, Metricool, Agorapulse, Vista, Statusbrew and SocialPilot (in a separate product); Facebook reviews at several; Sprout adds Yelp and Trustpilot. None at Later, Publer, SocialBee, Sendible or MeetEdgar | Google Business Profile and Facebook | None |
| Email | No researched social tool does email marketing; Constant Contact and Mailchimp turn emails into posts | Lists with consent, sign-up forms, campaigns, drip campaigns, sending, unsubscribes, bounces, reports, email ↔ social | None |
| Analytics | Per-network and cross-network, PDF, scheduled report emails | Same | Orchestrator counters (global, in memory) |
| Team and agency | Roles, per-user permissions, multiple brands, client portals, white-label | Members, roles, invitations; brands later | One owner |
| Billing | Per user (Hootsuite, Sprout, Agorapulse), per channel (Buffer), per account (Publer), per brand (Metricool); trials of 7 to 30 days, none at Metricool; PayPal at Hootsuite, Sprout, Agorapulse, Metricool, Publer, SocialBee, SocialPilot | PayPal subscriptions by tier | None |
| Listening, ads, link-in-bio | Listening at Hootsuite (Lumen); link-in-bio at Later and Publer; ads not compared in this research | Not planned yet | None |

## Release strategy

The phases below give the long-term order of work. They are not one release.
- **First paid release:** which phase ends in it, and with which networks, is decision Q1.
- **Release gates:** each connector ships behind its own gate:
  - the platform has granted access;
  - its operations are verified on a test account;
  - its cross-tenant tests pass.
- **Independence:** a platform that has not granted access blocks only its own connector.

## Phases

Each phase gets its own detailed plan before it is built, checked against the code. Each phase ends deployed and tested on the deployed site.

### Phase 0: defects, isolation and feasibility

Already done locally and passing, not pushed:
- Live updates (`next.config.ts` `outputFileTracingIncludes`, `scripts/check-live-updates-trace.mjs`, CI step).
- `src/app/robots.ts`.
- The business name starts empty (`WelcomeForms.tsx`, `welcome/page.tsx`).

Code:
1. **Replaceable AI provider.**
   - **Today:**
     - Triage, the reply drafter and the post writer already reach the model through one interface (`ISocialModelClient`, `SocialInterfaces.cs:165`). But only an Anthropic client exists, and it is wired in code (`SocialServiceRegistration.cs:54`).
     - The request is shaped as Anthropic's "forced tool" (`SocialModelRequest`, `SocialAgents.cs:192`).
     - The platform clearance and six places on the screens name Claude.
   - **A neutral contract:**
     - The request asks for a structured answer that matches a JSON schema.
     - The result carries the answer, the provider, the model and the token counts. The counts feed the per-reply budget and the unit-economics model.
   - **One client per provider** behind the interface: Anthropic (today's client), OpenAI, Gemini and Perplexity.
     - The new clients follow the OpenAI client GeekAPI already has for content work (`Workflow/Providers/OpenAiProvider.cs`), copied rather than shared.
     - Before coding, each provider's request shape and its support for schema-constrained answers are checked against its current API documentation.
     - **Perplexity** is understood to search the web on each call; that is unverified. The documentation check confirms whether Perplexity offers a model that does not search.
       - If it does not, comment text and commenters' names are never sent to it.
       - GeekSocial then refuses Perplexity for Triage and reply drafting, and uses it only for public content (Phase 6).
     - **Schemas stay flat and minimal**, so each provider can enforce them natively:
       - objects of string, number, boolean and enum fields;
       - every property listed as required;
       - no additional properties.

       The contract tests run every schema in use through each client's strictest rules. OpenAI's strict mode, for example, requires every property to be listed as required.
   - **The same rules for every client:**
     - one attempt, no retry, no second provider;
     - a refusal or a truncated answer fails;
     - a missing key or model fails, and nothing is sent;
     - logs never hold the prompt, the comment or the answer.
   - **The provider is the one already set on GeekAPI, `LlmProviders__DefaultProvider`.**
     - Content Creator already reads this setting (`ContentProviderFactory.cs:52-60`). GeekSocial ignores it today and always calls Anthropic.
     - **Keys and models:** each provider's key and model come from the existing `LlmProviders__{Provider}__ApiKey` and `__Model` settings. Gemini and Perplexity get sections of their own. Groq, which the setting already accepts, also gets a GeekSocial client, so every value the setting can hold works.
     - **Shared choice:** one setting chooses the provider for both Content Creator and GeekSocial. Content Creator refuses provider names it does not know, so naming Gemini or Perplexity there would also need Content Creator clients for them.
     - **No default in code, Claude included:** GeekSocial requires the setting to be present. It does not take the built-in "OpenAi" value that the options class falls back to when the setting is absent (`ProviderOptions.cs:12`).
     - **Launch choice:** which provider and model GeekSocial launches with is decision Q14, settled before launch.
     - **Failures:** an unknown provider name stops GeekAPI at startup. A missing key or model makes GeekSocial's AI calls fail visibly, while the rest of GeekAPI keeps running.
   - **Clearance is per provider:**
     - A platform is cleared for a named provider (for example `anthropic:facebook`), because a platform's terms are assessed for the company that receives the text.
     - After a switch, comments are held until the new provider is cleared.
     - The old `GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS` setting is refused at startup, with a message naming its replacement.
   - **Screens:** they show the configured provider's name, read from GeekAPI, instead of "Claude", and no environment-variable names.
   - **Tests:**
     - one contract test set that every client must pass against a fake HTTP handler;
     - clearance and startup tests.

     Each provider is proven live once its key is set.
2. **Remove auto-send entirely.**
   - Backend:
     - Drop `auto_send_categories` in a new GeekRepository SQL migration, and remove the matching row and entity fields.
     - Remove `SocialSendStep.AutoSendAsync` and `IsAutoSendable` (`SocialSendStep.cs:115-151`), the commented-out block (`SocialOrchestrator.cs:417-423`), and `DraftsAutoApproved` (`SocialOrchestratorStatus.cs`).
     - The settings route (`SocialController.cs:115`) keeps only `sendsDisabled`.
     - Update the affected tests.
   - Frontend: remove the Accounts "Send without approval" section, its types, the Inbox subtitle, the Activity count and the "auto-sent" audit label (`activity/page.tsx:102`), and update the fixtures and tests.
   - Docs: `GEEK-SOCIAL-API.md`.
3. **Per-tenant Activity and lasting failures.**
   - `GET status` requires a tenant and returns only that tenant's counts.
   - Failures are stored per tenant in GeekRepository and purged at 30 days, instead of a list of 20 in memory. Activity shows them.
4. **Missing tenant and consent checks.** `connect/meta/start` and `posts/copy` never look up the tenant, and `posts/copy` skips the AI-consent check. Both get the same checks as every other route.
5. **The post form offers only what the chosen network accepts.** Today a Facebook post with an Image URL is refused (`MetaPublisher.cs:43-48`); the form will offer only the fields in the capability matrix (`SocialPlatforms.cs:194-228`).
6. **Wording.**
   - Comments and Activity: no environment-variable names. `GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS` is a GeekAPI setting that these screens quote today, and item 1 replaces it.
   - Accounts: no developer instruction.
   - "Pages" becomes "accounts" where it means accounts.
   - The site description drops "for Geek @ Your Spot".
   - The AI terms also mention the commenter's name, which Triage and the Drafter send (`SocialOrchestrator.cs:327,361`).
7. **Cross-tenant tests** for every GeekAPI social route and for joining a live-update group: another tenant's ids are refused. From here on, these tests gate every release.

Feasibility (documents, no product code):

8. **Platform access register**, one row per network:
   - developer account, business verification and app review;
   - permissions requested and account eligibility;
   - quotas and API price, and testing limits;
   - renewal and expected approval time;
   - what a suspension of GeekSocial's app does to every tenant, and how to recover.

   The register also stays in use as the maintenance record for each connector: API version, last verified date, known limits, recent failures and announced deprecations.
9. **Public legal pages first, then applications.**
   - **Before any application,** geek-social publishes a privacy policy and terms of service, reachable without signing in. Their content states what GeekSocial actually does:
     - what it collects;
     - the 30-day comment purge;
     - AI drafting with a person approving every reply;
     - the AI provider;
     - how to ask for deletion.

     The owner reviews them before they are published.
   - **robots.txt and the noindex header** are checked against each platform's rules for these URLs, using the access register.
   - **Then the applications are submitted,** by the account holder, so approval time runs alongside the build: Meta App Review and Business Verification for customers' Pages (`PLATFORM-CAPABILITIES.md:428`), LinkedIn Community Management, and Google Business Profile API access.
10. **Verified capability matrix**, checked operation by operation against each API's documentation and, where possible, a test account:
   - content types and media limits;
   - scheduling, publish, edit and delete;
   - comments, messages and reviews;
   - analytics;
   - rate limits.

   Phase 2's shared publishing design is built on this matrix.
11. **Connector contract** covering the whole connection lifecycle:
    - authorize and store the token encrypted;
    - refresh it;
    - detect revocation and permission changes;
    - reauthorize and disconnect;
    - discover the accounts behind a sign-in.

    Proven first on Facebook, the one connector that is built.
12. **Unit-economics model** for a small, a typical and a heavy tenant:
    - costs: AI tokens (priced for each candidate provider and model, as the cost per drafted reply and per post copy), platform API fees, email volume, media storage, compute and payment fees;
    - the result: monthly cost per tenant, and the margin at the prices under consideration (input to Q2).

### Phase 1: SaaS foundation

**Settled before any code**, each one a decision under **Decisions**:
- Roles kept separate from permissions, and whether one person can be in several tenants (Q3).
- How tenant, brand, connected account and user relate, so agency brands can be added later without a data migration (Q4).
- The retention matrix (Q5), the email providers (Q6) and staging (Q8).
- **The billing state machine:**
  - states and transitions;
  - webhooks verified and processed idempotently, including duplicates and out-of-order events;
  - a reconciliation sweep against the payment provider;
  - failed-payment retries and the grace period;
  - cancellation, refunds and disputes;
  - upgrades and downgrades with proration, and reactivation;
  - billing history;
  - entitlements enforced on the server;
  - what scheduled content does while a tenant is suspended.

**Build:**
1. **Transactional email service** in GeekAPI, for invitations, approval notices and receipts.
   - GeekBackend has none today; GeekOAuth uses plain SMTP (`AuthEmailService.cs`).
   - The provider sits behind one interface. Delivery records are durable, bounce and complaint webhooks are handled, and there is a suppression list.
2. **Team.**
   - Tables `geek_social.tenant_members` (tenant, user, role) and `invitations` (email, role, token hash, expiry, accepted at).
   - The membership check is copied from Geek-CRM (`GeekAPI/Auth/CrmAccess.cs`).
   - That check caches membership for 60 seconds, so a removed member can keep access for up to a minute. The review flagged this delay (#8); the Phase 1 plan settles whether any route skips the cache.
   - An invite link leads to sign-up or sign-in through `/connect/authorize`. Nothing in GeekBackend has invitations today.
3. **Billing**, built to the state machine above.
   - With PayPal (the requirement as written), the starting point is Geek Receptionist's code: `GeekAPI/Services/Voice/Billing/*`, `Onboarding/SignupPayments.cs`, `SubscriptionActivation.cs`, `TenantStanding.cs`, and tables `0060`–`0063`.
   - Today that code has an hourly standing sweep and no PayPal webhook. The state machine adds the missing parts.
4. **Onboarding wizard** at `/welcome`: business, plan and payment, AI terms, connect networks, invite team. Each step is saved on the server and can be resumed. Whether connecting comes before payment is decision Q7. Free, open sign-up ends here.
5. **Durable, tenant-scoped event records** for publishes, approvals, account status, sends and AI usage. They replace the in-memory orchestrator counters and are what Phase 8 reports on.
6. **Tenant data export**, and what deletion does when a tenant leaves (Q5, Q9).
7. **Operational monitoring**, plus the notices a customer sees when a platform fails or a scheduled post cannot publish.

### Phase 2: publishing core (Facebook first)

- **Post lifecycle:** draft → awaiting approval → approved and scheduled → publishing → published, failed, or outcome unknown.
  - An unknown outcome is checked against the platform, shown to a person, and not republished until that person has looked.
  - The action audit already records `outcome_unknown` for publishes and replies (`SocialSender.cs:87`, `SocialRecords.cs:393`); the post itself gets the same state.
- **Approval enforced in the backend:**
  - An approval covers one exact version of one network's text and media.
  - Any edit voids it.
  - Publishing refuses a post without a valid approval, and checks that the approver had the right permission.
  - Each recycled or RSS publication needs its own approval.
  - What else one approval covers is decision R4.
- **One post, several networks:** a post holds a version per network, and the composer shows each network's fields from the verified capability matrix.
- **Scheduler:**
  - GeekSocial's own, so every network behaves the same.
  - It wakes at the next due time, or on a channel when a schedule changes. There is no polling loop.
  - Each publication has an identity and an idempotency key, and the platform's post id is stored.
  - Transient errors get a limited number of retries. Orphaned jobs are reconciled at startup.
- **Media**, in the planned private Supabase Storage bucket reached through GeekRepository (`plans/geek-social-multi-tenant-connectors-2026-11-16.md:61-64`):
  - Uploads are authorized, and their type and size are checked.
  - Files are scanned for malware and processed per network.
  - Quotas follow the tier (Q13).
  - Signed URLs are issued after the tenant ownership check and expire.
  - Files move directly between the browser or the platform and storage through those signed URLs. GeekRepository issues the URLs and never streams file bytes.
  - A file is kept until every scheduled use of it has run.
  - Failed and orphaned uploads are cleaned up, and media is deleted with the tenant.
- **Per-platform pause**, for example when a platform's API misbehaves:
  - An operator can pause publishing and replies for one platform across all tenants.
  - The flag is stored in GeekRepository, so setting it needs no deploy or restart.
  - The scheduler and the sender hold the work, tenants see that the platform is paused, and nothing is dropped.
- **Calendar and queue:** a calendar, a queue with time slots, and content categories with evergreen recycling.

### Phase 3: networks, first wave

- Instagram (the same Meta app), LinkedIn (page and profile), and Google Business Profile (posts and reviews).
- Each follows the connector contract and the Facebook pattern (`SocialServiceRegistration.cs`), and ships behind its own release gate.

### Phase 4: networks, second wave

- X, TikTok, YouTube and Pinterest, each covering the operations decided in Q12, behind its own release gate.
- **Nextdoor:**
  - Planning and approval in GeekSocial are committed scope.
  - Publishing through the API depends on Nextdoor granting access.
  - Nextdoor does not hold up the rest of this phase.

### Phase 5: unified inbox

- DMs, mentions and reviews across networks.
- Assignment, saved replies, labels, hide and delete.
- AI drafts for each kind of message, and a person approves every one.
- **Per-reply AI budget**, shared by every component that calls a model:
  - For each reply it records the model calls, tokens, retries and the final outcome.
  - A third call is refused.
  - The same budget enforces each tenant's daily AI-call cap.
  - An automated acceptance test proves both limits.
- The orchestrator-as-agent plan (`plans/geek-social-orchestrator-agent-2026-11-17.md`: up to 8 turns plus re-drafts) breaks this limit. It must be redesigned to fit the budget or dropped.

### Phase 6: AI content and repurposing

- One source, an article URL or text, becomes per-network versions and an email version, in a brand voice.
- This phase writes content only. Scheduling and sending email, including drip campaigns, belong to Phase 7.
- Linking to Content Creator's pieces needs a read API that does not exist yet (`GccProjectsController` requires `content-creator.manage`).

### Phase 7: email marketing (Mailchimp and Constant Contact)

How lists and delivery are handled depends on decision R2. If GeekSocial sends itself, this phase starts with an email operations specification:
- **Sender setup:** SPF, DKIM and DMARC; sending-domain and sender verification; domain warm-up.
- **Reputation:** reputation monitoring, and spam-complaint thresholds.
- **Lists and limits:** one suppression list across all campaigns, abuse checks on contact imports, and sending rate limits.
- **Provider risk:** what happens if the provider suspends the account.
- **CAN-SPAM:** the sender is identified, the postal address is in the footer, and opt-outs are honored promptly.
- **Separation:** marketing mail is kept apart from transactional mail.

Then:
- Contacts with consent and its source, lists and segments, sign-up forms.
- A campaign editor whose content comes from a document model, rendered to HTML by one renderer; the model never writes HTML.
- Campaigns and drip campaigns, sending, unsubscribe links, bounce and complaint handling, and reports.
- Email → social and social → email.

### Phase 8: analytics and reports

- Metrics per network, post performance and cross-network reports, built on the Phase 1 event records.
- How long metrics are kept, and which metrics each platform makes available, are set before the reports are built.
- PDFs with QuestPDF, which is already in use (`GccLinkedInDocumentPdfRenderer.cs`), and scheduled report emails.

### Phase 9: agency

- Several brands per account, client approval links without a login, white-label reports.
- The underlying data model is decided in Phase 1 (Q4).

## Decisions

Every decision here belongs to the product owner; none is made during the build.

The decisions that block Phase 1 are grouped into two memos, settled while Phase 0 runs:
- **Memo A, entity and access:** Q3, Q4, Q15.
- **Memo B, billing, operations and retention:** R2, R3, Q5–Q9.

### Requirements the reviews questioned

| # | Requirement | The review's question | Needed before |
|---|---|---|---|
| R1 | All nine networks | Are all needed for the first paid release, or a subset? The review's example for local service businesses: Facebook, Instagram, Google Business Profile. Each network is also lasting maintenance work | Paid launch |
| R2 | Email like Mailchimp and Constant Contact | Should GeekSocial run lists and sending itself, or integrate with an established email provider that holds the lists and delivers, while GeekSocial writes and repurposes the content? The second review recommends integrating an established email API instead of running shared sending pools and domain warm-up | Phase 7; affects the provider choice in Phase 1 |
| R3 | PayPal | Compare with Stripe Billing and a merchant-of-record service. Points to compare: subscription changes, failed-payment recovery, webhooks, customer portal, refunds, disputes, tax, cost, and reuse of Geek Receptionist's code. The review notes that using PayPal does not by itself make PayPal responsible for GeekSocial's sales-tax and invoicing obligations. The second review notes that reusing Geek Receptionist's PayPal code saves build time, provided webhook signature verification and idempotency are added | Phase 1 |
| R4 | A person approves every reply and post | What does one approval cover? Several networks with identical text? Does a date change void it? Does approving your own post count? Do email campaigns need a separate rule? | Phase 2 |

The first review accepted the two-call AI limit and GeekSocial owning each network's app. It asked that the limit be enforced as a shared budget (Phase 5) and that app ownership be run as an ongoing responsibility (Phase 0, item 8).

### Not yet decided

| # | Decision | Needed before |
|---|---|---|
| Q1 | Which phase and which networks make up the first paid release | Paid launch |
| Q2 | Tiers, prices, pricing basis, trial, included usage and overage, set from the unit-economics model | Paid launch |
| Q3 | Roles kept separate from permissions; one person in several tenants | Phase 1 |
| Q4 | How tenant, brand, connected account and user relate | Phase 1 |
| Q5 | Retention matrix for every data category (comments, messages, reviews, posts, media, AI prompts and responses, subscribers, campaigns, delivery records, billing, audit, logs, backups), what must be kept for financial or legal reasons, and what happens when a tenant leaves | Phase 1 |
| Q6 | Transactional and marketing email providers, evaluated separately | Phase 1 |
| Q7 | Whether a client can connect accounts before paying | Phase 1 |
| Q8 | A permanent staging environment: separate database and storage, PayPal sandbox, test platform accounts, separate credentials, test data. The second review recommends making this a requirement, in place before any billing code | Phase 1 |
| Q9 | Customer data export: formats and who may export | Phase 1 |
| Q10 | Support channels, hours and response targets; incident and status communication; no promises that depend on a platform's uptime | Paid launch |
| Q11 | Whether Threads and Bluesky are in | Phase 2 design |
| Q12 | YouTube and Pinterest, operation by operation (for example Shorts or long video, community posts, comments, boards, analytics) | Phase 4 |
| Q13 | Storage quotas and overage | Phase 2 |
| Q14 | Which AI provider and model GeekSocial launches with. Claude, today's only client, is not assumed: it is not the cheapest. The choice is put forward with each candidate's cost per reply from the unit-economics model (Phase 0, item 12), and is set in `LlmProviders__DefaultProvider` on GeekAPI. Also the cost limits, including each tenant's daily AI-call cap | Launch |
| Q15 | Display names for members. Geek Auth sends the login (an email address) as the name (`AuthorizationController.cs:88`), so names need a field in GeekOAuth | Phase 1 |
| Q16 | API cost and usage budget for each connector | Each connector |
| Q17 | Whether listening, ads and link-in-bio are in | After Phase 9 |
## Documentation: every document, once this plan is approved

No document changes before approval. After approval, every document below is brought in line with the approved plan in one pass, before Phase 0 code. The answers to R1–R4 and Q1–Q17 go into each document they affect.

**Internal (engineering and planning):**
- **geek-social:** `README.md`, `HANDOFF.md`, `AUDIT.md`.
- **geek-social plans:**
  - `geek-social-tenant-setup-form-2026-11-18.md`: marked superseded by connecting through GeekSocial's own apps. Key rotation carries over to Phase 1.
  - `geek-social-multi-tenant-connectors-2026-11-16.md`: the Platforms table gets YouTube and Pinterest in, and Nextdoor as plan-and-approve.
  - `geek-social-orchestrator-agent-2026-11-17.md`: marked as breaking the two-call limit; it is redesigned or dropped in Phase 5.
  - `geek-social-engagement-agent-2026-11-08.md`: checked against the approved plan (auto-send removed, approvals).
- **GeekBackend:**
  - `Architecture.md` and `docs/GEEK-SOCIAL-API.md`.
  - `docs/PLATFORM-CAPABILITIES.md`, with §1a item 8 marked superseded. Its clearance items (M4, I6, L5) are reworded wherever they assume Claude is the only provider.
  - The comments on the AI interface and its registration (`SocialInterfaces.cs`, `SocialServiceRegistration.cs`), which describe Claude as the default.
  - `docs/GEEK-CRM-DATA-MODEL.md`, where it mentions GeekSocial.
  - `docs/platform-research-2026-11-16/` (linkedin, meta, pinterest, x, youtube), checked against the 2026-11-18 research.
  - `plans/geek-social-handoff-2026-11-12.md` and `plans/geek-social-7b-tenants-2026-11-16.md`.
- **New in GeekBackend:**
  - `docs/market-research-2026-11-18/`: the six reports and the pricing table.
  - `docs/GEEKSOCIAL-SCOPE.md`: the scope table, the requirements, and the decisions as answered.
- **geekatyourspot:** `plans/geek-social-engagement-agent-2026-11-08.md` is a copy of the geek-social plan. It is replaced by a pointer to that plan, or brought in line.
- **The assistant's memory notes for this project:** the tenant-setup-form note, now wrong, is rewritten; the email, Nextdoor and replaceable-AI-provider requirements are recorded.

**External (what customers and platforms read):**
- **Text in the app:**
  - the site description (`src/app/layout.tsx:25`, "for Geek @ Your Spot");
  - the AI terms on `/welcome`;
  - the Accounts and Comments wording (Phase 0, item 6);
  - the six places that name Claude (Phase 0, item 1).
- **GeekOAuth:** any product name or description the GeekSocial sign-in client shows (`OidcPublicClientSeeds.cs`, `ScopeSeeder.cs`).
- **Pages that do not exist yet:** geek-social has no privacy policy, terms of service or help pages. The platform applications in Phase 0, item 9 may need public versions; the access register records each platform's exact requirement.
## Verification, every phase

- **GeekBackend:** `dotnet build` and `dotnet test GeekBackend.Tests` (unit tests against fakes; no local database), including the cross-tenant tests and the AI-provider contract tests.
- **geek-social:** `npm run typecheck`, `lint`, `test`, `build` with CI's placeholder settings, and `check:trace`.
- **Release:** CI green after the push; Railway and Vercel deployments verified.
- **Live:** a walkthrough of the deployed site in a browser, with the account holder entering passwords. Phase 0's live check:
  - sign-in works;
  - live updates connect, with no "Live updates are off" banner;
  - Activity shows only this tenant's numbers;
  - no auto-send setting appears anywhere;
  - `/robots.txt` disallows all;
  - Activity names the configured AI provider, and a comment on a cleared platform gets a draft.

## How this plan answers the reviews

### First review

| Findings | Where |
|---|---|
| 1, 2 | Release strategy; R1, Q1 |
| 3, 10, 31 | Phase 0, items 8–9 |
| 4, 12, 13, 20 | R2, Q6; Phase 1, item 1; Phases 6 and 7 |
| 5, 11 | R3; Phase 1 billing state machine |
| 6, 23 | R4; Phase 2 approval |
| 7, 25 | Phase 5 per-reply AI budget |
| 8 | Standing rules (tenant isolation); Phase 0, item 7 |
| 9, 26 | Standing rules (retention); Q5 |
| 14 | Phase 2 post lifecycle |
| 15 | Q8 |
| 16 | Phase 2 media; Q13 |
| 17, 22 | Q3, Q4 |
| 18, 28 | Phase 0, item 10; Q12 |
| 19 | Phase 0, item 11; Q7 |
| 21 | Phase 1, item 5; Phase 8 |
| 24 | Standing rules (nothing fails silently) |
| 27 | Phase 4 (Nextdoor) |
| 29 | Decisions |
| 30 | Phase 0, item 12; Q2 |
| 32 | Phase 1, item 6; Q9 |
| 33 | Phase 1, item 7; Q10 |

### Second review

| Finding | Where |
|---|---|
| Too many decisions block Phase 1 at once | Decisions: memos A and B |
| No pause for one platform across all tenants | Phase 2, per-platform pause |
| Testing without staging | Q8 (recommendation recorded) |
| Email marketing scope | R2 (recommendation recorded) |
| Webhook security and floods of inbound events | Standing rules (inbound events); Phase 5 |
| Where `GEEK_SOCIAL_CLAUDE_CLEARED_PLATFORMS` lives | Phase 0, items 1 and 6 |
| Media streamed through GeekRepository or sent directly | Phase 2, media |
| Reusing Geek Receptionist's PayPal code | R3 |

### Third review

| Case to watch | Where |
|---|---|
| Perplexity's web search could carry comment text into search queries | Phase 0, item 1 (Perplexity) |
| Platform applications need public privacy and terms pages | Phase 0, item 9 |
| JSON-schema strictness differs between providers | Phase 0, item 1 (schemas) |

### New requirement

| Requirement | Where |
|---|---|
| Replaceable AI provider | Requirements; standing rules (code); Phase 0, item 1; Q14 |
