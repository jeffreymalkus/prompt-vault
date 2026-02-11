# Prompt Vault — Project Brief

## Mission

Prompt Vault is a human-centered instruction vault.

It is not an AI runtime.
It is not an agent framework.
It is not an LLM wrapper.

It is a structured system for storing, organizing, versioning, and exporting high-quality AI instructions in a durable, file-native format.

The goal is to give humans control over AI behavior through clear, reusable, portable instruction artifacts.

---

## Core Philosophy

AI tools change rapidly.
Interfaces change.
Agent ecosystems change.
Models change.

Clear instructions endure.

Prompt Vault is built around the belief that:

- Instructions are assets.
- Structure increases reliability.
- Versioning creates trust.
- File-native storage creates portability.
- Human clarity reduces AI drift.

---

## What Prompt Vault Is

Prompt Vault is:

- A persistent repository for prompts.
- A structured skill/package storage system.
- A versioned instruction history system.
- A SKILL.md-compatible package exporter.
- A bridge between human thinking and AI execution.

---

## What Prompt Vault Is Not

Prompt Vault is NOT:

- An autonomous agent runner.
- A model hosting platform.
- A workflow automation engine.
- A speculative AI experiment lab.
- A constantly shifting architecture playground.

It prioritizes stability over trend chasing.

---

## Product Objectives

1. Establish trustworthy version history.
2. Prevent silent mutation of instruction history.
3. Enable file-native SKILL.md-compatible packages.
4. Preserve user-authored content exactly.
5. Allow GitHub import of structured skills.
6. Support clean export to external ecosystems.
7. Maintain predictable, minimal behavior.

---

## Design Principles

### 1. Preserve First

Imported files must remain unchanged.
Unknown frontmatter keys must survive edits.
User intent is never overwritten.

### 2. Enforce Light

On export:
- Warn on spec violations.
- Never hard-fail.
- Never block user action.

### 3. Immutability of History

Snapshots must be immutable.
Normal save must not create versions.
Only explicit “Save New Version” creates a snapshot.
v1 baseline must never be deleted.

### 4. File-Based Memory

Project state must persist in:
- Markdown specs
- Code
- Git history

Not in conversation context.

### 5. Bounded Execution

AI execution must:
- Operate phase-by-phase.
- Avoid repo-wide exploration.
- Modify only declared files.
- Avoid speculative architecture changes.

---

## Architecture Direction

Prompt Vault consists of:

1. Prompt system (existing)
2. Versioning system (stabilized)
3. Package system (SKILL.md-compatible)
4. GitHub import pipeline
5. Export utilities

All systems must remain:

- Understandable
- Deterministic
- Inspectable
- File-backed

---

## Long-Term Positioning

Prompt Vault is a durable instruction layer.

As models evolve, Prompt Vault remains useful because:

- Structured instruction outlives model APIs.
- SKILL.md compatibility enables ecosystem portability.
- Versioning builds institutional memory.
- Human-authored clarity reduces dependency on prompt optimization trends.

---

## Development Discipline

When using AI to develop this project:

- Planning must be written to markdown files.
- Execution must occur phase-by-phase.
- AI must not re-plan architecture unless explicitly requested.
- AI must not explore the entire repo unless necessary.
- Tasks must be bounded by file scope.

The repository is the source of truth.
Conversation is temporary scratch space.

---

## Success Criteria

Prompt Vault is successful when:

- Version history is predictable and trusted.
- Packages import/export cleanly.
- Unknown frontmatter survives edits.
- Builds are stable.
- The system feels durable, not experimental.

Stability over novelty.
Clarity over cleverness.
Durability over trend alignment.
