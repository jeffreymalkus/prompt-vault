# Prompt Vault --- Implementation Plan

## Overview

Prompt Vault is being repositioned as a human-centered instruction
vault.

This implementation has two tracks:

1.  Fix versioning trust issues.
2.  Introduce a SKILL.md-compatible Package system for file-native
    storage, GitHub import, and export.

Packages must be compatible with `npx skills add`.

------------------------------------------------------------------------

# SKILL.md Compatibility --- Preserve First, Enforce Light

-   Entrypoint file: `SKILL.md`
-   YAML frontmatter required (name, description; others optional)
-   Skill directory structure:
    -   SKILL.md
    -   Optional: scripts/, references/, assets/

Rules:

-   On import:
    -   Do NOT enforce kebab-case or spec limits.
    -   Preserve all frontmatter keys.
    -   Preserve file names and folder structure exactly.
-   On export:
    -   Sanitize folder name (lowercase, spaces → hyphens).
    -   Warn on spec violations.
    -   Never hard-fail export.

Unknown frontmatter keys must always be preserved.

------------------------------------------------------------------------

# Phase 1 --- Fix Versioning Invariants

## Files to Modify

-   src/pages/Index.tsx
-   src/components/VersionHistoryDrawer.tsx
-   src/components/PromptModal.tsx (verify only)

## Requirements

-   Normal Save updates prompt data only.
-   Normal Save does NOT create a snapshot.
-   Only "Save New Version" creates a snapshot.
-   Restore does NOT create a snapshot.
-   Snapshots are immutable.
-   v1 baseline exists and cannot be deleted.
-   commitMessage must equal exactly what the user typed.

## Specific Adjustments

### src/pages/Index.tsx

-   Remove all createVersionSnapshot() calls from handleSavePrompt.
-   Remove any auto-snapshot creation from handleUpdateCurrent.
-   Keep handleSaveNewVersion as the only snapshot creation path.
-   Ensure ensureBaselineSnapshot does not regenerate v1.

### src/components/VersionHistoryDrawer.tsx

Replace:

const canDelete = true;

With:

const isV1 = v.version === 1; const canDelete = !isV1;

------------------------------------------------------------------------

# Phase 2 --- Package Data Model + Storage

## New File

src/types/package.ts

### Types

export type PackageSourceType = 'local' \| 'github' \| 'url';

export interface PackageFile { path: string; content: string; sha?:
string; }

export interface Package { id: string; sourceType: PackageSourceType;
sourceRef?: string; entrypoint: string; files: PackageFile\[\];
frontmatter: Record\<string, any\>; searchIndexFields: { name: string;
description: string; tags: string\[\]; keywords: string\[\]; };
category: string; folder: string; createdAt: number; updatedAt: number;
usageCount: number; isPinned?: boolean; }

### Utilities (same file)

-   parseFrontmatter(markdown)
-   serializeFrontmatter(frontmatter, body)
-   assemblePackageForLLM(pkg)
-   skillToPackage(skill, prompts)

## Modify src/types/index.ts

-   Add 'packages' to ActiveSection
-   Re-export from ./package

## Modify src/pages/Index.tsx

-   Add packages state
-   Persist to prompt_vault_packages (localStorage)
-   Add CRUD handlers
-   Add filteredPackages
-   Add one-time skill → package migration

------------------------------------------------------------------------

# Phase 3 --- GitHub Import

## Guardrails

-   Max 50 files
-   Max 512KB total content
-   Skip binaries (.png, .jpg, .zip, etc.)
-   Skip individual files \> 100KB
-   Warn if localStorage exceeds 2MB

## New File

src/utils/githubImporter.ts

Functions:

-   parseGitHubURL(url)
-   fetchGitHubDirectory(...)
-   fetchGitHubFile(...)
-   importGitHubPackage(url)

Entrypoint priority:

SKILL.md \> AGENTS.md \> first .md file

------------------------------------------------------------------------

# Phase 4 --- Package UI

New components:

-   PackageCard.tsx
-   PackageDetailModal.tsx
-   PackageModal.tsx
-   PackageImportModal.tsx

Modify:

-   NavigationTabs.tsx
-   Index.tsx

------------------------------------------------------------------------

# Phase 5 --- Export Actions

New file:

src/utils/packageExporter.ts

Functions:

-   copyPackageForLLM(pkg, includeSupporting = false)
-   downloadPackageAsText(pkg)
-   exportAsSkillDirectory(pkg)

ZIP export deferred.

------------------------------------------------------------------------

# Verification Checklist

1.  Save does not create snapshot.
2.  Save New Version creates snapshot.
3.  Restore does not create snapshot.
4.  v1 cannot be deleted.
5.  Packages create/edit/save correctly.
6.  GitHub import preserves structure.
7.  Unknown frontmatter keys are preserved.
8.  Export produces valid SKILL.md format.
9.  npm run build succeeds.
10. Deployment succeeds.
