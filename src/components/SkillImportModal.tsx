import React, { useState, useRef } from 'react';
import { Skill, AIPrompt, generateId, detectVariables } from '../types/index';
import { X, Upload, FileJson, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface SkillImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (skill: Skill, newPrompts: AIPrompt[]) => void;
  existingPrompts: AIPrompt[];
}

interface SkillTemplate {
  name: string;
  description: string;
  category: string;
  folder: string;
  tags: string[];
  inputsRequired: string[];
  outputFormat: string;
  toolsUsed: string[];
  exampleRun?: string;
  executionNotes?: string;
  embeddedPrompts: {
    title: string;
    content: string;
    description: string;
    notes?: string;
    type: 'system' | 'user';
    tags: string[];
  }[];
}

export const SkillImportModal: React.FC<SkillImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingPrompts
}) => {
  const [jsonContent, setJsonContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedTemplate, setParsedTemplate] = useState<SkillTemplate | null>(null);
  const [duplicatePrompts, setDuplicatePrompts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setJsonContent('');
    setParseError(null);
    setParsedTemplate(null);
    setDuplicatePrompts([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateTemplate = (data: any): data is SkillTemplate => {
    if (!data || typeof data !== 'object') return false;
    if (!data.name || typeof data.name !== 'string') return false;
    if (!Array.isArray(data.embeddedPrompts)) return false;
    
    for (const prompt of data.embeddedPrompts) {
      if (!prompt.title || !prompt.content) return false;
      if (prompt.type && !['system', 'user'].includes(prompt.type)) return false;
    }
    
    return true;
  };

  const checkDuplicates = (template: SkillTemplate): string[] => {
    const duplicates: string[] = [];
    
    for (const embeddedPrompt of template.embeddedPrompts) {
      const exists = existingPrompts.some(p => 
        p.type === (embeddedPrompt.type || 'user') &&
        p.folder === (template.folder || 'General') &&
        p.title === embeddedPrompt.title &&
        p.content === embeddedPrompt.content
      );
      if (exists) {
        duplicates.push(embeddedPrompt.title);
      }
    }
    
    return duplicates;
  };

  const parseJson = (content: string) => {
    setParseError(null);
    setParsedTemplate(null);
    setDuplicatePrompts([]);
    
    if (!content.trim()) return;
    
    try {
      const parsed = JSON.parse(content);
      
      if (!validateTemplate(parsed)) {
        setParseError('Invalid skill template format. Required fields: name, embeddedPrompts (array with title and content).');
        return;
      }
      
      const duplicates = checkDuplicates(parsed);
      setDuplicatePrompts(duplicates);
      setParsedTemplate(parsed);
    } catch (e) {
      setParseError('Invalid JSON format. Please check the syntax.');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setJsonContent(content);
    parseJson(content);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonContent(content);
      parseJson(content);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = () => {
    if (!parsedTemplate) return;
    
    const now = Date.now();
    const newPromptIds: string[] = [];
    const newPrompts: AIPrompt[] = [];
    
    // Create prompts from embedded definitions
    parsedTemplate.embeddedPrompts.forEach((embeddedPrompt, index) => {
      // Check if this exact prompt already exists
      const existingPrompt = existingPrompts.find(p => 
        p.type === (embeddedPrompt.type || 'user') &&
        p.folder === (parsedTemplate.folder || 'General') &&
        p.title === embeddedPrompt.title &&
        p.content === embeddedPrompt.content
      );
      
      if (existingPrompt) {
        // Use existing prompt's ID
        newPromptIds.push(existingPrompt.id);
      } else {
        // Create new prompt
        const promptId = generateId();
        const content = embeddedPrompt.content;
        
        const newPrompt: AIPrompt = {
          id: promptId,
          title: embeddedPrompt.title,
          content: content,
          description: embeddedPrompt.description || '',
          notes: embeddedPrompt.notes || '',
          category: parsedTemplate.category || 'Creative',
          folder: parsedTemplate.folder || 'General',
          type: embeddedPrompt.type || 'user',
          tags: embeddedPrompt.tags || [],
          version: 1,
          createdAt: now + index,
          lastUsedAt: now,
          usageCount: 0,
          isPinned: false,
          variables: detectVariables(content)
        };
        
        newPrompts.push(newPrompt);
        newPromptIds.push(promptId);
      }
    });
    
    // Create skill with relational links to prompts
    const newSkill: Skill = {
      id: generateId(),
      name: parsedTemplate.name,
      description: parsedTemplate.description || '',
      category: parsedTemplate.category || 'Creative',
      folder: parsedTemplate.folder || 'General',
      tags: parsedTemplate.tags || [],
      inputsRequired: parsedTemplate.inputsRequired || [],
      outputFormat: parsedTemplate.outputFormat || '',
      embeddedPromptIds: newPromptIds,
      toolsUsed: parsedTemplate.toolsUsed || [],
      exampleRun: parsedTemplate.exampleRun,
      executionNotes: parsedTemplate.executionNotes,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isPinned: false
    };
    
    onImport(newSkill, newPrompts);
    handleClose();
  };

  if (!isOpen) return null;

  const exampleTemplate = `{
  "name": "Content Brief Generator",
  "description": "Creates comprehensive content briefs",
  "category": "Marketing",
  "folder": "Content",
  "tags": ["content", "seo", "brief"],
  "inputsRequired": ["TOPIC", "AUDIENCE"],
  "outputFormat": "Markdown document",
  "toolsUsed": ["GPT-4"],
  "embeddedPrompts": [
    {
      "title": "Research Prompt",
      "content": "Research [TOPIC] for [AUDIENCE]...",
      "description": "Gathers initial research",
      "type": "system",
      "tags": ["research"]
    },
    {
      "title": "Brief Generator",
      "content": "Create a content brief about [TOPIC]...",
      "description": "Generates the final brief",
      "type": "user",
      "tags": ["brief"]
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Upload size={20} className="text-primary" />
              Import Skill from JSON
            </h2>
            <p className="text-xs text-muted-foreground">
              Import a skill template with embedded prompts.
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/90 rounded-xl text-sm font-bold text-secondary-foreground transition-all"
            >
              <FileJson size={16} />
              Upload JSON File
            </button>
            <span className="text-sm text-muted-foreground">or paste JSON below</span>
          </div>

          {/* JSON Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">JSON Template</label>
            <textarea
              className="w-full h-64 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm font-mono"
              placeholder={exampleTemplate}
              value={jsonContent}
              onChange={handleTextChange}
            />
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{parseError}</p>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedTemplate && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Valid skill template detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{parsedTemplate.name}</strong> with {parsedTemplate.embeddedPrompts.length} embedded prompt(s)
                  </p>
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicatePrompts.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber/10 border border-amber/30 rounded-xl">
                  <AlertCircle size={18} className="text-amber mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {duplicatePrompts.length} prompt(s) already exist
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      These will be linked instead of duplicated: {duplicatePrompts.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Prompts Preview */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Embedded Prompts Preview</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {parsedTemplate.embeddedPrompts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <FileText size={14} className="text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                            p.type === 'system' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                          }`}>
                            {p.type || 'user'}
                          </span>
                          <span className="text-sm font-medium text-foreground truncate">{p.title}</span>
                          {duplicatePrompts.includes(p.title) && (
                            <span className="text-[10px] text-amber font-semibold">(exists)</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-border flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm transition-colors text-muted-foreground"
            >
              CANCEL
            </button>
            <button
              onClick={handleImport}
              disabled={!parsedTemplate}
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-sm text-primary-foreground transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              IMPORT SKILL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
