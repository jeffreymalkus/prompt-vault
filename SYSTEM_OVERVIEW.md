# Prompt Vault — System Overview

Generated: 2026-02-11 | Read-only analysis — no code was modified.

---

## 1. Architecture Summary

### Tech Stack

Prompt Vault is a **single-page React 18 application** built with TypeScript, Vite, and Tailwind CSS. It uses the shadcn/ui component library (Radix primitives) for its design system.

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC plugin) |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| UI primitives | Radix UI (via shadcn/ui) |
| Routing | react-router-dom v6 |
| State | React `useState` / `useEffect` (no Redux or Zustand) |
| Persistence | `localStorage` (7 distinct keys) |
| Testing | Vitest + @testing-library/react + jsdom |
| Diffing | `diff` (word-level diff for version history) |

### File Layout

```
src/
├── App.tsx                     # Route shell (QueryClient, Tooltip, Toaster, Router)
├── main.tsx                    # Entry point
├── pages/
│   ├── Index.tsx               # God-component: ALL state, handlers, layout (1,647 lines)
│   └── NotFound.tsx
├── types/
│   └── index.ts                # Every interface, enum, utility function
├── data/
│   └── canonicalSeedPrompts.ts # Bundled read-only seed prompts ("asd-seed-*")
├── components/
│   ├── PromptCard.tsx          # Card rendering + inline edit
│   ├── PromptModal.tsx         # Create/edit modal
│   ├── PromptDetailModal.tsx   # Full detail view with variable substitution
│   ├── SkillCard.tsx / SkillModal.tsx / SkillImportModal.tsx / RunSkillModal.tsx
│   ├── WorkflowCard.tsx / WorkflowModal.tsx / WorkflowImportModal.tsx / RunWorkflowModal.tsx
│   ├── AgentCard.tsx / AgentModal.tsx / AgentImportModal.tsx
│   ├── SmartImportModal.tsx    # AI-assisted paste-to-create for prompts & skills
│   ├── VersionHistoryDrawer.tsx # Word-level diff viewer + restore
│   ├── NavigationTabs.tsx      # Object vs. Capability view toggle
│   ├── CapabilityView.tsx      # Cross-entity category grouping
│   ├── ExecutionHistory.tsx    # Run log viewer
│   └── ui/                     # ~40 shadcn/ui primitives (button, dialog, card, etc.)
├── hooks/
│   └── use-mobile.tsx, use-toast.ts
├── lib/
│   └── utils.ts                # `cn()` class-merge helper
└── test/
    ├── setup.ts
    ├── example.test.ts
    └── canonicalSeeds.test.ts
```

### State Architecture

All application state lives in **`Index.tsx`** as top-level `useState` hooks. There is no context provider, no store, and no reducer. State is passed down to child components via props and callback handlers. This is a single-page, single-user, local-first application with no backend.

**localStorage keys:**

| Key | Contents |
|---|---|
| `prompt_vault_data_v2` | User-created prompts (excludes canonical seeds) |
| `prompt_vault_folders` | Custom folder names |
| `prompt_vault_skills` | Skill records |
| `prompt_vault_workflows` | Workflow records |
| `prompt_vault_agents` | Agent records |
| `prompt_vault_execution_history` | Run logs |
| `prompt_vault_version_snapshots` | Immutable version snapshots for prompts |

Each collection is loaded on mount (`useEffect([], [])`) and persisted via individual `useEffect` watchers that serialize to localStorage on every state change.

---

## 2. Key Feature Map

### A. Prompt Organizer (core)

The primary feature. Prompts (`AIPrompt`) are the central entity — text templates with embedded `[VARIABLE]` placeholders.

