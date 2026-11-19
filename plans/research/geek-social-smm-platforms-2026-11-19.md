# Social media management platforms: how they present themselves, their legal and trust pages, and their features (2026-11-19)

Asked for in conversation on 2026-11-19, after the Meta App Review research showed GeekSocial has no public home. The question was how
other social media management (SMM) tools present themselves, and what each one offers.

**How this was gathered.**
- **Presentation, legal and trust** (16 tools): read on 2026-11-19 from each vendor's own site with `curl` (default user agent) and the
  pages' text. A page that renders only in the browser could not be read this way; those cells say so.
- **Features of the 22 tools researched on 2026-11-18:** condensed from the six reports in GeekBackend
  `docs/market-research-2026-11-18/`. Each block names its report and sections, and the source links are in those reports. Nothing
  was added from memory.
- **Vendors on geekatyourspot.com's home page "Use Cases"** (added at the owner's request): read on 2026-11-19 from each vendor's
  own pages; each line carries its source. Only the vendors related to GeekSocial are included (social media, messaging and
  email); the section says which were left out.
- **UNVERIFIED** means the page could not be read or did not say.
- **Prices** of the 22 tools are not repeated here: they are in `plans/geek-social-competitor-pricing-2026-11-18.md`. The Use Cases
  blocks give each vendor's pricing model.

A fact here is a fact about the date it was read, not about today.

## Findings

