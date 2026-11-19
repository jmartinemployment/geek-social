# GeekSocial: plan for review (revision 4, 2026-11-19)

Previous reviews: revision 1 (33 findings), revision 2 (five gaps, three clarifications), revision 3 ("approved to freeze the plan and begin Phase 0", three cases to watch). Revision 4 incorporates the Phase 0 findings, the full SMM market research (22 tools), and the competitor pricing and unit-economics work.

---

## The product

GeekSocial is a social media management product for small businesses. It has three parts:

- **geek-social:** Next.js screens on Vercel.
- **GeekAPI:** a .NET service on Railway — business logic, background worker ("orchestrator").
- **GeekRepository:** a .NET service — the only path to the Postgres database.

Sign-in goes through Geek Auth (GeekOAuth, OpenIddict). One paying customer is one **tenant**.

---

## What is built today

At geek-social `299c767` and GeekBackend `f90e9d0e`: five screens (Inbox at `/`, Comments, Accounts, Posts, Activity); one network (Facebook Pages); link posts can be published now; a signed-out visitor at `/` is redirected to sign-in.

Components in place:

- **Connector:** `MetaAccountConnector`, Login for Business, token renewal, marks accounts `reconnect_required`.
- **Listener:** webhook handshake, `X-Hub-Signature-256` verified, events stored once.
- **Triage:** forced-schema model call, clearance-gated; fails closed with no clearance recorded.
- **Drafter** and **Post Writer:** single model call each, one attempt.
- **Reviewer:** plain code, no model call; refuses em dashes, the address, unapproved links.
- **Sender:** one attempt, one `action_audit` row, `outcome_unknown` on ambiguous result.
- **Orchestrator:** background service, single-reader channel wake, startup recovery.

LinkedIn, Instagram, GBP, X, YouTube, TikTok and Pinterest are not yet connected; they wait on platform applications.

Phase 0 items 1-7 are deployed; feasibility work for items 8-12 is complete.

**Phase 0 findings** (from `PLATFORM-ACCESS-REGISTER.md`, `PLATFORM-CAPABILITIES.md`, `GEEK-SOCIAL-API.md`, and `plans/research/geek-social-unit-economics-2026-11-18.md`):
- The configured model (`gpt-4.1`) shuts down 2027-01-14. Switching changes `LlmProviders__OpenAi__Model` on GeekAPI; Content Creator and the Receptionist share `LlmProviders__DefaultProvider`.
- Nextdoor's Publish API form excludes promoting a business.
- X link posts cost $0.200 each.
- Native scheduling is available on three networks only.
- Media is bytes for LinkedIn, X and YouTube; URL for Meta, TikTok and Pinterest.
- AI token counts are not currently recorded.
- Meta connector gap: guides name `pages_read_user_engagement`; connector checks `pages_read_user_content`.
- No deauthorization or deletion callback is built.
- Google and TikTok refuse a website that is a login page or a redirect.

---

## What the market does

22 tools were researched (`plans/research/geek-social-smm-platforms-2026-11-19.md`). Competitor pricing is in `plans/research/geek-social-competitor-pricing-2026-11-18.md`.