- **CRUD**: Create, edit, delete prompts via modal forms.
- **Copy to clipboard**: One-click copy of prompt content; increments `usageCount`.
- **Pinning & Frequently Used**: Pin prompts; sidebar shows top 5 by usage/pin status.
- **Folders & Categories**: Organize prompts into user-created folders and preset categories (Writing, Coding, Marketing, etc.).
- **Import/Export**: JSON and CSV import/export with duplicate detection (signature = `type|folder|title|content`).
- **Canonical Seeds**: 10+ built-in prompts (prefix `asd-seed-`) that are always present, cannot be deleted, and are excluded from localStorage persistence. Editing a seed creates a user-owned copy.
- **Smart Import ("Magic Import")**: Paste raw text → auto-detect whether it's a prompt or skill → pre-fill creation form.

### B. Skill Registry

Skills (`Skill`) bundle prompts into reusable AI capabilities with structured fields:

- Expert persona, rules/guardrails, procedure, output format
- Linked prompts (`embeddedPromptIds`)
- Tools used, inputs required (auto-scanned from `[VARIABLE]` patterns in procedure text)
- Status: draft / active
- **LLM Export**: `assembleSkillForLLM()` renders a skill into portable Markdown for pasting into an LLM.
- **Text Import**: `parseTextToSkillFields()` uses heading-based heuristics (regex matching on "role", "persona", "rules", "output", etc.) to auto-populate fields from pasted text.

### C. Workflows

Workflows (`Workflow`) chain skills into ordered sequences:

- Ordered `skillIds[]` array
- Trigger type: manual / scheduled / event-based
- Input source, output deliverable, human review step toggle
- Run simulation via `RunWorkflowModal`

### D. Agents

Agents (`Agent`) are automated workflow executors (metadata-only, no actual runtime):

- Linked to a single workflow (`linkedWorkflowId`)
- Data sources, connected tools, memory toggle
- Status: active / paused / error
- Failure handling instructions

### E. Execution History

`ExecutionRun` records track simulated runs of skills and workflows with inputs, outputs, timing, and status.

### F. Version History

Immutable `PromptVersionSnapshot` records with word-level diff viewing (via `diffWords` from the `diff` library). See Section 4 below.

---

## 3. Variable Parsing System

Variables are the mechanism for making prompts and skills reusable with user-supplied inputs.

### Syntax

Variables are delimited by square brackets: `[VARIABLE_NAME]` or `[VARIABLE_NAME:default_value]`.

### Detection (Prompts)

The core regex is defined in `types/index.ts`:

```
PLACEHOLDER_REGEX = /\[([^\]:\]]+)(?::[^\]]*)?\]/g
```

This matches `[KEY]` and `[KEY:default]` patterns. The `detectVariables()` function:

1. Iterates all matches via `matchAll`
2. Extracts the canonical key (everything before the first `:`)
3. Filters out a stoplist: `OPTIONAL`, `REQUIRED`, `EXAMPLE`, `NOTES`, `RULES`, `STEPS`
4. Deduplicates by key
5. Returns an ordered array of unique variable names

### Detection (Skills)

Skills use a separate scanner — `scanSkillInputs()` — with a stricter regex:

```
/\[([A-Z][A-Z0-9_ ]{1,50})\]/g
```

This only matches uppercase identifiers (1–50 chars, starting with a letter). It normalizes whitespace to underscores, applies the same stoplist, and deduplicates.

### Variable Values

Variable values are stored as `Record<string, string>` dictionaries and are:

- Editable inline on PromptCard and PromptDetailModal
- Persisted into `PromptVersionSnapshot.variableValues` when a new version is saved
- Restored from snapshots when reverting to a prior version

### Substitution

Variables are substituted at copy/export time by replacing `[KEY]` tokens with user-entered values. The template text itself always retains the bracket notation.

---

## 4. Versioning System

Prompt versioning follows strict invariants documented in `PROJECT_BRIEF.md` and `IMPLEMENTATION_PLAN.md`.

### Core Rules

