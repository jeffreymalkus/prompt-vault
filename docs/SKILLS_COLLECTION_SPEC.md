# Skills Collection System — Product Spec (Draft v1)

> Extends the existing Skill system with a "collector" mode for importing, storing, and deploying full markdown skill files.

---

## Problem

Most real-world AI skills are distributed as standalone markdown files — detailed instruction sets that you paste into an LLM to give it a capability. Examples include Claude Code SKILL.md files, custom GPT instructions, agent persona definitions, and workflow playbooks.

Today, Prompt Vault's skill system is a **builder** — you compose skills from prompts, persona, rules, and procedure fields. That works for skills you create yourself, but it doesn't handle the common workflow of:

1. Find a useful skill online (GitHub, blog post, community share)
2. Save it for later
3. Try it out
4. Deploy it into your AI tool of choice
5. Track which skills you're actually using

---

## Solution

Add a **collected skill** mode alongside the existing composed skill mode. A collected skill stores the full markdown source as a single document, with metadata for organization and deployment tracking.

---

## Data Model Changes

### Extended Skill Interface

```typescript
interface Skill {
  // ... existing fields preserved ...

  // NEW: Collection fields
  sourceType: 'composed' | 'collected';     // Distinguishes builder vs. collector mode
  sourceMarkdown?: string;                   // Full markdown content (collected skills only)
  sourceUrl?: string;                        // Where the skill was found
  sourceEcosystem?: SkillEcosystem;          // Which AI platform it targets
  deploymentStatus?: DeploymentStatus;       // Lifecycle tracking
  lastDeployedAt?: number;                   // When it was last copied/exported
  deploymentTarget?: string;                 // Where it was deployed (user note)
}

type SkillEcosystem =
  | 'claude-code'
  | 'chatgpt'
  | 'gemini'
  | 'cursor'
  | 'windsurf'
  | 'other';

type DeploymentStatus =
  | 'saved'        // Collected but not yet tried
  | 'testing'      // Currently being evaluated
  | 'deployed'     // Actively in use somewhere
  | 'archived';    // Evaluated and shelved
```

### Backward Compatibility

- All existing skills get `sourceType: 'composed'` via migration
- Existing fields (`expertPersona`, `rulesGuardrails`, `procedure`, `embeddedPromptIds`) continue to work for composed skills
- Collected skills primarily use `sourceMarkdown` — the section fields are optional and can be auto-populated via `parseTextToSkillFields()` for search/filter purposes

---

## Import Mechanisms

### 1. Paste Markdown (Primary)

User pastes full markdown content into a text area. This is the most common flow — you find a skill online, copy it, paste it into Prompt Vault.

- Large text area (not the current multi-field form)
- Auto-detect: name (from first `# heading`), description (first paragraph), variables (via `scanSkillInputs`)
- User fills in: source URL, ecosystem, tags, folder, notes

### 2. Import .md File

User uploads a `.md` file from their computer.

- File picker filtered to `.md` / `.txt`
- File contents populate `sourceMarkdown`
- Same auto-detection as paste flow

### 3. URL Reference (Metadata Only)

User saves a URL with notes about a skill they've found but haven't collected yet.

- Minimal form: name, URL, ecosystem, notes
- `deploymentStatus` defaults to `saved`
- `sourceMarkdown` left empty until they paste/import it later

---

## Deployment Mechanisms

### 1. Copy Full Text to Clipboard

One-click copy of `sourceMarkdown` to clipboard. This is the primary deployment action — paste the skill into Claude, ChatGPT, etc.

- Button: "COPY SKILL" (prominent, primary color)
- Updates `lastDeployedAt` timestamp
- Increments `usageCount`
- Optional: prompt user to update `deploymentStatus` if still `saved`

### 2. Export as .md File

Download the skill as a standalone `.md` file.

- Filename: `{skill-name-slugified}.md`
- Pure markdown content (no Prompt Vault metadata)
- Button: "EXPORT .MD" (secondary action)

### 3. Copy for LLM (Existing)

The existing `assembleSkillForLLM()` function continues to work for composed skills. For collected skills, it just returns `sourceMarkdown`.

---

## Status Tracking

### Deployment Lifecycle

```
saved → testing → deployed
                 ↘ archived
```

- **Saved**: Collected but not yet evaluated. Default for new imports.
- **Testing**: Currently being tried out. User manually sets this.
- **Deployed**: Actively in use. User sets this when they've committed to using the skill.
- **Archived**: Evaluated and decided not to use. Keeps the record for reference.

### Status Display

- Color-coded badges on skill cards (gray → yellow → green → muted)
- Filter by deployment status in the skill list
- "Last deployed" timestamp shown on card

