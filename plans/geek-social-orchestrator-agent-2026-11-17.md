# Plan: make the GeekSocial Orchestrator an LLM-driven agent

Status: proposed, not approved. Revised twice on 2026-11-18, the second time after an AI review. Nothing in it is
built. Owner decisions D1 to D3 are open. All code work is in `GeekBackend`; whether the `geek-social` screen
changes depends on D1 and D2.

## Revision history

**Second revision, after the AI review (2026-11-18).**
- The agent's last step is now a proposal, not a write. One deterministic commit checks it and writes the draft
  and the comment's outcome in a single conditional store operation, so a malformed or doubled answer can no
  longer half-decide a comment, and a crash cannot leave a draft without an outcome. (Review findings 2, 7, 11.)
- `redraft_reply` runs the Reviewer on the new text; a handle binds one text to its own review. (3)
- A failed run now records the comment as `failed`, visible on the Comments screen with Run again, as agent
  failures are recorded today, instead of leaving it waiting with nothing to wake it. (6)
- Auto-send is removed from the agent path, because `PLATFORM-CAPABILITIES.md` section 1a requires a person to
  approve every reply; checked that a person's Approve is then the only route to a send. D1 is now only about when
  the setting is removed. (1)
- Corrected: separate runs do not stop other comments' text from reaching a decision, because `get_thread`
  brings it in on purpose. The plan now says what a hostile neighbour can and cannot do. (5)
- Every model and tool call per run has a budget; the Reviewer is plain code and makes no model call. (9)
- Concurrent runs on one comment (background, run again, two deployed versions) are settled by the conditional
  commit. (8)
- What "batch" means is now part of D3. (4)
- Failure records, mixed-version behaviour and the tests for all of the above are specified. (10)

**First revision (2026-11-18).** Corrected the test count (51, not 47) and the store reads; made Triage optional;
separated ordering from deciding; added wake-loop, crash, rerun, cost, status and rollback behaviour.

## Context

The GeekSocial Orchestrator (`GeekBackend/GeekAPI/Services/Social/Orchestration/SocialOrchestrator.cs`, 491 lines) is
plain code: `HandleAsync` runs one fixed sequence for each comment (load, gates, Triage, Drafter, Reviewer, store the
draft, record the outcome, auto-send). It makes no model call, and two tests enforce that:
`SocialAgentSeparationTests.The_orchestrator_takes_no_model_and_no_platform` and
`SocialOrchestratorTests.The_orchestrator_takes_no_agent_model_or_platform_in_its_constructor`.

The owner expects the Orchestrator to be an agent, as is usual, and said so in the 2026-11-17 session. In that
session they chose these four decisions for it to make, which the fixed sequence cannot:
1. Choose which agents to call for a comment.
2. Order and batch waiting work.
3. Re-draft after a Reviewer refusal.
4. Use the thread's other comments.

`plans/geek-social-engagement-agent-2026-11-08.md` says the orchestrator is plain code, under a "Jeff, 2026-11-09"
attribution. The owner has said that record is bogus, so nothing in it is treated as their decision. Every
constraint below is something the owner said in that session, a rule in the existing code, tests or documents, or a
proposal that is marked as one.

## Findings that shape the design (checked against the code on 2026-11-18)

- The send guardrails live in `SocialSendStep`, `SocialSender`, the repository and the database: the 30 replies per
  account per hour limit and the 15-minute cooldown (`SocialSendStep.CheckLimitsAsync`), the Reviewer re-check
  before every send, the pause and reconnect checks, one attempt and one audit row per send (`SocialSender`),
  compare-and-set draft transitions, and the unique index `ux_reply_drafts_one_answer_per_event` (which does not
  cover refused drafts).
