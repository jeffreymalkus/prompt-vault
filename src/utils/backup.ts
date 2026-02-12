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
