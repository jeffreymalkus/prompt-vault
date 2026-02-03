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

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  TABLE = 'TABLE'
}

export const DEFAULT_CATEGORIES = [
  'All',
  'Writing',
  'Coding',
  'Marketing',
  'Business',
  'Analysis',
  'Creative',
  'Planning'
];

// Utility function to detect variables in prompt content
export function detectVariables(content: string): string[] {
  const matches = content.match(/\[([A-Z_]+)\]/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}
