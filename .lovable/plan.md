

# Fix Delete Icon Visibility in Version History Sidebar

## Root Cause

The `ScrollArea` component wrapping the version list applies `overflow: hidden` on its viewport. Combined with the `w-64` sidebar, the delete button at the end of the `flex justify-between` row is being clipped -- the row content overflows horizontally and the ScrollArea hides it.

The observer tool confirms: **zero delete buttons or trash icons are found in the DOM** as interactive elements, meaning they are rendered but completely hidden by overflow clipping.

## Solution

Move the delete button out of the cramped header row and place it on its own line (next to the timestamp) where there is ample horizontal space. This guarantees visibility regardless of version name length.

Additionally, add `overflow-visible` to the inner content wrapper to prevent clipping.

## Changes

### File: `src/components/VersionHistoryDrawer.tsx`

**1. Restructure the version item layout (lines ~126-148)**

Remove the delete button from the header row (the `flex justify-between` div with the version name). Instead, place it in the timestamp row at the bottom of each version item:

```text
Before:
  [GitCommit icon] [version name + LATEST badge] [delete button]  <-- cramped, clipped
  [commit message]
  [content preview]
  [timestamp]

After:
  [GitCommit icon] [version name + LATEST badge]
  [commit message]
  [content preview]
  [timestamp]                              [delete button]  <-- plenty of space
```

The timestamp row will become a `flex justify-between items-center` container holding the date on the left and the delete button on the right.

**2. Specific code changes:**

- Remove the `{onDeleteVersion && (...)}` block from lines 138-147 (inside the header `flex justify-between` div)
- Simplify the header div back to just `flex items-center gap-2` (no need for `justify-between` anymore)
- Change the timestamp `<p>` (line 157) into a `<div>` with `flex items-center justify-between`
- Place the delete button inside that new timestamp row div
- Keep all existing guards: `canDelete = sortedVersions.length > 1 && !isV1`
- Keep icon as `Trash2 size={14} className="text-red-500"`
- Keep `shrink-0` on the button

This approach avoids any ScrollArea overflow issues because the timestamp row is never horizontally crowded.

## Technical Details

| What | Detail |
|------|--------|
| File | `src/components/VersionHistoryDrawer.tsx` |
| Lines affected | ~126-159 (version item layout) |
| Root cause | ScrollArea overflow:hidden clips the delete button |
| Fix approach | Move delete button to timestamp row where space is available |
| Guards preserved | v1 cannot be deleted; last version cannot be deleted |
