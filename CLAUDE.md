# CLAUDE.md — Project Operating Instructions

## Project Identity
This repository contains **Prompt Vault**, a local-first React + TypeScript application for organizing and operationalizing AI instruction assets.

Core entity hierarchy:
Prompts → Skills → Workflows → Agents

The system is evolving from a prompt notebook into a structured **Skill Engine** capable of:
1. **Composing** skills from internal prompts.
2. **Collecting** full Markdown skills from external sources (e.g., Claude Code, GitHub).

The repository is the sole source of truth. Do not rely on chat history.

---

# Execution Model
All work follows a sprint structure:
1. Diagnose
2. Plan
3. Implement
4. Validate

Do not skip phases. Do not implement changes until a plan is approved.

---

# Multi-Agent Handoff Protocol
This project uses a tag-team model between **Antigravity (IDE/Architect)** and **Claude Code (CLI/Implementer)**.

- **Context Bridge:** Use `IMPLEMENTATION_PLAN.md` to track multi-phase features.
- **Session Continuity:** If an agent hits a limit, it must summarize the current status and "Next Step" in `CURRENT_TASK.md` before exiting.
- **Conflict Prevention:** Always `git commit` before switching agents to avoid overwriting work.

---

# Code Change Rules
- Make minimal, surgical edits.
- Do not refactor unrelated code.
- Preserve existing naming conventions and data structures.
- **Disclosure:** Before editing, list files to be modified, purpose, and risk assessment.

---

# Variable System Rules (Core Infrastructure)
## Syntax
[KEY] | [KEY:default] | [KEY:default/options]

## Implementation
- Use shared `PLACEHOLDER_REGEX` for all detection.
- Use `canonicalKey()` for normalization.
- All substitution paths must support the `:default/options` suffix.

---

# Versioning System Rules
- Only “Save New Version” creates snapshots.
- Restore must not create snapshots.
