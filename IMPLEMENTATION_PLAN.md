# Prompt Vault — Implementation Plan (v4)

## Direction

Prompt Vault is an organizer for instruction assets.

It consists of:

1. Prompt Organizer (with stable versioning)
2. Skill Registry (ecosystem-aware metadata layer)
3. Backup & Restore safety net

It does NOT:

- Store skill file trees
- Mirror GitHub repositories
- Act as a package manager
- Execute or auto-install skills
- Integrate directly with CLIs
- Provide multi-user sync (v1 is local-first)

GitHub stores files.
CLIs install skills.
Prompt Vault organizes knowledge.

---

# Phase 1 — Prompt Versioning Stability

## Objective

Establish trustworthy version history behavior.

## Requirements

- Normal Save updates draft only.
- Normal Save does NOT create a snapshot.
- Only "Save New Version" creates a snapshot.
- Restore does NOT create a snapshot.
- Snapshots are immutable.
- v1 baseline exists and cannot be deleted.
- commitMessage must remain exactly as typed.

## Completion Criteria

- Manual verification confirms invariants.
- No unintended snapshot creation.
- Build succeeds.

---

# Phase 2 — Skill Registry Data Model

## Objective

Introduce structured metadata system for tracking external skills.

## SkillRecord Schema

SkillRecord {
  id: string

  name: string

  runtime:
    'claude-code' |
    'vercel' |
    'opra' |
    'chatgpt' |
    'gemini' |
    'other'

  sourceUrl: string

  description: string
  problemSolved: string

  toolsRequired: string[]
  compatibleWith: string[]

  installationMethod: string

  notes: string
  tags: string[]

  status: 'saved' | 'tested' | 'adopted' | 'rejected'

  createdAt: number
  updatedAt: number
}

## Storage

- Local-first (localStorage)
- Key: prompt_vault_skills
- JSON serialized array of SkillRecord

No file replication.
No recursive GitHub import.
No SKILL.md parsing.

---

# Phase 3 — Skill Registry UI (CRUD)

## Objective

Allow full management of SkillRecord entries.

## 3A — List + Read-Only Cards

- Render all skills.
- Show:
  - name
  - runtime
  - truncated description
  - status
  - tags
- "Open Source" button.
- Empty state message if no skills.

## 3B — Create Skill

- "Add Skill" button.
- Modal form for all schema fields.
- Save creates new SkillRecord with timestamps.
- Persist to localStorage.

## 3C — Edit, Delete, Copy Install

- Edit button (prefilled modal).
- Delete button (confirm required).
- Copy Install button (copies installationMethod).
- Persist updates correctly.

---

# Phase 4 — Filtering & Sorting

## Objective

Enable clarity across many skills.

## 4A — Search + Runtime/Status Filters

Add:

- Search (matches name, description, tags, runtime)
- Runtime filter dropdown
- Status filter dropdown

Filters must compose.

## 4B — Tools Filter + Sorting

Add:

- ToolsRequired filter dropdown (deduped tool list)
- Sort options:
  - Recently updated (default)
  - Recently added
  - Name A–Z
  - Status (adopted → tested → saved → rejected)

Apply filtering first, sorting last.

No filter persistence in v1.

---

# Phase 5 — Backup & Restore

## Objective

Protect user data without backend complexity.

## 5A — Export All Data

- "Export All Data" button.
- Downloads JSON:

{
  "schemaVersion": 1,
  "exportedAt": timestamp,
  "data": {
    "prompts": [...],
    "versions": [...],
    "skills": [...]
  }
}

Filename format:
prompt-vault-backup-YYYY-MM-DD.json

## 5B — Import Backup

- File picker (.json)
- Validate:
  - schemaVersion === 1
  - prompts array
  - versions array
  - skills array
- Confirm overwrite.
- Replace in-memory state + localStorage.
- Fail safely on invalid JSON.

---

# Non-Goals (Explicitly Excluded)

- Recursive GitHub import
- SKILL.md directory reconstruction
- Package manager behavior
- CLI integration
- Auto-install skills
- Multi-user sync
- Supabase or backend database
- Agent execution layer (future consideration)

---

# Definition of v1 Complete

Prompt Vault v1 is complete when:

- Prompt versioning is stable and predictable.
- Skills can be added, edited, categorized, and filtered.
- Installation instructions are easily accessible.
- Data can be exported and restored safely.
- The product feels organized and durable.

Stability over novelty.
Clarity over complexity.
Organization over automation.
