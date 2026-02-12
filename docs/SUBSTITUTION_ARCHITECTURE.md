# Substitution Architecture

> Variable parsing, detection, normalization, and substitution across Prompt Vault.

---

## 1. Supported Placeholder Syntax

All three forms are supported system-wide:

```
[KEY]                    → Simple variable
[KEY:default]            → Variable with default/hint
[KEY:default/options]    → Variable with default and option list
```

The colon-separated suffix is metadata for the user; it is stripped during key normalization and does not affect substitution behavior.

---

## 2. Core Regex — `PLACEHOLDER_REGEX`

**File:** `src/types/index.ts`

```ts
const PLACEHOLDER_REGEX = /\[([^\]:\]]+)(?::[^\]]*)?\]/g;
```

Behavior:
- Capture group 1: everything between `[` and the first `:` (or `]`)
- Non-capturing group: optionally matches `:` followed by anything up to `]`
- The full match (`match[0]`) spans the entire `[KEY:default]` token
- Global flag (`g`) enables `matchAll` and `replace` iteration

**All detection and substitution paths must use this regex.** No alternate regex is permitted (per CLAUDE.md).

---

## 3. Key Normalization — `canonicalKey()`

**File:** `src/types/index.ts`

```ts
export function canonicalKey(raw: string): string {
  return raw.split(':')[0].trim();
}
```

Strips the colon suffix and trims whitespace. Returns the bare key name. This is the canonical form used for variable value lookups.

---

## 4. Detection Functions

### 4.1 `detectVariables(content)` — Prompt detection

**File:** `src/types/index.ts`

Used at prompt creation time to populate `prompt.variables[]`.

Flow: `matchAll(PLACEHOLDER_REGEX)` → `canonicalKey(m[1])` → stoplist filter → deduplicate → return `string[]`

Stoplist: `OPTIONAL`, `REQUIRED`, `EXAMPLE`, `NOTES`, `RULES`, `STEPS`

### 4.2 `extractAllVariables(content)` — Detail modal detection

**File:** `src/components/PromptDetailModal.tsx`

Identical logic to `detectVariables`. Used to build the variable input form in the detail modal.

### 4.3 `scanSkillInputs(text)` — Skill procedure detection

**File:** `src/types/index.ts`

Used to auto-detect `[VARIABLE]` patterns in skill procedure text.

Flow: `matchAll(PLACEHOLDER_REGEX)` → `canonicalKey(m[1])` → uppercase + underscore normalize → stoplist filter → deduplicate → return `string[]` formatted as `[NORMALIZED_KEY]`

Output items include surrounding brackets (e.g., `[TOPIC]`), matching the display format in the Skill modal.

---

## 5. Substitution Sites

### 5.1 Prompt Detail Modal — substituted copy

**File:** `src/components/PromptDetailModal.tsx` (lines 30–35)

```ts
function substituteVariables(content, values) {
  return content.replace(PLACEHOLDER_REGEX, (full, rawKey) => {
    const key = canonicalKey(rawKey);
    const v = values[key];
    return v !== undefined && v !== '' ? v : full;
  });
}
```

Handles both `[KEY]` and `[KEY:default]`. Used for clipboard copy and live preview.

### 5.2 Prompt Detail Modal — highlighted preview

**File:** `src/components/PromptDetailModal.tsx` (lines 39–70)

Same regex, builds React nodes with `<mark>` highlights for filled variables.

### 5.3 Skill Run Modal — execution substitution

**File:** `src/components/RunSkillModal.tsx` (lines 33–40)

Uses `PLACEHOLDER_REGEX` + `canonicalKey`. Looks up values via `.toUpperCase()` key.

### 5.4 Workflow Run Modal — execution substitution

**File:** `src/components/RunWorkflowModal.tsx` (lines 76–79)

Uses `PLACEHOLDER_REGEX` + `canonicalKey`. Inline within the workflow execution loop.

### 5.5 Card Quick-Copy — raw template

**File:** `src/pages/Index.tsx` (line 651)

Copies `prompt.content` directly to clipboard without substitution. This is by design — the button is labeled "COPY TEMPLATE" and preserves bracket tokens for reuse.

### 5.6 Skill LLM Assembly — template export

**File:** `src/types/index.ts` (`assembleSkillForLLM`)

Pass-through. Emits skill procedure text with brackets intact. No substitution applied.

---

## 6. Key Normalization Chain

```
Template text:  "Analyze [TOPIC:your subject here] for [AUDIENCE]"
                       │                                    │
  PLACEHOLDER_REGEX ───┤                                    │
                       ▼                                    ▼
  match[0]:  "[TOPIC:your subject here]"        "[AUDIENCE]"
  match[1]:  "TOPIC"                            "AUDIENCE"
                       │                                    │
  canonicalKey() ──────┤                                    │
                       ▼                                    ▼
  key:       "TOPIC"                            "AUDIENCE"
                       │                                    │
  values["TOPIC"] ─────┤    values["AUDIENCE"] ─────────────┤
                       ▼                                    ▼
  output:    "marketing"                        "developers"
```

---

## 7. Variable Value Storage

Variable values are stored as `Record<string, string>` dictionaries:

- **Runtime:** `varValues` state in `PromptDetailModal`, `inputs` in `RunSkillModal`, `inputValues` in `RunWorkflowModal`
- **Persisted:** `PromptVersionSnapshot.variableValues` — saved when creating a new version, restored when selecting a historical version

Keys in `variableValues` use the canonical form (output of `canonicalKey()`).

---

## 8. Invariants

1. All detection must use `PLACEHOLDER_REGEX` — no alternate regex.
2. All key extraction must use `canonicalKey()` — no manual colon-splitting.
3. Substitution replaces the full match (`match[0]`), including any `:default` suffix.
4. Unfilled variables are left as-is (the original bracket token is preserved).
5. The stoplist (`OPTIONAL`, `REQUIRED`, `EXAMPLE`, `NOTES`, `RULES`, `STEPS`) is applied during detection only, not during substitution.
