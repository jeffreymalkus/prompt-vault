import React, { useState, useEffect } from 'react';
import { Agent, Workflow, TriggerType, ExecutionStatus, DEFAULT_CATEGORIES, generateId } from '../types';
import { Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
  agent?: Agent;
  availableFolders: string[];
  availableWorkflows: Workflow[];
}

export const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agent,
  availableFolders,
  availableWorkflows
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [linkedWorkflowId, setLinkedWorkflowId] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('manual');
  const [dataSources, setDataSources] = useState('');
  const [toolsConnected, setToolsConnected] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [notificationMethod, setNotificationMethod] = useState('');
  const [failureHandlingInstructions, setFailureHandlingInstructions] = useState('');
  const [status, setStatus] = useState<ExecutionStatus>('paused');
  const [category, setCategory] = useState('Creative');
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description);
      setLinkedWorkflowId(agent.linkedWorkflowId);
      setTriggerType(agent.triggerType);
      setDataSources(agent.dataSources.join(', '));
      setToolsConnected(agent.toolsConnected.join(', '));
      setMemoryEnabled(agent.memoryEnabled);
      setNotificationMethod(agent.notificationMethod || '');
      setFailureHandlingInstructions(agent.failureHandlingInstructions || '');
      setStatus(agent.status);
      setCategory(agent.category);
      setFolder(agent.folder);
      setTags(agent.tags.join(', '));
    } else {
      resetForm();
    }
  }, [agent, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setLinkedWorkflowId('');
    setTriggerType('manual');
    setDataSources('');
    setToolsConnected('');
    setMemoryEnabled(false);
    setNotificationMethod('');
    setFailureHandlingInstructions('');
    setStatus('paused');
    setCategory('Creative');
    setFolder('General');
    setTags('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    const agentData: Agent = {
      id: agent?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      linkedWorkflowId,
      triggerType,
      dataSources: dataSources.split(',').map(s => s.trim()).filter(Boolean),
      toolsConnected: toolsConnected.split(',').map(s => s.trim()).filter(Boolean),
      memoryEnabled,
      notificationMethod: notificationMethod.trim() || undefined,
      failureHandlingInstructions: failureHandlingInstructions.trim() || undefined,
      lastRunAt: agent?.lastRunAt,
      status,
      category,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: agent?.createdAt || now,
      updatedAt: now
    };
    
    onSave(agentData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            {agent ? 'Edit Agent' : 'New Agent'}
          </DialogTitle>
          <DialogDescription>
            Deploy an automated workflow executor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Agent Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Content Publisher Bot"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Description</label>
              <textarea
                className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?"
              />
            </div>
          </div>

          {/* Linked Workflow */}
          <div>
            <label className="text-sm font-semibold text-foreground/80 block mb-2">Linked Workflow *</label>
            <select
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              value={linkedWorkflowId}
              onChange={(e) => setLinkedWorkflowId(e.target.value)}
              required
            >
              <option value="">Select a workflow...</option>
              {availableWorkflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {availableWorkflows.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 italic">No workflows available. Create a workflow first.</p>
            )}
          </div>

          {/* Trigger Type */}
          <div>
            <label className="text-sm font-semibold text-foreground/80 block mb-2">Trigger Type</label>
            <div className="flex gap-2">
              {(['manual', 'scheduled', 'event-based'] as TriggerType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTriggerType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    triggerType === type 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Organization */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Category</label>
              <select
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Folder</label>
              <select
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                {availableFolders.filter(f => f !== 'All').map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Sources & Tools */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Data Sources</label>
              <Input
                value={dataSources}
                onChange={(e) => setDataSources(e.target.value)}
                placeholder="Comma-separated list"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Tools Connected</label>
              <Input
                value={toolsConnected}
                onChange={(e) => setToolsConnected(e.target.value)}
                placeholder="Comma-separated list"
              />
            </div>
          </div>

          {/* Memory & Notifications */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="memoryEnabled"
                checked={memoryEnabled}
                onChange={(e) => setMemoryEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
              />
              <label htmlFor="memoryEnabled" className="text-sm font-medium text-foreground">
                Enable Memory
              </label>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Notification Method</label>
              <Input
                value={notificationMethod}
                onChange={(e) => setNotificationMethod(e.target.value)}
                placeholder="e.g., Email, Slack"
              />
            </div>
          </div>

          {/* Failure Handling */}
          <div>
            <label className="text-sm font-semibold text-foreground/80 block mb-2">Failure Handling Instructions</label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
              rows={2}
              value={failureHandlingInstructions}
              onChange={(e) => setFailureHandlingInstructions(e.target.value)}
              placeholder="What to do if the agent fails..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-semibold text-foreground/80 block mb-2">Tags</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated tags"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              CANCEL
            </Button>
            <Button type="submit" disabled={!name.trim() || !linkedWorkflowId} className="flex-1">
              {agent ? 'SAVE CHANGES' : 'CREATE AGENT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
