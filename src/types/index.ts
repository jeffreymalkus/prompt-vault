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
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  isPinned?: boolean;
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
  const matches = content.match(/\[([A-Z_]+)\]/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
