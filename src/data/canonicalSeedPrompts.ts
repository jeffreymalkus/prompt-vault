import { AIPrompt, detectVariables } from '../types';

/**
 * Canonical seed prompts from the AI Slow Down system (v1.0).
 * These are bundled into the app and always present regardless of localStorage state.
 * Identified by the `asd-seed-` id prefix.
 */

export const CANONICAL_SEED_PREFIX = 'asd-seed-';

export function isCanonicalSeed(id: string): boolean {
  return id.startsWith(CANONICAL_SEED_PREFIX);
}

const SEED_TIMESTAMP = 1700000000000; // Fixed epoch for stable ordering

interface SeedDef {
  id: string;
  title: string;
  content: string;
  variables: string[];
  description: string;
  notes: string;
}

const seeds: SeedDef[] = [
  {
    id: 'asd-seed-01-help-me-decide',
    title: 'Help Me Decide',
    content: `You are my decision advisor. Help me make a clear, defensible decision.

Decision I'm facing:
[DECISION]

Context that matters:
- What success looks like: [SUCCESS]
- What failure looks like: [FAILURE]
- Constraints (time, money, policy, risk tolerance): [CONSTRAINTS]
- One-way consequences (if any): [ONE-WAY CONSEQUENCES — outcomes that would be hard, costly, or impossible to undo once they happen]

Rules (strict):
- Do not invent facts, data, or probabilities.
- If an assumption is required, label it ASSUMPTION.
- Do not optimize for optimism.
- Stay within the context provided.

Step 1 — Options (no filler):
Present 3 genuinely different options.
If fewer than 3 are viable, explain why.

Step 2 — Stress test each option:
For each option, list:
- Best plausible case
- Most likely case
- Failure mode (how this goes wrong in practice)

Step 3 — Tradeoffs (explicit):
State the single primary tradeoff each option forces me to accept.

Step 4 — Recommendation:
Provide:
1) One recommended option
2) The key reason it wins
3) The main risk I am accepting by choosing it
4) What would change your recommendation

Step 5 — Action:
State the single most concrete next step I should take if I proceed.

Output format:
- Clear headings
- Concise bullets
- No background explanation beyond what is needed to decide`,
    variables: ['CONSTRAINTS', 'DECISION', 'FAILURE', 'SUCCESS'],
    description: 'Structured framework for making clear, defensible decisions by evaluating options, stress-testing outcomes, and identifying concrete next steps.',
    notes: 'Uses a 5-step progression: Options → Stress Test → Tradeoffs → Recommendation → Action. Forces explicit tradeoff acknowledgment and prevents optimism bias by requiring failure mode analysis for each option.',
  },
  {
    id: 'asd-seed-02-tell-me-what-i-m-missing',
    title: 'Tell Me What I\'m Missing',
    content: `You are my critical thinking partner. Your job is to identify gaps, assumptions, and unknowns — not to redesign the plan or give encouragement.

What I'm working on: [PLAN / IDEA / DECISION]

Context that matters: [CONTEXT]

Rules (strict):
- Do not judge whether this is a good idea.
- Do not propose solutions unless explicitly asked.
- Do not optimize or improve the plan.
- Do not invent facts or external constraints.
- Stay within the information provided.

Step 1 — Assumptions: List up to 5 assumptions I am making. Label each as:
- EXPLICIT (stated by me)
- IMPLIED (not stated, but required for this to work)

Step 2 — Unknowns: List up to 5 things that would materially change the outcome if they turned out differently.
If something is unknowable right now, label it UNKNOWABLE.

Step 3 — Fragility check:
Identify the single assumption or unknown that would cause the most damage if it were wrong.

Step 4 — Clarity test:
State one question I should answer next to reduce uncertainty the most. (Do not answer it.)

Output format:
- Clear headings
- Bullet points only
- No recommendations, fixes, or motivational language`,
    variables: ['CONTEXT', 'PLAN / IDEA / DECISION'],
    description: 'Identifies hidden assumptions, unknowns, and fragility points in any plan or idea — without judging or redesigning it.',
    notes: 'Deliberately separates gap-finding from problem-solving. Labels assumptions as EXPLICIT vs IMPLIED and unknowns as UNKNOWABLE when appropriate. The fragility check pinpoints the single highest-risk assumption.',
  },
  {
    id: 'asd-seed-03-pressure-test-this-before-i-act',
    title: 'Pressure-Test This Before I Act',
    content: `You are my pre-commitment risk reviewer. Assume I am likely to proceed unless a serious risk is identified.

Action I am about to take:
[ACTION]

Context that matters:
- Who is affected: [PEOPLE / STAKEHOLDERS]
- Timing / urgency: [TIMING]
- Constraints (policy, legal, financial, reputational): [CONSTRAINTS]
- One-way consequences (if any): [ONE-WAY CONSEQUENCES]

Rules (strict):
- Do not redesign the action.
- Do not suggest alternative strategies unless explicitly asked.
- Do not invent facts, policies, or reactions.
- Stay within the context provided.
- Focus on consequences, not idea quality.

Step 1 — Backfire analysis:
List up to 5 ways this could realistically backfire in practice.
Include misunderstandings, second-order effects, and stakeholder reactions.

Step 2 — Severity filter:
From the above, identify:
- The single most damaging failure mode
- Whether it is REVERSIBLE or ONE-WAY

Step 3 — Risk reduction:
Name one concrete adjustment that would meaningfully reduce that risk
(without changing the core action).

Step 4 — Go / pause check:
State clearly:
- Proceed as planned
- Proceed with the adjustment
- Pause and reassess

Briefly justify the recommendation in 2–3 bullets.

Output format:
- Clear headings
- Bulleted lists
- No reassurance, encouragement, or generic advice`,
    variables: ['ACTION', 'CONSTRAINTS', 'ONE-WAY CONSEQUENCES', 'PEOPLE / STAKEHOLDERS', 'TIMING'],
    description: 'Pre-commitment risk review that identifies backfire scenarios, severity, and risk reduction steps before you act.',
    notes: 'Assumes you will proceed unless a serious risk is found. Distinguishes REVERSIBLE vs ONE-WAY consequences. Ends with a clear go/pause/adjust recommendation rather than open-ended analysis.',
  },
  {
    id: 'asd-seed-04-compare-these-options-clearly',
    title: 'Compare These Options Clearly',
    content: `You are my analytical comparison partner. Your job is to compare options clearly and fairly — not to decide for me unless I explicitly ask.

Options to compare:
[OPTION 1]
[OPTION 2]
[OPTION 3]
(Add or remove options as needed.)

Context that matters:
- My goal: [GOAL]
- Constraints (time, money, policy, risk tolerance): [CONSTRAINTS]
- What matters most in this situation: [PRIORITIES]

Rules (strict):
- Treat each option as if it were proposed by a competent professional.
- Do not invent features, benefits, or drawbacks.
- If information is missing, label it UNKNOWN.
- Do not collapse options into hybrids.
- Stay within the provided context.

Step 1 — Normalize assumptions:
State any assumptions you must apply equally across all options.
Label them ASSUMPTION.

Step 2 — Side-by-side comparison:
For each option, compare on:
- Strengths
- Weaknesses
- Hidden costs or second-order effects
- Who this option is best suited for

Use parallel structure so differences are easy to see.

Step 3 — Risk profile:
For each option, state:
- Primary risk
- Whether that risk is REVERSIBLE or ONE-WAY

Step 4 — Differentiators:
Identify the single most important factor that distinguishes each option from the others.

Step 5 — Synthesis (not a decision):
Summarize the comparison in 3–5 bullets that highlight the real tradeoffs.
Do not choose an option unless I explicitly ask you to.

Output format:
- Clear section headings
- Bulleted lists
- No recommendations unless requested
- No filler or generic advice`,
    variables: ['CONSTRAINTS', 'GOAL', 'OPTION 1', 'OPTION 2', 'OPTION 3', 'PRIORITIES'],
    description: 'Side-by-side comparison of multiple options using parallel structure, risk profiles, and differentiators — without choosing for you.',
    notes: 'Treats all options as proposed by competent professionals to prevent bias. Uses parallel structure for easy scanning. Separates synthesis from decision-making unless explicitly asked to recommend.',
  },
  {
    id: 'asd-seed-05-turn-my-messy-thoughts-into-clarity',
    title: 'Turn My Messy Thoughts Into Clarity',
    content: `You are my sense-making assistant. Your job is to organize what I've provided, not to add new ideas or solutions.

Raw input (verbatim):
[PASTE NOTES / THOUGHTS]

Rules (strict):
- Do not add new ideas, opinions, or recommendations.
- Do not infer intent beyond what is written.
- Do not fix problems unless explicitly stated.
- If something is unclear or ambiguous, label it UNCLEAR.
- Stay strictly within the provided text.

Step 1 — Extract:
Separate the input into:
- Facts (explicit statements)
- Questions (explicit or implied)
- Concerns or uncertainties
- Possible actions mentioned (if any)

Step 2 — Organize:
Group the extracted items into coherent themes.
Name each theme using neutral, descriptive labels.

Step 3 — Prioritize:
Based only on emphasis, repetition, or stated urgency in the input, identify:
- What appears to matter most
- What appears secondary
- What can likely wait

Step 4 — Clarity gaps:
List up to 3 places where missing information prevents clear understanding or action.
Do not fill the gaps — only name them.

Step 5 — Clean summary:
Produce a short summary (6–8 bullets max) that accurately reflects the input without interpretation.

Output format:
- Clear section headings
- Bullet points only
- No advice, solutions, or motivational language`,
    variables: ['PASTE NOTES / THOUGHTS'],
    description: 'Converts raw, unstructured notes or thoughts into organized themes, priorities, and a clean summary — without adding interpretation.',
    notes: 'Strictly organizational — no new ideas, opinions, or recommendations are added. Labels ambiguous items as UNCLEAR. Priority is inferred only from emphasis, repetition, or stated urgency in the original text.',
  },
  {
    id: 'asd-seed-06-break-this-into-real-next-steps',
    title: 'Break This Into Real Next Steps',
    content: `You are my execution planner. Your job is to break this into realistic, doable steps — not to design a perfect plan.

Goal I want to accomplish:
[GOAL]

Context that matters:
- Constraints (time, budget, authority, dependencies): [CONSTRAINTS]
- My role / control level: [ROLE]
- Timeline pressure (if any): [TIMING]

Rules (strict):
- Do not invent resources, authority, or approvals.
- Do not assume ideal conditions.
- Do not expand scope beyond the stated goal.
- If a step depends on missing information or permission, label it BLOCKED.
- Prefer smaller, testable steps over comprehensive plans.

Step 1 — Clarify the finish line:
Restate the goal in one sentence as a concrete outcome.
If the goal is ambiguous, label it UNCLEAR and explain why.

Step 2 — Identify the very next step:
Define the smallest meaningful action I can take next.
It must be:
- Specific
- Doable within my constraints
- Clearly startable

Step 3 — Short sequence:
List 3–7 follow-on steps that logically come after the first step.
For each step, include:
- What is done
- Who is involved (if anyone)
- What blocks it (if anything)

Step 4 — Reality check:
Identify:
- The step most likely to stall
- Why it might stall
- One way to reduce that friction (without adding scope)

Step 5 — Execution summary:
Provide a concise checklist version of the steps suitable for immediate use.

Output format:
- Clear headings
- Bulleted lists
- No motivational language
- No long-term strategy discussion`,
    variables: ['CONSTRAINTS', 'GOAL', 'ROLE', 'TIMING'],
    description: 'Breaks any goal into a realistic sequence of small, doable steps with dependency tracking and stall-point identification.',
    notes: 'Prioritizes smallest meaningful actions over comprehensive plans. Labels blocked steps explicitly. Includes a reality check that identifies the most likely stall point and a friction-reduction step.',
  },
  {
    id: 'asd-seed-07-rewrite-this-without-changing-the-meaning',
    title: 'Rewrite This Without Changing the Meaning',
    content: `You are my precision editor. Your job is to improve clarity and structure without altering meaning, intent, or implied commitments.

Text to rewrite (verbatim):
[TEXT]

Context that matters:
- Audience: [AUDIENCE]
- Purpose of the text: [PURPOSE]
- Desired tone: [NEUTRAL / PROFESSIONAL / FIRM / WARM]
- Constraints (legal, policy, reputational, scope): [CONSTRAINTS]

Rules (strict):
- Do NOT change meaning, intent, facts, or commitments.
- Do NOT add new claims, promises, or assumptions.
- Do NOT remove caveats or qualifiers unless explicitly told.
- If wording is ambiguous in the original, preserve the ambiguity and flag it.
- Stay within the original scope and length unless told otherwise.

Step 1 — Meaning lock:
Briefly restate the original meaning in 2–3 bullet points.
(Do not rewrite yet.)

Step 2 — Risk scan:
Identify up to 3 places where a rewrite could accidentally:
- Change meaning
- Introduce a new commitment
- Soften or harden tone unintentionally

Step 3 — Rewrite:
Produce a revised version that is:
- Clearer
- More direct
- Better structured
While preserving the meaning lock from Step 1.

Step 4 — Fidelity check:
List any phrases where reasonable readers might still interpret the text differently.
If none, state NONE.

Output:
1) Revised text (sendable)
2) Meaning lock bullets
3) Fidelity check notes
No commentary beyond this.`,
    variables: ['AUDIENCE', 'CONSTRAINTS', 'NEUTRAL / PROFESSIONAL / FIRM / WARM', 'PURPOSE', 'TEXT'],
    description: 'Precision editing that improves clarity and structure while locking in the original meaning, intent, and commitments.',
    notes: 'Uses a "meaning lock" step before rewriting to prevent drift. Includes a risk scan for accidental changes to commitments or tone. The fidelity check at the end flags any remaining ambiguity.',
  },
  {
    id: 'asd-seed-08-outline-first-then-draft',
    title: 'Outline First, Then Draft',
    content: `You are my drafting partner. Your job is to create a safe, structured first pass that can be refined later — not a polished final product.

What I need to create:
[TASK]

Context that matters:
- Audience: [AUDIENCE]
- Purpose (what this is for): [PURPOSE]
- Desired length / depth: [LENGTH or DEPTH]
- Constraints (format, tone, policy, scope): [CONSTRAINTS]

Rules (strict):
- Do not assume unstated requirements.
- Do not add sections that aren't justified by the purpose.
- Do not over-polish language.
- If key information is missing, label it REQUIRED INPUT.
- Stay within the stated scope and length.

Step 1 — Structural outline:
Create a clear outline with only the sections needed to fulfill the purpose.
For each section, include a one-line note on what it should accomplish.

Step 2 — Outline check:
Briefly explain (in 3–5 bullets) why this structure fits the audience and purpose.
If any section is optional, label it OPTIONAL.

Step 3 — Draft:
Write a rough draft following the outline.
Use simple, direct language.
Leave placeholders where REQUIRED INPUT is missing.

Step 4 — Draft limitations:
List up to 3 known weaknesses or gaps in this draft that should be addressed in a later revision.

Output:
1) Outline
2) Draft
3) Draft limitations
No commentary beyond this.`,
    variables: ['AUDIENCE', 'CONSTRAINTS', 'LENGTH or DEPTH', 'PURPOSE', 'TASK'],
    description: 'Two-phase drafting: creates a structural outline first, then writes a rough draft that follows it — designed for iteration, not perfection.',
    notes: 'Separates structure from prose to reduce blank-page paralysis. Labels optional sections and missing inputs explicitly. Ends with known weaknesses to guide revision.',
  },
  {
    id: 'asd-seed-09-is-this-idea-any-good-be-brutally-specific',
    title: 'Is This Idea Any Good? Be Brutally Specific',
    content: `Idea:
[IDEA]

Context:
- Target user or buyer: [TARGET]
- What success means: [SUCCESS]
- Constraints: [CONSTRAINTS]

Step 1 — Restate the idea clearly (2–3 sentences)

Step 2 — Find the dealbreakers:
- 3 specific flaws or failure points
- 3 assumptions that must be true
- 1 assumption that would collapse the idea if false

Step 3 — 6‑month failure postmortem:
List the top 3 reasons this would fail.

Step 4 — Fix + test:
- The single weakest part
- Exactly how to fix it
- The simplest test to validate the core assumption

Self‑check:
Rate this critique 1–100 for specificity, severity, and usefulness.
If any score is below 90, rewrite the critique.`,
    variables: ['CONSTRAINTS', 'IDEA', 'SUCCESS', 'TARGET'],
    description: 'Brutally honest idea evaluation that identifies dealbreakers, critical assumptions, and the single weakest point — with a concrete fix and validation test.',
    notes: 'Includes a self-check mechanism where the AI rates its own critique for specificity and rewrites if the score is below 90. The 6-month failure postmortem forces forward-looking risk identification.',
  },
  {
    id: 'asd-seed-10-extract-facts-only-no-guessing-with-proof',
    title: 'Extract Facts Only (No Guessing, With Proof)',
    content: `Source document:
[UPLOADED_DOCUMENT_OR_TEXT]

Extraction task:
[SPECIFIC_DATA_TO_EXTRACT]

Rules:
1. Use ONLY the provided document.
2. If information is not explicitly stated, write: NOT FOUND.
3. If a claim is implied but uncertain, mark it: UNVERIFIED.
4. Every claim must be supported by a direct quote.

Output format (repeat per item):
- Claim
- Status: FOUND / UNVERIFIED / NOT FOUND
- Supporting quote
- Location (section or paragraph identifier)

Verification step:
Review each claim one final time.
If you cannot point to a direct quote, remove the claim.`,
    variables: ['SPECIFIC_DATA_TO_EXTRACT', 'UPLOADED_DOCUMENT_OR_TEXT'],
    description: 'Extracts only explicitly stated facts from a document, with direct quotes as proof and clear labeling of unverified or missing information.',
    notes: 'Every claim requires a supporting direct quote and location reference. Uses a three-tier status system: FOUND / UNVERIFIED / NOT FOUND. Includes a final verification pass that removes any unsupported claims.',
  },
  {
    id: 'asd-seed-11-prompt-failure-analysis-via-external-frames',
    title: 'Prompt Failure Analysis via External Frames',
    content: `Compare my last prompt and your response against common prompt failure patterns.

Identify 2–3 plausible failure modes that could explain why the result wasn't useful (for example: unclear objective, missing constraints, wrong abstraction level, ambiguous audience, output format mismatch, or task overloading).

For each failure mode:
- briefly explain how it might apply here

Then choose the most likely one and rewrite my original prompt to correct for it, while preserving my original intent.

Keep the rewritten prompt short, explicit, and reusable.`,
    variables: [],
    description: 'Diagnoses why a previous prompt produced poor results by analyzing it against common failure patterns, then rewrites it to fix the most likely issue.',
    notes: 'Meta-level prompt — operates on the prompt itself rather than the task. Identifies failure modes like unclear objectives, missing constraints, wrong abstraction level, or task overloading. Preserves original intent while fixing structural issues.',
  },
  {
    id: 'asd-seed-12-get-back-on-track',
    title: 'Get Back on Track',
    content: `Before continuing, do the following:

1. State the task you are currently trying to complete for me in one sentence.
2. List the assumptions you are making about my goal, constraints, audience, or desired output.
3. Remove any assumptions that are not explicitly confirmed in the conversation.

Once aligned, continue the task using only confirmed information.`,
    variables: [],
    description: 'Realignment prompt that forces the AI to restate its understanding of the task and strip out unconfirmed assumptions before continuing.',
    notes: 'Session-control prompt designed for mid-conversation correction. Prevents context drift by requiring explicit confirmation of goals, constraints, and audience before proceeding.',
  },
  {
    id: 'asd-seed-13-save-progress-and-continue',
    title: 'Save Progress and Continue',
    content: `Before continuing, reconstruct the current state of this task from the conversation so far, without assuming anything is implicitly remembered.

Provide a State Summary that includes:

1. Current Objective
What we are trying to accomplish right now.

2. Confirmed Constraints & Variables
Only include constraints or decisions that have been explicitly stated or confirmed.

3. Open Questions or Unresolved Decisions
Anything that still needs clarification or choice.

4. Key Context for Handoff
A concise block I can copy into a fresh chat to continue this work without losing progress.

After the summary, ask whether to:
- continue in this thread, or
- switch to a fresh chat using the handoff context.`,
    variables: [],
    description: 'Creates a portable state summary of the current task so work can continue seamlessly in a fresh conversation without losing progress.',
    notes: 'Generates a structured handoff block covering objective, confirmed constraints, completed work, open questions, and key context. Designed for long-running tasks that may span multiple sessions.',
  },
  {
    id: 'asd-seed-14-reduce-to-what-matters-next',
    title: 'Reduce to What Matters Next',
    content: `Convert this response into decision-level output.

Strip away background explanation and secondary detail.

Identify the single most likely next action I should take.

If there are alternatives, present no more than three, with one-line guidance on when each applies.

Optimize for speed, clarity, and usability.`,
    variables: [],
    description: 'Strips a verbose response down to decision-level output: the single most likely next action plus up to three alternatives.',
    notes: 'Compression prompt — removes background explanation and secondary detail. Optimizes for speed, clarity, and immediate usability. Useful after receiving long AI responses that bury the actionable conclusion.',
  },
  {
    id: 'asd-seed-15-write-a-professional-response-with-stakes',
    title: 'Write a Professional Response With Stakes',
    content: `You are my senior communications advisor. Draft a response I can send.

Incoming message (verbatim):
[PASTE MESSAGE]

Context I can share:
- Relationship / power dynamic: [WHO IS THIS PERSON TO ME]
- What I want as the outcome: [OUTCOME]
- What I must avoid (risk, admissions, commitments): [AVOID]
- Constraints (timing, policy, legal/compliance, confidentiality): [CONSTRAINTS]
- Preferred tone: [NEUTRAL / WARM / FIRM / DIPLOMATIC / URGENT-CALM]

Step 1 — Clarify before drafting:
Ask up to 5 questions only if truly necessary. If not necessary, skip questions and state assumptions you are making in 3 bullets.

Step 2 — Risk scan (silent, then apply):
Avoid overpromising, accidental admissions, scope creep, ambiguous timelines, emotional language, unnecessary detail, and any new facts not in my input.

Step 3 — Draft:
Write one email reply with:
- Subject line (if helpful)
- 3–8 sentences max unless context requires more
- Clear yes/no/next step
- Specific timeline if provided; otherwise propose one
- One closing line that preserves goodwill

Step 4 — Confidence check:
List 3 potential misinterpretations of your draft.
Then provide a revised version that prevents the most likely misinterpretation.

Output:
1) Final sendable draft
2) 3-bullet explanation of why this works`,
    variables: ['AVOID', 'CONSTRAINTS', 'NEUTRAL / WARM / FIRM / DIPLOMATIC / URGENT-CALM', 'OUTCOME', 'PASTE MESSAGE', 'WHO IS THIS PERSON TO ME'],
    description: 'Drafts a professional email response for high-stakes situations, with risk scanning for accidental admissions, overpromises, and misinterpretations.',
    notes: 'Includes a silent risk scan that checks for overpromising, scope creep, ambiguous timelines, and emotional language before drafting. The confidence check lists potential misinterpretations and provides a revised version to prevent the most likely one.',
  },
  {
    id: 'asd-seed-16-say-no-without-burning-capital',
    title: 'Say No Without Burning Capital',
    content: `You are my negotiation-aware writing coach. Help me say no (or not now / not like this) while preserving the relationship.

What I'm being asked to do:
[PASTE REQUEST OR DESCRIBE]

My position:
- What I can't do: [BOUNDARY]
- Why (one sentence, non-emotional): [REASON]
- What I can do instead (if any): [ALTERNATIVE]
- What I need from them (if any): [ASK]
Tone: [CALM / FIRM / FRIENDLY / EXECUTIVE-BRIEF]
Medium: [EMAIL / SLACK / TALKING POINTS]

Deliver 3 options:
A) Direct + brief
B) Warm + collaborative
C) Conditional yes (only if constraints are met)

Rules:
- No apologies unless you caused the problem
- Do not blame others
- Do not over-explain
- Avoid vague phrases unless tied to a concrete next step
- Include a clear boundary sentence

For each option include:
- Sendable message
- Boundary sentence
- Alternative or next step`,
    variables: ['ALTERNATIVE', 'ASK', 'BOUNDARY', 'CALM / FIRM / FRIENDLY / EXECUTIVE-BRIEF', 'EMAIL / SLACK / TALKING POINTS', 'PASTE REQUEST OR DESCRIBE', 'REASON'],
    description: 'Helps decline requests while preserving relationships — provides three response options: direct, warm, and conditional yes.',
    notes: 'Negotiation-aware approach that avoids unnecessary apologies, blame, and over-explanation. Each option includes a clear boundary sentence, an alternative or next step, and adapts to the specified medium (email, Slack, or talking points).',
  },
  {
    id: 'asd-seed-17-prepare-me-for-this-meeting',
    title: 'Prepare Me for This Meeting',
    content: `You are my chief of staff. Prepare me for a meeting so I can drive outcomes.

Meeting details:
- Title: [TITLE]
- Attendees + roles: [NAMES/ROLES]
- My role: [ROLE]
- Timebox: [MINUTES]
- Purpose: [PURPOSE]
- Background: [PASTE CONTEXT]

Step 1 — Objective:
State the single best decision-level objective.

Step 2 — Agenda:
Create a timeboxed agenda with a desired output for each section.

Step 3 — Pre-wire:
List what each attendee likely cares about, 3 questions to ask, and 3 facts I must have ready (mark UNKNOWN if missing).

Step 4 — Decisions & asks:
Propose decisions to reach and specific asks to make.

Step 5 — Risks:
List 3 failure modes and one prevention move for each.

Output sections clearly and concisely.`,
    variables: ['MINUTES', 'NAMES/ROLES', 'PASTE CONTEXT', 'PURPOSE', 'ROLE', 'TITLE'],
    description: 'Full meeting preparation: objective, timeboxed agenda, stakeholder analysis, pre-wire questions, proposed decisions, and risk prevention.',
    notes: 'Chief-of-staff approach that focuses on driving outcomes rather than just attending. Includes stakeholder motivation mapping, facts to have ready (marked UNKNOWN if missing), and specific failure mode prevention for each agenda item.',
  },
  {
    id: 'asd-seed-18-turn-these-notes-into-decisions-and-owners',
    title: 'Turn These Notes Into Decisions and Owners',
    content: `You are my operations analyst. Convert notes into an execution-ready record.

Raw notes:
[PASTE NOTES]

Rules:
- Do not invent facts, owners, or dates
- If unclear, write UNCLEAR
- If missing, write OWNER NOT ASSIGNED or DATE NOT STATED

Deliver:
1) Decisions
2) Action items table (Action | Owner | Due | Dependencies | Status)
3) Open questions
4) Explicit risks mentioned
5) Proposed next-meeting agenda based only on unresolved items`,
    variables: ['PASTE NOTES'],
    description: 'Converts raw meeting notes into an execution-ready record with decisions, action items, open questions, and risks.',
    notes: 'Operations-focused: produces a structured action items table (Action | Owner | Due | Dependencies | Status). Labels missing information explicitly as UNCLEAR, OWNER NOT ASSIGNED, or DATE NOT STATED rather than inventing details.',
  },
  {
    id: 'asd-seed-19-draft-the-follow-up-after-this-meeting',
    title: 'Draft the Follow-Up After This Meeting',
    content: `You are my follow-up writer. Draft a post-meeting message that creates accountability.

Inputs:
- Meeting title: [TITLE]
- Audience: [EMAIL / SLACK]
- Tone: [NEUTRAL / WARM / FIRM]
- Notes or summary: [PASTE]

Rules:
- Do not invent owners or dates
- Make action items explicit
- Keep length between 120–200 words unless necessary

Deliver:
- One-sentence recap
- Decisions
- Action items (Owner — Action — Due)
- Open questions
- Next checkpoint (or DATE NOT STATED)

Then provide a second version 30% shorter.`,
    variables: ['EMAIL / SLACK', 'NEUTRAL / WARM / FIRM', 'PASTE', 'TITLE'],
    description: 'Drafts a post-meeting follow-up message that creates accountability with explicit action items, decisions, and next checkpoints.',
    notes: 'Produces two versions: a full follow-up and a 30% shorter version. Focuses on accountability by making action items explicit with Owner — Action — Due format. Never invents owners or dates.',
  },
  {
    id: 'asd-seed-20-explain-this-to-an-executive',
    title: 'Explain This to an Executive',
    content: `You are my executive communications editor. Convert this into an exec-ready brief.

Topic:
[PASTE]

Executive context:
- Role: [ROLE]
- Priorities: [PRIORITIES]
- Desired decision: [DECISION/ASK]
- Time available: [30s / 2m / 5m]

Rules:
- Lead with the point
- Plain language only
- Quantify impact or mark UNKNOWN
- Surface risks and tradeoffs
- Be decisive
- Do not include background context the executive did not ask for.

Deliver:
1) 30-second version (≤5 bullets)
2) 2-minute version (Problem → Impact → Options → Recommendation → Risks)
3) Appendix: 5 likely questions with sharp answers

End with the exact decision or next step required.`,
    variables: ['30s / 2m / 5m', 'DECISION/ASK', 'PASTE', 'PRIORITIES', 'ROLE'],
    description: 'Converts any content into an executive-ready brief at three time scales (30s, 2min, 5min) with clear asks and risk surfacing.',
    notes: 'Leads with the point, uses plain language, and quantifies impact (or marks UNKNOWN). Includes an appendix of 5 likely executive questions with sharp answers. Ends with the exact decision or next step required.',
  },
  {
    id: 'asd-seed-21-translate-this-for-a-non-expert-audience',
    title: 'Translate This for a Non-Expert Audience',
    content: `You are my translation layer. Explain this so a non-expert can understand and act.

Source material:
[PASTE]

Audience:
- Role: [ROLE]
- Baseline knowledge: [BASELINE]
- What they need to do: [ACTION]
- Tone: [FRIENDLY / NEUTRAL / PROFESSIONAL]

Deliver:
1) One-sentence definition
2) Five-bullet explanation with one example (and one analogy if helpful)
3) What this means for you (3 bullets)
4) Misunderstandings to prevent (3 bullets)
5) One suggested next step or question

Rules:
- Do not oversimplify into inaccuracy
- Label uncertainty explicitly
- No filler`,
    variables: ['ACTION', 'BASELINE', 'FRIENDLY / NEUTRAL / PROFESSIONAL', 'PASTE', 'ROLE'],
    description: 'Translates complex or technical content into clear, accurate language that a non-expert audience can understand and act on.',
    notes: 'Five-layer delivery: one-sentence definition, five-bullet explanation with examples, "what this means for you" section, common misunderstandings to prevent, and a suggested next step. Explicitly avoids oversimplifying into inaccuracy.',
  },
];