| Area | Strongest implementations (tool, line in research file) |
|---|---|
| **Planning calendar** | Planable: views, campaigns, labels, version history (475); ContentStudio shareable calendar (511); SocialBee time zones (313); Ocoya unified calendar for posts, articles and email (583) |
| **Scheduling** | MeetEdgar categories with weekly slots, recycle when empty, Use Once, expiry (367); Vista recycling capped at 25 reuses 72 hours apart (403); Publer CSV up to 500 (295) with every rejected row reported — Buffer drops silently (241); RSS into pending-review queue (367); tenant-wide pause (Sprout 223, Hootsuite 205); per-network daily caps (Publer 294, Sendible 349); best times from the tenant's own data (Statusbrew 421, Metricool 277) |
| **Composer** | Per-network versions, first comment, Stories, Reels, carousels, polls, threads where the network allows (Metricool 277, Statusbrew 421); Publish Rules pre-checks (421); locked draft templates (Agorapulse 386); alt text (Metricool 242, Agorapulse 386); media library; Canva and cloud-drive import (Metricool 278, Publer 306); link shortening and UTM (SocialBee 313, Metricool 277) |
| **Categories and library** | SocialBee: evergreen re-queue, share-once, expiry, pause, UTM and analytics per category (313, 318) |
| **AI content** | Brand profile from website and documents (ContentStudio 512, SocialBee 325); per-network do/don't rules (Loomly 494); voice from the brand's own posts (Metricool 278); one blog becomes a drip (Missinglettr 548, Lately 530); Full AI, Balanced, No AI modes (548); AI-content labels (Metricool 278, 296); account-level AI-off switch (Agorapulse 395) |
| **Approvals** | Planable: up to 10 levels, lock after approval, schedule on approval, revoke unschedules, version history, internal notes (475, 481); Sprout: any-or-all per step, auto-reject after 90 days, approvals for inbox and review replies (229); Statusbrew: required rejection reason, reminders, external approver by magic link with no seat (427); Metricool: any rejection blocks publishing (283); Loomly: client cannot see drafts (499); Hootsuite: exportable approval history (211) |
| **Auto-send and automation** | Vista automations, Statusbrew Rule Engine and "Let AI reply", SocialPilot auto-replies, ContentStudio send-automatically rules, Hootsuite keyword and business-hours replies (207), Meta's keyword automations and Business Agent (449); ManyChat comment-to-DM, story-reply and keyword DM automations |
| **Engage** | Agorapulse: assignment, collision detection, saved replies, labels, AI suggestions sent by a person, moderation rules that hide or delete but never reply (387); Sprout: keyword auto-hide, spam classification (225); Statusbrew: history backfill, SLA reports (423) |
| **Reviews** | Sprout: GBP and Facebook with approval (226); Hootsuite: GBP and Facebook (208); SocialPilot: review requests by email and low-rating gating to private feedback first (334) |
| **Notices** | Failed posts, reconnects, empty queues, unanswered comments, approval reminders (Statusbrew 250, Agorapulse 394, Planable 481, SocialPilot 337) |
| **Measure** | Cross-network reports, PDF and PPTX, scheduled emails to non-login recipients (Sendible 354), no-login report links (Metricool 282), white-label reports (Agorapulse 390), campaign goals (Metricool 282), best times heatmap (Metricool 277) |
| **Team and agency** | Permissions per brand and section (Metricool 283); isolated space per client (Statusbrew 428); brand voice per client (Vista 410); white label with own domain and sender (Metricool 284, SocialPilot 338); client connect links (Sendible 356, Vista 410, Statusbrew 428, Agorapulse 392) |
| **API and MCP** | Tokens scoped to workspace with expiry, MCP with per-action toggles and idle expiry (Planable 485-486); no "publish now" — waits for approval (Agorapulse 395); API posts held for approval (Buffer 247); "approved" webhook (ContentStudio 517) |
| **Email** | Confirmed opt-in on by default (GetResponse 866); no bought lists, unchecked boxes (Brevo 837-839, Mailchimp 889-891); one-click unsubscribe (MailerLite 915); complaint limits (MailerLite 0.2% 916, Moosend 0.1% 933); campaign calendar shared with social (Mailchimp 881, Ocoya 583); sent campaign offered as a social post (Mailchimp 884-885); Facebook lead ads into lists (804-805, 835); Mailchimp and Brevo may use customer data for machine learning (898, 847) |
| **Customer-supplied AI keys** | FeedHive 577, Publer 307 let customers bring their own |
| **Link in bio** | With email capture (Later 268, Publer 304); Later does not remove unsubscribed people (268) |
| **Onboarding** | Wizard and checklist (SocialBee 325, Vista 415); five-step flow; trials of 14-30 days, several without a card; no tool asks the customer for their own developer app (253, 397) |
| **Mobile** | Approvals and inbox on the phone (Metricool 288, Publer 301, SocialPilot 337) |
| **Pricing** | Per user: Hootsuite $99, Sprout $99, Agorapulse $99; per channel: Buffer $6; per brand or profile set: Metricool $25, Later $25, SocialBee $29, SocialPilot $30, Sendible $35; free plans at Buffer, Metricool, Later, Loomly, Planable, Meta Business Suite; X as add-on at Agorapulse ($69/profile/month); PayPal accepted at Hootsuite, Sprout, Agorapulse, Metricool, Publer, SocialBee, SocialPilot |
| **Structural observation** | Every researched tool structures its product around planning and publishing, not the inbox. Homepage headlines name "plan", "schedule" or "measure"; the inbox is one module among several (Finding 1) |

---

## Proposed path forward

The following describes how the work is currently conceived. All of it is open for review.

### Phase 0 — the current focus

Items 1-7 are deployed. Items 8-12 are research done. The findings above raise the following proposed additions before the platform applications are submitted:

**Proposed 0a — 30-day purge.** The privacy policy would describe a 30-day purge of comments and derived data (drafts, audit rows, job payloads). Whether and how to build this, and what categories it covers, is open.

**Proposed 0b — Disconnect and deauthorization.** Meta's review process requires a deauthorization callback. A disconnect flow that removes a stored token and queued work while keeping the audit record is one approach. Whether the audit record should be kept is open.

