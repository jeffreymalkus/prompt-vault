# CURRENT_TASK.md — Active Sprint

## Sprint Title
Substitution System Consistency & Validation

---

## Sprint Goal

Ensure that all variable substitution mechanisms across the application consistently support:

- [KEY]
- [KEY:default]
- [KEY:default/options]

This sprint validates the recent substitution fixes and hardens the system against regression.

---

## Context

Recent changes unified placeholder parsing and substitution logic using:

- PLACEHOLDER_REGEX
- canonicalKey()

Fixes were applied to:

- RunSkillModal substitution
- RunWorkflowModal substitution
- Shared parsing utilities

We must now confirm system-wide consistency.

---

## Scope

### Included

- Prompt copy flows
- Prompt detail modal substitution
- Skill execution substitution
- Workflow execution substitution
- Export / assembly outputs
- Version snapshot variable persistence

### Excluded

- New feature development
- UI redesign
- Parsing syntax changes
- Versioning architecture changes

---

## Workstreams

### 1) Substitution Audit Agent

Trace every substitution implementation and confirm support for:

- [KEY]
- [KEY:default/options]

Identify any literal token matching logic such as:

\[KEY\]

Flag inconsistencies.

---

### 2) Variable Integrity Agent

Validate alignment between:

- Detection (PLACEHOLDER_REGEX)
- Canonicalization (canonicalKey)
- Storage (variableValues)
- Substitution outputs

Ensure consistent key derivation across all layers.

---

### 3) Regression Risk Agent

Identify system surfaces vulnerable to substitution drift:

- Skill assembly
- Workflow chaining
- Snapshot restoration
- Import/export parsing

Produce a risk register.

---

### 4) QA Validation Agent

Produce a manual smoke test checklist covering:

- Prompt detail substitution
- Card copy behavior (expected raw vs substituted)
- Skill run outputs
- Workflow run outputs
- Snapshot variable restoration

---

### 5) Documentation Agent

Update or create:

/docs/SUBSTITUTION_ARCHITECTURE.md

Document:

- Parsing model
- Substitution model
- Key normalization rules
- Supported placeholder syntax

---

## Deliverables

Cowork should produce:

1. Substitution consistency matrix
2. File-level audit findings
3. Minimal fix list (if required)
4. Regression risk log
5. Validation checklist
6. Documentation updates

---

## Implementation Constraints

If fixes are required:

- Reuse PLACEHOLDER_REGEX
- Reuse canonicalKey()
- Do not introduce alternate parsing logic
- Do not alter variable syntax
- Make minimal, surgical edits only

---

## Validation Requirements

After implementation:

- Build must compile cleanly
- No TypeScript errors
- No substitution regressions
- No snapshot integrity impact

---

## Definition of Done

Sprint is complete when:

- All substitution paths support [KEY:default/options]
- No literal token replacement logic remains
- Validation checklist passes
- Documentation is updated
- No regressions detected

---

## Execution Mode

Operate under CLAUDE.md instructions:

Diagnose → Plan → Implement → Validate

Do not implement changes without plan approval.

---

# End of Current Task