---

## UI Changes

### Skill List View

- Add deployment status badge to SkillCard
- Add "Last deployed" timestamp
- Add ecosystem badge (icon or label)
- Distinguish composed vs. collected skills visually (subtle indicator)

### New: Collect Skill Modal

A simplified modal optimized for the collection workflow:

```
┌─────────────────────────────────────────────┐
│  Collect Skill                              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Paste skill markdown here...        │    │
│  │                                     │    │
│  │                                     │    │
│  │                                     │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│  [Import .md file]                          │
│                                             │
│  ── Auto-detected ──────────────────────    │
│  Name:        [auto-filled from heading]    │
│  Variables:   [TOPIC], [AUDIENCE]           │
│                                             │
│  ── You fill in ────────────────────────    │
│  Source URL:   [https://...]                │
│  Ecosystem:   [claude-code ▾]              │
│  Folder:      [General ▾]                  │
│  Tags:        [tag1, tag2]                  │
│  Notes:       [your notes...]              │
│                                             │
│           [Cancel]  [Save Skill]            │
└─────────────────────────────────────────────┘
```

### Skill Detail View (Collected)

When opening a collected skill, show:

- Full markdown rendered as formatted text (read-only preview)
- Raw markdown toggle (for editing)
- Source URL link
- Deployment status selector
- Action buttons: COPY SKILL | EXPORT .MD | Edit | Delete

### Existing Skill Modal (Composed)

No changes. The current SkillModal continues to work for composed skills.

---

## Navigation

### "Add" Button Split

The current "Add Skill" button becomes a dropdown or split button:

- **Collect Skill** → Opens CollectSkillModal (import flow)
- **Build Skill** → Opens existing SkillModal (composer flow)

Or: a single "Add Skill" button that opens a choice screen:

```
How do you want to add a skill?

[📥 Collect]              [🔧 Build]
Import a skill you        Create a skill from
found online              your own prompts
```

---

## Filtering Additions

Add to existing filter system:

- **Source Type**: Composed | Collected | All
- **Deployment Status**: Saved | Testing | Deployed | Archived | All
- **Ecosystem**: Claude Code | ChatGPT | Gemini | Cursor | Windsurf | Other | All

These compose with existing filters (category, folder, search, tags).

---

## Migration

On app load, if skills exist without `sourceType`:

```typescript
skills = skills.map(s => ({
  ...s,
  sourceType: s.sourceType || 'composed',
  deploymentStatus: s.deploymentStatus || 'deployed'  // assume existing skills are in use
}));
```

This is a non-breaking, additive migration.

---

## What This Does NOT Do

- **No auto-fetching from URLs**: User copies/pastes content manually. Fetching raises CORS, auth, and reliability issues.
- **No skill marketplace or registry**: This is personal collection, not a shared platform.
- **No version control for collected skills**: v1 stores one version. If the source changes, user re-imports.
- **No execution**: Prompt Vault remains an organizer, not a runtime.
- **No LLM API integration**: Deployment means clipboard/file export, not API calls.

---

## Implementation Phases

### Phase A: Data Model + Migration
- Add new fields to Skill interface
- Add migration logic for existing skills
- Add localStorage persistence for new fields
- Estimated: 1 session

### Phase B: Collect Skill Modal
- New CollectSkillModal component
- Paste markdown + file import
- Auto-detection (name, variables)
- Metadata form (URL, ecosystem, folder, tags)
- Estimated: 1-2 sessions

### Phase C: Deployment Actions
- Copy full text to clipboard
- Export as .md file download
- Status tracking updates on deploy
- Estimated: 1 session

### Phase D: Card & Filter Updates
- Add deployment status badge to SkillCard
- Add ecosystem badge
- Add source type indicator
- Add new filter dropdowns
- Estimated: 1 session

### Phase E: Skill Detail View
- Markdown preview for collected skills
- Raw/preview toggle
- Deployment controls
- Estimated: 1 session

---

## Open Questions

1. **Should collected skills support editing the markdown after import?** yes
2. **Should the "Build Skill" flow auto-populate `sourceMarkdown` from assembled fields?** yes
3. **Should there be a "duplicate as collected" option for composed skills?** defer to v2)

---

## Success Criteria

The Skills Collection system is successful when:

- A user can paste a markdown skill and save it in under 30 seconds
- A user can deploy a saved skill to any LLM in 2 clicks (open → copy)
- A user can see at a glance which skills are saved vs. deployed vs. archived
- A user can filter their library by ecosystem and status
- Existing composed skills continue to work without changes

---

*Stability over novelty. Clarity over complexity. Organization over automation.*
