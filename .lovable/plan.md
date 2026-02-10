

# Fix: Delete Button Not Rendering (Nested Button Problem)

## Root Cause

The version list items are rendered as `<button>` elements (line 115). The delete icon is also a `<button>` (line 137) nested inside. **HTML does not allow `<button>` inside `<button>`** -- browsers silently drop or ignore the inner one. This is why the trash icon is completely invisible regardless of styling.

## Fix

**Change the outer `<button>` to a `<div>`** with `role="button"`, `tabIndex={0}`, and a cursor style. This preserves accessibility and click behavior while allowing the inner delete `<button>` to render normally.

### File: `src/components/VersionHistoryDrawer.tsx`

**Lines 115-158** -- Replace the outer `<button>` with a `<div>`:

```text
Before:  <button key={v.id} onClick={...} className="w-full text-left p-3 ...">
After:   <div key={v.id} onClick={...} role="button" tabIndex={0} className="w-full text-left p-3 cursor-pointer ...">
```

And the closing tag:

```text
Before:  </button>
After:   </div>
```

No other changes needed -- the inner delete `<button>` already has `e.stopPropagation()`, correct `shrink-0`, `text-red-500`, and `size={14}` from the previous edit.

## Why This Fixes It

With the outer element as a `<div>`, the inner `<button>` is valid HTML and will render the red `Trash2` icon as intended. All existing layout fixes (`min-w-0`, `truncate`, `shrink-0`) will now take effect.

## Files Changed

| File | Change |
|------|--------|
| `src/components/VersionHistoryDrawer.tsx` | Change outer `<button>` to `<div>` with `role="button"` and `tabIndex={0}` on each version list item (lines 115 and 158) |