- **Routes to a send.** `SendAsync` sends only an `approved` draft. Exactly two places move a draft to `approved`:
  `SocialSendStep.AutoSendAsync` (`SocialSendStep.cs:128`, no person) and `SocialOperatorActions.ApproveAsync`
  (`SocialOperatorActions.cs:122`, which takes the approving user's id). The orchestrator's step 7
  (`SocialOrchestrator.cs:419-421`) is the only caller of `AutoSendAsync`.
- `GeekBackend/docs/PLATFORM-CAPABILITIES.md` section 1a says a person approves every reply and post. Auto-send
  contradicts it.
- The model client makes one call with one forced tool (`ClaudeSocialModelClient.CallToolAsync`). Its message type
  carries a string, so it cannot carry `tool_use` or `tool_result` blocks, and there is no multi-turn tool loop
  anywhere in GeekBackend. A new client contract is required.
- Store: GeekAPI reaches it through `HttpSocialRepository` (HTTP to GeekRepository, which owns `SocialRepository`).
  `ListEventsAsync(tenantId, TriageOutcomes.Untriaged, accountId, limit)` is the per-tenant waiting list, oldest
  first; `ListUntriagedEventsAsync` spans every tenant (startup recovery only). There is no read for the other
  comments on one post, and no operation that writes a draft and an outcome together.
- `RecordTriageOutcomeAsync` lands only on an undecided or re-runnable comment (`failed`, `blocked_no_clearance`);
  a decided one answers conflict. Agent failures are recorded today as `failed` with the agent's code, and the
  operator re-runs them from the Comments screen.
- `SocialWake` is a single-reader channel; `ExecuteAsync` handles one wake at a time. `RerunAsync` is called from a
  web request (`SocialController.cs:280`), outside that loop, and the request waits for the outcome.
- Triage reads only its own comment and post (`TriageRequest`: comment text, post text, author name) and returns a
  category from `ReplyCategories` (question, praise, complaint, spam, sensitive), whether a reply is needed, and a
  free-text reason when a person must write the reply. `OutboundTextReviewer` is plain code with no model call.
- Failures reach the Activity screen as `SocialStepFailure(Step, Code, At)` through
  `SocialOrchestratorStatus.RecordFailure`.
- Not built, despite the 2026-11-08 plan: a per-thread cooldown (the cooldown is per account). Out of scope here.

## Design

### Parts

| Part | Plain code or model | Job |
|---|---|---|
| `SocialOrchestrator` (existing `BackgroundService`) | plain code | Wake, startup recovery, purge, send-waiting, the hard gates. Hands a tenant's waiting comments to the agent. |
| `SocialOrchestratorAgent` (new) | model | The ordering call for a tenant's waiting comments, and the decision run for one comment. Ends a run with a proposal. |
| `SocialOrchestratorTools` (new) | plain code | Runs the agent's non-final tools: tenant-bound, every argument validated. |
| `SocialDecisionCommit` (new) | plain code | Checks a proposal and writes the outcome in one conditional store operation. The only part that decides a comment. |

### Hard gates stay in code, before the model sees anything

Existing rules; the model never decides them and never sees a comment that fails them:
- Only `comment_created` events; already-decided events skipped; text gone (past retention) recorded `failed/invalid_request`.
- The account's own comments recorded `no_reply_needed`.
- Tenant AI consent (`AiConsentAcceptedAt is null` gives `blocked_no_clearance`).
- Platform clearance (`SocialClaudeClearance`): an uncleared platform gives `blocked_no_clearance` before any model
  call, including the agent's own calls.

### Ordering and batching (owner decision 2; see D3)

- On a wake, the shell reads that tenant's waiting comments (`ListEventsAsync` with `Untriaged`, batch size
  proposed 10). With one comment there is nothing to order and no ordering call.
- With more than one, one ordering call (single forced tool, the existing `CallToolAsync` shape) receives, per
  comment: id, account, platform, post id, age, and how many other waiting comments share its post. No comment text.
  It returns the ids in the order to handle them, grouped by post.
- The answer must be exactly the ids it was given, each once. Anything else is `model_failed`, and every comment in
  that batch is recorded `failed/model_failed` through the commit, visible with Run again. It does not fall back
  to oldest first (a backup path), and it does not leave the batch waiting with nothing to wake it.
- Each comment then gets its own decision run, in that order. A comment decided in this pass is skipped when its own
  wake arrives (`HandleAsync` already skips decided comments).

### The decision run for one comment (owner decisions 1, 3 and 4)

The run starts with that one comment, its post's text and its account, as data in a labelled block with the same
"untrusted" instruction Triage uses.

**Tools that do work** (run by `SocialOrchestratorTools`):

