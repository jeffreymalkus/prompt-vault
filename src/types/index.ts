// ===============================
// CORE TYPES - PROMPT NOTEBOOK
// ===============================

export type PromptType = 'system' | 'user';

export interface AIPrompt {
  id: string;
  title: string;
  content: string;
  description: string;
  notes?: string;
  category: string;
  tags: string[];
  folder: string;
  type: PromptType;
  version: number;
  lastUsedAt: number;
  createdAt: number;
  usageCount: number;
  isPinned?: boolean;
  variables: string[];
  parentId?: string;
}

// ===============================
// NEW CAPABILITY LAYERS
// ===============================

export type ObjectType = 'prompt' | 'skill' | 'workflow' | 'agent';

export type TriggerType = 'manual' | 'scheduled' | 'event-based';

export type ExecutionStatus = 'active' | 'paused' | 'error';

// SKILL - Bundle of prompts with execution logic
export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  folder: string;
  tags: string[];
  inputsRequired: string[]; // List of required input names
  outputFormat: string;
  embeddedPromptIds: string[]; // Relational link to prompts
  toolsUsed: string[];
  exampleRun?: string;
  executionNotes?: string;
  expertPersona?: string;
  rulesGuardrails?: string;
  procedure?: string; // Free-text procedure / embedded prompts text
  status?: 'draft' | 'active';
  lastExportedText?: string; // Persisted Copy for LLM output
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  isPinned?: boolean;
}

// Scan skill procedure text for [VARIABLE] patterns
export function scanSkillInputs(text: string): string[] {
  const stoplist = new Set(['OPTIONAL', 'REQUIRED', 'EXAMPLE', 'NOTES', 'RULES', 'STEPS']);
  const regex = /\[([A-Z][A-Z0-9_ ]{1,50})\]/g;
  const seen = new Set<string>();
  const result: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const normalized = match[1].trim().toUpperCase().replace(/\s+/g, '_');
    if (!stoplist.has(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(`[${normalized}]`);
    }
  }
  return result;
}

// Assemble a skill into a portable Markdown block for LLM use
export function assembleSkillForLLM(skill: Skill): string {
  const sections: string[] = [];
  sections.push(`# Skill: ${skill.name}`);
  
  if (skill.expertPersona) {
    sections.push(`\n## Context & Persona\n\n${skill.expertPersona}`);
  }
  if (skill.rulesGuardrails) {
    sections.push(`\n## Rules & Guardrails\n\n${skill.rulesGuardrails}`);
  }
  if (skill.inputsRequired.length > 0) {
    sections.push(`\n## Inputs\n`);
    skill.inputsRequired.forEach(v => {
      const label = v.replace(/^\[|\]$/g, '');
      sections.push(`[${label}]: ____________________`);
    });
  }
  if (skill.procedure) {
    sections.push(`\n## Procedure\n\n${skill.procedure}`);
  }
  if (skill.outputFormat) {
    sections.push(`\n## Output Format\n\n${skill.outputFormat}`);
  }
  return sections.join('\n');
}