/**
 * The 21 canonical seed prompts, fully typed as AIPrompt objects.
 * These are immutable at runtime — user actions cannot modify them.
 */
// Exact folder + category mapping per prompt id
const SEED_PLACEMENT: Record<string, { folder: string; category: string }> = {
  'asd-seed-01-help-me-decide':                       { folder: 'Core Frameworks', category: 'Planning' },
  'asd-seed-02-tell-me-what-i-m-missing':              { folder: 'Core Frameworks', category: 'Planning' },
  'asd-seed-03-pressure-test-this-before-i-act':       { folder: 'Professional',    category: 'Operations' },
  'asd-seed-04-compare-these-options-clearly':         { folder: 'Core Frameworks', category: 'Planning' },
  'asd-seed-05-turn-my-messy-thoughts-into-clarity':   { folder: 'Core Frameworks', category: 'Planning' },
  'asd-seed-06-break-this-into-real-next-steps':       { folder: 'Professional',    category: 'Operations' },
  'asd-seed-07-rewrite-this-without-changing-the-meaning': { folder: 'Professional', category: 'Writing' },
  'asd-seed-08-outline-first-then-draft':              { folder: 'Professional',    category: 'Writing' },
  'asd-seed-09-is-this-idea-any-good-be-brutally-specific': { folder: 'Core Frameworks', category: 'Planning' },
  'asd-seed-10-extract-facts-only-no-guessing-with-proof': { folder: 'Core Frameworks', category: 'Research' },
  'asd-seed-11-prompt-failure-analysis-via-external-frames': { folder: 'Core Frameworks', category: 'Analysis' },
  'asd-seed-12-get-back-on-track':                     { folder: 'Core Frameworks', category: 'Analysis' },
  'asd-seed-13-save-progress-and-continue':            { folder: 'Core Frameworks', category: 'Analysis' },
  'asd-seed-14-reduce-to-what-matters-next':           { folder: 'Core Frameworks', category: 'Analysis' },
  'asd-seed-15-write-a-professional-response-with-stakes': { folder: 'Professional', category: 'Writing' },
  'asd-seed-16-say-no-without-burning-capital':        { folder: 'Professional',    category: 'Writing' },
  'asd-seed-17-prepare-me-for-this-meeting':           { folder: 'Professional',    category: 'Business' },
  'asd-seed-18-turn-these-notes-into-decisions-and-owners': { folder: 'Professional', category: 'Operations' },
  'asd-seed-19-draft-the-follow-up-after-this-meeting': { folder: 'Professional',   category: 'Operations' },
  'asd-seed-20-explain-this-to-an-executive':          { folder: 'Professional',    category: 'Business' },
  'asd-seed-21-translate-this-for-a-non-expert-audience': { folder: 'Professional', category: 'Business' },
};

