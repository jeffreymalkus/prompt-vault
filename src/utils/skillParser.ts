import { SkillEcosystem, PLACEHOLDER_REGEX, canonicalKey } from '../types/index';

export interface ExternalReference {
    url: string;
    source: string; // e.g., 'github.com', 'vercel.com'
    type: 'repo' | 'docs' | 'other';
}

export interface AnalysisResult {
    variables: string[];
    urls: ExternalReference[];
    ecosystem: SkillEcosystem;
    suggestedCategory: string | null;
    detectedName: string | null;
    detectedDescription: string | null;
}

// Keywords for auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    'Coding': ['function', 'react', 'typescript', 'python', 'code', 'bug', 'test', 'api', 'endpoint', 'json', 'script'],
    'Marketing': ['seo', 'copy', 'social media', 'post', 'blog', 'article', 'keyword', 'audience', 'brand', 'campaign'],
    'Business': ['strategy', 'plan', 'proposal', 'email', 'meeting', 'agenda', 'finance', 'report', 'presentation'],
    'Analysis': ['analyze', 'data', 'summary', 'insight', 'trend', 'review', 'audit'],
    'Creative': ['story', 'poem', 'idea', 'brainstorm', 'image', 'art', 'design', 'plot'],
    'Writing': ['edit', 'proofread', 'grammar', 'rewrite', 'tone', 'style', 'draft'],
};

// Known ecosystems mappable by URL
const ECOSYSTEM_MAP: Record<string, SkillEcosystem> = {
    'github.com': 'other', // GitHub is a source, but usually implies 'Coding' or general 'Other' if not specific
    'vercel.com': 'other',
    'cursor.sh': 'cursor',
    'cursor.com': 'cursor',
    'openai.com': 'chatgpt',
    'chat.openai.com': 'chatgpt',
    'anthropic.com': 'claude-code',
    'console.anthropic.com': 'claude-code',
    'gemini.google.com': 'gemini',
    'aistudio.google.com': 'gemini',
    'windsurf': 'windsurf' // keyword check mostly
};

export function analyzeSkillText(text: string): AnalysisResult {
    const result: AnalysisResult = {
        variables: [],
        urls: [],
        ecosystem: 'other',
        suggestedCategory: null,
        detectedName: null,
        detectedDescription: null,
    };

    if (!text.trim()) return result;

    // 1. Variable Detection (Keep existing robust logic)
    const stoplist = new Set(['OPTIONAL', 'REQUIRED', 'EXAMPLE', 'NOTES', 'RULES', 'STEPS']);
    const seenVars = new Set<string>();
    for (const m of text.matchAll(PLACEHOLDER_REGEX)) {
        const key = canonicalKey(m[1]);
        if (!key) continue;
        const normalized = key.trim().toUpperCase().replace(/\s+/g, '_');
        if (!stoplist.has(normalized) && !seenVars.has(normalized)) {
            seenVars.add(normalized);
            result.variables.push(`[${normalized}]`);
        }
    }

    // 2. URL Detection & Ecosystem Fingerprinting
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const seenUrls = new Set<string>();
    for (const m of text.matchAll(urlRegex)) {
        const url = m[1];
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        let source = 'unknown';
        try {
            const hostname = new URL(url).hostname.replace(/^www\./, '');
            source = hostname;

            // Check ecosystem map
            for (const [host, eco] of Object.entries(ECOSYSTEM_MAP)) {
                if (hostname.includes(host)) {
                    result.ecosystem = eco;
                    break;
                }
            }
        } catch (e) {
            // invalid url, ignore
        }

        result.urls.push({
            url,
            source,
            type: source.includes('github') ? 'repo' : 'other'
        });
    }

    // 3. Auto-Categorization
    const lowerText = text.toLowerCase();

    // Count keyword matches per category
    const scores: Record<string, number> = {};
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        scores[cat] = 0;
        for (const kw of keywords) {
            if (lowerText.includes(kw.toLowerCase())) {
                scores[cat]++;
            }
        }
    }

    // Find highest score
    let maxScore = 0;
    let bestCat = null;
    for (const [cat, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            bestCat = cat;
        }
    }

    if (maxScore > 0) {
        result.suggestedCategory = bestCat;
    }

    // 4. Metadata Detection (Heuristics)
    const lines = text.split(/\r?\n/);

    // Name: First heading or first non-empty line
    for (const line of lines) {
        const heading = line.match(/^#\s+(.+)/);
        if (heading) {
            result.detectedName = heading[1].trim();
            break;
        }
        const trimmed = line.trim();
        if (trimmed.length > 0 && trimmed.length <= 100 && !result.detectedName) {
            result.detectedName = trimmed;
        }
    }

    // Description: First substantial paragraph
    let pastHeading = false;
    for (const line of lines) {
        if (/^#\s+/.test(line)) { pastHeading = true; continue; }
        const trimmed = line.trim();
        if (trimmed.length > 15 && !/^#/.test(trimmed)) {
            // Simple heuristic: if it looks like a sentence and follows a heading (or is the first substantial text)
            result.detectedDescription = trimmed.slice(0, 200);
            break;
        }
    }

    return result;
}
