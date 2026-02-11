Phase 1B — Snapshot Immutability + Version Delete Rules

Scope
Modify only:
- src/pages/Index.tsx
- src/components/VersionHistoryDrawer.tsx

Do NOT:
- Modify PromptModal.tsx
- Change save vs restore logic
- Redesign data model
- Modify unrelated files

Objective
Enforce snapshot immutability and correct version deletion rules.

Required Behavior
1) Snapshots are immutable:
   - Creating a new version must NOT mutate existing versions.
   - Use deep copy when storing snapshot content/variables.

2) Version deletion rules:
   - Prompt deletion (from list view) remains allowed.
   - Inside Version History only:
       - v1 baseline is NOT deletable.
       - All later versions ARE deletable.
       - User may delete all modifications and end with only v1.

3) Delete button in VersionHistoryDrawer:
   - Must always be visible (no opacity-0 / group-hover-only).
   - Disabled or hidden ONLY for v1 baseline.

Acceptance Criteria
- Create v2, v3 → delete v3, delete v2 → only v1 remains.
- v1 cannot be deleted inside version history.
- Creating a new version does not change older version data.

Output unified diff only.