| Tool | Does | Limit per run (proposed) |
|---|---|---|
| `get_thread()` | Other comments on the same tenant, account, platform and post, newest first, each in its own labelled untrusted block; text past retention never returned. Needs a new store read. | 1 call, 20 comments |
| `triage_comment()` | Calls `IEngagementTriage` for this comment. Triage reads only this comment and its post, never the thread. | 1 |
| `draft_reply(category)` | Calls `IReplyDrafter`, then `IOutboundTextReviewer` on that exact text. `category` is a `ReplyCategories` value: Triage's, or the agent's own if it skipped Triage. Returns a handle. | 1 |
| `redraft_reply(handle)` | Calls the Drafter again with that handle's broken rule codes (codes only), then the Reviewer on the new text. Returns a new handle. | 2 |

A handle is an immutable record held in the run: the exact text, the category, that text's own Reviewer result
(passed, or the broken rules) and the attempt number. The model sees only the handle's id and the review result,
never a way to change the text.

**Proposals** (the run's last step; nothing is written when the agent makes one):

| Proposal | Means | Needs Triage's verdict? |
|---|---|---|
| `propose_draft(handle)` | Store this handle's text: `pending` if its review passed, `refused` (rejected, with the rules) if not. | no |
| `propose_escalation(reason?)` | A person writes the reply. The reason is Triage's when Triage gave one; otherwise the agent's, validated as Triage's is (non-empty, length cap). | no |
| `propose_no_reply()` | No reply is needed. | **yes: Triage ran in this run and said no reply is needed** |

The rule behind the last column: an outcome that puts a comment in front of a person (a draft or an escalation) may
skip Triage, because a person reads it before anything happens. An outcome that takes a comment out of a person's
view needs Triage's own verdict, and Triage reads only this comment and its post, so neither the agent nor a hostile
comment in the thread can dismiss it. This is the plan author's proposal.

What "choose which agents to call" then means: Triage is optional before a draft or an escalation; the Drafter is not
called when the outcome is an escalation or no reply; the Reviewer runs on every drafted text and is never optional;
`get_thread` is the agent's choice.

There is no send, approve, publish or react tool, and no proposal leads to a send. Draft transitions after the
commit stay with `SocialSendStep` and `SocialOperatorActions`.

### Every response is checked before anything in it runs

- Each assistant response is validated whole first: every tool name known, every argument valid, every limit above
  respected, and a proposal, if any, is the only tool call in its response. If any check fails, nothing in that
  response runs and the run fails as below.
- The first valid proposal ends the run. Text the model writes outside tool calls is ignored: not stored, not logged,
  never shown.

### The commit (`SocialDecisionCommit`)

- Checks the proposal against the run: the tenant and comment are the run's own; the handle was made in this run;
  the handle's text is the text its review was made on; Triage's verdict is present for no reply.
- Writes the outcome, and the draft if there is one, in **one store operation** that succeeds only while the
  comment is undecided or re-runnable. New: `ISocialStore.DecideEventAsync`, one transaction in `SocialRepository`,
  exposed by GeekRepository and called through `HttpSocialRepository`.
- A conflict means another run decided this comment first (the background loop, a run again, or a second deployed
  version during a deploy). This run's result is discarded and logged; it is not an error for the operator.
- Because draft and outcome are written together, the crash windows of today's code (a draft without an outcome, or
  a second refused draft on re-run) cannot occur.

### Failures (fail loud, no fallback)

- A run that fails (a model call failing, `not_configured`, an unknown tool, malformed arguments, a stop reason of
  `refusal` or `max_tokens`, a limit or the time limit hit, a commit check failing) is committed as `failed` with
  its code through the same conditional operation, as agent failures are recorded today. The comment appears on the
  Comments screen's Failed tab with Run again, and a `SocialStepFailure` (step "decide a comment" or "order waiting
  comments", the code, the time; never the comment's text) appears on the Activity screen. `clearance_required`
  is committed as `blocked_no_clearance`, as today.
- A cancelled run (service shutdown, or a run again whose request was dropped) commits nothing, and the comment
  stays as it was: waiting comments are found by startup recovery, which is what follows a shutdown.
- A comment is left waiting only while it has not been handled. Each stored comment arrives with its own wake, so
  only a shutdown loses wakes, and startup recovery covers that. Failed comments are no longer waiting, so a failing
  comment cannot hold the head of every later batch.
