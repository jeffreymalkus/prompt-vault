

# Rebuild Version History: Create Automatic v1 Baseline

## Root Cause

No initial "v1" snapshot is created when a prompt is first interacted with. Version history starts empty, so there is nothing to diff against, nothing to restore, and all subsequent version operations are built on a missing foundation.

## Plan

### 1. Auto-create v1 baseline snapshot (Index.tsx)

Add an `ensureBaselineSnapshot` function that checks if any snapshots exist for a prompt. If none exist, it creates a v1 baseline from the prompt's current state.

Call this function:
- When a prompt is opened in the detail modal (`handlePromptDetailClick`)
- At the start of `handleSaveNewVersion` (safety net)
- At the start of `handleUpdateCurrent` (safety net)

This ensures every prompt always has at least one snapshot before any versioning operation runs.

### 2. Fix `handleUpdateCurrent` race condition (Index.tsx)

Currently it calls `createVersionSnapshot` and then separately mutates `prev[0]` to attach variable values. This is a race with React state batching.

Rewrite to build the complete snapshot (including `variableValues`) in a single `setVersionSnapshots` call. No separate mutation step.

### 3. Remove `contentExists` blocking check (Index.tsx)

The identical-content check on line 608-611 blocks valid saves where the user wants to save a named version with specific variable values but hasn't changed the prompt body. Remove it entirely -- duplicate name prevention is sufficient.

### 4. Make delete button always visible (VersionHistoryDrawer.tsx)

Remove `opacity-0 group-hover:opacity-100` so the trash icon is always visible. Allow deleting any version as long as at least one other version remains (protect against completely empty history).

### 5. Remove `duplicate-content` error case (PromptDetailModal.tsx)

Remove the UI handling for `duplicate-content` errors since that check is being removed from the backend logic.

## Technical Details

### `ensureBaselineSnapshot` function (new, in Index.tsx)

```text
function ensureBaselineSnapshot(prompt):
  key = prompt.parentId || prompt.id
  existing = versionSnapshots.filter(s => s.promptId === key)
  if existing.length === 0:
    create snapshot with:
      promptId: key
      content: prompt.content
      title: prompt.title
      version: 1
      commitMessage: "Initial version"
      variableValues: {}
    prepend to versionSnapshots
```

### Fixed `handleUpdateCurrent`

```text
function handleUpdateCurrent(promptObj, varValues):
  ensureBaselineSnapshot(promptObj)
  create snapshot with:
    all prompt fields
    variableValues: varValues (included directly)
    commitMessage: "Updated current"
  prepend to versionSnapshots in single setState call
```

### Fixed `handleSaveNewVersion`

```text
function handleSaveNewVersion(promptObj, varValues, versionName):
  ensureBaselineSnapshot(promptObj)
  check duplicate name (keep this)
  // no content check
  create snapshot with versionName and varValues
  increment prompt version
  return null (success)
```

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add `ensureBaselineSnapshot`; rewrite `handleUpdateCurrent` and `handleSaveNewVersion`; remove content-duplicate check; call baseline on detail open |
| `src/components/VersionHistoryDrawer.tsx` | Make delete button always visible; allow delete on any version when 2+ exist |
| `src/components/PromptDetailModal.tsx` | Remove `duplicate-content` error handling |

## Acceptance Tests

- Opening any prompt's version history shows at least a v1 baseline
- "Save New Version" works on first attempt (no empty history)
- "Update Current" properly saves variable values in one atomic operation
- Saving a version with same content but different name succeeds
- Duplicate version names are still blocked
- Delete button is visible on all versions; can delete any version when 2+ exist
- No USER/SYSTEM badges reintroduced

