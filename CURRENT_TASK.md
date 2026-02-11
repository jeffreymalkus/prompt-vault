# CURRENT TASK — Phase 1G: Prompt Card Editing Parity (Body + Variables + Save/New Version)

## Scope (modify only)
- src/components/PromptCard.tsx
- src/pages/Index.tsx (only if required to pass handlers/props; no other changes)

## Objective
The prompt card view must allow editing the prompt BODY inline (not only variables) and must use the same Save vs Save New Version semantics as the edit screen.

## Required behavior

1) Inline body editing
- PromptCard must allow editing prompt.content (body) directly on the card via a textarea.
- It must be editable by default when viewing a prompt card (same as variables).

2) Save (draft-only)
- Card must have a "Save" action (use existing "Update Current" if present but rename it to "Save").
- Save updates the current draft only:
  - persists edited prompt.content
  - persists edited variable values
- Save must NOT create a snapshot/version.

3) Save New Version (with title prompt)
- Card must have a "Save New Version" action.
- Clicking it must prompt for a version title (minimal inline prompt/modal is fine).
- If cancelled or title is empty: do nothing.
- If title provided: call the existing onSaveNewVersion handler with the title exactly as typed, using the current edited body + current variable values.

4) No duplicate version logic
- PromptCard must not create snapshots directly.
- It must call the existing handlers passed from Index.

## Constraints
- Do not modify restore behavior.
- Do not modify version engine logic (Index.tsx) beyond wiring required props.
- Keep UI changes minimal; no redesign.

## Done when (live app)
- On the prompt card, I can edit body + variables.
- Clicking Save updates the current draft without creating a new version.
- Clicking Save New Version prompts for a title and creates a new version that includes BOTH:
  - the edited body
  - the edited variables