**Proposed 0c — AI token recording.** A per-tenant daily cap on AI calls would need token counts per call. These are not currently recorded. Where to record them and what the cap should be is open.

**Proposed 0d — AI model switch.** The configured model shuts down 2027-01-14. The replacement model, the timing of the switch, and how it affects Content Creator and the Receptionist (which share the provider setting) are open.

**Proposed 0e — Public product site.** Google and TikTok require a public homepage that is not a login page. One approach: a home page at the current domain with preview wording for unbuilt features, a privacy policy and terms of service, and `robots.txt` opened for those pages and every URL in the Meta app settings. Whether the app moves to a sub-path, what the home contains, and which address it lives at are open.

**Then: platform applications.** Meta App Review and Business Verification for customers' Pages, LinkedIn Community Management, Google Business Profile API access.

---

### Phase 1 — SaaS foundation

The owner has described a paid SaaS with billing through PayPal. What is being considered:

- A multi-step onboarding wizard (five steps are one option: business info, plan and payment, AI terms, connect networks, invite team).
- A billing implementation starting from Geek Receptionist's code — states and transitions, webhooks, reconciliation, retries, grace period, upgrades, downgrades, billing history, entitlements. Whether PayPal is the right provider, and how it compares to Stripe or a merchant-of-record, is open.
- Approval notices, invitation emails and receipts via a transactional email service. Which provider, and whether the provider's terms permit training on customer data, is open.
- Team membership and an external approver path with no seat requirement. The structure of roles and permissions is open.
- Durable per-tenant event records for publishes, approvals, account status, sends and AI usage.
- Tenant data export and behaviour on tenant departure. The scope of both is open.
- A staging environment. Whether one is required before billing code is built is open.

---

### Phase 2 — Planning and publishing

The owner has described a tool that lets a business plan, compose and schedule content across networks. What is being considered:

- A calendar and queue as the primary view. Whether the planner or the inbox should be the first screen, and when that changes, is open.
- Per-network versions, first comment, Stories, Reels, carousels, alt text, media library.
- Best-time suggestions — from the tenant's own data, from pooled data, or not at all — is open.
- A per-platform pause: queued work held without dropping.
- CSV import, RSS as a pending-review feed, evergreen recycling with expiry.
- A brand profile and per-brand do/don't rules, used by the AI drafter. Whether this belongs in Phase 2 or later is open.
- Approval model: one option is one exact version, one network, any edit voids it. What one approval covers — several networks, a date range, a recurring post — is open.
- Media handling: GeekAPI could fetch bytes for networks that take bytes (LinkedIn, X, YouTube), and serve signed URLs for networks that take URLs (Meta, TikTok, Pinterest). Other arrangements are possible.
- Link shortening and UTM parameters.

---

### Phase 3 — Networks, first wave

Instagram (same Meta app), LinkedIn (page and profile), and Google Business Profile (posts and reviews). The features to cover on each — Stories, Reels, carousels, article posts, GBP post types, review replies — and the order are open.

---

### Phase 4 — Networks, second wave

X, TikTok, YouTube and Pinterest. For X, AI replies may require X's prior approval and may be limited to mentions only (access register). For Nextdoor, publishing through the API depends on whether Nextdoor grants access; the form has excluded promoting a business. Whether Nextdoor becomes a reminder to post by hand, or is dropped from scope, is open.

---

### Phase 5 — Unified inbox

The owner has described a tool that handles comments, DMs, mentions and reviews across networks with AI-drafted replies that a person approves. What is being considered:

- Assignment, collision detection, saved replies, labels, hide and delete.
- Moderation rules that hide, delete, label or assign — whether they should be able to reply automatically is open.
- An AI draft for each kind of message. The owner has described a limit of two AI calls per comment. Whether that limit is right, and how to enforce it, is open.
- A per-tenant daily cap on AI calls, with some portion reserved for the inbox.
- SLA reporting.
- For GBP and YouTube, stored data may need to be refreshed or deleted within 30 days (access register).
- A proposal exists (`plans/research/geek-social-orchestrator-agent-2026-11-17.md`) to make the orchestrator LLM-driven, using up to 6 model calls per comment. Whether this is compatible with the two-call description, and whether the two-call description is right, is open.

---

### Phase 6 — AI content and repurposing

What is being considered: one source (article URL or text) becomes per-network versions and an email version using the brand voice from Phase 2. A drip that turns one blog post into a year's worth of posts (Missinglettr 548, Lately 530). Full AI, Balanced, No AI modes. AI-content labels. An account-level AI-off switch. Whether non-text AI (transcription, images, video) belongs in this phase or later is open. Whether customers supplying their own AI keys should be supported is open.