1. **Every tool has a public product site on its own domain; the app sits behind sign-in, usually on another host.**
   - The product site's homepage describes the product in its headline: for example Hootsuite, "Create, approve, schedule, and
     measure every post in one place"; Planable, "Plan social like a team". The exception is Later, whose homepage now leads with
     influencer marketing ("Unforgettable campaigns start with insight").
   - The app lives on `app.` (Sprout, Later, Agorapulse, Metricool, SocialBee, Sendible, Planable, Loomly, ContentStudio, MeetEdgar),
     `space.` (Statusbrew), or the product site itself (Hootsuite; Vista Social's log-in is at `vistasocial.com/login`).
   - A signed-out visitor to the app gets a sign-in page: Sprout `app.sproutsocial.com` → `/login`, Loomly → `/signin`, MeetEdgar →
     `/users/sign_in`. Hootsuite's `/dashboard` sends a signed-out visitor to its marketing homepage.
   - **Sign-in on a separate host is normal.** Buffer's app (`publish.buffer.com`) sends a signed-out visitor to `auth.buffer.com`, and
     its "Log in" link goes to `login.buffer.com`. SocialPilot signs in at `auth.socialpilot.co`. GeekSocial's sign-in on GeekOAuth's host
     is the same pattern.
   - **What GeekSocial lacks is the product site, not a different app layout.** GeekSocial's own domain (`geekatyourspot.com`) is the
     consulting business's site and has no GeekSocial page.

2. **The product site carries the same set of public pages at every vendor.**
   - **On every homepage:** a pricing page, sign-up and log-in links, and a footer with the privacy policy and terms on every page.
   - **On most:** a status page (Sprout, Buffer, Agorapulse, Publer, SocialBee, Planable, Loomly, Vista Social, Statusbrew,
     ContentStudio) and a trust or security page.
   - **On several:** a GDPR page (Hootsuite, Agorapulse, Vista Social, ContentStudio), a data processing agreement (Planable,
     Loomly, Statusbrew, and Hootsuite's trust center), and a cookie policy (Hootsuite, Metricool, Planable).
   - **The fullest legal center is Hootsuite's** (`hootsuite.com/legal`): self-serve and enterprise terms, an end-user licence, API terms,
     terms for its GPT, privacy, GDPR, a subprocessor list, security practices, cookies, copyright, and an EU Digital Services Act page.
   - **Only two sign-in pages showed the privacy and terms links in the page as served:** Hootsuite and Loomly. The other sign-in pages are
     built in the browser, so `curl` could not see whether they link them (UNVERIFIED).

3. **The products are often brands of a parent company, and the legal pages name the parent.** Later's privacy notice is Mavrck
   LLC's; Planable's is SER Acquisition Inc.'s; MeetEdgar's is "SureSwift Worldwide Inc. dba MeetEdgar"; SocialBee's names the WebPros
   group. GeekSocial's draft names its operator the same way ("Geek @ Your Spot", `legal-pages` branch, `src/lib/legal.ts`).

4. **The most complete privacy policies have a section on the data each network supplies.**
   - **Agorapulse** (last revised 4 August 2026) lists:
     - what it collects from connected accounts;
     - one compliance sentence per network: the Google API Services User Data Policy "including the Limited Use requirements",
       the LinkedIn API Terms of Use, the Meta Platform Terms and Developer Policies, the TikTok Developer Terms of Service, and the
       X Developer Agreement and Developer Policy;
     - each network's own privacy policy;
     - how long it keeps data after a disconnect: "after 7 days for YouTube accounts, and after 90 days for accounts on the other
       Associated Platforms".
   - **Vista Social** (last updated 17 November 2026) gives YouTube and the other Google services their own section. It covers
     Limited Use, a link to the YouTube Terms of Service, a link to the Google Privacy Policy, and revoking access through
     `security.google.com/settings/security/permissions`. It also says how YouTube data is stored and deleted.
   - **Shorter YouTube statements:** Hootsuite, Sprout, SocialPilot, Loomly, Metricool and MeetEdgar mention YouTube API Services and
     the Google Privacy Policy or Google's revoke page.

5. **Meta's deletion instructions sit inside the privacy policy; none of the 16 has a separate data deletion page.**
   - No tool answered at the usual paths (`/data-deletion`, `/data-deletion-instructions`, `/facebook-data-deletion`,
     `/user-data-deletion`, `/legal/data-deletion`, `/delete-data`). Statusbrew's `/legal/data-deletion` shows its Legal Center, not a
     deletion page.
   - **Planable** gives two routes: disconnect the account in Workspace Settings, which "removes tokens and schedules deletion", or
     remove Planable in Facebook's Apps and Websites settings. The second "sends us a deauthorization signal; we then delete Third
     Party Platform Data".
   - **Agorapulse** gives disconnecting, or an email to `legal@agorapulse.com`.

6. **Retention after a disconnect or account closure is stated by some vendors only.**
   - Agorapulse: 7 days for YouTube, 90 days for other networks.
   - Publer: data is kept 7 days after account deletion so it can be recovered, then deleted.
   - Vista Social: account information is kept 30 days after closure.
   - ContentStudio: deleting the account deletes all content.
   - Hootsuite, Sprout, Buffer and Statusbrew state no period in the text read.

7. **AI disclosures differ widely; the vendors named are OpenAI, Anthropic, Microsoft and Google.**
   - **Names AI subprocessors:** Hootsuite lists Google Cloud Canada, OpenAI and Microsoft as "AI Service Provider" (subprocessor list
     last updated 28 October 2026).
   - **Incorporates OpenAI's terms:** Buffer's terms make OpenAI's terms part of Buffer Creator.
   - **Lists OpenAI for AI content generation:** MeetEdgar.
   - **Anthropic as a subprocessor:** Sendible lists "Anthropic, PBC (Claude)". Vista Social sends Ask Vista questions to Anthropic,
     which "does not use it to train models, and deletes it within 30 days".
   - **Says no data trains AI:** SocialBee ("We do not use any data submitted through AI Features … to train, fine-tune, retrain or
     otherwise improve any LLM"), Planable (no personal data for training generalized AI), and ContentStudio (no Google user data for
     training).
   - **Says the opposite:** Later's notice says "We may use your content, engagement data, and platform interactions to train and
     improve our AI models". SocialPilot says that by using the service "you consent to the use of AI Pilot", which it also uses to
     "provide personalized content and advertising".

8. **Trust claims and partner badges.**
   - **SOC 2:** claimed by Hootsuite, Sprout, Agorapulse, ContentStudio, Loomly, SocialPilot, Statusbrew and Vista Social. Hootsuite,
     Sprout, Statusbrew and Vista Social say Type II.
   - **ISO 27001:** Hootsuite, Sprout, Loomly, Publer and Agorapulse.
   - **Partner badges:** Agorapulse's footer shows Meta, TikTok and LinkedIn Marketing Partner badges. Metricool links its listings in
     Google's, Pinterest's and LinkedIn's partner directories. No other homepage showed a platform partner badge.

## Their features versus GeekSocial's current design

**GeekSocial is a multi-platform product.** Its networks are Facebook, Instagram, LinkedIn (page and profile), Google Business
Profile, X, TikTok, YouTube and Pinterest, with Nextdoor as plan-and-approve (`plans/geek-social-roadmap-2026-11-18.md`, scope
table). The Facebook connector is the first one built; the others are not built yet. The screens built so far (`main` at
`299c767`, `src/components/AppNavbar.tsx`) are five, organised around replying to comments:
- **Inbox** is the first screen (`/`): reply drafts the AI wrote for comments, by status, waiting for a person to approve, edit,
  send or reject.
- **Comments:** comments that did not become a draft.
- **Accounts:** the connected accounts and their settings (Facebook Pages so far).
- **Posts:** one link post at a time, with AI-suggested copy, published now; and a list of published posts.
- **Activity:** status and audit.

**The researched tools are organised around planning and publishing.** The engagement inbox is one module among several. Where
their homepage headlines (read 2026-11-19) name an activity, it is planning, scheduling, publishing or measuring; no headline
names the inbox:
- Hootsuite: "Create, approve, schedule, and measure every post in one place".
- Planable: "Plan social like a team".
- Metricool: "Plan, measure, and manage it all in one tool".
- Publer: "Manage, automate, and track your social media success".
- Loomly: "Stress-free social media management".
- Agorapulse's description lists "inbox, publishing, reporting, monitoring, and team collaboration" together.

What each area looks like, from the 2026-11-18 research (the feature blocks below, and the roadmap's scope table,
`plans/geek-social-roadmap-2026-11-18.md`), against GeekSocial's code today:

| Area | The researched tools | GeekSocial today |
|---|---|---|
| Organising idea, first screen | Plan, create, schedule and publish, then engage and measure | Inbox of AI reply drafts |
| Networks | Most: Facebook, Instagram, LinkedIn, X, TikTok, YouTube, Pinterest, Google Business Profile; several add Threads and Bluesky | Multi-platform: the same eight networks, plus Nextdoor as plan-and-approve. Connector built so far: Facebook Pages; the rest are not built yet |
| Planning calendar | Every tool: calendar of drafts and scheduled posts, per-network versions | None |
| Scheduling | Scheduled posts, queues with time slots (Buffer, SocialBee, MeetEdgar), recommended times, bulk CSV upload (Agorapulse: up to 200 posts), RSS at several | Publish now only |
| Post types and media | Images, video, carousels, Reels, Stories, first comment, X threads (varies by network) | Link post through the one connector built so far (Facebook); no media yet |
| Content library, categories, recycling | Content libraries; categories with time slots and evergreen re-queue (SocialBee, MeetEdgar) | None |
| AI content | Captions and per-network versions, brand voice (Agorapulse "Organization Context"), repurposing a webinar, blog or video into many posts (Agorapulse Archie, Missinglettr, Lately), AI images and video (Predis, Ocoya) | "Suggest copy" for one link post |
| Approvals and collaboration | Multi-step approvals (Planable up to 10 levels), external approvers through a link with no account (Agorapulse, Vista, SocialPilot, Sprout), internal comments, roles | Approval of replies only, by one person |
| Engagement inbox | Comments, DMs, mentions and reviews across networks; assignment, saved replies, labels, moderation rules. AI replies: suggestions a person sends (Agorapulse, Custom plan only); automations that send AI replies with no per-message approval once live (Vista Social, Statusbrew) | Facebook comments; AI drafts; approve, edit, send, reject; Like |
| Reviews | Google Business Profile and Facebook reviews at many (Hootsuite, Sprout, Buffer, Metricool, Agorapulse, Vista, Statusbrew) | None |
| Analytics and reports | Per-network and cross-network reports, PDF or PPTX export, scheduled report emails, white-label reports | None for the customer |
| Listening | Hootsuite, Sprout, Agorapulse (paid add-on) | None |
| Team and agency | Roles and permissions, several brands or workspaces, client portals, white-label | One owner |
| Link in bio | Later, Publer, Agorapulse (PulseLink) | None |
| Integrations, API, MCP | Canva, Google Drive, Bitly, Zapier, Slack and Teams; public APIs; MCP servers so AI assistants can work the tool (Agorapulse, Vista Social, Statusbrew, Planable, ContentStudio, FeedHive, Ocoya, Predis) | None |
| Mobile apps | iOS and Android at most tools | Web only |
| Email marketing | None of the social tools; the email platforms on geekatyourspot.com's Use Cases do it (see their blocks below) | None (on the roadmap) |
| Onboarding | Trial sign-up, then connect each network by signing in through the vendor's own app | Business name and AI terms, then connect Facebook |

**The roadmap already aims at the market's shape.** Its target column (calendar, scheduling, approvals, analytics, team,
per-network AI versions) matches the researched tools. The screens built so far are the inbox part of it, and the first screen a
customer and a platform reviewer see is the Inbox.

## Compared with GeekSocial today: public site and legal pages

Facts about GeekSocial are from `main` at `299c767` and the unpushed `legal-pages` branch at `9aa80c4`.
- **Public site:** none. `/` is the Inbox, and a signed-out visitor goes to sign-in (`src/proxy.ts`); `robots.ts` disallows `/`. Every
  researched tool has a public product site (Finding 1).
- **Privacy policy draft** (`legal-pages`, `src/app/privacy/page.tsx`):
  - **Already covers:** the operator; what is collected from a connected Facebook Page; the AI provider named (OpenAI); no training;
    a person approves every reply; comment text kept 30 days; deletion by removing the app in Facebook's "Business integrations"
    plus an email; deletion within 30 days.
  - **Not in it, but in the fuller competitor policies (Finding 4):** a per-network compliance sentence (needed as each network
    connects: Google "Limited Use", the YouTube Terms of Service and Google Privacy Policy links and Google's revoke page, LinkedIn,
    TikTok and X terms), and how long a connected account's data is kept after a disconnect.
  - **Already true of the draft:** Meta's Data Deletion Instructions URL can point at its deletion section (Meta allows "the relevant
    section in the application's Privacy Policy").
- **Pages most competitors have that GeekSocial has none of:** status page, security or trust page, subprocessor list, DPA, cookie
  policy. The draft covers cookies inside the privacy policy.

## Presentation and legal pages, tool by tool

Read 2026-11-19. "SPA" means the page is built in the browser, so its content could not be read with `curl`.

| Tool | Product site | Sign-in / app host; signed-out app root | Footer legal and trust links | Privacy policy (date, entity) | Network data, deletion, retention | AI statements | Certifications, badges |
|---|---|---|---|---|---|---|---|
| Hootsuite | hootsuite.com | `hootsuite.com/login` → `/signin` (OAuth on the same domain); `/dashboard` → marketing homepage | Legal Center, Trust Center (`trustcenter.hootsuite.com`), Privacy, Accessibility | Last Updated May 2nd, 2025; Hootsuite Inc. | Google API Services incl. YouTube, Google Privacy Policy; retention period not stated | Subprocessors: Google Cloud Canada, OpenAI, Microsoft as AI Service Provider | SOC 2 Type II, ISO 27001, ISO 27701 (trust center) |
| Sprout Social | sproutsocial.com | `app.sproutsocial.com` → `/login` (403 to `curl`: bot protection) | Security, Trust Center, System status, Privacy, Terms, Website Terms, Disclosure Policy, Do Not Sell, AI and automation, Trust and compliance | Last updated September 16, 2026; Sprout Social, Inc. | YouTube API Services, revoke at Google security settings | Has an AI page (`/ai/`); no AI vendor named in the privacy policy | SOC 2 Type II, ISO 27001, ISO 27701, HIPAA (trust center) |
| Buffer | buffer.com | Log in `login.buffer.com`; app `publish.buffer.com` → `auth.buffer.com` | Status, Privacy, Terms, Security (all on `buffer.com/legal`) | Last updated September 30, 2024; Buffer, Inc. | Not found in the text read | Buffer Creator uses OpenAI models; OpenAI's terms incorporated | None shown |
| Later | later.com | `app.later.com` (SPA) | Trust Center (`trust.later.com`, SPA), Terms, Privacy | Last updated August 31, 2026; Mavrck LLC | Not found | May use content and engagement data "to train and improve our AI models" | UNVERIFIED (trust center is SPA) |
| Agorapulse | agorapulse.com | `app.agorapulse.com` (SPA) | Platform Status, Trust Center, Terms, Privacy, GDPR, Security | Last revised 4 August 2026; Agorapulse SAS | Per-network section (Finding 4); delete by disconnecting or emailing `legal@agorapulse.com`; 7 days YouTube, 90 days others | Not found | Footer: Meta, TikTok, LinkedIn Marketing Partner; SOC 2; ISO 27001:2022; AWS |
| Metricool | metricool.com | `app.metricool.com` (SPA); sign-up `/register` | Terms & Conditions, Privacy, Cookies, Legal Notice | Date not found; METRICOOL SOFTWARE, S.L. | Section 2.6 YouTube API Services | Not found | Google, Pinterest, LinkedIn partner directory listings |
| Publer | publer.com | `app.publer.com` (410 to `curl`) | Status, Trust Center, Terms, Privacy | Date not found | Account deletion: 7 days for recovery, then deleted; no Google statement found | Not found | ISO 27001 (trust center) |
| SocialBee | socialbee.com | `app.socialbee.com` (SPA) | Privacy, Terms, Status, Partner | Date not found; WebPros group | Not found | No training on AI inputs or outputs; AI providers in the WebPros subprocessor list | G2 badges |
| SocialPilot | socialpilot.co | Log in `auth.socialpilot.co`; app `app.socialpilot.co` | Trust Center, Privacy Policy & GDPR, Terms | Last Updated December 9, 2024; SocialPilot Technologies Inc. | YouTube API Services, YouTube Terms, Google Privacy Policy, revoke page | "AI Pilot": consent by using the service; used for personalized content and advertising | SOC 2 (trust center) |
| Sendible | sendible.com | `app.sendible.com` (SPA) | Privacy, Terms | Date not read; entity not read | Not found | Subprocessor: Anthropic, PBC (Claude), customer data transfer "Yes" | None found |
| Planable | planable.io | `app.planable.io/login` (SPA) | AI Instructions, Terms, Privacy Statement, DPA, Cookie policy, Status | Last revised 14 April 2026; SER Acquisition Inc. | Meta deletion: disconnect, or remove the app in Facebook's Apps and Websites (deauthorization) | No personal data used to train generalized AI | Capterra badge |
| Loomly | loomly.com | `app.loomly.com` → `/signin`, which links Privacy and Terms | Status, Terms of Use, Privacy, Cookie preferences, DPA, Security, law-enforcement information, vulnerability reporting | Last updated June 19, 2026 | YouTube API Services, Google Privacy Policy, revoke | Not found | SOC 2, ISO 27001 (security page) |
| Vista Social | vistasocial.com | `vistasocial.com/login` (same host); `app.vistasocial.com` did not answer | Status, Trust center, Privacy, Terms, Security, GDPR | Last updated November 17, 2026 (effective November 4); Vista Social LLC | Google section (Finding 4); YouTube data deleted on request by email; account info kept 30 days after closure | Ask Vista uses Anthropic, no training, deleted within 30 days | "GDPR compliant, SOC 2 compliant, CCPA ready" |
| Statusbrew | statusbrew.com | `space.statusbrew.com/login` | Privacy & Security, System Status, Changelog, Terms, Privacy; Legal Center lists GDPR, DPA (on request), Sub-processors, Security, Payment Terms | Last updated June 06, 2025; Statusbrew, Inc. | Not found | Not found | SOC 2 Type 2, GDPR badges |
| MeetEdgar | meetedgar.com | `app.meetedgar.com` → `/users/sign_in` | Terms & Conditions, Privacy, Cookie Preferences | Last modified October 15, 2025; SureSwift Worldwide Inc. dba MeetEdgar | YouTube Terms; "We do not store Social Media Platform passwords" | OpenAI for AI content generation | None found |
| ContentStudio | contentstudio.io | `app.contentstudio.io/login` (SPA) | Privacy, Terms, GDPR, System status, Security policy | Last updated April 30, 2026; ContentStudio Inc | Account deletion deletes all content | No Google user data used to train generalized AI | SOC 2 (security page), "GDPR Compliant" |

## Features, tool by tool

### Social media management tools (researched 2026-11-18)


Condensed from the six reports in GeekBackend `docs/market-research-2026-11-18/`, using only what they state. Each block names its report and sections; the vendor source links are in the reports.


#### Hootsuite
- **Networks:** Facebook Pages; Instagram Business/Creator; LinkedIn Pages and profiles; Threads; X; TikTok; Bluesky; YouTube; Pinterest (publishing only); WhatsApp and Google Business Profile (Inbox only); Reddit (moderated subreddits, Inbox from 2026-10-28); Mastodon only via third-party Fedica app; no Nextdoor, Snapchat, Tumblr.
- **Publishing:** Calendar/list views; recommended posting times; Bulk Composer CSV up to 350 posts (not in trial); per-network customization; first comment on Instagram and Facebook (2026-11-10); posts, stories, reels, carousels; drafts; asset library; Ow.ly and Bitly links; Hootbio link-in-bio; RSS via Syndicator app; suspend scheduled posts (Advanced+); queue and recycling UNVERIFIED.
- **Content creation / AI:** Wisdom (formerly OwlyGPT): captions per network, repurposing top posts, holiday content, tone/length edits, hashtag suggestions, post and image generation; drafts from a website URL or uploaded files; saved brand Instructions (2026-10-29); Lumen trend research; built-in image/video editing; Canva, Adobe Express; 100 AI credits/month.
- **Engagement inbox:** Nest inbox (all plans): comments, DMs, mentions on FB, IG, LinkedIn Pages, Threads, X, TikTok, YouTube, WhatsApp, Reddit, own webchat; assignment (Advanced+); saved replies; AI smart replies the agent accepts, rewrites or cancels (plan tier conflicting); keyword/business-hours auto-responses; manual hide only, keyword auto-hide UNVERIFIED; tag/resolve rules.
- **Reviews:** Google Business Profile reviews in Inbox since 2026-04-20 (reply, tag, topics, sentiment); Yelp, Facebook, TripAdvisor and others monitored only via the third-party ReviewTrackers app (replying UNVERIFIED); Enterprise add-on for review monitoring; no Glassdoor.
- **Listening:** Lumen by Talkwalker: 7-day (Standard) or 30-day (Pro+) search; sentiment, image recognition, peak detection, AI summaries; 90-day forecasting (Pro+); basic sources incl. news, blogs, Facebook, X, Bluesky, YouTube; Instagram, Threads, LinkedIn, Reddit sources, 13-month history and alerts Enterprise only; benchmarking of 5 or 20 competitors.
- **Analytics / reporting:** Paid and organic metrics for FB, IG, X, TikTok, LinkedIn, Pinterest, YouTube; Reddit (no export); cross-network and benchmark reports; custom reports (Pro+); logo on reports (Advanced+); PDF/PPTX export (tier conflicting), CSV/XLSX (Advanced+); scheduled email reports (Pro+ internal, Advanced+ external); Wisdom builds reports from questions; ROI reporting (Enterprise).
- **Approvals / collaboration:** Custom permissions (all plans); post and inbox-reply approvals, multi-tier, sequential or parallel (Advanced+); no external-reviewer link, Enterprise feature only records approvals made outside Hootsuite; internal post comments (Advanced+); contact notes; approval history in CSV; Vigil policy screening (Enterprise add-on); SSO (Enterprise); tasks UNVERIFIED.
- **Agency / multi-client:** Organizations and teams, each social account in one organization and shareable across teams; agency page cites organizing accounts by client, white-labeled scheduled reports, approval workflows, documented external approvals; client portal and per-client billing UNVERIFIED.
- **Ads:** All plans: publish and schedule ads, ad analytics and campaign management on Facebook, Instagram, LinkedIn, X; boost FB, IG and LinkedIn posts; automatic boosting by criteria (Pro+).
- **Email:** No email marketing found (UNVERIFIED), Mailchimp only via Zapier; "Send to email" from Streams through the user's own email; notification emails (failed post, Inbox activity, approval needed); scheduled report emails; email is not an Inbox channel; no Outlook integration.
- **Automation / AI agents and guardrails:** Unattended: scheduled/bulk publishing; scripted DM auto-responders with handoff; IG comment-to-DM; Enterprise generative chatbot answering from an approved knowledge bank, reviewed after the fact; auto-boost; inbox rules. Guardrails: smart replies are suggestions; Wisdom agents need Allow/Deny before writing; MCP cannot send public replies; approvals; Vigil.
- **Integrations / API / mobile apps:** Canva, Adobe Express, Google Drive, Dropbox, Bitly, Slack, HubSpot, Salesforce (Enterprise), monday.com, Asana, Shopify, Google Analytics, ReviewTrackers; Zapier; REST API with OAuth2 (publishing, approvals, media, analytics, Inbox, SCIM); Claude/ChatGPT MCP connectors excluding X, LinkedIn, Reddit, Snapchat, YouTube data; iOS and Android.
- **Onboarding (does the customer bring their own developer app?):** No. Sign up with email, Google, Facebook, LinkedIn or X; prompted to connect accounts at first sign-in; every network is a sign-in/authorize flow; Bluesky username plus password; GBP Owner/Manager; WhatsApp needs a verified Meta business; only the optional custom webchat needs the customer's developers (webhooks).
- **Distinctive:** Relaunched 2026-06-24 as "Social OS" (Perch, Nest, Lumen, Parliament, Wisdom, Vigil); Nextdoor explicitly unsupported; approvals, assignment and external report delivery gated to Advanced; the generative chatbot is the only unattended AI talking to customers; Inbox auto-disabled after 60 days unused; Instagram API cap of 25 posts/reels per 24 hours.
- **Source:** `hootsuite-sprout.md` sections H1–H13, H15, H16

#### Sprout Social
- **Networks:** X; Facebook Pages; Instagram Business; LinkedIn pages and profiles; TikTok; YouTube; Pinterest; Threads; Bluesky; Snapchat; Reddit (official Data Partner); WhatsApp (Standard+, inbox only); Google Business Profile; review sites (Trustpilot, Yelp, Glassdoor, app stores); Tumblr for listening only; no Nextdoor or Mastodon.
- **Publishing:** Calendar, scheduling up to 180 days ahead; queue of 10/20/30 posts a day with ViralPost timing; Optimal Send Times; CSV bulk up to 350 (Pro+); per-network customization; first comment on FB, LinkedIn, IG; Stories, Reels, carousels; drafts; RSS feeds (Pro+); Bitly; SproutLink link-in-bio; pause all scheduled posts; recycling not found.
- **Content creation / AI:** AI Assist (OpenAI, can be disabled): Enhance Post (Pro+), generate posts from top posts, a topic or an article URL, alt text, subtitles, translations, hashtag suggestions; Trellis agent (100 credits/seat/month) drafts replies, variations, inbox briefings; Trellis Studio scheduled skills; image and video editors; Canva, Adobe Express.
- **Engagement inbox:** Smart Inbox (Standard+, not Essentials): comments, mentions, DMs, Story replies, ad comments on X, FB, IG, LinkedIn, TikTok, YouTube, WhatsApp, Reddit, Threads, Bluesky; case assignment, automatic routing (Advanced); saved replies (Pro+); AI Enhance Reply and Trellis drafted replies; keyword auto-hide rules, spam classification, sentiment (Advanced); contact history; collision detection.
- **Reviews:** Read, reply, tag on Facebook, Google Business Profile, Yelp, Trustpilot (needs paid Trustpilot account), Glassdoor, Apple App Store, Google Play (Standard+); reviews become cases, follow rules and reply approvals; one reply per review; each location counts as a profile; TripAdvisor sunset (no new locations from 2026-10-30, data through 2026-11-30, never replyable).
- **Listening:** Brand keyword and location monitoring (Standard+, 10 or 20 keywords); paid Listening add-on with Smart Categories, sentiment, spike alerts across Bluesky, FB, IG, Reddit, TikTok, Tumblr, Web, X, YouTube; Listening Lite (3 topics, 30 days, availability UNVERIFIED); competitor reports for FB, X, IG (Pro+).
- **Analytics / reporting:** Group, profile, post and cross-network reports, unlimited PDF/CSV, Google Analytics report (all plans); competitor, paid, tag reports and PDF logo (Pro+); team, care and customer-feedback reports, scheduled weekly/monthly PDF by email (Advanced); Premium Analytics add-on with custom reports, ROI charts, shareable links; BI via API.
- **Approvals / collaboration:** Profile-level access limits; advanced permissions (Pro+); multi-step post approvals, "Any or All" per step, unapproved posts do not publish, auto-reject after 90 days (Pro+); up to 3 external approvers via emailed no-login link (Advanced); inbox and review reply approvals (Advanced); tasks and internal comments; audit trail CSV (plan UNVERIFIED).
- **Agency / multi-client:** Groups per client with separate permissions, reporting and profiles; per-group report logo; shared/external calendar links; Agency Partner Program and agency packages via sales; no dedicated client portal (external approvers use an emailed stream); full white-label UNVERIFIED/not offered; per-client billing UNVERIFIED.
- **Ads:** Boost published and dark FB/IG posts (all plans); FB, IG and TikTok ad comments in Smart Inbox; paid performance reports for FB, IG, X, LinkedIn (Pro+); full campaign management UNVERIFIED (targeted ads go to Facebook Ads Manager).
- **Email:** No email marketing found (UNVERIFIED); Employee Advocacy add-on sends employee newsletters; email a message or review to non-users; approval notification emails and emailed external-approver links; "Send PDF" to up to 25 addresses, scheduled delivery (Advanced); Automated Rules "Send an email" and spike alerts; email not an inbox channel.
- **Automation / AI agents and guardrails:** Unattended: RSS immediate publishing; scripted Bot Builder chatbots (Advanced); Automated Rules (tag/complete/hide/alert); AI-reply workflows (Advanced plus Trellis Plus Shared Credits; whether sent without approval UNVERIFIED). Guardrails: AI features can be disabled; post and reply approvals; Blocked Words (Guardian add-on); Trellis fair-use cap; read-only ChatGPT MCP; no-training agreements.
- **Integrations / API / mobile apps:** Canva, Drive, Dropbox, Slack, Bitly, Adobe, Bynder (all plans); HubSpot, Salesforce, Dynamics 365, Zendesk, Marketo (Advanced); Shopify, WooCommerce, Facebook Shops (Pro+); Tableau; no official Zapier app (third party); public API (Advanced, 60 requests/minute from 2026-11-03, no implementation help); read-only ChatGPT MCP; iOS and Android.
- **Onboarding (does the customer bring their own developer app?):** No developer app or network API keys. 30-day Professional trial, email only, no card; connect at least one profile; networks authorized with native credentials; WhatsApp needs Meta Business Manager admin, PIN, a number not on the WhatsApp app; GBP Owner/Manager; published re-auth cadences (Instagram 90 days, LinkedIn 60–365).
- **Distinctive:** No inbox in the cheapest Essentials plan; 5-profile cap on the two cheaper plans; broadest review coverage of the pair but TripAdvisor dropped; external no-login approval limited to 3 approvers on Advanced; Reddit partner limits (no export, API or CRM); AI metered per seat with fair-use cap; no Nextdoor or Mastodon.
- **Source:** `hootsuite-sprout.md` sections S1–S13, S15, S16

#### Buffer
- **Networks:** Facebook Pages (Groups notification-only); Instagram Business/Creator (personal notification-only); X; LinkedIn Pages and profiles; Pinterest; TikTok; Google Business Profile; Mastodon; Threads; Bluesky (app password); YouTube Shorts only; Substack Notes; Start Page; no Nextdoor, Reddit, Tumblr, WhatsApp, Snapchat, Telegram.
- **Publishing:** Per-channel time-slot queue; week/month calendar; generic best-time suggestions; CSV bulk on all plans (10 or 100 per channel, text and single image only, over-limit posts skipped without error); per-network text; first comment (paid); Reels, Stories, carousels; unlimited drafts; recurring posts (beta); RSS feeds manual pick only; tags; link shortening and UTM.
- **Content creation / AI:** AI Assistant (OpenAI; all plans incl. Free, unlimited): ideas, repurpose a post across formats, summarize long content, rewrite/tone, tailor per network; AI alt text; AI Takeaways in Insights; shared post templates; Ideas Kanban board; Hashtag Manager (paid); image editor (2026-09-15); custom video covers; Canva in composer; no video editing.
- **Engagement inbox:** "Community": comments on IG, FB, LinkedIn, Threads, Bluesky, X, TikTok, YouTube, Mastodon; X and LinkedIn mentions; GBP reviews; no DMs or ad comments; resolve and bulk-resolve; no assignment; saved replies; AI reply suggestions a person edits and sends (5/week Free, unlimited paid, not X); no auto-replies, moderation rules, sentiment or CRM.
- **Reviews:** Google Business Profile only: read and reply in Community, text-only replies, list view only, up to 2-hour delay, AI suggestions for star-rated reviews, reviewer photos from 2026-06-10; Facebook reviews UNVERIFIED; Yelp, TripAdvisor not supported.
- **Listening:** Not offered; only X Mentions tab and LinkedIn mentions; no competitor tracking; Benchmarks compare with aggregate Buffer accounts; follower-growth benchmark LinkedIn only.
- **Analytics / reporting:** Insights rebuilt 2026-04-14; per-channel metrics except GBP, FB Groups, IG personal; All Channels view with AI Takeaways; 30 days Free, 2 years paid; CSV/Markdown/PDF export (paid); branded logo/cover reports (Team); no white-label; email digests to Buffer users only; UTM, no ROI; boosted-post data FB/IG.
- **Approvals / collaboration:** Four roles (Admin, Creator, Collaborator, Viewer) with per-channel and per-teammate restrictions (Team, 2026-11-17); approval workflow Team only, in app; Needs-Approval members' drafts held even from API, MCP, third-party apps; no external client link; opt-in approval emails; post notes with @mentions (all plans); no tasks; audit trail UNVERIFIED.
- **Agency / multi-client:** Users can belong to several Organizations, each on its own subscription; per-channel billing with unlimited Team users; clients join as Team members; no client portal; no white-label beyond branded PDF reports; per-client billing not documented; no Agency plan (third party says retired November 2025, UNVERIFIED); max 5 Instagram accounts recommended per organization.
- **Ads:** Cannot boost posts or run ads; boosted-post data for FB and IG only, excluding Ads Manager ads and boosted X posts; whether this survived the new Insights UNVERIFIED.
- **Email:** No email marketing; Substack Notes publishing (2026-09-23); post-to-email and email-to-post only via Zapier/IFTTT; approval and rejection emails are notices, approving happens in app; Daily Post Recap and Weekly Report Card to Buffer users only; alerts for failures, disconnections, hourly unreplied comments, empty queue; no email inbox.
- **Automation / AI agents and guardrails:** Queue auto-publishes; recurring posts beta; RSS automation only via Zapier/WordPress; no auto-replies; MCP server (2026-06-10, all plans) lets Claude, ChatGPT and others create/schedule posts and read Insights. Guardrails: agent posts land as drafts or scheduled; tool access chosen and revocable; Needs-Approval role holds API/MCP posts; otherwise agents can schedule without review (report's inference).
- **Integrations / API / mobile apps:** Bitly, Canva, Dropbox, Google Drive/Photos, OneDrive, Unsplash, Zapier, Make, n8n, IFTTT, Power Automate, WordPress, Feedly, AI assistants; no Slack, CRM or Shopify; GraphQL API (2026-05-27, all plans, no comments coverage) with API keys or OAuth PKCE clients and plan rate limits; legacy REST retired 2027-02-01; iOS and Android.
- **Onboarding (does the customer bring their own developer app?):** No; keys exist only for outside tools. Free sign-up without card or 14-day trial; connect by logging into the network and granting permissions; FB "Full control", LinkedIn Super Admin, YouTube Owner, IG Business/Creator; Bluesky app password is the one manual credential.
- **Distinctive:** Per-channel pricing with volume ladder and a usable Free plan (3 channels, Community, API); no DMs or auto-replies; approval role also holds API/MCP posts; machine-readable pricing page; pruning (Start Page ends 2027-02-02, Analyze retired 2026-10-07, legacy REST 2027-02-01); comment score for responsiveness; 20 changelog entries 2026-04-14 to 2026-11-17.
- **Source:** `buffer-later-metricool-publer.md` Buffer sections 1–13, 15, 16

#### Later
- **Networks:** Instagram Business/Creator; Facebook Pages; Pinterest; TikTok; LinkedIn pages and profiles; Threads; YouTube Shorts only; Snapchat; X dropped (no new connections after 2025-07-30, support ended 2025-08-28); no Google Business Profile, Bluesky, Mastodon, Reddit, Tumblr, WhatsApp, Nextdoor.
- **Publishing:** Visual calendar and feed planner; Auto Publish or push-notification publishing; Quick Schedule weekly slots; Best Time to Post (Starter+); bulk media upload, no CSV import found; one post to up to 10 profiles with per-profile edits; first comment Instagram only; Reels, Stories, carousels; drafts count toward post caps; no RSS or recycling; media library.
- **Content creation / AI:** Caption Writer (beta, English, paid plans, 3 versions per credit, "Later is not responsible" disclaimer); AI Ideas/content pillars; monthly AI credits 0/5/50/100; Saved Captions; hashtag suggestions (Starter+, automatic on Growth+); crop, filters, text on images; no video editor found; Canva and Dropbox import; UGC Collect and repost with credit; repurposing not found.
- **Engagement inbox:** Social Inbox (Growth+, beta, desktop only): IG and FB DMs, IG/FB/TikTok comments; no mentions or reviews; DMs answerable only within 7 days; assignment claimed on product page, not in help article (UNVERIFIED); member inbox access cannot be restricted; manual hide/delete; no saved replies, AI replies, auto-replies, keyword auto-hide or CRM.
- **Reviews:** None for local-business reviews (GBP unsupported; Facebook, Yelp, TripAdvisor not mentioned); Later Influence's Bazaarvoice, PowerReviews, Yotpo integrations syndicate creator-written product reviews, not a business's incoming reviews.
- **Listening:** Desktop only; Collect (Growth+); Brand Mentions (Scale, IG and TikTok); sentiment/Brand Health (Scale, IG, TikTok, FB Pages); keyword Topics only on legacy Enterprise; Competitor Benchmarking (Scale, IG only); Future/Industry Insights trend prediction (Scale).
- **Analytics / reporting:** IG, FB, TikTok, Pinterest, Threads, LinkedIn (Starter+; 3 months, 1 year or 2 years history); none for YouTube Shorts or Snapchat; Custom Analytics cross-network dashboard (Scale, excludes LinkedIn); CSV export for IG and LinkedIn; no white-label; scheduled report and threshold-alert emails to any address (Scale); weekly IG summary email; Link in Bio UTMs/clicks.
- **Approvals / collaboration:** Growth+, desktop, not IG Stories; roles Owner, Reviewer, Member, Member (Restricted); approval does not block publishing unless "Publish Without Approval" is removed; request changes, comments, activity log; external review links (no login, expire after 7 days, no password); 48-hour shared calendar link; Calendar Notes; no account-wide audit log found.
- **Agency / multi-client:** Access Groups separate profiles, media, captions and users (unlimited on Growth+); Social Sets hold one profile per platform; clients as restricted users or via review links; one Later account per email; no client portal, white-label or per-client billing found; Scale marketed for agencies.
- **Ads:** No ad creation, management or boosting; Scale: paid vs organic reporting for boosted FB/IG posts via a connected Meta ad account, not backfilled; creator-side Partnership Ads need the creator's approval.
- **Email:** No email marketing or post-as-email; Link in Bio email capture with CSV export or Mailchimp (all plans; unsubscribes not removed); weekly IG summary email; scheduled reports and alerts by email (Scale); approval request/approval emails, approving happens on the web link; no email inbox.
- **Automation / AI agents and guardrails:** Unattended: Auto Publish incl. IG first comments; Best Time auto-enabled; scheduled report emails; Collect gathers UGC; no auto-replies, chatbots, keyword auto-hide or AI agent (EdgeAI is influencer marketing). Guardrails: AI captions inserted and edited by a person, output disclaimed; approval gates publishing only when "Publish Without Approval" is removed.
- **Integrations / API / mobile apps:** Canva, Dropbox, Mailchimp; Google Drive, Zapier, HubSpot, ClickUp unsupported; Slack and Bitly UNVERIFIED; Instagram Shop tagging (Growth+); no public API for Later Social (Later Influence Reporting API, not self-serve); iOS and Android for scheduling, calendar, Link in Bio; analytics, inbox, Collect desktop only.
- **Onboarding (does the customer bring their own developer app?):** No developer app or keys for Later Social (only Later Influence's PowerReviews/Yotpo credentials). Email/password sign-up on web or mobile, optional 2FA; in-app login and authorize; IG Business/Creator, Instagram Login works without a Page; FB page admin; LinkedIn super-admin; connections expire and need re-login.
- **Distinctive:** Shifting to influencer marketing (bought Mavely, January 2025); Instagram-first visual planner, Link in Bio, UGC Collect; dropped X; 8 networks; post caps per profile in which drafts count, metered AI credits; thin beta inbox; approvals do not gate publishing; no public API, Zapier or Google Drive; several help-center inconsistencies.
- **Source:** `buffer-later-metricool-publer.md` Later sections 1–13, 15, 16

#### Metricool
- **Networks:** Instagram (professional); Facebook Pages; TikTok; YouTube; X (paid add-on, not Free); LinkedIn profiles and pages (paid plans); Threads; Bluesky (.bsky.social handles only); Pinterest; Google Business Profile (one location per brand); Twitch (analytics only); website and Meta/Google/TikTok Ads; no Nextdoor, Mastodon, Reddit, Tumblr, WhatsApp.
- **Publishing:** Day/week/month calendar; Autolists (weekly slots, circular when repeating, 200 posts each); recurring posts; best-time heatmap; CSV import/export; per-network edits; first comment on IG, FB, LinkedIn, TikTok, YouTube; Stories, Reels, carousels, polls, X threads; drafts; tags with AI auto-tagging; RSS feeds fill Autolists; UTM builder; non-tracking shortener; SmartLinks link-in-bio.
- **Content creation / AI:** AI Text Generator: drafts from a topic with tone, language and network, hashtags, CTAs, 5-post threads; per-brand per-network AI instructions, generated from the brand's posts (October 2026); credits 5 Free, 20 or 35 per brand; AI alt text, auto-tagging, EU AI Act labels; templates and snippets; image and video editor; Canva, Adobe Express.
- **Engagement inbox:** Inbox on all plans incl. Free: FB and IG comments and DMs, TikTok Business comments, X DMs only, LinkedIn comments and mentions, YouTube comments, GBP reviews; Saved Answers; private notes; read and resolved states; no assignment, AI replies, auto-replies (paid Flows only), hide/delete, stored history, new-message alerts, multi-brand view or ad-comment replies.
- **Reviews:** Google Business Profile only, read and reply in Inbox; owner role may be needed; reviews cannot be flagged or liked, reviews with images do not sync; Facebook reviews likely not (UNVERIFIED); no Yelp, TripAdvisor or Trustpilot.
- **Listening:** No general listening; pay-per-use Hashtag Tracker (X hashtag, keyword or account with 7-day look-back; IG one hashtag; 8-hour refresh); competitor tracking up to 100 (5 on Free) on IG, FB, X, YouTube, Twitch per marketing page; no LinkedIn page or TikTok competitors.
- **Analytics / reporting:** Per-network metrics incl. Twitch, website, Meta/Google/TikTok Ads; 30 days Free, unlimited paid; cross-network PDF/PPT reports with logo (Starter+); custom templates (Advanced+); automatic monthly report emails with reply-to; Metricool Studio AI report builder (May 2026) shared by no-login live URL; Campaign Dashboards with goals; Looker Studio connector; ROI UNVERIFIED.
- **Approvals / collaboration:** Team members and roles Advanced+ only: six default roles, custom roles, per-brand per-section permissions incl. "Schedule pending review"; internal review board; client approval from email link into no-login portal; rules none/any/all reviewers; any rejection blocks publishing; cross-brand "Review requests" list (October 2026); post and inbox notes; post assignment; no audit trail found.
- **Agency / multi-client:** Brand is the unit, one per client; Client role (Advanced+); no-login approval portal; Studio reports shared by URL; white label on Custom plan (custom domain, logo, login page, agency-signed emails, branded reports); White Label for Integrators embedding; per-client billing not found.
- **Ads:** Meta and Google Ads: create, pause, reactivate, withdraw, edit budgets (image ads only, 8-digit email code to confirm); TikTok Ads analysis only; boost FB and IG posts; cross-platform ads reporting; LinkedIn Ads not mentioned; ad comments cannot be replied to; plan gating UNVERIFIED.
- **Email:** No email marketing or post-as-email; client approval emails with no-login portal links; automatic monthly report emails to several recipients with reply-to (Starter+); monthly summary to owner; agency-branded emails under white label; notifications for failed posts, disconnections, approvals; no new-message alerts; no email inbox.
- **Automation / AI agents and guardrails:** Auto-publishing; repeating Autolists; RSS auto-fill with hold-until-activated option; Flows (paid since 2026-11-09): IG comment-to-DM and keyword DMs, TikTok auto-replies and banned-word hiding, X comment-to-DM and DM replies, random reply variants, no human approval step; MCP server and Claude/ChatGPT connectors on all plans can schedule posts, no agent-specific guardrails; revocable integrations list.
- **Integrations / API / mobile apps:** Canva, Google Drive, Adobe Express; Zapier and Make (Advanced+); n8n, Power BI, Tableau via API; Looker Studio; Slack alerts; WordPress, Shopify, Squarespace, Wix, GTM website connectors; no native CRM, Bitly or Dropbox; API (Advanced+) for metrics, comments, scheduling; MCP all plans; iOS and Android (planner, inbox, analytics, approvals; no Flows).
- **Onboarding (does the customer bring their own developer app?):** No developer app or keys; API and MCP tokens optional and outward. Sign up with email, Google or Facebook (Facebook on Free only); one brand on Free; in-browser OAuth with admin/owner rights; IG via Instagram login or linked Page; LinkedIn page super admin; Bluesky pop-up; website by snippet/plugin.
- **Distinctive:** Brand-based pricing with unlimited team members on Advanced; free-forever plan with Inbox, AI, MCP; analytics-first (100 competitors, Twitch, website, ads, Studio); thin inbox; automation without approval (Flows, MCP); no-login client approval portal; network limits (GBP owner role, IG DM 24-hour/7-day window, no TikTok DMs); monthly product updates.
- **Source:** `buffer-later-metricool-publer.md` Metricool sections 1–13, 15, 16

#### Publer
- **Networks:** Facebook Pages, plus Groups and Profiles by reminder only; Instagram Business/Creator; X (paid plans only); LinkedIn profiles and pages; Pinterest; Google Business Profile; YouTube; TikTok; Threads; Bluesky; Mastodon; Telegram; WordPress; per-network daily posting limits; no Nextdoor, Reddit, Tumblr, WhatsApp.
- **Publishing:** Calendar with feed preview; auto-schedule queue (Free); failed posts auto-rescheduled; best times (Business); CSV up to 500 posts (Pro+); per-network text; follow-up comments, performance-triggered on Business; Stories, Reels, carousels; app reminders; Ideas Kanban board; recycling, recurring posts, Spintax (Business); RSS auto-publish (Pro+); media library; shorteners and UTM; Linkie link-in-bio.
- **Content creation / AI:** AI Assist: captions, rewrites, 80+ languages, Brand Voices, analytics chat, hashtags, alt text, comment replies, AI images, WordPress articles, AI-content labels; unlimited on Business, Free/Pro need their own OpenAI key; repurposing X threads to carousels, quotes to images, RSS to posts; photo and video editor; Canva, VistaCreate, PostNitro, Contentdrips.
- **Engagement inbox:** No unified inbox; per-post comment view, reply, add, delete on FB Pages, IG, X, Mastodon, LinkedIn, Threads, Bluesky, YouTube (Admin role only); no DMs, mentions or reviews; no assignment or saved replies; AI comment replies (Business or own key); no auto-replies, moderation, sentiment or CRM; Kibo standalone inbox MVP live (Q4 2026 roadmap, details UNVERIFIED).
- **Reviews:** None; cannot read or reply to Google, Facebook, Yelp or TripAdvisor reviews; GBP is publishing plus profile counts; blog sends users to Google's own interface; Kibo's 2021 description mentioned reviews (UNVERIFIED today).
- **Listening:** No keyword or brand listening; competitor tracking on Business (FB, IG, X: followers, engagement, top posts, posting times); Explore tab with trending IG/X posts, news feed, RSS.
- **Analytics / reporting:** Analytics on Business: per-account and per-post metrics, demographics, follower growth, 24-hour sync; cross-account dashboard and team activity; competitor and hashtag analysis; PDF and CSV export; white-label reports Enterprise only; weekly/monthly PDF reports by email; UTM and Linkie clicks; ROI UNVERIFIED; GBP post insights stopped 2023-02-20.
- **Approvals / collaboration:** Roles Owner, Admin, Editor, Client (Read-only, Posting, Full); approval rights assignable; two-tier internal and client approval (Business); declining requires a note; unapproved post marked Failed and not published; mobile approvals; approval emails; post notes with @mentions; Ideas assignees; enforceable 2FA; audit trail UNVERIFIED.
- **Agency / multi-client:** Unlimited Workspaces (Professional, Business), one per client; clients invited by email as Client members, no separate portal; white-label analytics reports only (Enterprise); API suggested for building a white-label scheduler; per-client billing UNVERIFIED.
- **Ads:** None found (no ad management, boosting or ad reporting; based on absence, not a Publer statement).
- **Email:** No email marketing, newsletters, post-as-email or email inbox; notification emails (failed posts, approvals, notes, empty queue, reauthorization); weekly/monthly PDF reports; email invites; Linkie email capture; Zapier email automations; support by email and live chat.
- **Automation / AI agents and guardrails:** Unattended: queue, RSS auto-publish, recycling with Spintax, auto-share/delete, auto-hide of own weak FB/YouTube posts, performance-triggered comments and reposts (Business), Zapier, API, MCP server (Business) scheduling posts "like an agent"; no automatic customer replies. Guardrails: approvals fail closed; daily posting limits; OAuth-scoped MCP; scoped API keys; whether API/MCP posts need approval UNVERIFIED.
- **Integrations / API / mobile apps:** Canva, VistaCreate, PostNitro, Contentdrips, OpenAI, Drive, Dropbox, OneDrive, Giphy, Unsplash, Senja, Bitly, Rebrandly and other shorteners, Google Analytics; Zapier (all plans); Slack only via Zapier; no CRM; REST API (Business/Enterprise, 100 requests per 2 minutes, no inbox endpoints); MCP; browser extension; iOS and Android.
- **Onboarding (does the customer bring their own developer app?):** No developer app for any network. Sign up by email or Facebook, X, LinkedIn, Google, Apple; onboarding questions, first Workspace; OAuth to Publer's app; Bluesky app password; Telegram by making Publer's bot admin; self-hosted WordPress application password; optional own OpenAI key.
- **Distinctive:** Per-account pricing, cheapest in class; X paid-only because of X Enterprise API cost; publishing-first with no inbox (Kibo separate); unusual networks (Telegram, WordPress, Mastodon, X Communities); approval fails closed; MCP agent; performance-triggered automations; daily limits as anti-spam; app reminders as API fallback; small company (Kalemi, Albania), public roadmap.
- **Source:** `buffer-later-metricool-publer.md` Publer sections 1–13, 15, 16

#### SocialBee
- **Networks:** Direct: Facebook Pages, Instagram, Threads, LinkedIn pages and profiles, X, Pinterest, TikTok, YouTube, Google Business Profile, Bluesky; "Universal Posting" phone reminders, user posts by hand: Facebook Groups, Reddit, WhatsApp, Telegram, Mastodon, Quora; personal FB/IG profiles by reminder; no Nextdoor or Tumblr.
- **Publishing:** Date/time scheduling; five calendar views; time zones; best-time suggestions from top posts; bulk editor and CSV (Accelerate+); per-network customization; first comment; alt text; drafts; content categories with evergreen re-queue, share-once, expiry, one-click pause; RSS into categories; shorteners and per-category UTM; Stories/Reels and media library UNVERIFIED; no link-in-bio found.
- **Content creation / AI:** AI Copilot (beta): from brand answers or website URL builds strategy, pillars, categories, posting plan, and posts with captions, hashtags, variations, AI visuals; "nothing is posted without your approval"; unlimited AI on all plans; tone, length, emoji controls; 1K+ prompts; post variations; hashtag generator and organizer; Canva, Unsplash, GIPHY; image crop/rotate.
- **Engagement inbox:** Engagement inbox on every plan, as Boards and Streams: comments, mentions, DMs on FB Pages and IG Business; comments and mentions on Threads, X, LinkedIn Company; YouTube comments; reply and like; internal notes; not found: assignment, saved replies, AI replies, auto-replies, moderation, sentiment, CRM.
- **Reviews:** None (GBP not in the inbox; no review sites found).
- **Listening:** No keyword or brand listening found; only Facebook "Competitor analysis".
- **Analytics / reporting:** Per-network page, post, category and post-type metrics, demographics, daily engagement map; cross-account profile analytics; PDF export; branded reports (Pro); advanced analytics (Accelerate+); 3 months or 2 years history; per-category UTM/Ref, no ROI; no scheduled email reports; Facebook Impressions replaced by Views (2026).
- **Approvals / collaboration:** Roles Owner, Manager, Publisher (approves), Contributor (cannot approve); draft → review → approval; clients join a workspace to approve or request changes, no no-login link; unapproved posts do not publish; post feedback with @mentions; email notifications; plan availability conflicting (Accelerate+ vs every plan); audit trail not found.
- **Agency / multi-client:** Workspaces 1, 1, 5 by plan; agency plans with 10, 20, 30 workspaces and 5 users each, same features as Pro; no client portal, software white-label or per-client billing; white label only for ConciergeBee services.
- **Ads:** No in-app ads management or boosting; paid and organic reach in post analytics; ad campaign setup, ads management and Boosted Posts sold as ConciergeBee done-for-you services.
- **Email:** Email notifications for comments and changes; no email marketing, post-as-email, email approvals or emailed reports found.
- **Automation / AI agents and guardrails:** Unattended: evergreen recycling and category scheduling; RSS import. Guardrails: Copilot output must be approved; unapproved posts act as drafts; Concierge Migration sets migrated posts "not approved"; no auto-replies or chatbots.
- **Integrations / API / mobile apps:** Canva, Unsplash, GIPHY, Quu, Bitly, Rebrandly, Replug, Switchy, BL.INK, JotURL, RocketLink, Zapier, Pabbly, Make; no Google Drive, Dropbox, Slack or CRM; no public API (long-term roadmap, no timeline); iOS and Android app delivers Universal Posting reminders.
- **Onboarding (does the customer bring their own developer app?):** No evidence they ever do. 14-day trial without card; Onboarding Wizard prompts the first account; each network uses its own log-in/authorization; common failures are FB Page Admin, IG linked to a Page, LinkedIn Super Admin; Copilot can start from a website URL; paid Concierge Migration and ConciergeBee services.
- **Distinctive:** Category-first evergreen scheduling, being simplified ("Category Sequence" and "Random" replaced, 2026-10-20); Universal Posting counts networks it cannot post to; software plus human ConciergeBee services, white-labelled to agencies; public changelog shows a 2026-07-27 ~12-hour outage with missed posts not republished; no AI replies, reviews, listening or API.
- **Source:** `socialbee-socialpilot-sendible-edgar.md` sections 1.1–1.13, 1.15, 1.16

#### SocialPilot
- **Networks:** Facebook Pages; Instagram Business/Creator; TikTok; X; LinkedIn pages and profiles; Threads; YouTube; Pinterest; Google Business Profile (Event/Offer posts since 2026-09-17); Bluesky; Facebook Groups UNVERIFIED; WhatsApp only for review requests; no Nextdoor, Mastodon, Reddit, Tumblr.
- **Publishing:** Queue Schedules and Smart Queues (all plans); drag-to-reschedule calendar, bulk edit (2026-03-20); AI Scheduler peak times; CSV up to 500 posts (Premium+); per-network customization, previews, first comment, LinkedIn documents, tagging, drafts; repeat posts; content library and tags; RSS feeds; shortener, Bitly, UTM; watermark (Premium+); FB audience targeting; no category recycling or link-in-bio.
- **Content creation / AI:** AI Pilot: brand voice per client, captions, hashtags, variations, repurposing long-form content into a week of posts, 10 languages, holiday ideas, proofreading; AI credits 500 to unlimited by plan; no image generation found; image editor; Holiday Calendar; Canva, Unsplash, GIPHY; AI Scheduler GPT inside ChatGPT.
- **Engagement inbox:** Social Inbox (Standard+): messages, comments, mentions on FB Pages, IG (incl. Story replies), LinkedIn Pages, plus GBP reviews and Q&A; tags, notes, priority sort, bulk actions; assignment UNVERIFIED; no saved replies; AI response refinement; AI or custom auto-replies to DMs and comments, IG auto-DM on comment (2026-01-21); no moderation, sentiment or CRM.
- **Reviews:** Separate SocialPilot Reviews product (free tier): read and reply on GBP and Facebook; monitor Tripadvisor, Yelp, Trustpilot; AI auto-reply rules in 40+ languages; review requests by email, SMS, WhatsApp, bulk up to 5,000; below-average ratings sent to a feedback page first; feedback forms; review reports; separate Listings product.
- **Listening:** No keyword or brand listening found; Competitor Reports (Premium+); free Instagram/Facebook competitor-analysis tools.
- **Analytics / reporting:** FB, X, LinkedIn, GBP, IG, YouTube, TikTok; 2 years history; PDF reports, email and scheduled delivery (Standard+); custom cross-account PDF/CSV, competitor and white-label reports (Premium+); live-link sharing; report duplication; organic vs paid boosted-post results; campaign tags; UTM; ROI not described.
- **Approvals / collaboration:** Role names differ by page (Admin, Manager, Content Scheduler/Creator); scheduler posts go to Pending Review for Manager approval or return with comment (Standard+); client approval via no-login emailed "Approve On-the-Go" link (Premium+); automated pending-approval email reminders (2026-01-13); mobile comments and approvals; audit trail not found.
- **Agency / multi-client:** Unlimited client seats (Premium+); clients are a permission-limited role, separated by Account Groups, no separate workspaces; invite links with platform restrictions, clients connect own accounts; white-label reports (Premium+), full white-label with custom domain and own-domain emails (Ultimate); SaaS white-label embedding; per-client billing not found.
- **Ads:** Boosted Post Performance reporting (organic vs paid); automatic boosting claimed on vendor blog (UNVERIFIED); no ads or campaign management found.
- **Email:** PDF reports by email and scheduled branded reports to clients; client approval links and pending-approval reminders by email; white-label system emails from agency domain; Reviews product email, SMS and WhatsApp review requests; no email marketing or email inbox.
- **Automation / AI agents and guardrails:** Inbox auto-replies (AI or custom) sent immediately, scheduled or approved before sending; review reply rules; RSS and repeat posts; MCP server (2026-04-09, every plan) lets Claude, ChatGPT, Cursor, Windsurf, Zapier create and schedule posts. Guardrails: posts only when asked, limited to the user's role, no added permissions; GBP Event/Offer excluded.
- **Integrations / API / mobile apps:** Slack (not for white-label users), Unsplash, Google Drive, Giphy, Dropbox, Zapier, Sniply, Rebrandly, Bitly, Feedly, Canva, Box, WordPress, Zillow, ChatGPT, Shopify; no CRM; public API not on USD plans (India Enterprise lists it), UNVERIFIED; MCP every plan; browser extension; iOS and Android.
- **Onboarding (does the customer bring their own developer app?):** No; an API key is used only for optional MCP from Cursor, Windsurf or custom clients. 14-day trial without card; Accounts > Connect Account and authorize; FB/IG need Admin or Editor, IG Business linked to a Page; agencies invite clients by link to connect own accounts; migration service on Ultimate.
- **Distinctive:** Four-product suite (Social, Reviews, Listings, AI Pilot), Reviews getting most 2026 updates; already ships AI inbox auto-replies with an approve-before-send option (report calls it closest to GeekSocial's model); role-scoped MCP on every plan; client approval and bulk gated at Premium; regional India plan set.
- **Source:** `socialbee-socialpilot-sendible-edgar.md` sections 2.1–2.13, 2.15, 2.16

#### Sendible
- **Networks:** Facebook Pages; Instagram Professional; LinkedIn profiles and Company Pages; TikTok Business and Personal; X; Google Business Profile; YouTube (videos, Shorts); Threads; Bluesky; WordPress; no Pinterest, Nextdoor, Mastodon, Reddit, Tumblr, WhatsApp.
- **Publishing:** Drag-and-drop calendar, Unified Calendar beta (2026-03-18); Smart Queues reposting evergreen content up to two years ahead; repeated content with start/end dates; adaptive best times; bulk/CSV incl. video (2026-10-29); dynamic-field personalization (Elite+); per-network customization; first comment FB, IG, LinkedIn, TikTok; drafts; RSS auto-poster, Google Alerts; content libraries (Premium+); Bitly, UTM; daily send caps per workspace.
- **Content creation / AI:** AI Assist in Compose: captions, rephrase, grammar, shorter/longer; unlimited AI credits on every plan; no repurposing or image generation found; topic-cluster hashtags in library; Canva with templates; image and video editor; Chrome extension and website share button.
- **Engagement inbox:** Priority Inbox: comments, mentions, messages from chosen profiles (FB incl. ad comments and Messenger, IG comments and DMs since 2026-10-29, LinkedIn Pages, YouTube); assign messages to team members; date, profile, archive filters; email or Slack notifications; not found: saved replies, AI replies, auto-replies, moderation, sentiment, CRM.
- **Reviews:** None found; Google Business Profile reviews not mentioned.
- **Listening:** Listening feature page removed (serves homepage); white-label page still lists listening; undated keyword-monitor webinar; current listening UNVERIFIED; no competitor benchmarking found.
- **Analytics / reporting:** Per-network and combined Engagement reports (all plans); 8 pre-built reports incl. Google Analytics; drag-and-drop custom report builder and unbranded reports (Premium+); PDF; automatic daily/weekly/monthly email delivery to non-users; live report links; GA ROI and UTMs; no GBP reports.
- **Approvals / collaboration:** Unlimited users on every plan; assignment and approvals (Plus+); custom workflows forcing approval for chosen users; individual or bulk approval requests; client users preview and approve in their own dashboards, notified in dashboard and by email; permission groups, advanced permissions (Elite+); workspace access control (2026-08-18); no named audit trail.
- **Agency / multi-client:** Workspaces are the pricing unit (6 profiles each); Client Connect widget lets clients link profiles without sharing passwords, reconnection links emailed; white-label add-on (Elite+): domain, emails, SSO, support pages, branded trial page, service packages; software-integrator embedding; no billing of agency clients found.
- **Ads:** Facebook ad comments monitored and answered; no ad creation, boosting or ad reporting found.
- **Email:** Automatic emailed reports with per-recipient subject and message; approval-request emails (from agency domain under white label); Client Connect reconnection emails; add to a content library by forwarding email (text and images); email or Slack notifications; no email marketing.
- **Automation / AI agents and guardrails:** Unattended: Smart Queues, repeated content, RSS auto-poster, automated reports; Zapier beta (2026-01-07) lets Airtable, Notion, Monday.com, ClickUp create, queue or delete posts; publishing API and MCP announced, not shipped; no AI auto-replies. Guardrail: approval can be forced for chosen users.
- **Integrations / API / mobile apps:** Zapier, Canva, Google Drive, Dropbox, Pexels, Flickr, GIPHY, Bitly, Google Analytics, WordPress, Chrome extension; Slack notifications; no CRM; no public API yet (publishing API and MCP announced); iOS and Android (depth UNVERIFIED).
- **Onboarding (does the customer bring their own developer app?):** No; only keys mentioned are for the upcoming API, and Bitly branded links need the customer's own paid Bitly. 14-day trial without card; connect profiles and invite team immediately; authorization or Client Connect; LinkedIn reconnection reminders yearly instead of every 60 days (2026-08-18); dedicated onboarding (Premium+).
- **Distinctive:** Unlimited users, priced by workspace; built for agencies and multi-location brands (Client Connect, white-label reselling, branded trials, vertical pages); no Pinterest, GBP reporting or reviews, inbox AI or API yet; daily publishing caps; plans overhauled about 2026-10-31.
- **Source:** `socialbee-socialpilot-sendible-edgar.md` sections 3.1–3.13, 3.15, 3.16

#### MeetEdgar
- **Networks:** TikTok; Facebook Pages and Stories; Instagram (Business direct, personal and Stories by app reminder); LinkedIn pages and profiles; Pinterest; Google Business Profile; X; Threads; YouTube Shorts only; Bluesky; Facebook Groups dropped after Meta's Groups API shutdown (2024-04-22); no Nextdoor, Mastodon, Reddit, Tumblr, WhatsApp.
- **Publishing:** Permanent unlimited library; categories mapped to weekly time slots; Random slots; newest-first order, recycles published posts when a category runs out; skip, shuffle, pause; Use Once and expiry dates; rotating caption variations (X: each once); CSV import (no video, IG, Pinterest); RSS to library or pending review; first comment FB/LinkedIn/IG; Rebrandly/Bitly; no drafts found.
- **Content creation / AI:** Inky AI writes captions from a description with tone and optional hashtags, copied and pasted by the user; 15 or 50 credits/month; "Suggest variations" scrapes pull quotes from the linked page (not AI); Canva import; no repurposing, image generation or image editing found.
- **Engagement inbox:** Social Inbox (EDGAR plan only, added about September 2026): FB and IG DMs incl. Story replies; comments only on Edgar-published posts; any member can reply; no filters, search or deletion; not found: mentions, assignment, saved replies, AI or auto-replies, moderation, sentiment, CRM.
- **Reviews:** None.
- **Listening:** None.
- **Analytics / reporting:** Dashboard of content sent, link clicks and impressions by category and account; weekly performance email every Sunday; post history; Rebrandly click tracking and UTM; no competitor, custom, white-label or PDF reports or export found.
- **Approvals / collaboration:** Up to 20 members on both plans with full access except billing; no roles; no approval workflow; removing a member transfers content to the owner; notes, tasks, audit trail not found.
- **Agency / multi-client:** None: no workspaces, client portals, white label or per-client billing; aimed at solo businesses and small teams.
- **Ads:** None found.
- **Email:** Weekly performance-report email; LinkedIn token-refresh reminders; emails when X variations run low; team invitations; billing receipts; no email marketing.
- **Automation / AI agents and guardrails:** Unattended: self-filling queue, recycling, Random slots, RSS import, Shopify product import into the evergreen recycler. Guardrails: RSS can route to a pending review queue; Use Once and expiry stop recycling; queue pause; Inky only drafts; no AI agents or auto-replies.
- **Integrations / API / mobile apps:** Canva; Zapier (text templates using an Edgar API key from settings); Shopify; Bitly, Rebrandly; bookmarklet, Chrome extension, share button; no Google Drive, Dropbox, Slack or CRM; public API docs not found (UNVERIFIED); iOS and Android for Instagram reminders and queue view/skip.
- **Onboarding (does the customer bring their own developer app?):** No; Edgar's own key is used only for Zapier. 30-day trial, no payment at sign-up; Settings → network → log in and authorize; a second account on the same network needs logging out of the first; FB Page admin, LinkedIn Super Admin, IG Business via Page; default categories and starter slots.
- **Distinctive:** Purest evergreen-automation tool (permanent library, recycling, rotating variations); simple, 20 users included, 30-day trial; no approvals, roles or agency features; inbox only FB/IG on top plan; network rules leak in (X once per variation, Groups lost, IG reminders); small copy-paste AI.
- **Source:** `socialbee-socialpilot-sendible-edgar.md` sections 4.1–4.13, 4.15, 4.16

#### Agorapulse
- **Networks:** Facebook Page; Instagram Professional; Threads; X (paid add-on: X Lite / X Plus); LinkedIn Page and personal profile; YouTube; Google Business Profile; TikTok Business; Pinterest; Bluesky; Reddit for listening only. Not supported: Nextdoor, Mastodon, Tumblr, WhatsApp, and Facebook/Instagram personal profiles.
- **Publishing:** Unlimited scheduling; calendar; drafts; per-network customization; queues and recommended times (Advanced+); CSV bulk upload, up to 200 posts; first comment and X threads (Professional+); Stories, Reels and carousels vary by network (no Facebook carousels); labels; content library; pulse.ly/Bitly links and UTM; PulseLink link-in-bio; editing published Facebook posts (2026-09-01). RSS: UNVERIFIED (likely absent).
- **Content creation / AI:** AI Writing Assistant, AI alt text and Organization Context AI (stores brand tone) on all plans; hashtag suggestions; Archie (2026-10-20), a free repurposing tool that drafts posts from webinars, reports and YouTube videos and makes visuals and clips; locked draft templates; Canva (Professional+), Google Drive, Tenor.
- **Engagement inbox:** Organic and ad comments, mentions, DMs and reviews; assignment, collision detection and custom views (Professional+); saved replies, spam management and labels (Advanced+); AI reply suggestions on the Custom plan only, for DMs per the help article, tested only in English, and a person sends them; moderation rules can hide, delete, ban, assign, label or set sentiment but never reply. Pinterest and Bluesky have no inbox.
- **Reviews:** Google Business Profile reviews and Facebook recommendations only; reviews with pictures don't sync; no Yelp, TripAdvisor, Trustpilot or app stores. Review-request campaigns: not found, UNVERIFIED (likely absent).
- **Listening:** Paid add-on, price not published; Facebook, Instagram, YouTube, X, LinkedIn, Reddit, TikTok mentions, news, blogs and forums; AI screening of off-topic results; share of voice; sentiment; spike alerts; 24-month history; Boolean search (2026-03-05); competitor listening (2026-07-02).
- **Analytics / reporting:** Profile, post, community-management and ROI reports; white-label reports on all plans; team report (Professional+); scheduled report emails, label reports and ads reporting (Advanced+); Report Studio (2026-07-29); PPTX export; Reports open API and Looker Studio (Custom). No reports for Pinterest, Google Business or Bluesky; X reports need X Plus.
- **Approvals / collaboration:** Organization and profile roles (Moderator can schedule but not publish); simple approvals (Professional+); multi-step approvals (Custom); external approvers via a Shared Calendar link, no account needed, link valid 60 days (Advanced+); internal comments and calendar notes; Activity Log (2026-10-06, Tailored plan only); owners can enforce 2FA.
- **Agency / multi-client:** A user can switch between organizations; Workspaces are Custom-only; a free Profile Connector seat lets outsiders connect profiles (Advanced 5, Custom 10); white-label reports and PDF logo; no app or domain white-label; the Shared Calendar is the client surface. Per-client billing: UNVERIFIED.
- **Ads:** Boosting Facebook posts and ad-calendar sync (Custom); ads reporting, including Meta organic plus paid (Advanced+); moderation of Facebook, Instagram, LinkedIn and TikTok ad comments (Professional+). Campaign creation: not found, UNVERIFIED (likely absent).
- **Email:** No email marketing or newsletters; email notifications (token health, assignments, approvals, publish failures); scheduled report emails (Advanced+); Shared Calendar approvers get an emailed link and approve on the web page; Slack and Teams notifications are Custom-only; no email inbox integration.
- **Automation / AI agents and guardrails:** No auto-replies. Moderation rules act without a person but never reply. AI replies are drafts a person sends. Archie: nothing published without human sign-off. MCP (2026-10-29) confirms every reply, has no "publish now" action, and waits for a manager when an approval workflow covers the profile. Inbox approval workflows can gate AI agents (2026-09-10). AI is opt-in and can be switched off org-wide.
- **Integrations / API / mobile apps:** All plans: MCP (ChatGPT, Claude, Copilot Studio), Bitly, Google Analytics, Google Drive, Tenor. Canva (Professional+); Zapier (Advanced+); HubSpot, Salesforce, Slack, Teams, Looker Studio (Custom). The only public API is the Reports open API (Custom). No Dropbox. iOS and Android apps.
- **Onboarding (does the customer bring their own developer app?):** No. Each network is connected by OAuth, and the customer needs admin rights on the network side. 30-day trial with no card. Team access can be set at connection (2026-02-18). The one exception is Bluesky, which needs a user-generated app password.
- **Distinctive:** Per-user pricing with 10 profiles. The most conservative inbox AI of its group: suggestions only, Custom plan only. Approval gates for AI agents and an MCP that never publishes directly; the report calls this the closest match to GeekSocial's "a person approves every reply". The free plan ended 2026-07-06 and was replaced by Archie.
- **Source:** `agorapulse-vista-statusbrew.md` sections A1–A16, plus the Quick comparison table

#### Vista Social
- **Networks:** Facebook Pages and Groups; Instagram Business/Creator; X ($29/month per-profile add-on since 2026-03-01); LinkedIn Company Page and Personal Profile; TikTok; YouTube; Pinterest; Snapchat; Threads; Bluesky; Reddit; Tumblr; Google Business; review sites. "Custom profiles" cover channels it does not integrate with. No Nextdoor, Mastodon or WhatsApp.
- **Publishing:** Unlimited scheduling; calendar; bulk CSV; per-profile queues with tagged sub-queues; optimal times; per-profile customization; first comment; evergreen recycling (up to 25 reuses, at least 72 hours apart); "Smart Publishing" from RSS, news or AI, up to 24 posts a day; shortener and UTM; Vista Page link-in-bio; publishing pause and a delay on "Publish now".
- **Content creation / AI:** AI Assistant ("powered by ChatGPT") for captions and replies, with tone and brand voice; Brain knowledge bases built from documents, URLs, sitemaps and Zendesk (Advanced+); Ask Vista repurposing (for example, a blog post into LinkedIn posts); AI image and video generation on credits; photo editor; Canva, Figma, Dropbox and others.
- **Engagement inbox:** Comments, mentions, DMs, reviews and shares; Facebook, Instagram and TikTok load in real time, other networks every 5–6 hours; "assign as task"; saved replies and macros; AI-suggested replies that a person sends; automations that reply by keyword or AI intent; hide/delete moderation rules; social CRM panel; internal notes; sentiment (Enterprise only); Meta ad comments.
- **Reviews:** Replies to Google Business, Facebook, Apple App Store and Google Play reviews; Yelp, TripAdvisor, Trustpilot and OpenTable are monitor-only; AI-drafted review replies; automated replies by star rating or keyword (AI replies on Google Business and Facebook); review sites need Advanced+. Review-request campaigns: not found, UNVERIFIED (likely absent).
- **Listening:** Listening on its own profiles is in every plan. External listening (web, social, blogs, news, X Trends, YouTube Trending, Google Trends) is an add-on: Boolean keyword groups, sentiment and language filters, alerts, shareable listeners, refresh every 4–6 hours. Competitor reports on all plans.
- **Analytics / reporting:** Reports on profiles, posts, reviews, tasks, competitors, advocacy, sentiment, benchmarks, listeners, inbox and paid; scheduled delivery to team and external email addresses; custom reports (Advanced+); dashboards and sentiment reports (Enterprise); Looker Studio, Power BI and Tableau (Advanced+); branded PDFs; Ask Vista narrative reports. YouTube analytics: UNVERIFIED.
- **Approvals / collaboration:** Roles include Contributor, whose posts require review; single-step approvals (Professional); multi-step (Advanced+); clients approve through a shared-calendar link without logging in (Advanced+), but external reviewers are not emailed; Vista Work tasks; AI brand-safety check of posts and replies (Enterprise; Scale add-on); audit log (Enterprise, off by default).
- **Agency / multi-client:** One profile group per client, each with its own brand voice, Brain and policy; a profile connect link lets clients connect profiles without a seat (Scale+); white-labelling of the login domain and the notification sender (Scale+); shared calendars and share-by-link pages act as the client portal; a Slack or Teams channel per client. Per-client billing: UNVERIFIED.
- **Ads:** Boosting on Facebook, Instagram, LinkedIn, TikTok, X and Pinterest (all plans). Ads management (Advanced+) across Meta, LinkedIn, TikTok, Snapchat, X, Pinterest, Reddit, Google, Microsoft and OpenAI Ads, mostly via Ask Vista, with spend limits, daily caps and confirmation cards; new campaigns start paused. Meta ad-comment moderation; paid reports.
- **Email:** No email marketing; newsletters can only be planned as a manual custom profile with an email reminder; the automation "Send emails" action can alert any address; escalation and data-collection emails; scheduled report emails; white-label notification emails (Scale+); internal approvers are emailed, external reviewers are not; no email inbox integration.
- **Automation / AI agents and guardrails:** Once live, inbox and review automations send AI or text replies with no per-message approval. Guardrails: test mode, schedules, once-per-user, only Manage users can create them, Brain grounding, and Ask Vista saves automations as paused drafts. Ask Vista and its scheduled agents (Advanced+) follow approval workflows. Escalation rules. Smart Publishing can post with "No Review". MCP has 134 tools.
- **Integrations / API / mobile apps:** MCP; Ask Vista connectors (Notion, HubSpot, ClickUp and more); Canva, Google Drive, OneDrive, Dropbox, Google Analytics; Zapier, Make, Slack, Teams and BI tools (Advanced+); Zendesk (Scale+); Salesforce listed; REST API 2.0 on Enterprise or as an add-on (API 1.0 retired 2026-11-01); iOS, Android, Mac, Windows and browser extensions.
- **Onboarding (does the customer bring their own developer app?):** No for social networks: OAuth with "allow all permissions". Setup checklist and a free onboarding call; 14-day trial. The customer creates credentials only for a Bluesky app password, an Apple App Store .p8 key, a Google Play service-account JSON and an OpenAI Ads API key. Yelp and similar sites connect by public URL.
- **Distinctive:** The most automation-forward of its report: auto-DMs, comment and AI review replies, data-collection bots, scheduled agents, AI ads management. Broadest network list there, but no Nextdoor. Its guardrails act when automations are set up, not as per-reply approval. Sentiment, audit log and API are Enterprise-only.
- **Source:** `agorapulse-vista-statusbrew.md` sections V1–V16

#### Statusbrew
- **Networks:** Facebook Pages; Instagram Business/Creator; X; Threads; LinkedIn Pages and personal profiles; Pinterest; YouTube; TikTok; WhatsApp (inbox only); Reddit (no publishing); Bluesky; Google Business Profile (Standard+); Line (messages); App Store, Play Store, Trustpilot. No Nextdoor, Mastodon or Tumblr.
- **Publishing:** Multi-network scheduling with previews; calendar layouts; "Publish categories" (queues of time slots); Optimal Times from 180 days of data; bulk CSV; per-network customization and Post Groups; first comment, Stories, Reels, carousels, polls; RSS pulls articles into a list but does not auto-publish; Asset Manager; sbrew.link, Bitly, UTM; BrewLink; Publish Rules compliance checks (Premium). Evergreen: UNVERIFIED (likely absent).
- **Content creation / AI:** Brew AI captions and translation; AI Assistant in the reply box (translate, rephrase, tone, grammar; Premium+, uses credits; "It never sends replies"); AI report builder and Keyword Assistant; a brand-voice help article exists; Canva templates, Google Drive, Dropbox. Repurposing long content: not found, UNVERIFIED (likely absent).
- **Engagement inbox:** 25+ conversation types (ad comments, WhatsApp, Line, TikTok DMs, reviews); historic backfill; team inboxes; assignment (Premium); saved replies; collision detection; bulk hide/delete; social CRM; AI summaries, sentiment with intensity, translation; Rule Engine auto-replies, including "Let AI reply" (Premium); rules that hide, delete, route and tag; SLA reporting.
- **Reviews:** Read and reply: Google Business Profile reviews (plus Q&A and messages, beta), Facebook recommendations, App Store and Play Store (Enterprise), Trustpilot (Enterprise; needs a paid Trustpilot plan; replies cannot be edited); AI-written public auto-replies to Google reviews (Premium). Yelp: UNVERIFIED. No TripAdvisor. Review-request campaigns: not found, UNVERIFIED (likely absent).
- **Listening:** Included on Premium (4 topics, 1,000 conversations a month; more capacity costs extra); Instagram hashtags, X (off by default because of API cost), YouTube, Reddit, Threads, web; brand and competitor keywords; sentiment-trend report; reply to listened conversations from Engage; alerts not mentioned; competitor benchmarking (Premium).
- **Analytics / reporting:** 250+ metrics; 20+ visualization types; dashboards; Widget Builder and AI-assisted widgets; organic vs paid; competitor comparisons; team and SLA reports (Premium); 18-month backfill (Standard); PDF, CSV and PNG export; scheduled reports by email; view-only live links and embeds; GA4 with UTM; read-only Insights API. White-label reports: UNVERIFIED.
- **Approvals / collaboration:** Owner and Admin roles, user groups, granular permissions; single- or multi-step approvals (Premium+) with "require approval from all", mandatory rejection reasons and reminders; external approvers sign in by an emailed magic link and use no seat; unlimited guests can comment and suggest edits; audit and team activity logs (Enterprise). Inbox reply approvals: not mentioned, UNVERIFIED (likely absent).
- **Agency / multi-client:** "Spaces": one isolated workspace per client, with its own profiles, inboxes, rules and reports; the agency offer is priced per client with unlimited spaces; a Shared Link lets a client authorize their own profiles; the external approver page and shared report and calendar links serve as the client portal. White-label: UNVERIFIED. Invoicing not described.
- **Ads:** Boost Facebook and Instagram posts, including drafts and scheduled posts; dark posts; auto-hide or delete comments on Meta ads (including dynamic ads), with link and ML toxic filtering; TikTok ad comments; Facebook Paid Performance Report (Premium+); Meta ad metrics. Campaign creation: not found, UNVERIFIED (likely absent).
- **Email:** No email marketing; Rule Engine "Send email" to internal users and external addresses; magic-link emails for external approvers; internal approval emails held 5 minutes and skipped if already read in the app; scheduled PDF report emails; "No Upselling, No Sales Emails" policy. Email inbox integration: not found, UNVERIFIED.
- **Automation / AI agents and guardrails:** Engage rules hide, delete, assign, route, alert, auto-reply and AI auto-reply with no person involved. Guardrails: only Owners/Admins create rules; hide/delete need a conversation-type filter; AI fallback text; rules apply to new conversations only; working-hours schedules; rule limits per plan. No test mode or human approval is documented. MCP (Enterprise) has the user confirm each reply.
- **Integrations / API / mobile apps:** Slack; Teams; HubSpot and Salesforce (Enterprise); Dropbox; Google Drive; Canva; Bitly; Google Analytics; Zendesk and Zapier on request; MCP for Claude, ChatGPT, Gemini, Copilot; read-only Insights API (Enterprise, or an add-on on Premium); webhooks and APIs offered for other CRMs; developer portal contents UNVERIFIED; iOS and Android Companion app.
- **Onboarding (does the customer bring their own developer app?):** No for social networks: authorization redirects to the network, with network admin access needed. WhatsApp connects through Facebook login, and the number must not still run in the WhatsApp apps. Free migration and onboarding. The customer creates credentials for a Bluesky app password and for App Store, Play Store and Trustpilot keys (all three Enterprise).
- **Distinctive:** Engagement-first: 25+ conversation types, WhatsApp and Line, ad-comment moderation, SLA reports. The Rule Engine is a general automation layer that includes AI auto-replies, with no documented test mode or human in the loop. Claims no price hikes and no sales emails. The changelog is undated; the newest monthly product-changes article is from October 2025.
- **Source:** `agorapulse-vista-statusbrew.md` sections S1–S16

#### Meta Business Suite
- **Networks:** Facebook Pages and Groups; Instagram; Threads (cross-posting only, desktop only); Messenger and WhatsApp (inbox). No non-Meta networks. WhatsApp Status/Channels publishing: UNVERIFIED. Requires a business portfolio. Some messaging features and ads are unavailable in Europe and Japan.
- **Publishing:** Create and schedule posts, Reels and Stories to a Facebook Page, Instagram or Facebook Groups; Planner calendar that also shows ads; "active times" from the last 7 days; drafts and expiring posts; organic A/B tests; feed and grid previews; cross-posting between Facebook, Instagram, Groups and Threads. Meta says scheduled posts can fail and need a manual "Publish now". Free scheduling horizon: UNVERIFIED.
- **Content creation / AI:** "Use AI to help you generate content ideas"; saved ideas; separate text for Facebook and Instagram; up to 10 photos per Instagram post.
- **Engagement inbox:** Messenger, Instagram and WhatsApp messages in one place; Facebook and Instagram comments (reply, private message, hide, delete, report; no Instagram private message after 7 days); Follow up/Done/Spam; assignee and ad-response filters; customer panel with labels and notes; Leads tab; Inbox suggestions never auto-send; Page keyword blocking (1,000 keywords) and a profanity filter. Threads replies: UNVERIFIED.
- **Reviews:** No review management documented beyond Facebook comments and recommendations (UNVERIFIED).
- **Listening:** not stated in the report
- **Analytics / reporting:** Insights for the Facebook Page and Instagram profile, organic and paid: Overview, Results, Audience, Messaging (response rate and time, leads, orders), Benchmarking against similar businesses, Content. Instagram export, competitive and custom-audience insights, and a longer look-back are paid Meta One Advanced benefits.
- **Approvals / collaboration:** Task-based Page access (Content; Messages and community activity; Ads; Insights; full control); partners get partial access they can re-delegate; sharing Instagram access without the password is a paid Meta One benefit (4, 8 or 30 people). No approval workflow for content or replies is documented (UNVERIFIED as an absolute).
- **Agency / multi-client:** No multi-client workspace beyond switching between portfolios and assets, plus partner access.
- **Ads:** Simple ads or boosted content; ads tracked in the Ads tab and shown in the Planner; Ads Manager for detailed campaigns; Page keyword blocking and the profanity filter also apply to the Page's ads.
- **Email:** No email channel. A secondary source says the Business Agent does not handle email, phone, website chat or SMS.
- **Automation / AI agents and guardrails:** Free template and keyword automations (keywords match exactly and case-sensitively, up to 5, desktop only; a keyword reply goes out after 15 minutes unless a person answers first). Meta Business Agent (2026-06-03) sends on its own; a person can take over; it discloses AI, lets customers ask for a human, and notifies the business. Draft-for-approval mode: UNVERIFIED. Meta collects the agent's chats.
- **Integrations / API / mobile apps:** Free Meta Business Suite mobile app; Inbox suggestions are also available through the Messenger API; Business Agent Platform for larger businesses, with Shopify, Zendesk and Shopee connectors; "All tools" links Ads Manager, Events Manager and others.
- **Onboarding (does the customer bring their own developer app?):** Not stated in the report. A business portfolio holds the Page, the Instagram account, the ad account and people. The Business Agent needs messaging turned on, a professional Instagram account and a WhatsApp number on the Business app. Meta One is mobile-only onboarding and in limited testing.
- **Distinctive:** Free. Meta One paid tiers (announced 2026-09-15) add year-ahead scheduling, Instagram export, shared access, broadcast credits and more agent access. The report's own analysis of gaps a third-party tool can fill: non-Meta networks, AI replies a person approves (the agent does not answer comments), approvals, multi-tenant views, reviews, cross-network reports.
- **Source:** `meta-nextdoor-planable-loomly.md` Part A (A1–A12) and the cross-cutting section

#### Nextdoor for Business
- **Networks:** Nextdoor only. A free Business Page per location, up to ten locations per account.
- **Publishing:** Native Business Posts; the limit is conflicting ("unlimited free posts" vs up to twice a month to chosen neighborhoods), UNVERIFIED; native scheduling not found. Third parties: the Publish API (closed beta, approval needed) can create posts as a business profile, with no scheduling or audience parameter; the Share Plugin needs no approval, but the user finishes the post by hand.
- **Content creation / AI:** Business Pages redesigned in September 2026, with AI summaries and a "what neighbors say" tab. Nothing else stated in the report.
- **Engagement inbox:** Natively, a business can answer messages from its page; "Feed for Local Businesses" commenting is US and coming soon. Third parties cannot read business-page comments; a write-comment endpoint exists but business-profile support is not stated (UNVERIFIED); there is no DM API. The report concludes a Nextdoor inbox or AI-reply feature cannot be built.
- **Reviews:** Recommendations and Faves; owners can reply natively (secondary sources only, partially UNVERIFIED). There is no API for recommendations at all, and no tool was found that reads or replies to them.
- **Listening:** Content display APIs (Search, Trending Posts, Public Agency Feed) need a separate application. Orlo offers public-sector listening; Zencity has access to Nextdoor conversation data.
- **Analytics / reporting:** Third parties get no organic business analytics ("Get your posts" excludes business pages). Ads analytics are available through the Advertising API. Sprinklr supports Nextdoor ads and ads reporting only.
- **Approvals / collaboration:** not stated in the report. Orlo, a public-sector tool, offers drafts and approvals inside Orlo.
- **Agency / multi-client:** `/me/profiles` returns several business profiles per account but "does not support agency account". Up to ten locations per account.
- **Ads:** Self-serve Ads Manager (image, video, carousel and lead-gen ads; daily or lifetime budgets; Pixel and Conversions API); Local Deals; Neighborhood Sponsorships for listed trades; Opportunity Alerts (US, paid, September 2026). Advertising API v3 and CAPI access is reviewed individually and needs an API agreement.
- **Email:** not stated in the report
- **Automation / AI agents and guardrails:** not stated in the report
- **Integrations / API / mobile apps:** Developer portal (launched 2023-12-08): Publish API, Share Plugin, content display APIs, Verify by Nextdoor, Advertising API v3, CAPI/Pixel, News Partners. The API is in closed beta. A post can have up to 8,192 characters, one hashtag and 10 media URLs. Posts must come from a Nextdoor user, not the partner platform.
- **Onboarding (does the customer bring their own developer app?):** The third-party tool, not the customer, applies for the Publish API (form, logo, redirect URI); eligibility criteria are unpublished. If approved it gets a client ID and secret, then the user grants OAuth consent (scope `profile`) and picks a business profile. The Share Plugin needs no application.
- **Distinctive:** Every tool found publishing organic posts to Nextdoor serves public agencies or news publishers (Orlo, Social News Desk, Zencity, CivicPlus, Marfeel, True Anthem). Sprinklr supports ads only; Jetpack supports personal profiles only. Hootsuite, Sprout, Buffer, Later, Planable and Loomly have no Nextdoor support.
- **Source:** `meta-nextdoor-planable-loomly.md` Part B (B1–B5)

#### Planable
- **Networks:** Facebook Pages; Instagram Business/Creator; Threads; X (Basic plan: 1 post per 24 hours; not on the trial); LinkedIn page and profile; TikTok personal and business; YouTube; Pinterest business; Google Business Profile. No Nextdoor, Bluesky or Mastodon; Reddit is listening only. "Universal content" pages plan blogs and newsletters but do not publish them.
- **Publishing:** Feed and Calendar views, Grid (Pro+), List (Enterprise); recurring posts; auto-schedule on approval; campaigns; labels; version history; first comment, @mentions, alt text, time slots and best time; LinkedIn polls and PDFs (web app only); sync of previous content; "Save as an ad"; published posts archived after 1 year.
- **Content creation / AI:** Generate from a prompt; "Generate from posts" in the style of past posts (needs at least 5); rewrite presets; hashtags; captions from images or video; alt text; a brand-context document per workspace (the AI reads up to 4,000 characters); "AI never publishes a post for you"; no stated credit quota.
- **Engagement inbox:** Paid Social Inbox add-on: comments on Facebook, Instagram, LinkedIn and TikTok Business; Facebook and Instagram ad comments once an ad account is connected; DMs on Facebook Page and Instagram only (with Instagram limits); Open/Later/Done statuses; sentiment; "Answer with AI" suggested replies; only the last 14 days shown; reply permission set per member.
- **Reviews:** Not supported. Google Business Profile is a publishing and analytics channel only.
- **Listening:** Paid add-on: X, YouTube, Reddit, TikTok, Facebook, Instagram, LinkedIn and the web; 1 brand (plus 3 aliases), 3 topics and 3 competitors per workspace; brand and competitors sync every 24 hours, topics every 7 days; public posts only; replies happen on the original platform.
- **Analytics / reporting:** Paid add-on: Facebook, Instagram, LinkedIn, TikTok Business, Google Business Profile, YouTube, X; organic vs paid split; spend, CPM, CPC, CPE; competitor analytics; customizable reports with logo, a public share link, and PDF and CSV export.
- **Approvals / collaboration:** Workflow set per workspace: None or Optional (all plans), Required (Pro+), Multi-level up to 10 levels (Enterprise). Lock content after approval; auto-schedule on approval, and revoking unschedules; reminder emails; client Approver role with a "My approvals" queue; internal posts hidden from clients; public links allow view and comment only; annotations and suggested edits.
- **Agency / multi-client:** One workspace per client, each with its own pages, members, approval workflow and brand context; roles Guest, Writer, Contributor, Approver, Administrator, Owner; separate Approve/Edit/Publish/Analyze/Administrate permissions; a client invited as Admin can connect their own pages; client membership is not on Basic.
- **Ads:** "Save as an ad" (Pro); paid and organic analytics with spend metrics; Facebook and Instagram ad comments in the inbox; Meta and LinkedIn ad accounts are separate OAuth connections.
- **Email:** Email notifications, approval reminders, listening alerts and invites; invoices by email; newsletters can be planned and approved as universal content, but "Planable does not send email".
- **Automation / AI agents and guardrails:** No autonomous reply agent; a person applies or sends all AI output. The Planable MCP lets AI tools browse, create, schedule and approve posts and read and reply in the inbox. MCP guardrails: the AI can only do what the user can do; per-action toggles; expiry after 8 hours idle; consent lasts 180 days; Planable advises starting read-only.
- **Integrations / API / mobile apps:** Public API v1 (Pro+) with read or write tokens scoped to chosen workspaces and an expiry (workspaces, pages, analytics, posts, media, labels, Instagram stories); Zapier; MCP; Canva; Slack, email and push notifications. Mobile apps: not stated in the report.
- **Onboarding (does the customer bring their own developer app?):** No. Pages connect through Planable's own OAuth app; ad accounts are separate OAuth connections; API tokens are optional. The free trial has no time limit, allows 50 posts in total and needs no card.
- **Distinctive:** Built around approval workflows, with strictness levels used as a pricing lever; drafts hidden from clients until ready; approve schedules and revoke unschedules; content locks after approval. Inbox, analytics and listening are separate paid add-ons per workspace.
- **Source:** `meta-nextdoor-planable-loomly.md` Part C1 and the cross-cutting section

#### Loomly
- **Networks:** Facebook Pages; Instagram; Threads; LinkedIn page and profile (profiles have no analytics); TikTok; YouTube; Pinterest; Google Business Profile; Snapchat; Bluesky. X dropped. No Nextdoor or Mastodon; Reddit only through a manual Custom Channel or Zapier. One account per platform per calendar. Operated by Bending Spoons.
- **Publishing:** Direct publishing; unlimited scheduling (paid plans); recurring posts; CSV bulk upload of up to 60 posts; best time (Facebook, Instagram, LinkedIn); hashtag manager; Idea board; link shorteners; Loomly Studio media editor; slideshows; LinkedIn PDF carousels, polls, first comment and audience targeting; cloning across calendars; Custom Channels published by hand after an email reminder.
- **Content creation / AI:** AI Assistant chat (ideas based on what performed best; posts with captions, hashtags and generated images; reworking tone and translation); AI Captions on credits; AI Knowledge per calendar with do/don't brand rules, website, help link and tone for DMs and comments; limited or extended AI by plan; Canva, Google Drive, Unsplash, Giphy.
- **Engagement inbox:** "Interactions": Facebook comments, mentions and Messenger; Instagram comments, tags and DMs; LinkedIn comments and page mentions; TikTok comments; Bluesky comments and mentions. No Instagram ad interactions. Caps per rolling 14 days; 6-month retention; assignment; saved replies; "Reply with AI" that a person sends. Auto-moderation: not stated.
- **Reviews:** Not supported. Google Business Profile is a publishing channel only.
- **Listening:** AI social listening with competitor and sentiment analysis (needs a brand website): 2 runs a month on Starter, 5 on Beyond.
- **Analytics / reporting:** Basic analytics on all plans, including posts published outside Loomly, link clicks and Instagram story metrics; Advanced Analytics with date comparison, label filters, and PDF and CSV export; scheduled PDF report emails (up to 3 per calendar, 25 recipients; Beyond); AI analytics.
- **Approvals / collaboration:** Workflows per calendar: Original (2+ approvers), Lite (1 approver), Zero (none). Custom Workflows add Assignment Triggers and State Guards (all or any listed users, with override-by delegates). Roles Owner, Editor, Contributor, Client (cannot see drafts), Viewer; Custom Roles; private comments; post history; PDF export for offline approval; clients are free but use seats.
- **Agency / multi-client:** One calendar per client, brand or location, with unlimited calendars, priced per social account and per user. Custom branding (Beyond): branded subdomain, logo on the app and PDFs, favicon. Emails still come from Loomly, and the mobile app is not branded.
- **Ads:** Boost and sponsor Facebook, Instagram and LinkedIn posts from inside Loomly (requires reconnecting the Facebook Page and choosing an ad account). No Instagram ad interactions in the inbox.
- **Email:** Email notifications; scheduled report emails; email reminders to publish Custom Channels by hand (for example, a newsletter); Mailchimp through Zapier. No email-marketing or sending feature.
- **Automation / AI agents and guardrails:** No autonomous reply agent found; "Reply with AI" needs a person to click and send; AI Knowledge holds do/don't rules; approval workflows and State Guards gate publishing. Zapier triggers include post published, post failed and state changes; Zapier actions create a Quick Post or a Post Idea.
- **Integrations / API / mobile apps:** "Loomly does not currently offer a public API." Zapier, Slack, Microsoft Teams, Canva, Google Drive, Unsplash, Giphy. A mobile app exists; it is unbranded under white-label.
- **Onboarding (does the customer bring their own developer app?):** No. Accounts connect through Loomly's OAuth in Calendar Settings; LinkedIn Pages through the admin's profile. Free trial with no card; its length is UNVERIFIED. Free plan: 1 user, 3 accounts, 5 posts a month.
- **Distinctive:** Calendar plus approvals, with graded workflows (Zero/Lite/Original/Custom) and State Guards with delegates; the Client role cannot see drafts; X dropped from the current platform list; no public API.
- **Source:** `meta-nextdoor-planable-loomly.md` Part C2 and the cross-cutting section

#### ContentStudio
- **Networks:** Facebook, Instagram, X, LinkedIn profile and page, YouTube, TikTok, Pinterest, Threads, Bluesky, Telegram, Google Business Profile; Tumblr listed under "Blogs". No Mastodon, Reddit or Nextdoor.
- **Publishing:** Calendar, Grid and Feed views; shareable calendar; smart scheduling; content categories with time slots; Draft, Schedule or Queued; evergreen recycling with AI headline variations; RSS/OPML auto-posting; bulk CSV; Automations API (2026-09-23). A third-party tracker logged blog publishing as removed in 2026.
- **Content creation / AI:** AI Studio text, images and video (text-to-video, image-to-video, lip sync, talking avatar); Clip Maker cuts long videos into clips; "Customize with AI" writes a caption per platform (2026-08-05); Unified Brand Profile (2026-07-28) syncs websites, documents and accounts; Discover curation feeds. No paste-a-blog-URL-to-posts feature found.
- **Engagement inbox:** Advanced and Agency plans only: DMs, post and ad comments, mentions and reviews on Facebook, Instagram, X, LinkedIn and Google Business Profile; YouTube comments; assignment, collision detection, internal notes, saved replies, roles; "Reply with AI" drafts that a person sends; Auto Replies rules triggered by keywords plus an AI intent description; monthly auto-reply credits.
- **Reviews:** Reviews appear in the inbox; auto-reply rules can target Google Business Profile reviews. Other review sites: not stated in the report.
- **Listening:** A social listening add-on exists (its price is shown inconsistently). No further detail in the report.
- **Analytics / reporting:** Dashboard with PDF and CSV export; competitor analytics; Google Ads and Meta Ads analytics; Google Data Studio connector; Bluesky analytics (August 2026); YouTube competitor analytics (September 2026); white-label reports (Advanced+); reports by email, one-off or recurring (2026-08-25).
- **Approvals / collaboration:** Approval workflow (Advanced and Agency); approver and client dashboard; client invitations; reviewers can comment and approve from a shareable link without logging in; Approval Workflows API and an "approved" webhook (August/September 2026).
- **Agency / multi-client:** Agency Unlimited plan with unlimited workspaces and users; client workspaces; white-label, reseller and SSO add-ons. Whether white label requires the agency's own platform apps: UNVERIFIED.
- **Ads:** Ad comments in the inbox; Google Ads and Meta Ads analytics. Ad creation: not stated in the report.
- **Email:** No newsletter or email-sending product. Email is used only to deliver analytics reports. The free "AI Email Writer" is a marketing tool, not a product feature. No Mailchimp or email integration.
- **Automation / AI agents and guardrails:** Each Auto Replies rule either sends automatically (immediately, cannot be undone) or saves a draft for team review. AI replies can use the Brand Voice and uploaded help docs; a manual option sends fixed text. No sentiment exclusion, schedule or delay guardrail is documented. RSS and evergreen automations.
- **Integrations / API / mobile apps:** Canva, VistaCreate, PostNitro, Google Drive, Dropbox, Bitly, Replug, Feedly, Zapier, Make, n8n; MCP server and CLI for Claude, ChatGPT, Gemini, Cursor, Codex; OpenAPI spec with 177 endpoints; Inbox API (2026-08-05); webhooks (2026-08-21); an API-only plan. Mobile apps: not stated in the report.
- **Onboarding (does the customer bring their own developer app?):** No customer developer app found. Accounts connect inside the app (LinkedIn through a selection pop-up under Settings). API keys are needed only by API, MCP or CLI users. 7-day trial, no card.
- **Distinctive:** Each auto-reply rule chooses between sending automatically and saving a draft, with intent detection, help-doc grounding and per-plan AI reply quotas. API-only plan; MCP, CLI and webhooks for agents; blog publishing dropped in 2026.
- **Source:** `ai-repurposing-tools.md` sections 1.1–1.12 and At a glance

#### Lately
- **Networks:** LinkedIn personal and company; X personal and company; Facebook company Pages; Instagram company pages; YouTube on the top tier only. Not listed: Threads, TikTok, Pinterest, Google Business, Nextdoor, Bluesky, Mastodon, Reddit. All facts come from archived pages (2026-09-22 to 2026-10-12); the live site was down on 2026-11-18.
- **Publishing:** "Publish with Lately"; social media calendar; AI-optimized scheduling of cadence, time and day; RSS feed integration (Growth); can hand content to Hootsuite, Sprinklr or HubSpot, or export CSV. Evergreen: UNVERIFIED.
- **Content creation / AI:** Turns long text, audio and video (blogs, newsletters, podcasts, webinars) into dozens of posts, plus transcripts, audiograms and video clips; "Lately AI Original" posts; a voice model learned from past performance; messaging guides; keyword and anti-keyword controls; audience pre-testing; hashtags and emojis; several source languages.
- **Engagement inbox:** None found
- **Reviews:** not stated in the report
- **Listening:** not stated in the report. Competitor keyword analysis sits in analytics.
- **Analytics / reporting:** Engagement overview; top posts, channels and authors; keywords, hashtags and mentions; best times; competitor keyword analysis; campaign tracking; parent-child dashboards across regions, brands and employees; word-cloud recommendations; Excel export.
- **Approvals / collaboration:** Approvals "Limited" on Growth and full on Enterprise ("Review and approve every post before you schedule it"); employee advocacy (Enterprise).
- **Agency / multi-client:** "Multiple client account governance" on Enterprise only; agencies and franchises are among its markets.
- **Ads:** not stated in the report
- **Email:** Newsletters are input only. No email output, no sending and no email-service integration.
- **Automation / AI agents and guardrails:** Enterprise sells "100% automation" of publishing. "Kately", a chat-based social media agent, is waitlist-only. No guardrails beyond approvals are stated.
- **Integrations / API / mobile apps:** Hootsuite, Hootsuite Amplify, HubSpot Marketing Hub, Sprinklr, Salesforce, UpContent, Grammarly, Bitly. Public API: UNVERIFIED. Canva, Zapier, WordPress and Mailchimp are not mentioned. Mobile apps: not stated.
- **Onboarding (does the customer bring their own developer app?):** UNVERIFIED (help centre unreachable). Nothing on the archived pages says the customer creates a developer app. The customer can connect their own Bitly account. Free trial on Starter; its length is UNVERIFIED.
- **Distinctive:** The original "long-form into dozens of posts in a learned voice" product, with audio and video clips; sold as an add-on to Hootsuite, HubSpot and Sprinklr; no inbox; pivoting to Kately; live site broken on 2026-11-18. A third party says Starter was removed on 2026-11-03.
- **Source:** `ai-repurposing-tools.md` section 2 status note and 2.1–2.12

#### Missinglettr
- **Networks:** Facebook Pages and Groups; Twitter/X; LinkedIn profiles and pages; Instagram (business only); Google My Business; Bluesky; Mastodon. YouTube and Wistia are content sources only; Medium can no longer be connected. Not listed: Threads, TikTok, Pinterest, Nextdoor, Reddit.
- **Publishing:** Calendar; Scheduling Rules; schedule templates; dates and times per campaign; direct post scheduling and video posts; "Automatic Repost" duplicates best performers at their best times; campaigns created from RSS; Curate Auto-Schedule adds other users' content.
- **Content creation / AI:** A blog post (by RSS or URL) or a YouTube video becomes a drip campaign, by default 9 text+image+link posts spread over a year. Three AI levels: Full AI (goal-based phases), Balanced (real sentences from the source, no rewriting), No AI. Quote-bubble images; trending hashtags; brand voice; templates. What "AI Articles" produces: UNVERIFIED.
- **Engagement inbox:** None on vendor pages (a competitor also says so)
- **Reviews:** not stated in the report
- **Listening:** not stated in the report. Curate offers lists of industry content.
- **Analytics / reporting:** Campaign analytics and "Advanced Analytics"; click tracking through shortened URLs; clicks vs impressions.
- **Approvals / collaboration:** "Nothing is ever published without your approval"; pending Curate posts show a yellow dot; team members with permissions.
- **Agency / multi-client:** Agency add-on: unlimited workspaces and users; clients review performance in a white-labelled interface with custom domain, dashboard and reports.
- **Ads:** not stated in the report
- **Email:** None (no email or newsletter output, sending or integration)
- **Automation / AI agents and guardrails:** Automated drip campaigns, Automatic Repost and Curate Auto-Schedule; approval required before anything publishes; Balanced and No-AI modes avoid invented copy; the AI switch is forced off when the workspace has no AI provider connected.
- **Integrations / API / mobile apps:** Bitly, Replug, PixelMe, Epictions. Zapier, Canva, WordPress plugin, Mailchimp and a public API are all UNVERIFIED. Mobile apps: not stated.
- **Onboarding (does the customer bring their own developer app?):** Mostly no: major networks connect OAuth-style. Bluesky needs a handle and app password. For self-hosted Mastodon the customer may have to create an app and email its client key and secret to Missinglettr. Whether customers must bring their own AI key: UNVERIFIED. Free trial, no card.
- **Distinctive:** The one-post-to-year-long-drip model with mandatory approval; a Balanced mode that uses only source sentences, plus a no-AI mode; Curate, a content-sharing network across customers; no inbox, TikTok, Threads, Pinterest or email.
- **Source:** `ai-repurposing-tools.md` sections 3.1–3.12

#### FeedHive
- **Networks:** X, LinkedIn, Facebook (with a separate Groups doc), Instagram business, Threads, TikTok, Pinterest, YouTube, Google Business Profile, Discord; "availability may vary by feature". Not listed: Bluesky, Mastodon, Reddit, Nextdoor. LinkedIn profile vs page: UNVERIFIED.
- **Publishing:** Posting plans (time slots); calendar; CSV upload; best time slots; Instagram carousels; Thread Builder. Post Conditions automatically add a follow-up comment or thread once a post passes an engagement threshold (Twitter, Facebook, Instagram). Workflows can publish with no review. RSS only through Zapier, Make or n8n. Recycling is suggestions only, with no evergreen.
- **Content creation / AI:** A built-in AI writing agent turns one idea into captions, images (Flux Pro, Nano Banana 2) and hashtags for each platform; brand voice, audience and goals are set once; performance prediction and a Content Score; choice of model ("from GPT-5.1 to GPT-4.1 Mini"). No URL, video or podcast repurposing described.
- **Engagement inbox:** Social Inbox for monitoring and replying to comments and conversations; AI-drafted on-brand replies; saved replies; ownership hand-off. Which networks feed it: UNVERIFIED. No auto-reply or keyword trigger documented.
- **Reviews:** not stated in the report
- **Listening:** not stated in the report
- **Analytics / reporting:** Performance stats, engagement prediction, Content Score, best time slots; an Analytics section in the REST API.
- **Approvals / collaboration:** Workspaces with team members per plan; when a non-approver schedules a post it goes to "needing approval"; only the owner grants "Can approve"; a non-approver's edit sends an approved post back to draft; no client-approval role documented.
- **Agency / multi-client:** Agency plan with many workspaces and accounts. White label not mentioned; no client role documented.
- **Ads:** not stated in the report
- **Email:** None on vendor pages
- **Automation / AI agents and guardrails:** Agent-created posts are saved as drafts for approval. Workflows (Trigger URL → Create Draft → Add Socials → Publish) can publish with no review step. Post Conditions automate follow-ups. No inbox auto-reply.
- **Integrations / API / mobile apps:** Zapier, Make and n8n as trigger senders; webhooks; REST API; MCP server; CLI; agent guides (ChatGPT, Claude, Claude Code, Grok and others); LinkDrip link shortener. Canva, WordPress and Mailchimp are not mentioned. Mobile apps: not stated.
- **Onboarding (does the customer bring their own developer app?):** No developer app (Instagram connects through Facebook login). Discord needs a webhook URL the customer creates. The customer can optionally add their own OpenAI key (which bypasses the credit limit) and a Replicate key. 7-day trial.
- **Distinctive:** Positioned as "social media management for AI agents": MCP, CLI, workflows, and agent drafts held for approval; engagement-threshold post conditions; explicitly against evergreen reposting; bring-your-own OpenAI key; no email, Bluesky or Mastodon.
- **Source:** `ai-repurposing-tools.md` sections 4.1–4.12

#### Ocoya
- **Networks:** Facebook Pages, Instagram, X, LinkedIn profiles and pages, Pinterest, Bluesky, Threads, YouTube Shorts, Google Business, TikTok, Mastodon, Dribbble; also Telegram, Slack, Discord, Tumblr, WordPress, Webflow, Wix and other CMS destinations; email "Coming soon". Not listed: Nextdoor, Reddit, Facebook Groups, regular YouTube.
- **Publishing:** One calendar for posts, articles and (soon) emails; List, Board and Calendar views; weekly slots per channel; best-time suggestions that never reschedule on their own; bulk queueing; RSS auto-posting; workflows that publish from new RSS or CMS items. Evergreen not mentioned.
- **Content creation / AI:** Social campaigns turn a goal and audience into up to 90 per-network posts over up to 90 days; blog campaigns produce 1–20 articles of 600–3,000 words; workflows turn RSS or CMS articles into posts; a product-to-post step; images, carousels and short video; Design Studio; brand data fetched from the website, three tones plus custom rules. Video generation "Coming soon".
- **Engagement inbox:** Facebook and Instagram DMs, comments and mentions; Google Business reviews; comments on its SEO articles. AI reply drafts on request (reads the last four DM messages, 1 credit each); "Nothing is sent on its own". Assignment ("a marker, not a lock"); internal notes; per-brand snippets. Email replies "soon".
- **Reviews:** Google Business reviews in the inbox; replies post publicly. Workflows can trigger on a new review and reply.
- **Listening:** not stated in the report
- **Analytics / reporting:** Best-times chart (90 days); bio-link clicks; UTM tagging; tracking of post performance and article traffic. Depth of a full dashboard: UNVERIFIED.
- **Approvals / collaboration:** "Approvals are on every plan"; held posts never publish, even after their time; a Client role approves, declines and comments but cannot create or edit; public read-only calendar link; campaigns schedule only approved posts.
- **Agency / multi-client:** Unlimited brands on every plan, with "nothing leaks between them"; channels and credits are pooled across brands; an Agency tier.
- **Ads:** not stated in the report
- **Email:** Not live. Planned: AI-drafted email campaigns on the same calendar, each email a draft first. Sending mechanism, lists and subscribers are not described. A workflow "Send email" step is "Coming soon".
- **Automation / AI agents and guardrails:** Workflows can auto-reply, send DMs, hide or delete spam, or follow back when a new DM, comment, mention, review or follower arrives. Guardrails: filter and AI-filter steps, scoping to one account, test runs, errors that block activation, immediate pause, draft until set live. An auto-replied thread stays Open until a person resolves it.
- **Integrations / API / mobile apps:** REST API, MCP, n8n, custom endpoint. Zapier, Make, Canva, Shopify, WooCommerce and Mailchimp are not listed. Mobile apps: not stated.
- **Onboarding (does the customer bring their own developer app?):** UNVERIFIED. No vendor page read requires a customer developer app; the API, MCP and custom endpoint are optional. 7-day trial, card required.
- **Distinctive:** One calendar for social posts, SEO articles and planned email; inbox AI drafts never send on their own, but workflows can auto-reply behind an AI filter; Client-role approvals on every plan; unlimited brands with pooled credits; the broadest network list in its group, including Bluesky and Mastodon.
- **Source:** `ai-repurposing-tools.md` section 5 status note, 5.1–5.12 and section 7

#### Predis.ai
- **Networks:** Facebook and Groups, Instagram and Stories, TikTok, Google Business Profile, LinkedIn personal and page, YouTube Shorts, X. Pinterest is on the scheduling page but not the pricing page. Not listed: Threads, Bluesky, Mastodon, Reddit, Nextdoor.
- **Publishing:** Calendar; bulk and batch scheduling. Auto-post generates a week of posts, captions, images and reels and publishes daily "without you logging in"; review is optional; not on Core, and Rise auto-publishes up to 60 posts a month. RSS and evergreen not mentioned.
- **Content creation / AI:** Mainly an AI ad generator: a product URL becomes a video ad (script, shots, voiceover); UGC-avatar and image ads; a blog URL becomes carousel or video posts; blog to video; Shorts maker with voiceover, captions, music and dubbing into 19 languages; sizing for each placement; brand kit; competitor analysis runs.
- **Engagement inbox:** None found
- **Reviews:** not stated in the report
- **Listening:** not stated in the report. Competitor intelligence covers themes, hashtags, schedules and ads.
- **Analytics / reporting:** Insights on best-performing posts; ad insights on formats and hooks; competitor themes, hashtags and schedules.
- **Approvals / collaboration:** "Send for Review" emails a reviewer, who approves or rejects with a comment; approved posts are scheduled automatically; history is kept; unlimited team members.
- **Agency / multi-client:** Workspaces per brand or client; brand count depends on plan. White label not mentioned.
- **Ads:** Its core use: video, UGC-avatar and image ads generated from a product link, prompt or image; "Ad Competitor Intelligence"; ad performance insights. Publishing or managing ad campaigns: not stated.
- **Email:** None
- **Automation / AI agents and guardrails:** Fully automatic generate-and-publish, with review optional; an approval flow is available. No other guardrails stated.
- **Integrations / API / mobile apps:** Shopify; an API on all plans for video ads, UGC videos, image ads and social posts, with developer docs and separate API pricing; MCP for Claude and ChatGPT. Canva, Zapier, WooCommerce, WordPress and Mailchimp are not mentioned. Mobile apps: not stated.
- **Onboarding (does the customer bring their own developer app?):** UNVERIFIED. No vendor page read requires a customer developer app; the API is optional. 3-day trial; the card is charged when it ends.
- **Distinctive:** An ad-first creative generator that also publishes; generates and publishes with no one involved; blog-to-carousel and blog-to-video repurposing; no inbox, Threads or Bluesky.
- **Source:** `ai-repurposing-tools.md` sections 6.1–6.12


#### Contradictions found in the 2026-11-18 reports


**Reports 1 to 3** (Hootsuite to MeetEdgar): Hootsuite: GBP publishing (help center says Inbox only; integrations FAQ says the GMB app creates posts); smart-reply tier (pricing Pro+, help article Enterprise/Advanced Inbox); report-export tier (help says all plans, pricing says Pro+); external approvals (agency page says clients give the go-ahead, the Enterprise feature only records approvals made outside); Hootbio page dated 2026-11-21, after the check date. Sprout: WhatsApp chatbots (FAQ no, Bot Builder yes); CRM sending (Standard article vs Advanced-only table); public API (FAQ says none, help center and pricing say Advanced); "auto-reply" rule action appears only in the Bluesky article. Buffer: Ideas limit (unlimited vs 2,000); Essentials saved replies (5 vs unlimited); OAuth app clients ("coming soon" vs available); Pinterest personal notes. Later: custom roles (pricing vs four fixed roles); inbox assignment (product page vs help); LinkedIn profile carousels/video; hashtag limit 30 vs 5; credit add-ons on Starter. Metricool: Canva/Drive on Free (pricing add-on block vs Starter-only); competitor-tracking networks (marketing page vs help article). Publer: Telegram/X connection (help says Publer's bot and no developer account; API docs say bot token and developer account). SocialBee: approvals plan (Accelerate+ vs every plan); Facebook Groups (direct in help vs reminder-only). SocialPilot: role names differ between pages; approval article inconsistent on plans. Sendible: white-label add-on price differs between pricing and white-label pages; listening page gone but still linked. MeetEdgar: A/B testing on features page vs help describing only variation click comparison. I left out conflicts that only concern prices.

**Reports 4 to 6** (Agorapulse to Predis.ai):
- **Agorapulse:**
  - Threads analytics: A7/A12 list Threads reports, but A4 says none.
  - Competitive Benchmarking is a demo-only add-on, yet the Advanced plan card advertises it.
  - The approvals help article is inconsistent about which plans get approvals.
  - AI reply suggestions are DMs-only per the help article, but "comments and DMs" per the marketing page.
  - The pricing FAQ says "keep using the free plan", but the help center says the free plan ended 2026-07-06.
- **Vista Social:**
  - Vimeo is in the pricing FAQ but not on the integrations page.
  - Salesforce is on the integrations page, but the data-collection article says HubSpot/Salesforce CRM integrations are not available.
  - Tumblr has no inbox types listed, but the integrations page claims "response management".
- **Statusbrew:**
  - Rule Engine is on Standard per the pricing page, but "Lite and above" per the help article.
  - The MCP "saves everything as a draft", yet an integrations-page line says it can publish a post.
  - Yelp is on the integrations page but missing from the connectable profiles.
- **Nextdoor:** the Business Posts limit is "unlimited free posts" on one official page and "up to two times per calendar month" on another.
- **Meta:** third-party sources disagree on the free scheduling horizon (29 vs 75 days).
- **Loomly:**
  - "Custom roles & workflows" is Beyond on the pricing page but "Advanced Plan and up" in the help center.
  - Custom Roles is "Starter plan and up" in the help center but Beyond on the pricing page.
  - An older help page still lists X.
- **ContentStudio:** the listening add-on is shown at two different prices.
- **Lately:**
  - Growth's channels and seats are shown inconsistently (25/5 vs 5/3).
  - A third party says Starter was removed on 2026-11-03, while the archived vendor pricing still lists it.
- **Missinglettr:**
  - A third-party review lists Pinterest; the vendor does not.
  - The Agency card shows "10 AI Posts Generations", below Solo's 100. This is my observation; the report does not flag it.
- **Predis:** Pinterest is on the scheduling page but not the pricing page.
- **FeedHive:** third-party pages disagree with each other on Bluesky and Mastodon.
- **Across reports:** `meta-nextdoor-planable-loomly.md` B4 marks Nextdoor support at Vista Social and Agorapulse as UNVERIFIED. `agorapulse-vista-statusbrew.md` states "No" for both, because Nextdoor is absent from their network lists and help centers.

### Vendors on geekatyourspot.com's home page "Use Cases" (researched 2026-11-19)

**Which vendors are here.**
- **Included:** the Use Cases vendors related to GeekSocial: the marketing vendors that do something with social media or email,
  and ManyChat. ManyChat is listed under Business Operations → AI chatbot and automates Instagram and Facebook messages.
  Hootsuite is in the section above.
- **Left out, after the list was narrowed in conversation:** the ad-spend tools, the lead-enrichment tools, Pipedrive, Zapier, and
  the accounting and other business-operations vendors.
- Each block was read from the vendor's own pages on 2026-11-19, and each line carries its source.

**What they do with social media.**
- **Schedule and publish organic posts:** only Hootsuite and Semrush (its Social Toolkit).
- **Mailchimp** publishes to Facebook and Instagram and can post automatically when an email is sent.
- **GetResponse** posts a newsletter to Facebook and X when it is sent.
- **Writesonic** claims LinkedIn scheduling and YouTube upload.
- **ManyChat** sends messages and comment replies.
- **The AI writers draft and hand off:** Jasper's output is copy "you can move directly into your preferred scheduling or
  publishing workflow", and Frase's is for "export for your scheduler"; "Nothing posts itself".

**Whether they train AI on customer data.**
- **They may:** Mailchimp ("We may use your Inputs and Outputs, including Customer Data, for machine learning purposes"), Brevo
  (trains its AI features on content and usage data), HyperWrite (usage data including "email content"), AdCreative (anonymized
  data), and Marpipe (its subscription agreement).
- **They say they don't:** Semrush, GetResponse, MailerLite, Moosend, Castmagic, Frase, Jasper (for third-party models) and
  Writesonic (for general-purpose models).

**Ownership changes worth knowing** (geekatyourspot.com's own vendor pages may predate them):
- Semrush is an Adobe company (since 28 April 2026).
- MarketMuse is part of Siteimprove, and `marketmuse.com` redirects there.
- Moosend is "now a Constant Contact company".
- Frase and Rytr belong to Copysmith AI, Inc.
- AdCreative.ai is run by ADYOUNEED SAS within the Appier group.
- Rytr now leads with an "AI Relationship Manager".
- Writesonic and Scalenut have moved to AI-search visibility.

**Social media and messaging**

#### ManyChat

On geekatyourspot.com under Business Operations → AI chatbot. It is included because it automates Instagram, Messenger and WhatsApp
messages through Meta, which makes it the closest of the Use Cases vendors to GeekSocial.

**How this block was read.**
- **Blocked:** manychat.com and help.manychat.com answered `403` (a Cloudflare challenge) to `curl` and to the fetch tool.
- **Read from archive copies:** the homepage and the privacy policy, from Wayback Machine copies dated 2026-11-17.
- **From search excerpts, marked "(search excerpt)":** other ManyChat pages.
- **Read directly:** community.manychat.com, Meta's case-study page and the status checks.

- **What it is:** chat automation for Instagram, Messenger, WhatsApp, TikTok, SMS and email, by Manychat, Inc.
  (https://manychat.com/, archive copy).
- **Features:**
  - Flow Builder.
  - Quick Automations: comment-to-DM, replies to story mentions and follows, FAQs, giveaways, email and phone capture.
  - Live Chat, and integrations.
  - "Manychat AI", labelled beta:
    - AI Step.
    - AI Replies: answers DMs and comments from a Knowledge library, is tested in a Playground, then switched on with "Go Live".
    - AI Comments: Instagram only, positive comments only.
  - Sources: https://help.manychat.com/hc/articles/23018283889180 and
    https://help.manychat.com/hc/en-us/articles/23096278263836-Manychat-AI-Comments (search excerpts).
- **Social media:** it sends messages and replies to comments; no post publishing was found.
  - **Instagram:** professional accounts only. The recommended way connects through Meta and needs a Meta Business Portfolio and
    full control of the linked Page. Instagram Login works without a Meta business account, but "advanced features may be
    limited". The sign-up button goes to `app.manychat.com/signup/facebookAuth?channel=instagram`.
  - **WhatsApp:** needs a Business Manager admin, uses Embedded Signup, and allows one number per account.
  - **The Meta permissions it requests:** UNVERIFIED.
  - Sources: https://help.manychat.com/hc/en-us/articles/14281290924444-How-to-connect-Instagram-to-Manychat and
    https://help.manychat.com/hc/en-us/articles/19247843644060-How-to-connect-WhatsApp-to-Manychat-choosing-the-best-method
    (search excerpts).
- **Whether AI replies send on their own:** UNVERIFIED, and the sources conflict.
  - The help articles describe one switch, "Go Live", and no step per reply.
  - The product page says "With AI Comments, you approve every reply" (https://manychat.com/product/ai, search excerpt).
  - In 2024 a community moderator offered only workarounds for having an operator review AI drafts
    (https://community.manychat.com/general-q-a-43/creating-a-semi-automated-chatbot-with-gpt-4-and-manychat-feasibility-and-implementation-1774).
- **Pricing:** by active contacts a month, for accounts created from 2 March 2026; prices are monthly, with yearly billing in
  brackets.
  - Free: 25 contacts.
  - Essential: $17 ($14), 250 contacts.
  - Pro: $39 ($29), 2,500 contacts.
  - Business: $99 ($69), 7,500 contacts.
  - Advanced: $199 ($139), 25,000 contacts.
  - AI needs a paid plan "with Manychat AI"; the add-on's price is UNVERIFIED.
  - Sources: https://help.manychat.com/hc/en-us/articles/25800228332572-Pro-plan (search excerpt).
- **Presentation:**
  - `app.manychat.com/` → `/login`, behind a web-application firewall challenge. `status.manychat.com` answers `200`.
  - **Footer:** Status page, Changelog, Privacy settings, Privacy policy, Terms of service, Privacy & security.
  - **The legal index adds:** DPA, Service Providers (the subprocessor list), Cookies Statement, SLA, AI Supplementary Terms, EU
    Data Act Addendum, Acceptable Use Policy.
- **Privacy and AI terms:** https://manychat.com/legal/privacy, effective 12 October 2026; Manychat, Inc., United States, certified
  under the EU-US Data Privacy Framework.
  - **Meta data:** it collects from "integrations that you linked to the Service (Facebook, Instagram, etc.)": id, name, email,
    linked pages, location and gender.
  - It "may also use anonymized Customer Content for product improvement".
  - **Platform terms:** none named (no Meta Platform Terms, no Google Limited Use).
  - **Deletion:** by email to privacy@manychat.com.
  - **AI providers:** the subprocessor list (effective 7 August 2026) names OpenAI, Anthropic and Google for generative AI.
  - **Training:** the AI terms (8 May 2024) bar the AI providers from training on customer content, while ManyChat may use inputs
    and outputs to improve its own features. Sources: https://manychat.com/legal/service-providers and
    https://manychat.com/legal/ai-tos (search excerpts).
- **Trust claims:**
  - SOC 2 Type 2 (A-LIGN).
  - ISO 27001 (BSI). The security page says the 2013 standard and the blog says 2022.
  - ISO 42001.
  - Listed in the Cloud Security Alliance STAR registry.
  - "Official Meta Business Partner" in the messaging category; Meta's own case study is titled "Meta Business Partner".
    Meta's partner directory was not checked.
  - Sources: https://manychat.com/security (search excerpt), https://www.a-lign.com/resources/case-study-manychat,
    https://next.cloudsecurityalliance.org/star/registry/manychat-inc,
    https://www.facebook.com/business/marketing-partners/case-studies/manychat_bb-littles.

#### Semrush
- **What it is:** an SEO, AI-visibility and marketing suite, now an Adobe company (acquisition completed 28 April 2026)
  (https://www.semrush.com/, https://news.adobe.com/news/2026/04/adobe-completes-semrush-acquisition).
- **Social media: yes, through its Social Toolkit.**
  - Social Poster plans, schedules and publishes posts.
  - Social Dashboard gives "AI-powered recommendations".
  - Social Analytics sends PDF reports with an "AI-generated summary".
  - Social Tracker follows competitors; Content Insights shows top posts.
  - The Business plan adds Influencer Analytics (YouTube, Instagram, TikTok, Twitch) and Media Monitoring.
  - **Networks:** Facebook, Instagram, TikTok, LinkedIn, Pinterest, Google Business Profile, YouTube.
  - Sources: https://www.semrush.com/kb/1544-social-toolkit-pricing-and-plans,
    https://www.semrush.com/kb/1559-getting-started-with-social-toolkit.
- **Other features:** SEO, AI Visibility, content, ads, local, an MCP server. Its AI terms name "Open AI products, Stable Diffusion,
  MidJourney".
- **Pricing:** per toolkit.
  - SEO: $139 a month.
  - Social: Base $20 a month billed yearly; Pro $40; Business $250.
  - Extra users from $45 a month. There is a free plan and a 7-day trial.
  - Sources: https://www.semrush.com/pricing/, https://www.semrush.com/pricing/social/.
- **Presentation:**
  - The app runs on `www.semrush.com` itself (`/login/`); signed out, `/projects/` sends a visitor to the homepage.
  - **Footer:** Privacy Policy, Terms of Service, Cookies Settings, Do not sell my personal info.
  - **The legal hub adds:** DPA, sub-processors, AI Terms, Security Info, Content Policy.
- **Privacy and AI terms:** "Last Modified Date: October 13, 2025"; SEMrush Inc., Boston, as joint controller with a Czech
  affiliate.
  - "Semrush does not train or develop its models, and does not allow its third-party providers to train or develop its models on
    User Input."
  - **Platform terms:** it names the YouTube API terms and Google's privacy policy. No Meta platform terms and no "Limited Use"
    statement were found (https://www.semrush.com/company/legal/privacy-policy/).
- **Trust claims:** "SOC 2-audited security processes", "GDPR-compliant".

**Email platforms** (email marketing is on GeekSocial's roadmap)

#### ActiveCampaign
- **What it is:** email marketing, automation and CRM (https://www.activecampaign.com/).
- **Features:** email, SMS, WhatsApp, automation, CRM, landing pages, "Active Intelligence" AI, AI agents, MCP. AI subprocessors:
  AWS Bedrock and OpenAI (list updated 25 September 2026; https://www.activecampaign.com/legal/subprocessors).
- **Social media:**
  - No organic posting or scheduling, and no email-to-post feature found.
  - **Ads and leads:** Facebook Custom Audiences, Google Ads Customer Match, and lead forms from Facebook and Instagram, LinkedIn,
    TikTok and Google.
  - **Messenger:** Facebook Messenger in its Conversations inbox (https://www.activecampaign.com/platform/social-advertising-audiences).
- **Consent:**
  - Imported contacts must already have opted in.
  - "We will automatically place an unsubscribe link in your emails".
  - Separate Consent and Anti-spam policies (https://www.activecampaign.com/legal/anti-spam-policy).
- **Pricing:** by contacts.
  - Plans: Starter, Plus, Pro, Enterprise.
  - The prices are filled in by script; third parties report Starter at $15 a month billed yearly (UNVERIFIED).
  - There is a 14-day trial and no free plan.
- **Presentation:**
  - Log-in is at `www.activecampaign.com/login`.
  - **Footer:** Privacy Policy, CCPA Opt-Out, Legal Center.
  - **The Legal Center holds:** DPA, sub-processors, Acceptable Use, Cookies, and its Facebook Messenger Terms.
- **Privacy and AI terms:** "Last Updated: October 1, 2026"; ActiveCampaign, LLC, Chicago.
  - Its privacy policy cites "Google's Limited Use Requirements".
  - Its Messenger terms require Facebook's Terms of Service, Commercial Terms, Platform Terms and Business Tools Terms
    (https://www.activecampaign.com/legal/conversations-facebook-messenger-terms).
  - "At this time, we do not use the data that you input … to train AI models" (search excerpt; its help center refused fetching).
- **Trust claims:** "GDPR, SOC 2, and HIPAA compliance" (https://www.activecampaign.com/security).

#### Brevo
- **What it is:** email, SMS and WhatsApp marketing, CRM and transactional messaging (https://www.brevo.com/).
- **Features:** email, SMS, WhatsApp, push, forms, landing pages, automation, sales pipelines, Conversations (chat, chatbot, inbox),
  loyalty, a data platform, and "Aura" AI agents. AI subprocessors: OpenAI, Google Gemini, Anthropic, Langfuse.
- **Social media:**
  - No organic scheduling.
  - "Social Share" posts a sent campaign to Facebook or X (search excerpt).
  - **Its inbox:** replies to Facebook Messenger and Instagram direct messages.
  - **Its Meta Ads integration:** syncs segments to custom audiences "across Facebook, Instagram, and Messenger", builds lookalike
    audiences and imports lead ads, on all plans (https://www.brevo.com/integrations/meta-business/).
- **Consent:**
  - Consent must be active and explicit, with a checkbox that is not pre-checked.
  - Customers must be able to prove each opt-in.
  - An unsubscribe link is mandatory, and purchased or scraped lists are banned (https://www.brevo.com/legal/antispampolicy/).
- **Pricing:** by emails sent a month, not by contacts. The free plan sends 300 emails a day. Starter is $9 a month, from 5,000
  emails (https://www.brevo.com/pricing/).
- **Presentation:**
  - `app.brevo.com`; sign-in is on `login.brevo.com`.
  - **Footer:** GDPR, Security, Platform status, Cookie Settings, Acceptable Use Policy, Privacy, Terms, Legal notice, Responsible
    Disclosure.
- **Privacy and AI terms:** the privacy policy shows no date; Brevo SAS, Paris.
  - **Terms §6.7** (version 1 October 2025): "Brevo may use Content and Usage Data to enrich and train its AI Features for the sole
    purpose of improving the performance of the Services". Third-party AI providers "only process your data to provide the AI
    Features".
  - **Platform terms named:** Facebook's Ads and Commercial Terms, the WhatsApp Business terms, and Google's "Limited Use"
    (https://www.brevo.com/legal/termsofuse/).
- **Trust claims:** ISO 27001:2022; GDPR, CASL and CCPA; B Corp.

#### GetResponse
- **What it is:** email marketing and automation (https://www.getresponse.com/).
- **Features:** email, autoresponders, automation, landing pages, a website builder, popups, webinars, courses, SMS, and an AI email
  and campaign generator "powered by OpenAI technology".
- **Social media:**
  - When a newsletter is sent, it posts to Facebook Pages and X automatically. The Facebook connection must be authorized again
    every 60 days.
  - "Create, buy, and manage Facebook ads right inside GetResponse", with Instagram placements, lookalike audiences and Pixel
    remarketing; and a Google Ads creator.
  - No organic post scheduler.
  - Sources: https://www.getresponse.com/help/how-can-i-post-twitter-and-facebook-updates-when-i-send-a-newsletter.html,
    https://www.getresponse.com/features/paid-ads/facebook-ads.
- **Consent:** confirmed opt-in is the default (it can be turned off); an unsubscribe link in every message, processed
  automatically; a consent-management feature (https://www.getresponse.com/legal/antispam).
- **Pricing:** by list size. Starter is $19 a month. There is a free plan and a 14-day premium trial
  (https://www.getresponse.com/pricing).
- **Presentation:**
  - `app.getresponse.com` → `/login` on the same host.
  - **Footer:** Privacy Policy, Anti-Spam Policy, Terms of Service, Accessibility statement, Reporting policy.
- **Privacy and AI terms:** effective 19 June 2026; GetResponse S.A., Gdańsk, Poland.
  - "The AI solutions we have selected ensure that the model does not learn from the content provided by the Customer", naming
    OpenAI and Azure OpenAI.
  - Its ads feature is governed by "Facebook's Terms of Service, Advertising Policies and Commercial Terms".
- **Trust claims:** PCI DSS; "fully compliant with the GDPR".

#### Mailchimp
- **What it is:** Intuit's email and marketing platform (https://mailchimp.com/).
- **Features:** email, SMS, automations, transactional email, forms, a campaign calendar, a content library, reports; AI as "Intuit
  Assist", with Microsoft and OpenAI listed as subprocessors.
- **Social media: yes.**
  - It publishes to Facebook Pages and Instagram business profiles; scheduling needs Standard or higher.
  - It can "automatically post to Facebook and Instagram when you send an email". Its marketing page also lists X.
  - Ads: Facebook and Instagram ad buying, Google remarketing ads, Meta custom audiences.
  - Sources: https://mailchimp.com/help/create-social-post/, https://mailchimp.com/solutions/social-media-marketing-tools/.
- **Consent:**
  - Customers must be able to show an opt-in.
  - Every marketing email needs Mailchimp's own unsubscribe link.
  - Purchased lists are banned, and double opt-in is available (https://mailchimp.com/legal/acceptable_use/).
- **Pricing:** by contacts. The free plan covers up to 250 contacts. Standard starts at $20 a month, with a 14-day trial.
  Essentials is about $13 according to third parties (UNVERIFIED) (https://mailchimp.com/pricing/marketing/).
- **Presentation:**
  - `admin.mailchimp.com` → `login.mailchimp.com`.
  - **Footer:** GDPR Compliance, Security, Status, Accessibility, Privacy (on intuit.com), Terms, Legal, Cookie Preferences.
- **Privacy and AI terms:** Intuit's statement, last updated 9 March 2026; Intuit Inc. and The Rocket Science Group LLC.
  - Terms §30: "We may use your Inputs and Outputs, including Customer Data, for machine learning purposes", with preferences in
    the account settings.
  - Its ads terms require Facebook's Advertising Policies, Terms of Service, Commercial Terms and Custom Audience Terms
    (https://mailchimp.com/legal/terms/, https://mailchimp.com/legal/additional-terms/).
- **Trust claims:** SOC 2 reports, ISO 27001, EU-U.S. Data Privacy Framework.

#### MailerLite
- **What it is:** email marketing (https://www.mailerlite.com/).
- **Features:** email, automations, sites, forms, digital products, and an AI writer, subject-line and image generator. Its AI
  Policy names OpenAI and Google (https://www.mailerlite.com/legal/ai-policy).
- **Social media:**
  - No social publishing.
  - After a campaign is sent: "Share on Facebook or Share on X".
  - Blocks that embed X, Facebook, Instagram and LinkedIn posts in emails.
  - Facebook Lead Ads and Facebook Audiences integrations.
- **Consent:**
  - The opt-in checkbox must not be pre-checked.
  - Every email needs a "single-click, clear and visible unsubscribe link".
  - Accounts can be suspended above 0.2% complaints (https://www.mailerlite.com/legal/anti-spam-policy).
- **Pricing:** by subscribers. The free plan covers 250 subscribers and 2,500 emails. Comfort starts at $12 a month and Power at
  $25 (https://www.mailerlite.com/pricing).
- **Presentation:**
  - `dashboard.mailerlite.com` → `accounts.mailerlite.com`.
  - **Footer:** Privacy, Terms, Trust Page, Cookies Settings, Status, Report abuse.
  - **The legal hub holds:** DPA, Anti-Spam Policy, AI Policy.
- **Privacy and AI terms:** last updated 14 October 2026; MailerLite Limited (Ireland) and MailerLite, Inc. (Delaware).
  "enterprise-grade agreements that ensure your data is not used to train the providers models".
- **Trust claims:** ISO 27001:2022, GDPR, EU-U.S. Data Privacy Framework.

#### Moosend
- **What it is:** email marketing and automation; "now a Constant Contact company" (https://moosend.com/).
- **Social media:** no social publishing. Its "Social AI" menu item goes to Constant Contact's own social tools; it has a Facebook
  Lead Ads integration.
- **Consent:**
  - Purchased lists are banned, and confirmed opt-in is offered.
  - Customers must keep unsubscribes at or below 1% and complaints at or below 0.1% (https://moosend.com/acceptable-use-policy/).
- **Pricing:** by contacts. Pro is $9 a month for 500 contacts, and there is a 30-day trial (https://moosend.com/pricing/).
- **Presentation:**
  - Sign-in at `identity.moosend.com`.
  - **Footer:** Trust Center, Acceptable Use Policy, Privacy, Terms, Vulnerability Disclosure.
- **Privacy and AI terms:** a PDF dated June 2025; Moosend Ltd, London. It "contractually restricts their use for training or
  improving AI models".
- **Trust claims:** ISO 27001; Certified Senders Alliance.

**AI content tools that make social media content**

#### AdCreative.ai
- **What it is:** an AI ad-creative generator from ADYOUNEED SAS (Paris), part of the Appier group
  (https://www.adcreative.ai/, https://www.adcreative.ai/legal/en/terms-of-service-for-online-subscribers).
- **Features:** ad images and copy; product and fashion photoshoots; UGC and product videos; iStock images; Creative Scoring (its own
  model); creative and competitor insights (https://www.adcreative.ai/ad-creatives).
- **Social media:** ads only.
  - It sizes creatives for "Meta, Google, LinkedIn" and can "push AI ad creatives directly" to those ad accounts.
  - Insights read performance from the connected ad accounts.
  - No organic posting or scheduling is stated.
  - Integrations: Meta, Google, LinkedIn, Pinterest and Microsoft Ads (https://www.adcreative.ai/creative-insights).
- **Pricing:** monthly credits, plus limits on brands and users. Starter is $39 a month month-to-month (20 credits, 1 brand). There is
  a 7-day free trial and no free plan (https://www.adcreative.ai/).
- **Presentation:**
  - `app.adcreative.ai/` serves an empty page shell (title blank, noindex); sign-in is at `auth.adcreative.ai`.
  - **Footer:** Terms, Privacy, Cookies, Legal Notice.
  - **Not present:** DPA, subprocessors, security, status, AI policy.
- **Privacy and AI terms:** the policy shows no last-updated date. Controller: ADYOUNEED SAS, France; data on AWS in Ireland; no AI
  provider named. It "uses anonymized user data for the purpose of improving and training its artificial intelligence systems"
  (https://www.adcreative.ai/privacy-policy).
- **Trust claims:**
  - "fully compliant with GDPR".
  - G2 badges.
  - An image file named google-premier-partner.
  - No SOC 2 or ISO claim.

#### Anyword
- **What it is:** AI copywriting with performance prediction, by Keywee Inc. d/b/a Anyword (https://www.anyword.com/).
- **Features:**
  - Copy generation and performance scores.
  - Brand voice and rules.
  - Blog Wizard, a Chrome extension and an API.
  - An MCP server for Claude, ChatGPT, Copilot and Gemini.
  - A private model on Enterprise. Its DPA lists Azure and Google Cloud for "AI models hosting"
    (https://www.anyword.com/pricing, https://www.anyword.com/anyword-dpa-agreement).
- **Social media:**
  - It writes posts for LinkedIn, Facebook, Twitter and Instagram.
  - Its LinkedIn Page, Facebook Page, Instagram and X integrations are tagged "Content Export" ("Push ready-to-use content
    directly into your … marketing channels").
  - No scheduling is stated (https://www.anyword.com/social-media, https://www.anyword.com/integrations).
- **Integrations:** Meta, Google, LinkedIn and X Ads; HubSpot, Marketo, Salesforce, Braze, Sprinklr. Not on its two lowest plans.
- **Pricing:** by seats and predictions. Starter is $49 a month, or $39 billed yearly. There is a 7-day free trial
  (https://www.anyword.com/pricing).
- **Presentation:**
  - `go.anyword.com/` serves the app's shell.
  - **Footer:** Privacy Policy, Terms of Use, DPA Agreement; Security is in the menu.
  - Subprocessors appear only in the DPA.
- **Privacy and AI terms:** updated 5 March 2026; Keywee Inc., New York, USA; no model vendor named.
  - The terms (5 June 2024) let content be "aggregated and anonymized" to "improve the Anyword Platform".
  - There is no explicit training clause (https://www.anyword.com/privacy-policy,
    https://www.anyword.com/anyword-terms-of-service).
- **Trust claims:** "Upholding SOC 2, ISO, and GDPR regulations", with no report type or standard number
  (https://www.anyword.com/security).

#### Castmagic
- **What it is:** turns audio and video recordings into transcripts and written content. Operator: Magic Studios LLC
  (https://www.castmagic.io/).
- **Features:** transcription in 60+ languages; show notes, blogs and newsletters; clips, audiograms and carousels; AI images; a
  content strategist and chat; brand voice; an API; a Claude MCP connector.
  - **AI providers named:** AssemblyAI and Deepgram for transcription; OpenAI, Anthropic, AWS Bedrock and Google Vertex AI for
    generation (https://www.castmagic.io/features, https://www.castmagic.io/privacy).
- **Social media:**
  - It drafts LinkedIn posts ("ready to paste"), X threads, Instagram captions, Reel and TikTok scripts, and vertical clips.
  - It imports from YouTube, TikTok, Instagram and X.
  - No publishing, scheduling or social analytics.
- **Integrations:** Zoom, Google Drive, Loom, Zapier, RSS, API.
- **Pricing:** by hours of recordings in the library, plus seats. Hobby is $29 a month, or $19 billed yearly (30 hours). No free
  plan or trial stated (https://www.castmagic.io/pricing).
- **Presentation:**
  - `app.castmagic.io/` → `/users/sign-in` on the same host: magic link, Google, Apple or email.
  - **Footer:** Privacy, Terms, Affiliate Terms only.
- **Privacy and AI terms:** updated 27 October 2026; Magic Studios LLC, Henderson, Nevada, USA. Its AI providers: "none may use your
  data to train its models" (https://www.castmagic.io/privacy).
- **Trust claims:** none shown.


#### Frase
- **What it is:** an SEO and AI-search content platform, "wholly owned by Copysmith AI, Inc." Copysmith also owns Rytr
  (https://www.frase.io/, https://www.frase.io/company/privacy, https://trust.copysmith.ai/).
- **Features:** research; an agent that can publish to the customer's website; SEO and AI-search scoring; tracking of visibility
  in ChatGPT, Perplexity, Claude and Gemini; site audit; FraseCMS; MCP; API (https://www.frase.io/pricing).
- **Social media:**
  - It turns an article into LinkedIn and Instagram carousels, an X thread and a newsletter, to "export for your scheduler".
  - "Nothing posts itself." Professional plan and up (https://www.frase.io/features/content-atomization).
- **Integrations:** WordPress, Webflow, Sanity, Wix; Search Console and Google Analytics (read-only); Notion, Slack, Zapier, Make,
  n8n.
- **Pricing:** seats, sites and articles. Starter is $49 a month, or $39 billed yearly. There is a 7-day free trial with no card.
- **Presentation:**
  - The app at `next.frase.io` shows a sign-up page on `signin-next.frase.io`.
  - **Footer:** Security, Terms, Privacy, llms.txt, and SOC 2 and GDPR badges.
- **Privacy and AI terms:** updated 20 September 2026; Copysmith AI, Inc., Birmingham, Alabama, USA. Frase "does not use Customer
  Data … to develop, improve, or train generalized AI and/or machine learning (ML) models."
- **Trust claims:** "SOC 2 Type II attested and GDPR compliant". Copysmith's trust center lists SOC 2 Type 2 and SOC 3
  (https://www.frase.io/security).

#### ImagineArt
- **What it is:** an AI image, video and audio workspace for brands, from Vyro (https://www.imagine.art/).
- **Features:** 50+ models (Kling, Nano Banana, GPT Image, Runway and others); editing; Ad, Fashion and Film studios; AI Influencer;
  workflows; brand kits.
- **Social media:**
  - A Carousel Maker for social media carousels.
  - An Auto Clipper that makes clips "ready for YouTube Shorts, Instagram Reels, and TikTok".
  - No account connection, publishing or analytics (https://docs.imagine.art/llms.txt).
- **Integrations:** Photoshop, Premiere Pro, After Effects, Figma, Framer, Shopify, MCP.
- **Pricing:** credits.
  - Free plan: 100 credits a day, no video.
  - Basic: $13 a month, or $9 billed yearly (3,000 credits).
  - Source: the help center, https://docs.imagine.art/account/subscription-plans.
- **Presentation:**
  - The app runs on `www.imagine.art`, and the marketing pages are on the same site.
  - The marketing footer has no privacy or terms link: only cookie preferences, and SOC 2 and GDPR badges linking a trust center
    that needs JavaScript (UNVERIFIED).
- **Privacy and AI terms:** updated 8 September 2026; Vyro Turkey Teknoloji Limited Sirketi, Istanbul (its terms use Delaware
  law). It names Stability AI, OpenAI, Seedance, Veo, Kling, LTX and Wan. Training is opt-in: "By default, ImagineArt will not use
  your personal content for AI model training without your consent" (https://www.imagine.art/privacy-policy).
- **Trust claims:** SOC 2 Type II and GDPR; ISO 27001 and ISO 42001 "currently in progress".

#### Jasper
- **What it is:** an AI agent platform for enterprise marketing teams ("Put AI agents to work for marketing") (https://www.jasper.ai/).
- **Features:** Canvas workspace, agent library, Studio (custom agents), Grid, Jasper IQ (brand voice and knowledge), tracking of
  visibility in AI search, API and MCP. Its subprocessor list names Anthropic, Cohere, Google Gemini and OpenAI as LLM providers
  (https://www.jasper.ai/legal/sub-processors).
- **Social media:** writes copy only.
  - Agents: Social Media Posts (Facebook, X, Instagram, LinkedIn), Social Media Ad, LinkedIn Ad, Ad Campaign (Meta, Google, X).
  - No publishing, scheduling or analytics: the output is copy "you can move directly into your preferred scheduling or
    publishing workflow" (https://www.jasper.ai/agents/organic-social-media-posts).
- **Integrations:** Webflow, Salesforce (beta), Zapier, Make, Semrush, Slack, Google Docs and Sheets, Word, Chrome extension
  (https://www.jasper.ai/integrations).
- **Pricing:** per seat. Pro is $69 a seat a month, or $59 billed yearly; Business is custom. There is a 7-day free trial and no
  free plan (https://www.jasper.ai/pricing).
- **Presentation:**
  - `app.jasper.ai` serves the app's shell.
  - **Footer:** Privacy, Terms, Legal Center, Trust Foundation, Security, Governance, Compliance, Ethics.
  - **The Legal Center adds:** DPA, Sub-Processors, Cookie Policy (https://www.jasper.ai/legal).
- **Privacy and AI terms:** "Version 2 Effective May 30, 2025"; Jasper AI, Inc. (Delaware), Rollingwood, Texas. The trust page
  says: "Your company data and outputs are never used to train third-party LLMs" (https://www.jasper.ai/trust).
- **Trust claims:** "compliant with SOC 2, PCI, DPA, CCPA, and GDPR".

#### Marpipe
- **What it is:** a creative and feed platform for catalog ads (dynamic product ads) (https://www.marpipe.com/).
- **Features:** Catalog Creative, Product Level Video, Generative Catalogs (AI text and images), SKU Optimization, Feed
  Management. Its pricing FAQ says the ads are "not AI-generated, but they are automated".
- **Social media:** paid catalog ads only.
  - "Push your feed to Meta, Google, TikTok, Pinterest and Snapchat".
  - No organic posting, scheduling or social analytics.
  - Meta helps pay for its Enterprise plan through the "Meta Catalog Accelerator"
    (https://www.marpipe.com/meta-catalog-accelerator).
- **Pricing:** per month plus per SKU.
  - Free: $0.
  - Startup: $199 a month.
  - Enterprise: $999 a month.
  - Source: https://www.marpipe.com/pricing.
- **Presentation:**
  - `app.marpipe.com` serves the app's shell.
  - **Footer:** Security (Vanta trust center, UNVERIFIED), Privacy, Terms, Master Subscription Agreement.
- **Privacy and AI terms:** effective 24 October 2024; Marpipe, Inc., New York.
  - Its Master Subscription Agreement says Marpipe "may use the Customer Data for ... model training" (§5.4).
  - Third-party AI services "shall not use the Customer Data for any training purposes" (§7.1) (https://www.marpipe.com/msa).

#### Rytr
- **What it is:** now an "AI Relationship Manager & Follow-Up Assistant" (Engage), with AI writing as a second product (Create)
  (https://rytr.me/).
- **Social media:**
  - Create drafts "Social: Posts and captions" and "LinkedIn post".
  - On LinkedIn pages, its browser extension lists the people shown and drafts replies.
  - No publishing, scheduling or analytics (https://rytr.me/products/create).
- **Pricing:** Free forever (10,000 characters a month); Lite $9 a month; Personal $19; Pro $49 (https://rytr.me/pricing).
- **Presentation:**
  - `app.rytr.me` → a sign-in page on the same host.
  - **Footer:** Security, Privacy Policy, Terms of Use only.
- **Privacy and AI terms:** no date shown. The terms say Rytr LLC (Wyoming) and the footer says "Rytr, Inc.". The AI providers are
  not named; the only training statement covers Slack data. Rytr is owned by Copysmith, like Frase.
- **Trust claims:** none: "We list only controls we've built and tested, and no certifications we haven't earned."

#### Scalenut
- **What it is:** an SEO and AI-search content platform plus a managed service (https://www.scalenut.com/).
- **Social media:**
  - **Social UpReach** (Plus and Professional) monitors Reddit for brand and competitor threads and sentiment, and offers
    "AI-generated responses to reply to potential threads". The page does not say whether it posts replies or connects a Reddit
    account (https://www.scalenut.com/products/social-upreach).
  - Copy templates exist for social posts, Facebook and LinkedIn ads, copied to the clipboard. No publishing.
- **Pricing:** per plan. Starter is $59 a month, with a 7-day trial; Plus $89; Professional $199 (https://www.scalenut.com/pricing).
- **Presentation:** `app.scalenut.com` serves the app's shell. The footer has Terms and Privacy only, and reads "© Scalenut 2023".
- **Privacy and AI terms:** "Last updated November 2020"; Scalenut Technologies Private Limited, Gurugram, India. No AI provider
  named; training not addressed.
- **Trust claims:** none shown.

#### Writesonic
- **What it is:** "The AI search visibility platform for GEO and AEO", from Writesonic, Inc. (https://writesonic.com/).
- **Features:** visibility tracking across 8 AI platforms; an Action Center; agents that rewrite pages and do outreach; an AI
  article writer; crawler audits; MCP and API. Model providers in its privacy policy: OpenAI, Azure OpenAI, Anthropic (through
  Azure), Stability AI, OpenRouter, Google Cloud, and its own models.
- **Social media:**
  - **LinkedIn:** reads trending and competitor posts, and claims "Schedule and publish posts straight from Writesonic".
  - **YouTube:** "Upload a new video straight to your YouTube channel".
  - **Reddit:** drafts replies to threads.
  - The pages do not say how accounts connect. Its separate social product, Socialsonic, is being retired in 2026
    (https://writesonic.com/integrations/linkedin, https://writesonic.com/integrations/youtube).
- **Pricing:** per plan with included users. Starter is $79 a month billed yearly; there is a 7-day free trial with no card
  (https://writesonic.com/pricing).
- **Presentation:**
  - `app.writesonic.com` serves the app's shell.
  - **Footer:** Status, Terms, Privacy, DPA, Security (a trust site), and "AI Instructions" (a page of facts for AI assistants).
- **Privacy and AI terms:** "Last updated May 13, 2026"; Writesonic, Inc. (San Francisco and Wilmington, Delaware). "We do not use
  Customer Data to train or fine-tune any general-purpose, foundation, or large-language model", but it "may use de-identified
  Inputs, Outputs, and Usage Data" (https://writesonic.com/legal/privacy-policy).
- **Trust claims:** SOC 2 Type II, GDPR and HIPAA (trust center); G2 badges; Microsoft partner.

**AI content tools with no social media feature stated**

#### Copy.ai
- **No social media features stated.** "Social" appears only as a content type; it connects no social account and offers no
  posting or analytics (https://www.copy.ai/use-cases/content-creation). It describes itself as a "GTM AI platform" for sales and
  marketing workflows, and its Chat plan gives "Access to OpenAI, Anthropic, and Gemini models" (https://www.copy.ai/prices).
  Its terms (12 October 2023) say "Copy.AI's licensor, OpenAI LLC, exclusively owns all right, title and interest in and to
  Generated Content", while its security page says "We don't train on your data" (https://www.copy.ai/terms-of-service,
  https://www.copy.ai/security).

#### Koala
- **No social media features stated.** Koala (koala.sh, F5 Media, LLC, Gainesville, Florida) is an AI SEO article writer and agent
  that publishes to WordPress, Shopify, Webflow and Ghost. It lists no social-post feature (https://koala.sh/features). Its privacy
  notice (last updated 15 November 2026) names only "AI Model Providers" as a category and does not address training
  (https://koala.sh/pages/privacy-policy).

#### HyperWrite and MarketMuse
- **No social publishing stated by either.**
- **HyperWrite** (OthersideAI, Inc.) is an AI writing assistant and browser agent.
  - It has text generators for LinkedIn posts and tweet threads, but connects no social account (https://www.hyperwriteai.com/aitools).
  - Its terms (26 May 2023) let it use usage data, including "email content", "to train its machine learning algorithms
    applicable to its general user base", with an opt-out by email (https://www.hyperwriteai.com/terms).
- **MarketMuse** is now part of Siteimprove: `www.marketmuse.com` redirects to https://www.siteimprove.com/marketmuse/.
  - Its content planning lives inside Siteimprove's Content Strategy agents.
  - Its AI features are "powered by third-party service providers, including OpenAI … and Amazon (provider of Bedrock)"
    (https://www.siteimprove.com/legal/master-subscription-agreement/).

## Not checked

- Sign-in pages built in the browser (all but Hootsuite's and Loomly's): whether they link the privacy policy and terms.
- How any vendor filled in its Meta App Dashboard (Site URL, data deletion URL, reviewer instructions): not public.
- Trust centers that are built in the browser (Later, Copy.ai, ImagineArt, Marpipe) or gated behind a request form.
- **ManyChat:** manychat.com and its help center refused automated reading (a Cloudflare challenge). The homepage and privacy
  policy come from Wayback Machine copies dated 2026-11-17, and its other pages from search excerpts, marked in its block.
- **Search excerpts:** ActiveCampaign's and Brevo's help centers also refused automated reading; their points from search
  excerpts are marked.
- **Script-filled prices:** ActiveCampaign's prices and Mailchimp's Essentials price are filled in by script; the figures given are
  third-party and marked UNVERIFIED.

## Sources (read 2026-11-19)

Homepages: https://www.hootsuite.com/ · https://sproutsocial.com/ · https://buffer.com/ · https://later.com/ ·
https://www.agorapulse.com/ · https://metricool.com/ · https://publer.com/ · https://socialbee.com/ · https://www.socialpilot.co/ ·
https://www.sendible.com/ · https://planable.io/ · https://www.loomly.com/ · https://vistasocial.com/ · https://statusbrew.com/ ·
https://meetedgar.com/ · https://contentstudio.io/

Privacy policies: https://www.hootsuite.com/legal/privacy · https://sproutsocial.com/legal/privacy-policy/ · https://buffer.com/legal ·
https://later.com/privacy/ · https://www.agorapulse.com/privacy-policy/ · https://metricool.com/privacy-policy/ ·
https://publer.com/privacy · https://socialbee.com/privacy-policy/ · https://www.socialpilot.co/privacy-policy ·
https://www.sendible.com/privacy · https://planable.io/privacy/ · https://www.loomly.com/privacy/en · https://vistasocial.com/privacy/ ·
https://statusbrew.com/privacy-policy · https://meetedgar.com/privacy-policy · https://contentstudio.io/privacy-policy

Legal, trust and security pages: https://hootsuite.com/legal · https://hootsuite.com/legal/subprocessor-list ·
https://trustcenter.hootsuite.com/ · https://sproutsocial.com/trust-center/ · https://www.agorapulse.com/trust-center/ ·
https://publer.com/trust-center · https://www.socialpilot.co/trust-center · https://vistasocial.com/trust-center/ ·
https://statusbrew.com/security · https://statusbrew.com/legal/data-deletion · https://www.loomly.com/security ·
https://contentstudio.io/security

Sign-in and app hosts: https://hootsuite.com/login · https://hootsuite.com/dashboard · https://app.sproutsocial.com/ ·
https://login.buffer.com/login · https://publish.buffer.com/ · https://app.later.com/ · https://app.agorapulse.com/ ·
https://app.metricool.com/ · https://app.publer.com/ · https://app.socialbee.com/ · https://auth.socialpilot.co/login ·
https://app.sendible.com/ · https://app.planable.io/login · https://app.loomly.com/ · https://vistasocial.com/login ·
https://space.statusbrew.com/login · https://app.meetedgar.com/ · https://app.contentstudio.io/login

GeekSocial: `src/proxy.ts`, `src/app/robots.ts` on `main` (`299c767`); `src/app/privacy/page.tsx` and `src/lib/legal.ts` on
`legal-pages` (`9aa80c4`).
