import { AIPrompt, Skill, Workflow, Agent, ExecutionRun, PromptVersionSnapshot } from '../types';

export interface BackupData {
    prompts: AIPrompt[];
    folders: string[];
    skills: Skill[];
    workflows: Workflow[];
    agents: Agent[];
    history: ExecutionRun[];
    snapshots: PromptVersionSnapshot[];
}

export interface BackupFile {
    meta: {
        version: number;
        exportedAt: number;
        checksum: string;
    };
    data: BackupData;
}

// Simple Adler-32 checksum for integrity verification
function adler32(data: string): string {
    let a = 1, b = 0;
    const MOD = 65521;
    for (let i = 0; i < data.length; i++) {
        a = (a + data.charCodeAt(i)) % MOD;
        b = (b + a) % MOD;
    }
    return ((b << 16) | a).toString(16);
}

export function createBackup(data: BackupData): string {
    // Calculate checksum on the minified JSON string of the data object
    // This ensures that formatting changes to the outer file don't break the checksum logic
    // as long as the data object itself re-serializes to the same string.
    const dataString = JSON.stringify(data);
    const checksum = adler32(dataString);

    const backup: BackupFile = {
        meta: {
            version: 1,
            exportedAt: Date.now(),
            checksum,
        },
        data,
    };

    return JSON.stringify(backup, null, 2);
}

export function validateBackup(jsonContent: string): BackupData {
    let parsed: any;
    try {
        parsed = JSON.parse(jsonContent);
    } catch (e) {
        throw new Error('Invalid JSON format');
    }

    // Schema check
    if (!parsed.meta || !parsed.data) {
        throw new Error('Invalid backup format: missing meta or data fields');
    }

    if (parsed.meta.version !== 1) {
        throw new Error(`Unsupported backup version: ${parsed.meta.version}`);
    }

    // Checksum verification
    // Re-serialize the data object to minified JSON string to match creation logic
    const connectedDataString = JSON.stringify(parsed.data);
    const calculatedChecksum = adler32(connectedDataString);

    if (parsed.meta.checksum !== calculatedChecksum) {
        console.warn(`Checksum mismatch! Expected ${parsed.meta.checksum}, got ${calculatedChecksum}`);
        throw new Error('File integrity check failed (checksum mismatch). The file may have been modified.');
    }

    return parsed.data;
}

// ---- Phase 5: Merge-by-ID Restore ----

export interface RestoreReport {
    prompts: { added: number; replaced: number };
    folders: { added: number };
    skills: { added: number; replaced: number };
    workflows: { added: number; replaced: number };
    agents: { added: number; replaced: number };
    history: { added: number; replaced: number };
    snapshots: { added: number; replaced: number };
}

/**
 * Merge-by-ID strategy: for each imported item, if its ID exists locally,
 * replace the local copy. Otherwise add it as new.
 * Local items not present in the backup are kept.
 * Duplicate IDs within the backup: first occurrence wins.
 * No re-analysis — all metadata (archetype, provenance, resourceUrl, etc.) preserved exactly.
 */
export function mergeBackupData(current: BackupData, incoming: BackupData): { merged: BackupData; report: RestoreReport } {
    const report: RestoreReport = {
        prompts: { added: 0, replaced: 0 },
        folders: { added: 0 },
        skills: { added: 0, replaced: 0 },
        workflows: { added: 0, replaced: 0 },
        agents: { added: 0, replaced: 0 },
        history: { added: 0, replaced: 0 },
        snapshots: { added: 0, replaced: 0 },
    };

    const mergedPrompts = mergeArrayById(current.prompts, incoming.prompts, report.prompts);
    const mergedSkills = mergeArrayById(current.skills, incoming.skills, report.skills);
    const mergedWorkflows = mergeArrayById(current.workflows, incoming.workflows, report.workflows);
    const mergedAgents = mergeArrayById(current.agents, incoming.agents, report.agents);
    const mergedHistory = mergeArrayById(current.history, incoming.history, report.history);
    const mergedSnapshots = mergeArrayById(current.snapshots, incoming.snapshots, report.snapshots);

    // Merge folders (simple union, no IDs)
    const folderSet = new Set(current.folders);
    for (const f of incoming.folders) {
        if (!folderSet.has(f)) {
            folderSet.add(f);
            report.folders.added++;
        }
    }

    return {
        merged: {
            prompts: mergedPrompts,
            folders: Array.from(folderSet),
            skills: mergedSkills,
            workflows: mergedWorkflows,
            agents: mergedAgents,
            history: mergedHistory,
            snapshots: mergedSnapshots,
        },
        report,
    };
}

function mergeArrayById<T extends { id: string }>(
    local: T[],
    incoming: T[],
    counter: { added: number; replaced: number }
): T[] {
    const localMap = new Map(local.map(item => [item.id, item]));
    const seenIncoming = new Set<string>();

    for (const item of incoming) {
        // Dedupe within backup: first occurrence wins
        if (seenIncoming.has(item.id)) continue;
        seenIncoming.add(item.id);

        if (localMap.has(item.id)) {
            localMap.set(item.id, { ...item }); // replace, spread to preserve all fields
            counter.replaced++;
        } else {
            localMap.set(item.id, { ...item }); // add
            counter.added++;
        }
    }

    return Array.from(localMap.values());
}
