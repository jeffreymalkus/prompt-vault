import { Skill, SkillPlaybook, SkillArchetype, SkillProvenance } from '../types';
import { detectArchetype, ParseResult } from './skillParser';

export interface AnalyzeResult extends Partial<Skill> {
    isResource: boolean;
    parseResult: ParseResult;
}

/**
 * Shared utility to analyze raw input (URL or text) and return 
 * partial skill metadata for modal pre-filling.
 */
export function analyzeSkillInput(input: string): AnalyzeResult {
    const result = detectArchetype(input);
    const isResource = result.playbook === SkillPlaybook.IMPLEMENTATION_RESOURCE;

    return {
        name: result.title,
        title: result.title, // Sync name/title
        description: result.description,
        procedure: isResource ? result.description : undefined,
        archetype: result.archetype,
        playbook: result.playbook,
        provenance: result.provenance,
        resourceUrl: result.resourceUrl,
        inputsRequired: result.detectedInputs || [],
        sourceMarkdown: isResource ? result.description : input,
        sourceType: 'collected',
        isResource,
        parseResult: result
    };
}
