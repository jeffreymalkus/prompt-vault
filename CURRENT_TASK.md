# CURRENT TASK — Phase 1B Hotfix: Make Version Delete Unmissable

## Scope (modify only)
- src/components/VersionHistoryDrawer.tsx

## Required behavior
- For every version except v1 baseline, render a visible inline "Delete" button (text button is fine).
- v1 baseline must not show a delete control.
- Clicking Delete calls onDeleteVersion(versionId).
- No absolute positioning. No icon-only control.

## Non-goals
- No other changes.
- No refactors.

## Done when
In the deployed Vercel app, the inline Delete control is visible for v2+ and deletes; v1 has none.
