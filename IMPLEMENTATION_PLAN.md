# Prompt Vault — Implementation Plan (v3)

## Direction

Prompt Vault is an organizer for instruction assets.

It consists of:

1. Prompt Organizer (with stable versioning)
2. Skill Registry (ecosystem-aware metadata layer)

It does NOT:

- Store full skill file trees
- Replicate GitHub repositories
- Act as a package manager
- Execute skills
- Install skills automatically

GitHub stores files.
CLIs install skills.
Prompt Vault organizes knowledge.

---

# Phase 1 — Stabilize Prompt Versioning

## Objective

Establish trustworthy version history behavior.

## Files

- src/pages/Index.tsx
- src/components/VersionHistoryDrawer.tsx
- src/components/PromptModal.tsx (verify only)

## Requirements

- Normal Save updates draft only.
- Normal Save does NOT create a snapshot.
- Only "Save New Version" creates a snapshot.
- Restore does NOT create a snapshot.
- Snapshots are immutable.
- v1 baseline exists and cannot be deleted.
- commitMessage must remain exactly as typed.

## Completion Criteria

- Manual tests confirm invariant behavior.
- npm run build succeeds.
- No unintended snapshot creation occurs.

---

# Phase 2 — Skill Registry Data Model

## Objective

Create a structured metadata system for tracking skills across AI ecosystems.

## Data Model

New type: `SkillRecord`

SkillRecord {
id: string
name: string
// Where the skill runs
runtime: 'claude-code' | 'vercel' | 'opra' | 'chatgpt' | 'gemini' | 'other'
// Source reference
sourceUrl: string
// Description
description: string
problemSolved: string
// Technical compatibility
toolsRequired: string[] // e.g. shell, filesystem, web, repo
compatibleWith: string[] // optional additional environment notes
// How to install or activate
installationMethod: string // plain text instructions
// Personal tracking
notes: string
tags: string[]
status: 'saved' | 'tested' | 'adopted' | 'rejected'
createdAt: number
updatedAt: number
}


## Storage

- Local-first using localStorage.
- Key: `prompt_vault_skills`
- JSON serialized array of SkillRecord.

No file storage.
No recursive imports.
No SKILL.md parsing.

---

# Phase 3 — Skill Registry UI

## Components

- SkillCard.tsx
- SkillModal.tsx
- SkillDetailView.tsx

## Required Features

- Add skill manually.
- Edit skill metadata.
- View full skill details.
- Store installation instructions as text block.
- Tag skills.
- Assign status (saved / tested / adopted / rejected).

---

# Phase 4 — Filtering & Organization

## Objective

Enable rapid clarity across many skills.

## Add

- Search by:
  - name
  - description
  - tags

- Filter by:
  - runtime
  - status
  - toolsRequired

- Sort by:
  - recently added
  - recently updated
  - adopted first

Prompts and Skills remain separate sections.

---

# Phase 5 — Backup & Export

## Objective

Protect user data without backend complexity.

## Add

- "Export All Data" button:
  - Downloads full JSON snapshot:
    - prompts
    - versions
    - skills

- Optional later:
  - Import backup

No SKILL.md export.
No directory reconstruction.
No CLI integration.

---

# Non-Goals

The following are explicitly excluded:

- Recursive GitHub import
- SKILL.md preservation logic
- File tree editing
- Binary file handling
- File size guardrails
- Automated skill installation
- Multi-user sync
- Backend database (for now)

---

# Development Discipline

- Execute phase-by-phase.
- No architecture re-planning during execution.
- Modify only declared files per phase.
- Use CURRENT_TASK.md for bounded tasks.
- Treat markdown specs as persistent memory.

---

# Completion Definition

Prompt Vault v1 is complete when:

- Prompt versioning is stable and trusted.
- Skills can be added with runtime clarity.
- Installation instructions are easily accessible.
- Filtering reduces cognitive load.
- The system feels organized and durable.

Stability over novelty.
Organization over automation.
Clarity over complexity.
