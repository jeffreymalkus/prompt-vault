import { SkillArchetype, SkillPlaybook, SkillProvenance, PLACEHOLDER_REGEX, canonicalKey } from '../types/index';

export interface ParseResult {
    title: string;
    description: string;
    archetype: SkillArchetype;
    playbook: SkillPlaybook;
    provenance: SkillProvenance;
    resourceUrl?: string;
    normalizedText?: string;
    detectedInputs: string[];
}

function toTitleCase(slug: string) {
    return slug
        .replace(/[-_]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export function detectArchetype(input: string): ParseResult {
    const trimmed = input.trim();
    let url: URL | null = null;
    let isUrl = false;

    // STEP 0: Normalize & Type Check
    try {
        url = new URL(trimmed);
        isUrl = true;
    } catch (e) {
        isUrl = false;
    }

    // Common Input Detection (for Text and Markdown)
    const detectedInputs: string[] = [];
    const stoplist = new Set(['OPTIONAL', 'REQUIRED', 'EXAMPLE', 'NOTES', 'RULES', 'STEPS']);
    const seenVars = new Set<string>();
    for (const m of trimmed.matchAll(PLACEHOLDER_REGEX)) {
        const key = canonicalKey(m[1]);
        if (!key) continue;
        const normalized = key.trim().toUpperCase().replace(/\s+/g, '_');
        if (!stoplist.has(normalized) && !seenVars.has(normalized)) {
            seenVars.add(normalized);
            detectedInputs.push(`[${normalized}]`);
        }
    }

    // --- NON-URL PATH ---
    if (!isUrl) {
        const hasFrontmatter = /^---[\s\S]+?---/.test(trimmed);
        const hasVariables = detectedInputs.length > 0;

        let archetype = SkillArchetype.PROMPT_TEXT;
        let confidence = 0.5;

        if (hasFrontmatter || hasVariables) {
            archetype = SkillArchetype.SKILL_MARKDOWN;
            confidence = 0.9;
        }

        const playbook = archetype === SkillArchetype.SKILL_MARKDOWN
            ? SkillPlaybook.RUN_IN_APP
            : SkillPlaybook.RUN_IN_CHAT;

        return {
            title: archetype === SkillArchetype.SKILL_MARKDOWN ? "Structured Skill" : "Prompt Snippet",
            description: archetype === SkillArchetype.SKILL_MARKDOWN
                ? "Structured skill template with variables. Fill inputs and run inside the app."
                : "Prompt snippet. Copy to clipboard to use.",
            archetype,
            playbook,
            provenance: {
                domain: 'text-input',
                detectedKind: archetype,
                importedAtISO: new Date().toISOString(),
                confidence
            },
            normalizedText: trimmed,
            detectedInputs
        };
    }

    // --- URL PATH ---
    // Normalize URL
    const hostname = url!.hostname.toLowerCase();
    const pathname = url!.pathname.replace(/\/$/, ''); // Remove trailing slash
    const segments = pathname.split('/').filter(Boolean);

    let archetype = SkillArchetype.GENERIC_URL_RESOURCE;
    let confidence = 0.5;

    // STEP 1: URL Classification
    // GitHub Rules
    if (hostname === 'github.com' || hostname === 'gist.github.com' || hostname === 'raw.githubusercontent.com') {
        if (hostname === 'gist.github.com' || pathname.startsWith('/gist/')) {
            archetype = SkillArchetype.GITHUB_GIST;
            confidence = 1.0;
        } else if (pathname.includes('/blob/') || pathname.includes('/tree/') || pathname.includes('/raw/') || hostname === 'raw.githubusercontent.com') {
            archetype = SkillArchetype.GITHUB_FILE;
            confidence = 1.0;
        } else if (segments.length === 2) {
            archetype = SkillArchetype.GITHUB_REPO;
            confidence = 1.0;
        } else if (segments.length > 2) {
            archetype = SkillArchetype.GITHUB_REPO; // Sub-directory or specialized view
            confidence = 0.85;
        }
    }
    // Vercel Rules
    else if (hostname.endsWith('.vercel.app')) {
        archetype = SkillArchetype.VERCEL_DEPLOYMENT;
        confidence = 1.0;
    } else if (hostname === 'vercel.com' && pathname.includes('/templates')) {
        archetype = SkillArchetype.VERCEL_TEMPLATE;
        confidence = 1.0;
    }
    // Docs Rules
    else if (hostname.startsWith('docs.') || hostname.includes('readthedocs.io') || pathname.includes('/docs/')) {
        archetype = SkillArchetype.DOCS_RESOURCE;
        confidence = 0.9;
    }

    // STEP 2: Metadata Synthesis
    let title = "Resource";
    let description = "External resource.";

    switch (archetype) {
        case SkillArchetype.GITHUB_REPO:
            title = segments.length >= 2 ? toTitleCase(segments[1]) : "GitHub Repo";
            description = `GitHub repository for ${segments[0]}/${segments[1]}. Open to review source and documentation, then follow the checklist.`;
            break;
        case SkillArchetype.GITHUB_FILE:
            title = segments[segments.length - 1]; // filename
            description = `GitHub file reference (${title}). Open to review contents and integrate.`;
            break;
        case SkillArchetype.GITHUB_GIST:
            title = "GitHub Gist";
            if (segments.length > 0) title += ` ${segments[segments.length - 1].substring(0, 6)}`;
            description = "GitHub Gist snippet. Open to review and copy what you need.";
            break;
        case SkillArchetype.VERCEL_DEPLOYMENT:
            title = toTitleCase(hostname.split('.')[0]);
            description = `Live Vercel deployment (${hostname}). Open to preview behavior before integrating.`;
            break;
        case SkillArchetype.VERCEL_TEMPLATE:
            const tIdx = segments.indexOf("templates");
            if (tIdx !== -1 && segments.length > tIdx + 1) {
                title = toTitleCase(segments[segments.length - 1]);
            } else {
                title = "Vercel Template";
            }
            description = "Vercel template resource. Open to deploy or clone, then customize and verify.";
            break;
        case SkillArchetype.DOCS_RESOURCE:
            let base = "";
            if (hostname.startsWith('docs.')) base = hostname.split('.')[1];
            else if (hostname.includes('readthedocs.io')) base = segments[0] || hostname.split('.')[0];
            else base = hostname.split('.')[0];
            title = toTitleCase(base) + " Docs";
            description = `Documentation resource (${hostname}). Open to follow official integration steps.`;
            break;
        case SkillArchetype.GENERIC_URL_RESOURCE:
            const genBase = hostname.split('.')[0];
            title = toTitleCase(genBase) + " Resource";
            description = `External resource from ${hostname}. Open to review and follow provider instructions.`;
            break;
    }

    // STEP 3: Playbook Mapping
    const playbook = SkillPlaybook.IMPLEMENTATION_RESOURCE; // All URLs map to this

    return {
        title,
        description,
        archetype,
        playbook,
        provenance: {
            domain: hostname,
            detectedKind: archetype,
            importedAtISO: new Date().toISOString(),
            confidence
        },
        resourceUrl: trimmed, // Normalized URL
        detectedInputs: [] // Resources typically don't have inputs extracted this way
    };
}
