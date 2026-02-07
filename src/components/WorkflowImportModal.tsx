import React, { useState, useRef } from 'react';
import { Workflow, Skill, generateId } from '../types';
import { X, Upload, FileJson, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface WorkflowImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (workflow: Workflow, matchedSkillIds: string[]) => void;
  existingSkills: Skill[];
}

interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  folder: string;
  tags: string[];
  triggerType: 'manual' | 'scheduled' | 'event-based';
  inputSource?: string;
  skillNames: string[]; // Names of skills to link
  outputDeliverable?: string;
  humanReviewStep: boolean;
  executionNotes?: string;
}

export const WorkflowImportModal: React.FC<WorkflowImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingSkills
}) => {
  const [jsonContent, setJsonContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedTemplate, setParsedTemplate] = useState<WorkflowTemplate | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<{name: string; skill: Skill | null}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setJsonContent('');
    setParseError(null);
    setParsedTemplate(null);
    setMatchedSkills([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateTemplate = (data: any): data is WorkflowTemplate => {
    if (!data || typeof data !== 'object') return false;
    if (!data.name || typeof data.name !== 'string') return false;
    if (!Array.isArray(data.skillNames)) return false;
    return true;
  };

  const matchSkills = (template: WorkflowTemplate): {name: string; skill: Skill | null}[] => {
    return template.skillNames.map(name => {
      const skill = existingSkills.find(s => 
        s.name.toLowerCase() === name.toLowerCase()
      );
      return { name, skill: skill || null };
    });
  };

  const parseJson = (content: string) => {
    setParseError(null);
    setParsedTemplate(null);
    setMatchedSkills([]);
    
    if (!content.trim()) return;
    
    try {
      const parsed = JSON.parse(content);
      
      if (!validateTemplate(parsed)) {
        setParseError('Invalid workflow template format. Required fields: name, skillNames (array).');
        return;
      }
      
      const matched = matchSkills(parsed);
      setMatchedSkills(matched);
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
    const matchedSkillIds = matchedSkills
      .filter(m => m.skill !== null)
      .map(m => m.skill!.id);
    
    const newWorkflow: Workflow = {
      id: generateId(),
      name: parsedTemplate.name,
      description: parsedTemplate.description || '',
      category: parsedTemplate.category || 'Creative',
      folder: parsedTemplate.folder || 'General',
      tags: parsedTemplate.tags || [],
      triggerType: parsedTemplate.triggerType || 'manual',
      inputSource: parsedTemplate.inputSource,
      skillIds: matchedSkillIds,
      outputDeliverable: parsedTemplate.outputDeliverable,
      humanReviewStep: parsedTemplate.humanReviewStep || false,
      executionNotes: parsedTemplate.executionNotes,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isPinned: false
    };
    
    onImport(newWorkflow, matchedSkillIds);
    handleClose();
  };

  const unmatchedCount = matchedSkills.filter(m => !m.skill).length;
  const matchedCount = matchedSkills.filter(m => m.skill).length;

  const exampleTemplate = `{
  "name": "Content Production Pipeline",
  "description": "End-to-end content creation workflow",
  "category": "Marketing",
  "folder": "Content",
  "tags": ["content", "production"],
  "triggerType": "manual",
  "skillNames": ["Research Skill", "Draft Generator", "Editor"],
  "outputDeliverable": "Published article",
  "humanReviewStep": true
}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} className="text-accent" />
            Import Workflow from JSON
          </DialogTitle>
          <DialogDescription>
            Import a workflow template. Skills are matched by name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson size={16} className="mr-2" />
              Upload JSON File
            </Button>
            <span className="text-sm text-muted-foreground">or paste JSON below</span>
          </div>

          {/* JSON Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">JSON Template</label>
            <textarea
              className="w-full h-48 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm font-mono"
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
                  <p className="text-sm font-semibold text-foreground">Valid workflow template detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{parsedTemplate.name}</strong> with {parsedTemplate.skillNames.length} skill reference(s)
                  </p>
                </div>
              </div>

              {/* Skill Matching Status */}
              {unmatchedCount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {unmatchedCount} skill(s) not found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create these skills first, or they will be skipped:
                      {matchedSkills.filter(m => !m.skill).map(m => m.name).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills Preview */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80">Skills to Link</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {matchedSkills.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Zap size={14} className={m.skill ? 'text-accent' : 'text-muted-foreground'} />
                      <span className="flex-1 text-sm font-medium text-foreground">{m.name}</span>
                      {m.skill ? (
                        <span className="text-xs text-primary font-semibold">✓ matched</span>
                      ) : (
                        <span className="text-xs text-destructive font-semibold">not found</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              CANCEL
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedTemplate || matchedCount === 0}
              className="flex-1"
            >
              IMPORT WORKFLOW
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