// Parse raw text into skill fields using heading-based heuristics
export function parseTextToSkillFields(text: string): {
  expertPersona: string;
  rulesGuardrails: string;
  outputFormat: string;
  procedure: string;
} {
  const lines = text.split(/\r?\n/);
  
  type Block = { type: 'persona' | 'rules' | 'output' | 'other'; lines: string[] };
  const blocks: Block[] = [];
  let currentBlock: Block = { type: 'other', lines: [] };

  const personaRe = /^(?:#{1,3}\s*)?(?:role|persona|act as|context|expert)/i;
  const rulesRe = /^(?:#{1,3}\s*)?(?:rules|do not|constraints|guardrails|guidelines)/i;
  const outputRe = /^(?:#{1,3}\s*)?(?:output|format|return|response format|deliverable)/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (personaRe.test(trimmed)) {
      if (currentBlock.lines.length > 0) blocks.push(currentBlock);
      currentBlock = { type: 'persona', lines: [] };
      // If the heading line has content after the keyword, keep it
      const afterColon = trimmed.replace(/^(?:#{1,3}\s*)?(?:role|persona|act as|context|expert)\s*[:：]?\s*/i, '');
      if (afterColon && afterColon !== trimmed) currentBlock.lines.push(afterColon);
    } else if (rulesRe.test(trimmed)) {
      if (currentBlock.lines.length > 0) blocks.push(currentBlock);
      currentBlock = { type: 'rules', lines: [] };
      const afterColon = trimmed.replace(/^(?:#{1,3}\s*)?(?:rules|do not|constraints|guardrails|guidelines)\s*[:：]?\s*/i, '');
      if (afterColon && afterColon !== trimmed) currentBlock.lines.push(afterColon);
    } else if (outputRe.test(trimmed)) {
      if (currentBlock.lines.length > 0) blocks.push(currentBlock);
      currentBlock = { type: 'output', lines: [] };
      const afterColon = trimmed.replace(/^(?:#{1,3}\s*)?(?:output|format|return|response format|deliverable)\s*[:：]?\s*/i, '');
      if (afterColon && afterColon !== trimmed) currentBlock.lines.push(afterColon);
    } else {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock.lines.length > 0) blocks.push(currentBlock);

  const persona = blocks.filter(b => b.type === 'persona').map(b => b.lines.join('\n').trim()).join('\n\n');
  const rules = blocks.filter(b => b.type === 'rules').map(b => b.lines.join('\n').trim()).join('\n\n');
  const output = blocks.filter(b => b.type === 'output').map(b => b.lines.join('\n').trim()).join('\n\n');
  const procedure = blocks.filter(b => b.type === 'other').map(b => b.lines.join('\n').trim()).filter(Boolean).join('\n\n');

  return { expertPersona: persona, rulesGuardrails: rules, outputFormat: output, procedure };
}

// WORKFLOW - Ordered sequence of skills
export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  folder: string;
  tags: string[];
  triggerType: TriggerType;
  inputSource?: string;
  skillIds: string[]; // Ordered list of skill IDs
  outputDeliverable?: string;
  humanReviewStep: boolean;
  executionNotes?: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  isPinned?: boolean;
}

// AGENT - Automated workflow executor
export interface Agent {
  id: string;
  name: string;
  description: string;
  linkedWorkflowId: string; // Relational link to workflow
  triggerType: TriggerType;
  dataSources: string[];
  toolsConnected: string[];
  memoryEnabled: boolean;
  notificationMethod?: string;
  failureHandlingInstructions?: string;
  lastRunAt?: number;
  status: ExecutionStatus;
  category: string;
  folder: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
}

// ===============================
// PROMPT VERSION HISTORY
// ===============================

export interface PromptVersionSnapshot {
  id: string;
  promptId: string; // parentId or original id
  content: string; // template text with brackets intact
  title: string;
  description: string;
  tags: string[];
  category: string;
  folder: string;
  commitMessage: string;
  createdAt: number;
  version: number;
  versionName?: string; // user-given name like "Expert Marketing Version"
  variableValues?: Record<string, string>; // saved variable inputs
}

// ===============================
// EXECUTION HISTORY
// ===============================

export interface ExecutionRun {
  id: string;
  objectType: ObjectType;
  objectId: string;
  objectName: string;
  inputs: Record<string, string>;
  outputs: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'completed' | 'failed';
}

// ===============================
// NAVIGATION & VIEW TYPES
// ===============================

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  TABLE = 'TABLE'
}

export type NavigationView = 'object' | 'capability';

export type ActiveSection = 'prompts' | 'skills' | 'workflows' | 'agents' | 'history';

// ===============================
// CONSTANTS
// ===============================

export const DEFAULT_CATEGORIES = [
  'All',
  'Writing',
  'Coding',
  'Marketing',
  'Business',
  'Analysis',
  'Creative',
  'Planning',
  'Sales',
  'Research',
  'Operations'
];

export const DEFAULT_FOLDERS = [
  'General',
  'Core Frameworks',
  'Development',
  'Professional',
  'Marketing',
  'Education',
  'Creative'
];

// ===============================
// UTILITY FUNCTIONS
// ===============================

export function detectVariables(content: string): string[] {
  const stoplist = new Set(['OPTIONAL', 'REQUIRED', 'EXAMPLE', 'NOTES', 'RULES', 'STEPS']);
  const regex = /\[(.*?)\]/g;
  const seen = new Set<string>();
  const result: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const normalized = match[1].trim().toUpperCase().replace(/\s+/g, '_');
    if (!normalized || stoplist.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