- The old fixed sequence is deleted, not kept as a backup path. One model request is one attempt, never retried. A
  re-draft is a decision the owner chose, bounded and visible, not a transport retry.
- Cancellation passes through every tool, store call and `LlmConcurrencyGate` wait.
- The wake channel stays. No timer, no polling.

### What a hostile comment can and cannot do

- Its own decision run: it can steer its own draft's content, category or escalation, all of which a person reads
  before anything is posted. It cannot get its own comment dismissed without Triage agreeing on that comment alone.
- Another comment's decision run, through `get_thread`: the same reach, which is intended, since the owner chose to
  use thread context. It cannot dismiss the other comment, cannot reach another post, account or tenant, and cannot
  send anything.
- The ordering call never sees comment text.

### Operational behaviour

- **Wake loop.** The single reader stays: one decision run at a time for background work. A burst delays later
  comments by roughly one run each. Per run (proposed): 8 model turns, 12 tool calls, 1,000 output tokens per turn,
  60 seconds wall clock including waits at `LlmConcurrencyGate`. Fair turns between tenants are not designed here.
- **Cost per comment** (upper bound): 8 orchestrator turns, 1 Triage call, 3 Drafter calls; plus 1 ordering call per
  batch. The Reviewer makes no model call.
- **Configuration.** The agent uses the existing `LlmProviders__Anthropic__*` settings. A missing key or model fails
  each run `not_configured`, recorded and visible as above, as the other agents do today.
- **Status.** Failures use the existing `SocialStepFailure` list, so the Activity screen shows them with no screen
  change. New counters (runs, re-drafts, limit hits) are optional and would need a screen change.
- **Deploy and rollback.** During a deploy an old and a new version may both run; the conditional commit lets only
  one decide each comment (today's code already answers conflict on a decided comment). Rollback is revert and
  redeploy; comments the new version decided are ordinary outcomes and drafts. There is no switch back to the old
  sequence (that would be a backup path); a switch that only pauses agent work is listed under "Not in this plan".

## Owner decisions needed before build

- **D1. When auto-send is removed from the product.** The agent path never calls `AutoSendAsync` (required by
  section 1a; see Findings). Open: (a) in this same change, remove `AutoSendAsync`, `IsAutoSendable`, the accounts'
  `AutoSendCategories` and the Accounts screen's auto-send setting; or (b) leave them for a later change, in which
  case the Accounts screen setting does nothing and must at least say so, or it misleads. (b) still needs a
  `geek-social` change.
- **D2. Run again.** (a) Synchronous: the request runs the decision itself, outside the wake loop, up to the
  60-second limit; dropping the request before the commit changes nothing; it uses a model slot alongside the
  background loop; no screen change. (b) Asynchronous: the request reopens the comment (a new conditional store
  operation from `failed` or `blocked_no_clearance` back to waiting) and wakes the orchestrator, then returns at
  once. The reopened comment is durable, so a restart's recovery still handles it, and the Comments screen learns
  the result from `commentChanged` and from re-reading after every reconnect. Needs the new store operation, a new
  endpoint contract and a `geek-social` Comments screen change.
- **D3. What ordering and batching mean.** As designed: the agent orders a tenant's waiting comments and groups them
  by post, without their text. Not offered: leaving some comments for later, because with no timer nothing would
  wake a deferred comment again. Options: (a) as designed; (b) the ordering call also sees content (text or Triage
  categories) so it can put complaints first, at the cost that every comment in a batch can influence the order, and
  categories mean a Triage call per comment before ordering, which removes the freedom to skip Triage; (c) "batch"
  means one decision run covering several comments on one post (for example one answer to a repeated question),
  which puts several comments' text in one run and needs its own design.

## Steps

1. **Loop client.** In `GeekApplication/Interfaces/Social/SocialInterfaces.cs` add `ISocialToolLoopClient.StepAsync`
   returning assistant blocks (`text` / `tool_use`) and a stop reason, with content-block message types. New
   `LanguageModel/ClaudeToolLoopClient.cs` reusing `ClaudeSocialModelClient`'s settings, log redaction (never the
   prompt, comment or answer), `LlmConcurrencyGate` and clearance. Register in `SocialServiceRegistration.cs`.
