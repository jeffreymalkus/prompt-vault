# CURRENT TASK — Phase 1C: Consolidate Version Creation

## Scope (modify only)
- src/pages/Index.tsx

## Goal
There must be exactly ONE way to create a snapshot.

## Required changes

1) Keep only ONE snapshot creation function:
   - Use createVersionSnapshot(prompt, commitMessage)

2) Remove ALL other direct snapshot constructions:
   - Any inline `const snapshot: PromptVersionSnapshot = {...}`
   - Any direct `setVersionSnapshots(prev => [snapshot, ...prev])`
   - Any duplicate baseline creation logic

3) ensureBaselineSnapshot may remain, but:
   - It must ONLY create a baseline if none exists.
   - It must NEVER create duplicates.

4) Only handleSaveNewVersion is allowed to call createVersionSnapshot.
   - No other function may create snapshots.

5) handleSavePrompt must NEVER create snapshots.
6) handleUpdateCurrent must NEVER create snapshots.
7) handleRestoreVersion must NEVER create snapshots.

## Done when
- There is exactly one createVersionSnapshot call site.
- Save New Version increments versions correctly.
- No duplicate v1 can ever be created.