---

### Phase 7 — Email marketing

The owner has described email marketing as part of the product. What is being considered:

- Contacts with consent and its source, lists, segments, sign-up forms.
- Campaign calendar shared with the social post calendar.
- Sent campaigns offered as a social post.
- Facebook lead ads into lists.
- Confirmed opt-in on by default; no bought lists; one-click unsubscribe; complaint thresholds.
- Whether GeekSocial sends itself (requiring SPF/DKIM/DMARC, reputation monitoring, suppression list, CAN-SPAM footer) or integrates an established provider is open. The second review recommends integrating. Whether any candidate provider's terms permit training on customer data (Mailchimp and Brevo may) is an open evaluation criterion.

---

### Phase 8 — Analytics and reports

What is being considered: metrics per network, post performance, cross-network reports with PDF and PPTX export. Scheduled report emails to people without a login. No-login report links. White-label reports. Campaign goals. Best-time analysis. Whether reports carry comment text or personal data, and what the retention window for analytics is, are open.

---

### Phase 9 — Agency and API

What is being considered: several brands per account, client connect and approval links without a login, white-label reports with own domain. An API and MCP server: what operations to expose and which to restrict — approvals, comments, DMs — is open. The underlying data model is open.

---

### Later

Link in bio with email capture (Later does not remove unsubscribed people, 268 — whether that matters for GeekSocial's approach is open), listening, ads, native mobile apps, competitor tracking from public data, non-text AI.

---

## Review mapping

Previous reviews and where they were addressed in this revision:

### First review (33 findings)

| Findings | Where addressed |
|---|---|
| 1, 2 | Release strategy (Phase 1 and later phases) |
| 3, 10, 31 | Phase 0 |
| 4, 12, 13, 20 | Phase 1 (email); Phases 6 and 7 |
| 5, 11 | Phase 1 (billing) |
| 6, 23 | Phase 2 (approval) |
| 7, 25 | Phase 5 (AI per-reply) |
| 8 | Phase 0, item 7; Phase 2 |
| 9, 26 | Phase 0, item 0a; Phase 7 |
| 14 | Phase 2 (post lifecycle) |
| 15 | Phase 1 (staging) |
| 16 | Phase 2 (media) |
| 17, 22 | Phase 1 (team and roles) |
| 18, 28 | Phase 0, item 10; Phase 4 |
| 19 | Phase 0, item 11; Phase 1 |
| 21 | Phase 1 (event records); Phase 8 |
| 24 | Phase 0 findings; Phase 1 |
| 27 | Phase 4 (Nextdoor) |
| 29 | Phased approach |
| 30 | Phase 0, item 12; Phase 1 (pricing) |
| 32 | Phase 1 (tenant departure) |
| 33 | Phase 1 (operational monitoring) |

### Second review

| Finding | Where addressed |
|---|---|
| Too many decisions block Phase 1 at once | Phase 1 (grouped before-code work) |
| No pause for one platform | Phase 2 |
| Testing without staging | Phase 1 (staging) |
| Email marketing scope | Phase 7 |
| Webhook security and inbound-event floods | Phase 0 items 1 and 4; Phase 5 |
| Where cleared-platforms setting lives | Phase 0, item 1 |
| Media streamed through GeekRepository or directly | Phase 2 (media) |
| Reusing Receptionist's PayPal code | Phase 1 (billing) |

### Third review

| Case to watch | Where addressed |
|---|---|
| Perplexity web search could send comment text | Phase 0, item 1 |
| Platform applications need public privacy and terms | Phase 0, items 9 and 0e |
| JSON-schema strictness differs between providers | Phase 0, item 1 |

---

## Research files

| File | Contents |
|---|---|
| `plans/research/geek-social-smm-platforms-2026-11-19.md` | 22 SMM tools researched 2026-11-19 (168 KB) |
| `plans/research/geek-social-competitor-pricing-2026-11-18.md` | Pricing tables for all 22 tools |
| `plans/research/geek-social-unit-economics-2026-11-18.md` | Cost model: AI, platform fees, PayPal, storage |
| `plans/research/geek-social-engagement-agent-2026-11-08.md` | Original agent architecture |
| `plans/research/geek-social-multi-tenant-connectors-2026-11-16.md` | Earlier multi-tenant connector plan |
| `plans/research/geek-social-orchestrator-agent-2026-11-17.md` | LLM orchestrator proposal |
| `plans/research/geek-social-tenant-setup-form-2026-11-18.md` | Earlier tenant-setup form |
