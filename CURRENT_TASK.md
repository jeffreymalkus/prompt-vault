# CURRENT TASK — Phase 1D: Version History Must Show Snapshot Body

## Scope (modify only)
- src/components/VersionHistoryDrawer.tsx

## Bug
Selecting a version shows its variables, but the body/diff is anchored to prompt.content (current), making old versions appear to change when the current body changes.

## Required behavior
1) When a version is selected, the main body displayed in the right panel must come from selectedVersion.content.
2) The diff view must NOT use prompt.content as the “new text” when a version is selected.
   - Compare selectedVersion.content to the previous snapshot’s content (preferred), OR
   - If comparing to current, label it clearly as “Compared to Current”, but the main displayed body still must be selectedVersion.content.

3) No other behavior changes.

## Done when (live app)
- Clicking older versions shows the body as it existed in that version.
- Changing the current prompt body does not retroactively change how older versions display.