/**
 * The 21 canonical seed prompts, fully typed as AIPrompt objects.
 * These are immutable at runtime — user actions cannot modify them.
 */
export const CANONICAL_SEED_PROMPTS: AIPrompt[] = seeds.map((s, i) => {
  const placement = SEED_PLACEMENT[s.id] || { folder: 'General', category: 'Analysis' };
  return {
    id: s.id,
    title: s.title,
    content: s.content,
    description: s.description,
    notes: s.notes,
    category: placement.category,
    tags: [],
    folder: placement.folder,
    type: 'user' as const,
    origin: 'builtin' as const,
    version: 1,
    lastUsedAt: SEED_TIMESTAMP,
    createdAt: SEED_TIMESTAMP + i,
    usageCount: 0,
    isPinned: false,
    variables: s.variables,
  };
});

/**
 * Merge canonical seeds with user prompts from localStorage.
 * - Canonical prompts always come first.
 * - If a user prompt has the same id as a canonical prompt, the user copy is kept with a new id.
 */
export function mergeWithCanonicalSeeds(userPrompts: AIPrompt[]): AIPrompt[] {
  const canonicalIds = new Set(CANONICAL_SEED_PROMPTS.map(p => p.id));
  
  // Ensure all user prompts have origin field (backward compat)
  const withOrigin = userPrompts.map(p => ({
    ...p,
    origin: p.origin || 'user' as const,
  }));

  // Reassign ids for any user prompts that collide with canonical ids
  const safeUserPrompts = withOrigin
    .filter(p => !canonicalIds.has(p.id))
    .concat(
      withOrigin
        .filter(p => canonicalIds.has(p.id))
        .map(p => ({ ...p, id: `user-${p.id}-${Date.now()}`, origin: 'user' as const }))
    );

  return [...CANONICAL_SEED_PROMPTS, ...safeUserPrompts];
}
