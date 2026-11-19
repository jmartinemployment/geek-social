# GeekSocial as a multi-tenant product: connectors, tenants, images

Status: approved by Jeff 2026-11-16 with the adjustments under "Approved adjustments". Gate 7a (verification) only is authorized. **Gate 7a is complete (2026-11-16): see GeekBackend `docs/PLATFORM-CAPABILITIES.md` sections 1b and 2e to 2k and `docs/platform-research-2026-11-16/`. Nothing past 7a starts until Jeff has decided the eight items in 1b. Decided so far: item 1, there is no autonomous sending: nothing is posted without a person approving that reply or post, so auto-send is removed from the product and no platform consent question is asked (Jeff, 2026-11-16).** It changes the approved plan
(`geek-social-engagement-agent-2026-11-08.md`), which treated GeekSocial as one owner's tool. No code
follows from this until each gate below is approved.

## Approved adjustments (Jeff, 2026-11-16; these override the decisions below where they differ)

**Superseded for scope and order, 2026-11-18,** by `plans/geek-social-roadmap-2026-11-18.md` (revision 3). The changes:
- YouTube and Pinterest are back in scope.
- Nextdoor is plan-and-approve.
- GeekSocial owns the app on each network, and tenants connect by signing in.

The rest of this file stays as the record of 2026-11-16.

1. **Full platform scope, no exclusions:** Facebook, Instagram, LinkedIn, Google Business Profile, X,
   TikTok, YouTube and Pinterest, and Nextdoor as plan-and-approve. YouTube and Pinterest were dropped on
   2026-11-16 and restored on 2026-11-18. A platform that cannot do something (read comments, receive pushes) is
   marked BLOCKED for that action in the matrix, not dropped. `ISocialPublisher` (every platform) stays
   separate from `ISocialEngagementReader` (only the platforms that have comments or reviews to read).
2. **Everything real-time goes through one tenant-scoped SignalR hub in GeekAPI:** incoming webhook items,
   draft completions, and publish and reply statuses. No client polling, no post-backs. When a customer
   opens the screen and the hub connection is established, GeekAPI runs one on-demand sync for each
   connected platform that has no push (for example X, TikTok, Pinterest) and streams drafts to the screen
   as they finish. That sync is triggered by the person's connection, never by a timer.
3. **`tenants` table:** `id`, `owner_user_id`, `name`, `ai_consent_accepted_at`, `created_at`. `tenant_id`
   is the foreign key on every social table, mapped 1:1 to the owner on sign-up for now. This replaces
   decision 2 below (tenant is not the `OwnerId` itself).
4. **Gate 7b is an onboarding gate:** a tenant must have confirmed an email and a phone number and accepted
   the AI terms before connecting an account or generating a draft. Phone confirmation depends on the
   GeekOAuth two-factor and phone work, which another session owns.
5. **Gate 7a checklist:** extend `PLATFORM-CAPABILITIES.md` for Google Business Profile (with Google Cloud
   Pub/Sub push for reviews), X, YouTube, TikTok and Pinterest. For every platform: push webhook or
   on-demand sync only, binary upload or signed-URL media, and the image format rules.

## What changed

GeekSocial is a sellable product: a customer signs up, connects their own accounts, and the agents
draft replies for them. Scheduling posts is a later phase of Content Creator and is **out of scope
here**. GeekSocial writes the post and its image prompt, stores the image, and publishes when told to.

## What already exists (checked 2026-11-16 in GeekBackend)

| The pasted spec asks for | What is already there |
|---|---|
| `social_connections` | `geek_social.social_accounts` (0043), no owner column |
| `engagement_items` | `engagement_events` plus `reply_drafts`, with once-only reply and `outcome_unknown` |
| `scheduled_posts` | `social_posts` (published posts only); scheduling is Content Creator's, later |
| One `ISocialConnector` with seven methods | Four contracts in `SocialInterfaces.cs`: `ISocialAccountConnector`, `ISocialEngagementReader`, `ISocialPublisher`, `ISocialEngagementWriter`, plus `ISocialTokenProvider`; Facebook implements them |
| `Result<T>` | `GeekApplication/Results/Result.cs`, in use |
| Dapper in Geek-Repository | `SocialRepository` already uses Dapper |
| A tenant | Content Creator isolates by `OwnerId`, which is the signed-in user's id; GeekSocial has nothing |
| Image prompts | Content Creator already has an "also write image prompts" option |
| Image storage | Not defined anywhere I could find |

## Decisions (defaults stated; veto any)

1. **Extend, do not duplicate.** Add `tenant_id` to the existing social tables and make every read and
   write filter on it. A parallel set of three new tables would split one product's data in two and drop
   the once-only and uncertain-outcome rules that the existing tables enforce.
