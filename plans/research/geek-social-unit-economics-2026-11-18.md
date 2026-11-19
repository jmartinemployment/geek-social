# GeekSocial unit economics, 2026-11-18

Roadmap Phase 0, item 12 (`plans/geek-social-roadmap-2026-11-18.md:223-225`): what one tenant costs GeekSocial a
month, for a small, a typical and a heavy tenant, and the margin at a range of prices. It is the input to Q2
(tiers, prices and included usage), which is not decided.

**How far to trust it.**
- **Prices** were read from each vendor's own pricing page on 2026-11-18; each table names its source.
- **The size of each AI call** was measured from GeekSocial's own prompt builders, but converted to tokens by
  estimate.
- **Tenant volumes** (comments, posts, emails, storage) are placeholders that span a range. Nothing measured
  them, and no tenant exists yet. Replace them with the first tenants' numbers.
- **Compute** is not in the per-tenant cost; see "Not included".

## Findings

1. **The configured model shuts down on 2027-01-14.** GeekAPI runs on OpenAI `gpt-4.1`. OpenAI's deprecations
   page lists it as deprecated (notice 2026-10-14, shutdown 2027-01-14), with `gpt-6-luna` as the replacement
   (https://developers.openai.com/api/docs/deprecations, read 2026-11-18). `gpt-4.1-mini` has the same dates.
   `gpt-6-luna` costs a twentieth of `gpt-4.1` per token (below). Switching is a change to `GEEK_SOCIAL_AI_MODEL` on
   Railway. Before switching, run one live triage and one draft on it to check that triage's 400-token output limit
   is enough, since some models spend part of that limit before answering.
2. **AI is not the cost that matters on a small or cheap model.** A typical tenant's AI costs about $0.11 a month
   on `gpt-6-luna` or Claude Haiku 5.5, and about $2.09 on `gpt-4.1`. On a flagship model it is $9 to $53.
3. **X is the largest variable cost for any tenant that uses it.** X charges $0.200 for each post with a link,
   which is how GeekSocial shares an article. It also charges $0.015 for each other post and $0.005 for each
   delivered event (`GeekBackend/docs/platform-research-2026-11-16/x.md:21-31`). A heavy tenant on X costs about
   $27 a month in X fees alone, more than its AI on any model short of a flagship. Pricing X as an add-on, as
   Agorapulse does ($69 per X profile a month, `plans/geek-social-competitor-pricing-2026-11-18.md:77`), is one way
   Q2 can handle this.
4. **PayPal's fixed fee dominates at low prices.** PayPal Checkout costs 3.49% + $0.49 per payment, so a $15 plan
   loses $1.01 (6.7%) and a $99 plan loses $3.95 (4.0%).
5. **Nothing records what the AI actually used.** Every model client returns the input and output tokens of each
   answer (`SocialModelClientBase.cs:182-183`), and none of the callers (`EngagementTriage`, `ReplyDrafter`,
   `PostWriter`) keeps them. So this model cannot be checked against live use. The planned per-tenant daily AI cap
   (roadmap, "Inbound events") also has nothing to count against. Recording the counts per tenant and per call is
   the change that turns the estimates below into measurements.
6. **The prompt's input has no ceiling of GeekSocial's own.** The comment and the post text go into both calls
   at full length; only the platform's limits bound them. The ceilings below assume 4,000 more characters than the
   sample. A longer post costs more on both calls, and only the planned daily cap would stop it.

## Cost of each AI call

**Measured** (GeekBackend `3c32867e`, 2026-11-18). The real prompt builders were run with a 170-character
comment, a 250-character post and a 180-character article summary. Each call's characters (system prompt + user
message + answer schema) and its output limit:

| Call | Characters sent | Output limit (tokens) |
|---|---|---|
| Triage | 1,213 + 613 + 546 = 2,372 | 400 |
| Reply draft | 1,060 + 541 + 182 = 1,783 | 800 |
| Post copy | 1,119 + 433 + 193 = 1,745 | 2,000 |

**Estimated.** Characters were converted at about 4 per token, and 400 tokens were added per call for the
provider's own framing of the schema or tool (not measured). The output figures are a short JSON answer, a reply
of about 600 characters, and copy for one network.

| Call | Input tokens, typical / ceiling | Output tokens, typical / ceiling |
|---|---|---|
| Triage | 1,000 / 2,000 | 60 / 400 |
| Reply draft | 900 / 1,900 | 150 / 800 |
| Post copy | 900 / 1,900 | 200 / 2,000 |

The ceiling is the output limit, plus 4,000 characters of input beyond the sample. Every comment is triaged. A
comment that needs a reply also gets a draft, which is at most the two AI calls per reply that the roadmap allows.
Where a model reasons before answering, it bills that reasoning as output, which the typical figures leave out.

**Prices**, per million tokens, standard tier, read 2026-11-18:
- OpenAI: https://developers.openai.com/api/docs/pricing
- Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
- Google: https://ai.google.dev/gemini-api/docs/pricing
- Perplexity: https://docs.perplexity.ai/docs/agent-api/models

