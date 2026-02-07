import React, { useState, useRef } from 'react';
import { Agent, Workflow, generateId } from '../types';
import { Upload, FileJson, AlertCircle, CheckCircle, GitBranch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface AgentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (agent: Agent) => void;
  existingWorkflows: Workflow[];
}

interface AgentTemplate {
  name: string;
  description: string;
  workflowName: string; // Name of workflow to link
  triggerType: 'manual' | 'scheduled' | 'event-based';
  dataSources: string[];
  toolsConnected: string[];
  memoryEnabled: boolean;
  notificationMethod?: string;
  failureHandlingInstructions?: string;
  category: string;
  folder: string;
  tags: string[];
}

export const AgentImportModal: React.FC<AgentImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingWorkflows
}) => {
  const [jsonContent, setJsonContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedTemplate, setParsedTemplate] = useState<AgentTemplate | null>(null);
  const [matchedWorkflow, setMatchedWorkflow] = useState<Workflow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setJsonContent('');
    setParseError(null);
    setParsedTemplate(null);
    setMatchedWorkflow(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateTemplate = (data: any): data is AgentTemplate => {
    if (!data || typeof data !== 'object') return false;
    if (!data.name || typeof data.name !== 'string') return false;
    if (!data.workflowName || typeof data.workflowName !== 'string') return false;
    return true;
  };

  const matchWorkflow = (template: AgentTemplate): Workflow | null => {
    return existingWorkflows.find(w => 
      w.name.toLowerCase() === template.workflowName.toLowerCase()
    ) || null;
  };

  const parseJson = (content: string) => {
    setParseError(null);
    setParsedTemplate(null);
    setMatchedWorkflow(null);
    
    if (!content.trim()) return;
    
    try {
      const parsed = JSON.parse(content);
      
      if (!validateTemplate(parsed)) {
        setParseError('Invalid agent template format. Required fields: name, workflowName.');
        return;
      }
      
      const matched = matchWorkflow(parsed);
      setMatchedWorkflow(matched);
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
    if (!parsedTemplate || !matchedWorkflow) return;
    
    const now = Date.now();
    
    const newAgent: Agent = {
      id: generateId(),
      name: parsedTemplate.name,
      description: parsedTemplate.description || '',
      linkedWorkflowId: matchedWorkflow.id,
      triggerType: parsedTemplate.triggerType || 'manual',
      dataSources: parsedTemplate.dataSources || [],
      toolsConnected: parsedTemplate.toolsConnected || [],
      memoryEnabled: parsedTemplate.memoryEnabled || false,
      notificationMethod: parsedTemplate.notificationMethod,
      failureHandlingInstructions: parsedTemplate.failureHandlingInstructions,
      status: 'paused',
      category: parsedTemplate.category || 'Creative',
      folder: parsedTemplate.folder || 'General',
      tags: parsedTemplate.tags || [],
      createdAt: now,
      updatedAt: now
    };
    
    onImport(newAgent);
    handleClose();
  };

  const exampleTemplate = `{
  "name": "Content Publisher Bot",
  "description": "Automatically publishes content",
  "workflowName": "Content Production Pipeline",
  "triggerType": "scheduled",
  "dataSources": ["CMS", "Google Drive"],
  "toolsConnected": ["WordPress API", "Slack"],
  "memoryEnabled": true,
  "notificationMethod": "Slack",
  "category": "Marketing",
  "folder": "Automation",
  "tags": ["automation", "content"]
}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Import Agent from JSON
          </DialogTitle>
          <DialogDescription>
            Import an agent template. Workflow is matched by name.
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
                  <p className="text-sm font-semibold text-foreground">Valid agent template detected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{parsedTemplate.name}</strong>
                  </p>
                </div>
              </div>

              {/* Workflow Matching Status */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <GitBranch size={16} className={matchedWorkflow ? 'text-accent' : 'text-muted-foreground'} />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">
                    Linked Workflow: {parsedTemplate.workflowName}
                  </span>
                </div>
                {matchedWorkflow ? (
                  <span className="text-xs text-primary font-semibold">✓ matched</span>
                ) : (
                  <span className="text-xs text-destructive font-semibold">not found</span>
                )}
              </div>

              {!matchedWorkflow && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">
                    Workflow "{parsedTemplate.workflowName}" not found. Create the workflow first to import this agent.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              CANCEL
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedTemplate || !matchedWorkflow}
              className="flex-1"
            >
              IMPORT AGENT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