2. **Store.** Through GeekRepository (the only data plane) and `HttpSocialRepository`: a bounded, tenant-scoped read
   of the other comments on one post; `DecideEventAsync` (outcome and optional draft in one transaction,
   conditional on undecided or re-runnable); for D2(b), the reopen operation.
3. **Tools and commit.** `Orchestration/SocialOrchestratorTools.cs` and `Orchestration/SocialDecisionCommit.cs`, with
   the per-run object holding the comment, handles, counts and Triage's verdict.
4. **Agent.** `Orchestration/SocialOrchestratorAgent.cs`: the ordering call, the decision run with its system prompt
   (what it may decide, that it ends with exactly one proposal), whole-response validation, limits and time limit.
5. **Rewire.** `SocialOrchestrator`: keep the gates (steps 1 to 3b of `HandleAsync`), read the tenant's waiting
   comments, order them, run one decision per comment, commit; delete the fixed Triage / Drafter / Reviewer sequence
   and the step 7 auto-send call. `RecoverAsync`, `TakeInAsync` and `RerunAsync` use the same path; `RerunAsync`
   per D2. D1's removals per D1.
6. **Tests** (`GeekBackend.Tests/Social/`), against fakes, no real model calls:
   - Update the two tests that forbid a model in the orchestrator. New rules: only `SocialOrchestratorAgent` takes
     the loop client; only the three agents and the ordering call use `ISocialModelClient`; only
     `SocialOrchestratorTools` takes agent contracts; only `SocialDecisionCommit` writes outcomes; nothing in
     Orchestration takes a platform, writer or `SocialSender`; no agent takes another.
   - New `SocialOrchestratorAgentTests` with a scripted loop client: a normal reply; a draft without Triage; an
     escalation without Triage; no reply refused without Triage's verdict; a thread read; a refusal then a passing
     re-draft, with the Reviewer called on each text; refusal after the cap stored `refused`; a handle from another
     run, or text that does not match its review, refused at commit; a response with two proposals, or a proposal
     beside another tool call, rejected before any tool in it runs; unknown tool and bad arguments; each limit and the
     time limit committing `failed`; cancellation committing nothing; a hostile thread neighbour unable to dismiss
     the comment or reach another post; the ordering call receiving no text; a wrong ordering answer failing the
     batch; no auto-send after a stored draft.
   - Commit tests: a second commit on a decided comment is a conflict and is discarded; run again racing the
     background loop decides once.
   - Keep the existing 51 orchestrator tests that cover gates, recovery and outcomes; port the ones that assert the
     fixed order.
   - `DecideEventAsync`'s transaction in `GeekBackend.IntegrationTests`, which run where `TEST_DATABASE_URL` is set.
     No local Postgres is installed to run them.
7. **Docs.** Update `plans/geek-social-engagement-agent-2026-11-08.md` (Orchestrator row and bullet, and the bogus
   attribution wording), `GeekBackend/docs` where the orchestrator and auto-send are described, and this repo's
   `HANDOFF.md`. `GeekBackend/AGENTS.md` is gitignored and is not edited by this plan.

## Verification

- `dotnet build` and `dotnet test GeekBackend.Tests --filter Social` pass, including the new and updated tests.
- Each guard test fails when its guard is removed (the re-draft cap, the handle check, the Reviewer call in each
  drafting tool, the Triage requirement on no reply, the whole-response check, the no-text rule on the ordering
  call, the conditional commit).
- Fakes do not prove real behaviour. The live check is the owner's, on the deployed GeekAPI with the test Facebook
  Page and a real Anthropic key: post a question, a complaint, a repeat of an earlier question and a hostile
  comment; watch the Inbox, Comments and Activity screens; confirm every outcome is visible and nothing is sent
  without a person pressing Approve. No local Postgres or Docker is installed or started to substitute for this.

## Not in this plan

- A setting that pauses agent work (comments stay waiting and the Activity screen says so). It would not be a
  fallback, since nothing else decides the comment; it can be added if wanted.
- Prompt-injection defences beyond those above.
- A per-thread cooldown (the code has a per-account one).
- Fair scheduling between tenants.