2. **Tenant = the signed-in user's id** (`OwnerId`, as Content Creator does). A team or organisation
   concept is a later change; say so now if customers need it first.
3. **Keep the split contracts, one provider class per platform.** The spec's single interface would let
   anything that can read also write. The approved plan makes the Sender the only component that changes
   a platform. Each platform's quirks stay in its own provider classes, as the spec also asks.
4. **No timer polling, as `AGENTS.md` requires.** The spec's `FetchRecentCommentsAndReviews(since)` becomes
   webhook intake where the platform has one, and an operator-triggered resync for gap recovery. A
   platform whose only way to see new comments is polling cannot be added on that basis. See X below.
5. **Images:** a private Supabase Storage bucket, path `{tenantId}/{postId}/{file}`, only the path stored
   in the database. A short-lived signed address is made when a platform has to fetch the file. Formats are
   converted per platform at publish time. Unverified: that each platform accepts a signed address and
   which formats each takes; Phase 7a checks both.
6. **Image prompts** are written with the post by the Post Writer, shown to the customer, and kept with
   the post. GeekSocial does not generate pictures.

## What a product needs that one owner's own accounts did not

- **Platform approval for other people's accounts.** The Phase 0 matrix says Meta needs no App Review for
  the owner's own accounts. Connecting customers' accounts does: Meta App Review and business
  verification, LinkedIn's Standard tier (form, screen recording, test credentials), and Google's access
  request and OAuth verification for the Business Profile APIs. Each takes time and none can be skipped.
- **Per-customer clearance** to send comment text to Claude, and terms that cover a service run for other
  businesses.
- **Per-tenant limits**: the 30-replies-an-hour limit and the cooldown are per account today and must
  stay per tenant.
- **Retention**: LinkedIn's 48 hours applies to every tenant's comments.

## Platforms

| Platform | State | Before any code |
|---|---|---|
| Facebook | Built for one owner | Make it tenant-aware |
| Instagram | Declared, no connector | Settle I1, I3, I4 from Meta's docs |
| LinkedIn organisation, member | Declared, no connector | LinkedIn app and Community Management approval (yours to request); member stays publish-only |
| Google Business Profile | In scope | Gate 7a: API access request, review and reply endpoints, Pub/Sub push for reviews |
| X | In scope | Gate 7a: which tier can read mentions, its cost, and whether mentions arrive without polling |
| YouTube | In scope since 2026-11-18 (roadmap Phase 4; which operations is decision Q12) | The quota question; `PLATFORM-CAPABILITIES.md` 2g |
| TikTok | In scope | Gate 7a: Content Posting API audit, whether any comment API exists for third parties |
| Pinterest | In scope since 2026-11-18 (roadmap Phase 4): publish-only, no inbox | `PLATFORM-CAPABILITIES.md` 2i |
| Nextdoor | Planned and approved in GeekSocial since 2026-11-18; publishing through its API once access exists | Nextdoor API access |

Google, X, YouTube, TikTok and Pinterest are researched in Gate 7a and written into
`PLATFORM-CAPABILITIES.md`; nothing about them is coded from memory.

## Order, each ending at a gate for Jeff

- **7a. Verification.** Extend `PLATFORM-CAPABILITIES.md` for the five new platforms and for multi-tenant
  access on every platform; settle I1, I3, I4; settle image formats and signed addresses. No code.
- **7b. Tenants and the onboarding gate.** A `tenants` table (see adjustment 3); `tenant_id` on the social tables, a migration that gives existing rows to the current
  owner, filters in `SocialRepository` and every controller, tests that one tenant cannot read or change
  another's account, draft, post or image. Then the screen shows only the signed-in tenant's accounts.
- **7c. Images.** Storage, the image prompt on a post, and the Posts page.
- **7d onward.** One platform per step. The order is set after Gate 7a shows which platforms can receive
  pushes and which are open to a SaaS at all.
  Each connector is proven against a real test account before the next starts, and none is reported as
  working on the strength of tests against a stand-in.

## Rules kept

No autonomous sending (Jeff, 2026-11-16): a person approves every reply and every post. Care must be given to
prevent AI hallucinations, spam and similar content from being posted. Removing auto-send from what is built
(`AutoSendCategories`, the orchestrator's auto-send step, this screen's Accounts settings) is work for a later gate.

Fail loud with `Result<T>` and a visible outcome, never a swallowed error. One attempt per write, and a
write the platform did not clearly refuse is `outcome_unknown`. No stubs and no placeholder data.
Markdown is not a corpus format. Nothing polls on a timer.
