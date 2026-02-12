// ===============================
// BACKUP & RESTORE — Phase 5
// Pure persistence layer. No inference, no re-analysis.
// ===============================

import type { AIPrompt, Skill, Workflow, Agent, PromptVersionSnapshot } from '../types';
import { generateId } from '../types';

// ---- Backup schema ----

export interface BackupV1 {
  schemaVersion: 1;
  exportedAtISO: string;
  app?: {
    name?: string;
    build?: string;
  };
  data: {
    skills: Skill[];
    prompts: AIPrompt[];
    versions: PromptVersionSnapshot[];
  };
}

export interface RestoreReport {
  skills: { added: number; replaced: number };
  prompts: { added: number; replaced: number };
  versions: { added: number; replaced: number };
  errors: string[];
}

// ---- Export ----

export interface AppState {
  skills: Skill[];
  prompts: AIPrompt[];
  versions: PromptVersionSnapshot[];
}

export function buildBackupFromState(state: AppState): BackupV1 {
  return {
    schemaVersion: 1,
    exportedAtISO: new Date().toISOString(),
    app: {
      name: 'Prompt Vault',
    },
    data: {
      // Pure serialization — spread each item to capture any extra fields
      // (archetype, provenance, resourceUrl, etc.) that may exist at runtime
      skills: state.skills.map(s => ({ ...s })),
      prompts: state.prompts.map(p => ({ ...p })),
      versions: state.versions.map(v => ({ ...v })),
    },
  };
}

export function downloadBackup(backup: BackupV1): void {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `prompt-vault-backup_${stamp}.json`;

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Import / Restore ----

export function validateBackup(raw: unknown): { valid: true; backup: BackupV1 } | { valid: false; error: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'File does not contain a valid JSON object.' };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.schemaVersion !== 1) {
    return { valid: false, error: `Unsupported schema version: ${String(obj.schemaVersion ?? 'missing')}. Expected 1.` };
  }

  if (typeof obj.data !== 'object' || obj.data === null) {
    return { valid: false, error: 'Missing "data" object in backup file.' };
  }

  const data = obj.data as Record<string, unknown>;

  if (!Array.isArray(data.skills)) {
    return { valid: false, error: 'Missing or invalid "data.skills" array.' };
  }
  if (!Array.isArray(data.prompts)) {
    return { valid: false, error: 'Missing or invalid "data.prompts" array.' };
  }
  if (!Array.isArray(data.versions)) {
    return { valid: false, error: 'Missing or invalid "data.versions" array.' };
  }

  return { valid: true, backup: obj as unknown as BackupV1 };
}

/**
 * Merge-by-ID strategy: for each imported item, if its ID exists locally,
 * replace the local copy. Otherwise add it as new.
 * Local items not present in the backup are kept.
 * Items missing an `id` get a generated one.
 * Duplicate IDs within the backup: first occurrence wins.
 */
export function restoreBackupToState(
  backup: BackupV1,
  currentState: AppState,
  mode: 'merge' | 'replace' = 'merge'
): { nextState: AppState; report: RestoreReport } {
  const report: RestoreReport = {
    skills: { added: 0, replaced: 0 },
    prompts: { added: 0, replaced: 0 },
    versions: { added: 0, replaced: 0 },
    errors: [],
  };

  if (mode === 'replace') {
    return {
      nextState: {
        skills: dedupeById(ensureIds(backup.data.skills)),
        prompts: dedupeById(ensureIds(backup.data.prompts)),
        versions: dedupeById(ensureIds(backup.data.versions)),
      },
      report: {
        skills: { added: backup.data.skills.length, replaced: 0 },
        prompts: { added: backup.data.prompts.length, replaced: 0 },
        versions: { added: backup.data.versions.length, replaced: 0 },
        errors: [],
      },
    };
  }

  // Merge mode
  const nextSkills = mergeArrayById(currentState.skills, dedupeById(ensureIds(backup.data.skills)), report.skills);
  const nextPrompts = mergeArrayById(currentState.prompts, dedupeById(ensureIds(backup.data.prompts)), report.prompts);
  const nextVersions = mergeArrayById(currentState.versions, dedupeById(ensureIds(backup.data.versions)), report.versions);

  return {
    nextState: {
      skills: nextSkills,
      prompts: nextPrompts,
      versions: nextVersions,
    },
    report,
  };
}

// ---- Helpers ----

function ensureIds<T extends { id?: string }>(items: T[]): (T & { id: string })[] {
  return items.map(item => ({
    ...item,
    id: item.id || generateId(),
  }));
}

/** Keep first occurrence of each id */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

function mergeArrayById<T extends { id: string }>(
  local: T[],
  incoming: T[],
  counter: { added: number; replaced: number }
): T[] {
  const localMap = new Map(local.map(item => [item.id, item]));

  for (const item of incoming) {
    if (localMap.has(item.id)) {
      localMap.set(item.id, item); // replace
      counter.replaced++;
    } else {
      localMap.set(item.id, item); // add
      counter.added++;
    }
  }

  return Array.from(localMap.values());
}