1. **Normal Save** updates the current draft only. It does NOT create a snapshot.
2. **"Save New Version"** is the only action that creates an immutable snapshot.
3. **Restore** reverts the editor state to a snapshot's content. It does NOT create a new snapshot.
4. **v1 baseline** is auto-created on first interaction (`ensureBaselineSnapshot`). It cannot be deleted (`handleDeleteVersion` rejects `version === 1`).
5. **Commit messages / version names** are preserved exactly as typed (no normalization).
6. **Duplicate version names** are rejected (case-insensitive check within the same prompt's snapshots).

### Data Model

```typescript
PromptVersionSnapshot {
  id: string;
  promptId: string;       // links to prompt.parentId or prompt.id
  content: string;        // template text with brackets intact
  title, description, tags, category, folder: // full prompt metadata
  commitMessage: string;
  versionName?: string;
  version: number;        // monotonically increasing per prompt
  variableValues?: Record<string, string>;
  createdAt: number;
}
```

### Version Numbering

- Derived from existing snapshots: `maxVersion + 1`
- The prompt's own `version` field is updated to match after snapshot creation.

### Diff Viewer

`VersionHistoryDrawer` uses the `diff` library's `diffWords()` to render word-level diffs between any two snapshots, with green highlighting for additions and red strikethrough for deletions.

### Prompt Grouping

Prompts are grouped by `parentId || id`. The UI always shows the latest version per group. Editing a canonical seed creates a user-owned copy with `parentId` pointing to the original.

---

## 5. Skills / Workflows / Agents Structure

These three entity types form a layered capability hierarchy:

```
Prompts (atomic instructions)
  └── Skills (bundles of prompts + persona + rules + procedure)
       └── Workflows (ordered sequences of skills)
            └── Agents (automated workflow executors)
```

### Relational Links

| Parent | Child | Link Field |
|---|---|---|
| Prompt | Skill | `skill.embeddedPromptIds[]` → `prompt.id` |
| Skill | Workflow | `workflow.skillIds[]` → `skill.id` |
| Workflow | Agent | `agent.linkedWorkflowId` → `workflow.id` |

### Shared Patterns

All four entity types share:

- `id`, `category`, `folder`, `tags[]`, `createdAt`, `updatedAt`
- `isPinned` for quick-access
- Full CRUD via modal forms
- JSON import/export
- Folder and category filtering
- Grid and table view modes

### Skill-Specific Features

- **Procedure text**: Free-form text field that can contain `[VARIABLE]` references, auto-scanned by `scanSkillInputs()`.
- **LLM assembly**: `assembleSkillForLLM()` renders structured Markdown (Persona → Rules → Inputs → Procedure → Output Format).
- **Text-to-fields parsing**: `parseTextToSkillFields()` splits pasted text into persona, rules, output, and procedure sections using heading-based regex heuristics.
- **Run simulation**: `RunSkillModal` collects input values, assembles the skill text, and records an `ExecutionRun`.

### Workflow-Specific Features

- **Ordered skill chain**: `skillIds[]` defines execution order.
- **Trigger types**: manual, scheduled, event-based (metadata only — no actual scheduler).
- **Human review step**: Boolean toggle for workflows that need manual approval.
- **Run simulation**: `RunWorkflowModal` executes skills sequentially, collecting inputs per skill.

### Agent-Specific Features

- **Single workflow link**: Each agent maps to exactly one workflow.
- **Status management**: active / paused / error with toggle handler.
- **Memory & notifications**: Boolean `memoryEnabled` flag; optional `notificationMethod` string.
- **Metadata-only**: Agents are organizational records — there is no actual runtime or execution engine.

---

## Summary

Prompt Vault is a local-first, single-user organizer for AI instruction assets. It is deliberately not an execution engine or package manager. All data lives in the browser's localStorage across 7 keys. The architecture is a monolithic React SPA with all state centralized in `Index.tsx` (~1,650 lines). The four entity types (Prompts → Skills → Workflows → Agents) form a clear hierarchy connected by ID-based relational links. The versioning system enforces immutability guarantees with explicit user-triggered snapshots and word-level diff viewing. Variable parsing uses bracket-delimited `[KEY]` syntax with stoplist filtering and deduplication.
