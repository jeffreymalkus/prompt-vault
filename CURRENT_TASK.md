Phase 1A — Snapshot Creation vs Draft Save vs Restore

Scope
Modify only:
- src/pages/Index.tsx

Do NOT:
- Modify any other files
- Redesign architecture
- Touch delete rules or commitMessage logic
- Explore unrelated parts of the repo

Objective
Establish correct snapshot creation behavior.

Required Behavior
1) Normal Save:
   - Updates draft content + variables ONLY.
   - MUST NOT create a snapshot/version.

2) Save New Version:
   - The ONLY action that creates a snapshot/version.

3) Restore This Version:
   - MUST NOT create a snapshot/version.
   - ONLY updates editor state (content + variables).

Acceptance Criteria
- Save → version count does not change.
- Save New Version → version count increases by exactly 1.
- Restore → editor updates, version count does not change.
- No restore-triggered save loops.

Output unified diff only.
