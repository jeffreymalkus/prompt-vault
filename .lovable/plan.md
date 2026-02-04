

# Fix All Dark Green Elements for Better Readability

I found the problem - while the background was lightened, all the other green-based elements (buttons, borders, muted text) are still very dark. This creates poor contrast and makes the app hard to read.

---

## Elements to Lighten

| Token | Current (Dark) | New (Lighter) | Used For |
|-------|----------------|---------------|----------|
| `--secondary` | 52% lightness | 72% | Secondary buttons, backgrounds |
| `--muted` | 48% lightness | 65% | Muted backgrounds, tags |
| `--muted-foreground` | 28% lightness | 45% | Secondary text |
| `--border` | 50% lightness | 65% | All borders |
| `--input` | 50% lightness | 65% | Input field borders |
| `--sidebar-border` | 50% lightness | 65% | Sidebar borders |

---

## File to Modify

**src/index.css** - Update these values in both `:root` and `.dark`:

```css
/* Secondary: Lighter sage (was 52%, now 72%) */
--secondary: 138 10% 72%;
--secondary-foreground: 150 16% 20%;

/* Muted: Lighter desaturated sage (was 48%, now 65%) */
--muted: 138 8% 65%;
--muted-foreground: 150 10% 45%;

/* Border: Lighter sage (was 50%, now 65%) */
--border: 138 8% 65%;
--input: 138 8% 65%;

/* Sidebar border */
--sidebar-border: 138 8% 65%;
```

---

## Result

- Secondary buttons will be softer and easier on the eyes
- Borders will be subtle rather than harsh
- Muted text will have better contrast against backgrounds
- Overall app will feel lighter and more readable

