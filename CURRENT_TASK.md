# CURRENT TASK — Phase 1E: Derive Next Version from Snapshots

## Scope (modify only)
- src/pages/Index.tsx

## Problem
Version numbers are currently derived from promptObj.version.
This can cause incorrect numbering or duplicate v1.

## Required behavior

1) When creating a new version (inside handleSaveNewVersion / createVersionSnapshot):
   - Compute nextVersion as:
       nextVersion = 1 + max(snapshot.version)
     where snapshot.promptId === (prompt.parentId || prompt.id)

   - If no snapshots exist for that promptId:
       nextVersion = 1

2) Do NOT rely on promptObj.version to compute the next version.

3) After creating the snapshot:
   - Update the prompt's version field to nextVersion.

4) No other logic changes.
   - Do not modify restore logic.
   - Do not modify draft save logic.
   - Do not modify UI.

## Done when (live app)
- Creating multiple versions results in clean sequence:
    v1, v2, v3, v4...
- No duplicate v1 ever appears.
- Version numbers increment correctly even after reload.
