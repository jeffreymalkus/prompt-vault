# CURRENT TASK — Phase 1B (Follow-up): Version Delete Button Visible + Wired

## Scope (modify only)
- src/pages/Index.tsx
- src/components/VersionHistoryDrawer.tsx

## Objective
The delete (trash) button must be visible and functional for every version except v1 baseline.

## Requirements
1) The delete button MUST render for v2+ versions.
2) v1 baseline must NOT show a delete button and must not be deletable.
3) Ensure `onDeleteVersion` is passed from Index into VersionHistoryDrawer (delete must be wired).
4) Ensure button is visibly on-screen (not clipped/offscreen):
   - If the button is absolutely positioned, ensure its container is `relative` and not overflow-clipped.

## Non-goals
- Do not change any other versioning behavior.
- Do not touch PromptCard or PromptModal.
- No refactors.

## Done when
- In the deployed Vercel app, the trash icon appears for v2+ rows (no hover required) and successfully deletes.
- v1 has no trash icon and cannot be deleted.