GeekSocial's Perplexity client offers no tools, so no search fee applies (`PerplexitySocialModelClient.cs:17-20`).
Groq, which GeekAPI also supports, was not priced.

| Model | Input / output | Triage only | Replied comment (triage + draft) | Post copy |
|---|---|---|---|---|
| OpenAI gpt-4.1 (configured; shuts down 2027-01-14) | $2.00 / $8.00 | $0.0025 (up to $0.0072) | $0.0055 (up to $0.0174) | $0.0034 (up to $0.0198) |
| OpenAI gpt-6-luna (OpenAI's named replacement) | $0.10 / $0.50 | $0.0001 (up to $0.0004) | $0.0003 (up to $0.0010) | $0.0002 (up to $0.0012) |
| OpenAI gpt-6.2-astra (first row of the flagship table) | $8.00 / $40.00 | $0.0104 (up to $0.0320) | $0.0236 (up to $0.0792) | $0.0152 (up to $0.0952) |
| Claude Haiku 5.5 (prompts up to 100,000 tokens) | $0.10 / $0.50 | $0.0001 (up to $0.0004) | $0.0003 (up to $0.0010) | $0.0002 (up to $0.0012) |
| Claude Sonnet 5.5 | $2.00 / $10.00 | $0.0026 (up to $0.0080) | $0.0059 (up to $0.0198) | $0.0038 (up to $0.0238) |
| Claude Opus 5.5 | $4.00 / $20.00 | $0.0052 (up to $0.0160) | $0.0118 (up to $0.0396) | $0.0076 (up to $0.0476) |
| Gemini 3.1 Flash-Lite | $0.25 / $1.50 | $0.0003 (up to $0.0011) | $0.0008 (up to $0.0028) | $0.0005 (up to $0.0035) |
| Gemini 3.8 Flash, until 2026-12-31 | $0.75 / $3.75 | $0.0010 (up to $0.0030) | $0.0022 (up to $0.0074) | $0.0014 (up to $0.0089) |
| Gemini 3.8 Flash, from 2027-01-01 | $1.50 / $7.50 | $0.0020 (up to $0.0060) | $0.0044 (up to $0.0149) | $0.0029 (up to $0.0179) |
| Gemini 3.1 Pro Preview | $2.00 / $12.00 | $0.0027 (up to $0.0088) | $0.0063 (up to $0.0222) | $0.0042 (up to $0.0278) |
| Perplexity `perplexity/sonar` | $0.25 / $2.50 | $0.0004 (up to $0.0015) | $0.0010 (up to $0.0040) | $0.0007 (up to $0.0055) |

Clearance still decides which provider may receive comments at all. Today only `anthropic:facebook` is cleared,
so on OpenAI every Facebook comment is held (`HANDOFF.md:18-21`).

## Tenant profiles (placeholders)

| | Small | Typical | Heavy |
|---|---|---|---|
| Comments a month (half need a reply) | 100 | 500 | 3,000 |
| Post copies a month | 12 | 30 | 120 |
| On X: link posts / replies / delivered events a month | 8 / 20 / 40 | 20 / 100 / 200 | 60 / 600 / 1,200 |
| Emails a month (email is not built) | 1,000 | 5,000 | 50,000 |
| Media stored (media is not built) | 1 GB | 5 GB | 25 GB |

## Monthly cost per tenant

**AI**, typical (ceiling: every comment replied, every call at its limits):

| Model | Small | Typical | Heavy |
|---|---|---|---|
| OpenAI gpt-4.1 (configured) | $0.44 (up to $1.98) | $2.09 (up to $9.29) | $12.35 (up to $54.58) |
| OpenAI gpt-6-luna | $0.02 (up to $0.11) | $0.11 (up to $0.53) | $0.66 (up to $3.11) |
| OpenAI gpt-6.2-astra | $1.88 (up to $9.06) | $8.96 (up to $42.46) | $52.82 (up to $249.02) |
| Claude Haiku 5.5 | $0.02 (up to $0.11) | $0.11 (up to $0.53) | $0.66 (up to $3.11) |
| Claude Sonnet 5.5 | $0.47 (up to $2.27) | $2.24 (up to $10.61) | $13.21 (up to $62.26) |
| Claude Opus 5.5 | $0.94 (up to $4.53) | $4.48 (up to $21.23) | $26.41 (up to $124.51) |
| Gemini 3.1 Flash-Lite | $0.06 (up to $0.32) | $0.30 (up to $1.49) | $1.76 (up to $8.74) |
| Gemini 3.8 Flash, from 2027-01-01 | $0.35 (up to $1.70) | $1.68 (up to $7.96) | $9.90 (up to $46.69) |
| Gemini 3.1 Pro Preview | $0.50 (up to $2.55) | $2.39 (up to $11.93) | $14.06 (up to $69.94) |
| Perplexity `perplexity/sonar` | $0.08 (up to $0.46) | $0.37 (up to $2.15) | $2.19 (up to $12.58) |

**Platform API fees.** Only X charges, and only for tenants who use it: small $2.10, typical $6.50, heavy $27.00
(the profile's link posts at $0.200, replies at $0.015 and events at $0.005). Google Business Profile's API is "at
no charge" (`GeekBackend/docs/platform-research-2026-11-16/gbp.md:36`). The research found no API price for Meta,
LinkedIn, YouTube, TikTok or Pinterest (`GeekBackend/docs/PLATFORM-ACCESS-REGISTER.md`), and the model counts
none.

**Email**, at Amazon SES's $0.10 per 1,000 (https://aws.amazon.com/ses/pricing/): small $0.10, typical $0.50,
heavy $5.00. The others, read the same day, are plans with minimums rather than per-message prices: Postmark from
$15.00 a month for 10,000, Resend Pro $20 for 50,000, SendGrid Essentials "Starting $19.95/mo". Those are a fixed
cost shared by all tenants, not a per-tenant one.

**Media storage**, at Cloudflare R2's $0.015 per GB-month with free egress
(https://developers.cloudflare.com/r2/pricing/): small $0.02, typical $0.08, heavy $0.38. S3 Standard is $0.023
per GB-month plus $0.09 per GB of egress (https://aws.amazon.com/s3/pricing/). Vercel Blob is $0.023 plus $0.05
(https://vercel.com/docs/pricing/regional-pricing/iad1). Under the roadmap's media rule, files move between the
browser or platform and storage directly, so platforms fetching media are the egress that matters.

**Payment.** PayPal Checkout costs 3.49% + $0.49 per payment; Standard card payments cost 2.99% + $0.49; Advanced
card payments, which need approval, cost 2.89% + $0.29 (https://www.paypal.com/us/business/paypal-business-fees,
updated 2026-11-04). PayPal's optional Recurring Billing service is $10.00 a month for the whole account, not
per tenant. A dispute costs $15 and a chargeback $20.

## Margin at reference prices

No price is under consideration yet (Q2). The columns are reference points from the competitors' plans
(`plans/geek-social-competitor-pricing-2026-11-18.md`): $15 is Missinglettr's cheapest monthly plan, $29 is
SocialBee's and ContentStudio's, $49 is MeetEdgar's top plan ($49.99, line 24), and $99 is the per-seat price of
Hootsuite, Sprout and Agorapulse. They are not proposals.

The margin is (price − PayPal Checkout fee − AI − email − storage) ÷ price. Each cell gives it without X, then with
X. It uses typical AI use and leaves out compute (see "Not included").

On `gpt-4.1`, as configured today:

| Tenant | Variable cost without X / with X | $15 | $29 | $49 | $99 |
|---|---|---|---|---|---|
| Small | $0.56 / $2.66 | 90% / 76% | 93% / 86% | 94% / 90% | 95% / 93% |
| Typical | $2.67 / $9.16 | 75% / 32% | 86% / 63% | 90% / 77% | 93% / 87% |
| Heavy | $17.73 / $44.73 | −25% / −205% | 34% / −59% | 59% / 4% | 78% / 51% |

On `gpt-6-luna` (Claude Haiku 5.5 costs the same):

| Tenant | Variable cost without X / with X | $15 | $29 | $49 | $99 |
|---|---|---|---|---|---|
| Small | $0.14 / $2.24 | 92% / 78% | 94% / 87% | 95% / 91% | 96% / 94% |
| Typical | $0.68 / $7.18 | 89% / 45% | 92% / 70% | 94% / 81% | 95% / 89% |
| Heavy | $6.04 / $33.03 | 53% / −127% | 74% / −19% | 83% / 28% | 90% / 63% |

What this means for Q2:
- A flat price loses money on a heavy tenant who uses X, at any of these prices below $99.
- Included usage must be set per tier: comments triaged, AI calls and posts to X.
- Charging X separately, or counting it against included usage, keeps the cheap tiers positive.

## Not included

- **Compute and the database.** GeekAPI, GeekRepository and their database run on Railway, and the screens on
  Vercel. These are shared with Geek @ Your Spot's other products, and their bills are not split by product. Read
  the Railway and Vercel invoices to set the fixed cost, then divide it by the expected number of tenants.
- **Fixed subscriptions:** an email plan minimum, PayPal Recurring Billing if used, and credits bought ahead
  for X.
- **Refunds, disputes and support time.**
- **Taxes.**

## Updating it

- Re-read the prices before Q2 is decided. Gemini 3.8 Flash doubles on 2027-01-01, and `gpt-4.1` shuts down on
  2027-01-14.
- Replace the placeholder volumes with the first tenants' numbers.
- Replace the token estimates with recorded counts once finding 5 is built.

The arithmetic is in the tables above: cost per call = input tokens × input price + output tokens × output price,
per million tokens.
