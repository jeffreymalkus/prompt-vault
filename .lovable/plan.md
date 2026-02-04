

# Make Background Green Lighter

A simple CSS change to increase the lightness of the sage green background from 58% to 75%.

---

## Current vs New

| Property | Current | New |
|----------|---------|-----|
| Background | `138 10% 58%` (darker sage) | `138 10% 75%` (lighter sage) |

The hue (138 - green) and saturation (10% - muted) stay the same, only the lightness increases.

---

## File to Modify

### src/index.css

Update the `--background` variable in both `:root` and `.dark` sections:

```css
/* Before */
--background: 138 10% 58%;

/* After */
--background: 138 10% 75%;
```

---

## Visual Result

- Current: A medium-dark muted sage green (#8A9B8F)
- After: A lighter, softer sage green (approximately #B8C4BB)

This will make the background feel airier and provide better contrast with the cream-colored cards.

