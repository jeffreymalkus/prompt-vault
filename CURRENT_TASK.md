# Current Task — Phase 1: Versioning Invariants

## Scope

Modify only:

- src/pages/Index.tsx
- src/components/VersionHistoryDrawer.tsx
- src/components/PromptModal.tsx (verify only)

## Required Behavior

- Normal Save must NOT create a snapshot.
- Only "Save New Version" creates a snapshot.
- Restore must NOT create a snapshot.
- Snapshots are immutable.
- v1 baseline cannot be deleted.
- commitMessage must remain exactly what the user typed.

## Constraints

- Do not explore the entire repo.
- Do not modify unrelated files.
- Do not re-plan architecture.
- Output unified diff only.
