

# Fix Color Palette to Match Reference Design

## Problem Identified

The current design has readability issues because:
1. The background is sage green - but the reference shows a warm cream/gray background
2. Some buttons use hardcoded `text-muted-foreground` classes that override CSS variables
3. The secondary button color blends with the background

## Colors from Your Reference Image

| Element | Color | HSL |
|---------|-------|-----|
| Main Background | Warm cream-gray #EDE8E0 | 40 25% 90% |
| Sidebar/Cards | Warm cream #F6F1E8 | 40 33% 94% |
| Primary Button (New Prompt) | Dark teal #4A7C72 | 165 25% 39% |
| CTA Button (Add Your First) | Dark slate #2F3A3E | 195 15% 21% |
| Text | Dark charcoal #1F2A24 | 150 16% 14% |
| Accent (Active nav) | Terracotta #B96A4A | 18 45% 51% |

---

## Changes Required

### 1. src/index.css - Update Color Variables

Update both `:root` and `.dark` sections:

```css
/* Background: Warm cream-gray (not green) */
--background: 40 25% 90%;

/* Primary: Dark teal for main buttons - WHITE text */
--primary: 165 25% 39%;
--primary-foreground: 0 0% 100%;

/* Secondary: Dark slate/charcoal - WHITE text */
--secondary: 195 15% 25%;
--secondary-foreground: 0 0% 100%;

/* Muted: Light warm tones, readable dark text */
--muted: 40 15% 85%;
--muted-foreground: 150 12% 30%;

/* Border: Subtle warm gray */
--border: 40 10% 75%;
--input: 40 10% 75%;
```

### 2. src/pages/Index.tsx - Fix Button Text Colors

Some buttons explicitly use `text-muted-foreground` which makes button text unreadable. These need to change to `text-secondary-foreground`:

**Line 554** - Import button:
```tsx
// Before
className="... text-muted-foreground ..."
// After  
className="... text-secondary-foreground ..."
```

**Line 563** - Export button:
```tsx
// Before
className="... text-muted-foreground ..."
// After
className="... text-secondary-foreground ..."
```

---

## Visual Result

| Element | Before | After |
|---------|--------|-------|
| Background | Sage green (hard to read) | Warm cream-gray (easy on eyes) |
| Primary buttons | Terracotta | Dark teal with white text |
| Secondary buttons | Sage (fades into bg) | Dark slate with white text |
| Button text | Sometimes dark on dark | Always white on dark buttons |
| Cards | Cream (good) | Cream (unchanged) |

---

## Why This Works

1. **Warm neutral background** - Cream-gray is easier to read than green
2. **High contrast buttons** - Dark buttons (25% lightness) with white text (100%)
3. **Consistent text colors** - All buttons get white text via CSS variables
4. **No hardcoded overrides** - Button text uses `secondary-foreground` which maps to white

