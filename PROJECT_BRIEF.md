# Prompt Vault — Project Brief

## Mission

Prompt Vault is an organizer for instruction assets.

It exists to help humans:

- Collect prompts they use as tools.
- Curate external skills across ecosystems.
- Understand what those skills do.
- Track how to install and use them.
- Maintain clarity in a rapidly evolving AI landscape.

Prompt Vault is not an execution environment.
It is not a runtime.
It is not a package manager.

It is an instruction intelligence layer.

---

# Core Philosophy

AI tools change rapidly.
Agent ecosystems shift.
Frameworks rise and fall.

Clear organization endures.

Prompt Vault is built on three principles:

1. Instructions are assets.
2. Organization creates leverage.
3. Clarity reduces cognitive load.

The product is designed to reduce chaos — not amplify it.

---

# What Prompt Vault Is

Prompt Vault consists of:

## 1. Prompt Organizer

- Store prompts you use as tools.
- Version them.
- Modify them.
- Tag and categorize them.
- Quickly copy them into LLMs.
- Preserve prompt history with immutability guarantees.

Prompts are personal working tools.

---

## 2. Skill Registry (Metadata Layer)

Prompt Vault tracks external skills across ecosystems such as:

- Vercel
- Opra
- Claude Code
- Other agent ecosystems

For each skill, Prompt Vault stores:

- Name
- Ecosystem
- Source URL
- Description
- What problem it solves
- Required tools
- Compatible runtimes
- Installation instructions
- Personal notes
- Status (saved, tested, adopted, rejected)
- Tags

Prompt Vault does NOT:

- Store full SKILL.md file trees.
- Replicate GitHub repositories.
- Reconstruct directory structures.
- Act as a package manager.

GitHub stores files.
CLIs install skills.
Prompt Vault organizes knowledge.

---

## 3. Future Layer — Agent Registry (Deferred)

Agents may later be tracked similarly:

- What they orchestrate
- What skills they use
- What environments they run in
- How to deploy them

This is deferred until the skill registry is stable.

---

# Product Boundaries

Prompt Vault will NOT:

- Execute skills.
- Install skills automatically.
- Replace GitHub.
- Replace CLI workflows.
- Attempt to mirror external ecosystems.

It focuses strictly on:

Organization
Clarity
Tracking
Reference

---

# Engineering Principles

## 1. Immutability of Prompt History

- Normal Save does not create a snapshot.
- Only explicit "Save New Version" creates a snapshot.
- Snapshots are immutable.
- v1 baseline cannot be deleted.

Trust in versioning is foundational.

---

## 2. Metadata Over File Replication

Skills are stored as structured metadata records.

Installation instructions are stored as text.
File contents remain external.

---

## 3. Simplicity Over Infrastructure

No backend required initially.
No distributed storage required.
Single-user local-first model.

Cloud sync may be considered later.

---

## 4. Phase-Based Development

Development must:

- Be bounded by clearly defined tasks.
- Avoid repo-wide exploration.
- Avoid architecture re-planning during execution.
- Treat markdown files as persistent project memory.

---

# Long-Term Positioning

Prompt Vault becomes valuable when:

- A user can quickly see all prompts they rely on.
- A user can see all skills they have evaluated.
- A user can understand compatibility across ecosystems.
- A user can implement a skill quickly by referencing stored instructions.

It reduces fragmentation across AI ecosystems.

---

# Success Criteria

Prompt Vault is successful when:

- Prompt versioning is stable and predictable.
- Skills can be easily added and reviewed.
- Installation instructions are clear and accessible.
- The system reduces decision friction.
- The product feels organized, not experimental.

Stability over novelty.
Clarity over complexity.
Organization over automation.
