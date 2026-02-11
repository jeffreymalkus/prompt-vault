
# CURRENT TASK — Phase 1F: Edit Screen UX (Save vs Save New Version)

## Scope (modify only)
- src/components/PromptModal.tsx

## Objective
Make the edit screen buttons and flow unambiguous and consistent.

## Required behavior

1) Rename the primary draft-save action:
   - Button text "Update Current" must become "Save".
   - This action must update the current draft only.
   - It must NOT create a snapshot/version.

2) Rename the version creation action:
   - Button text "Save as vX" (or similar) must become "Save New Version".
   - Do NOT show the version number in the button label.

3) Add a minimal title prompt when "Save New Version" is clicked:
   - Show a small inline modal/dialog (or simple inline panel) with:
     - single text input: "Version title"
     - buttons: Cancel, Save New Version
   - If Cancel or empty title: do nothing (no snapshot).
   - If title provided: call the existing onSaveNewVersion handler with the title exactly as typed.

## Constraints
- Do not modify any logic in Index.tsx.
- Do not change version numbering logic.
- Do not change restore behavior.
- No UI redesign beyond the minimal title prompt.

## Done when (live app)
- Edit screen shows two buttons: "Save" and "Save New Version".
- Clicking Save updates draft only (no new version).
- Clicking Save New Version prompts for a title and then creates exactly one new version with that title.
