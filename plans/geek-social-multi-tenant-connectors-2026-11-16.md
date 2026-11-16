# GeekSocial as a multi-tenant product: connectors, tenants, images

Status: draft for Jeff's veto, written 2026-11-16. It changes the approved plan
(`geek-social-engagement-agent-2026-11-08.md`), which treated GeekSocial as one owner's tool. No code
follows from this until each gate below is approved.

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
| Google Business Profile | Not in the plan | Phase 0 verification: API access request, review and reply endpoints, whether new reviews can arrive without polling |
| X | Not in the plan | Phase 0 verification: which paid tier can read mentions at all, its cost, and whether mentions can be received without polling |

I have not researched Google or X. Nothing about their endpoints, limits or prices in the pasted spec is
verified, and none of it should be coded from memory.

## Order, each ending at a gate for Jeff

- **7a. Verification.** Extend `PLATFORM-CAPABILITIES.md` for Google and X and for multi-tenant access
  on every platform; settle I1, I3, I4; settle image formats and signed addresses. No code.
- **7b. Tenants.** `tenant_id` on the social tables, a migration that gives existing rows to the current
  owner, filters in `SocialRepository` and every controller, tests that one tenant cannot read or change
  another's account, draft, post or image. Then the screen shows only the signed-in tenant's accounts.
- **7c. Images.** Storage, the image prompt on a post, and the Posts page.
- **7d onward.** One platform per step, in this order: Instagram, LinkedIn, Google Business Profile, X.
  Each connector is proven against a real test account before the next starts, and none is reported as
  working on the strength of tests against a stand-in.

## Rules kept

Fail loud with `Result<T>` and a visible outcome, never a swallowed error. One attempt per write, and a
write the platform did not clearly refuse is `outcome_unknown`. No stubs and no placeholder data.
Markdown is not a corpus format. Nothing polls on a timer.
