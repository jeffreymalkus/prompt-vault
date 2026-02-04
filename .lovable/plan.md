
# Theme Copy: Match Fonts and Colors from Project 34c8a5dc

This plan copies the typography and color system from your other project (34c8a5dc) to this one (506ca747), while keeping all functionality unchanged.

---

## Summary of Changes

Based on the source project's `tailwind.config.ts`, I will:

1. **Add font imports** for Crimson Pro (serif) and Inter (sans-serif)
2. **Update CSS variables** to match the source project's design system
3. **Update tailwind.config.ts** to include the font families and additional theme tokens

---

## Files to Modify

### 1. index.html
Add Google Fonts imports for Crimson Pro and Inter:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 2. src/index.css
Replace CSS variables in `:root` to align with the source project's design system:

```text
:root Variables to Update/Add
+----------------------------------+
| Colors (keeping warm sage theme) |
| --shadow-card                    |
| --shadow-card-hover              |
| --shadow-soft                    |
| --amber (for pinned items)       |
| --amber-foreground               |
| --amber-muted                    |
| Sidebar-specific tokens          |
+----------------------------------+
```

Update body font-family to use Inter as sans-serif and add serif support.

### 3. tailwind.config.ts
Add from source project:
- `fontFamily` configuration (serif: Crimson Pro, sans: Inter)
- `amber` color tokens for pinned highlights
- `sidebar` color tokens
- `boxShadow` variables (card, card-hover, soft)
- Additional keyframes (fade-in, slide-in)

---

## Technical Details

### CSS Variables to Add
```css
/* Shadow system */
--shadow-card: 0 1px 3px rgba(0,0,0,0.08);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.1);
--shadow-soft: 0 2px 8px rgba(0,0,0,0.06);

/* Amber/Gold for pinned items */
--amber: 40 60% 55%;
--amber-foreground: 40 20% 15%;
--amber-muted: 40 40% 85%;

/* Sidebar tokens */
--sidebar-background: (matches card)
--sidebar-foreground: (matches foreground)
--sidebar-primary: (matches primary)
--sidebar-accent: (matches accent)
--sidebar-border: (matches border)
```

### Font Configuration
```ts
fontFamily: {
  serif: ["'Crimson Pro'", "Georgia", "serif"],
  sans: ["'Inter'", "system-ui", "sans-serif"],
}
```

### Body Styling
```css
body {
  @apply bg-background text-foreground;
  font-family: 'Inter', system-ui, sans-serif;
}
```

---

## What Stays the Same
- All React component logic
- LocalStorage implementation
- Import/Export functionality
- Layout and structure
- The warm sage/cream/terracotta color palette (core brand colors preserved)

---

## Result
After this change, the app will have:
- Elegant serif headings available via `font-serif` class
- Clean Inter font for body text
- Consistent shadow system matching your other project
- Amber highlight tokens for pinned items
- Sidebar-specific tokens for future sidebar enhancements
