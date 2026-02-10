

# Fix Delete Icon: Remove ScrollArea Clipping

## Root Cause

The `ScrollArea` component applies `overflow: hidden` on its viewport. The narrow `w-64` sidebar combined with `ml-5` margin on the timestamp row leaves no visible space for the delete button -- it gets clipped by the ScrollArea viewport even though it exists in the DOM.

Previous attempts to reposition the button within flex rows have all failed because the ScrollArea viewport clips ANY horizontal overflow.

## Solution

Two-part fix:

### 1. Override ScrollArea viewport overflow (line ~107)

Add a className to the ScrollArea that forces its viewport to allow visible overflow horizontally. Since the Radix ScrollArea viewport has `overflow: hidden` by default, we need to target it with a CSS override.

Replace:
```
<ScrollArea className="flex-1">
```
With:
```
<ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]]:!overflow-x-visible">
```

This uses a Tailwind arbitrary selector to override the Radix viewport's `overflow: hidden` to `overflow-x: visible`, allowing the button to render without being clipped.

### 2. Simplify the delete button placement (fallback)

If the CSS override alone doesn't work (due to ScrollArea structure), also reduce the `ml-5` on the timestamp row to `ml-4` and ensure the delete button has explicit dimensions:

Change line 145:
```
<div className="flex items-center justify-between ml-5 mt-1">
```
To:
```
<div className="flex items-center justify-between ml-4 mt-1">
```

And ensure the button has a fixed minimum width:
```
className="shrink-0 ml-1 p-1 hover:bg-destructive/20 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
```

### 3. Alternative: absolute positioning (if above still clips)

If the overflow approach still fails, position the delete button absolutely in the top-right corner of each version card:

- Add `relative` to the outer `<div>` wrapper (line 115)
- Remove the delete button from the timestamp row
- Place it as: `<button className="absolute top-2 right-2 ...">`

This guarantees visibility because it's positioned relative to the card, not flowing in a flex row.

## Recommended approach

Implement option 3 (absolute positioning) directly, as it is the most robust solution and immune to ScrollArea clipping issues. The version card already has `p-3` padding, so placing the button at `top-2 right-2` will look natural.

### Specific changes to `src/components/VersionHistoryDrawer.tsx`:

**Line 115**: Add `relative` to the outer div className  
**Lines 145-158**: Remove the delete button from the timestamp row  
**Line 126 (after the header div)**: Insert the delete button with absolute positioning:

```tsx
{onDeleteVersion && (
  <button
    onClick={(e) => { e.stopPropagation(); if (canDelete) handleDelete(e, v.id); }}
    disabled={!canDelete}
    className="absolute top-2 right-2 shrink-0 p-1 hover:bg-destructive/20 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    title={!canDelete ? (isV1 ? 'Cannot delete initial version' : 'Must keep at least one version') : 'Delete version'}
  >
    <Trash2 size={14} className="text-red-500" />
  </button>
)}
```

**Restore the timestamp row** to a simple `<span>`:
```tsx
<span className="text-[10px] text-muted-foreground/50 ml-5 mt-1 block">
  {new Date(v.createdAt).toLocaleDateString()} ...
</span>
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/VersionHistoryDrawer.tsx` | Add `relative` to version card div, move delete button to absolute `top-2 right-2` position |
