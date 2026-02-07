import React, { useState, useEffect } from 'react';
import { Workflow, Skill, TriggerType, DEFAULT_CATEGORIES, generateId } from '../types';
import { X, GitBranch, Plus, GripVertical, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
  workflow?: Workflow;
  availableFolders: string[];
  availableSkills: Skill[];
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workflow,
  availableFolders,
  availableSkills
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creative');
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('manual');
  const [inputSource, setInputSource] = useState('');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [outputDeliverable, setOutputDeliverable] = useState('');
  const [humanReviewStep, setHumanReviewStep] = useState(false);
  const [executionNotes, setExecutionNotes] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description);
      setCategory(workflow.category);
      setFolder(workflow.folder);
      setTags(workflow.tags.join(', '));
      setTriggerType(workflow.triggerType);
      setInputSource(workflow.inputSource || '');
      setSkillIds(workflow.skillIds);
      setOutputDeliverable(workflow.outputDeliverable || '');
      setHumanReviewStep(workflow.humanReviewStep);
      setExecutionNotes(workflow.executionNotes || '');
    } else {
      resetForm();
    }
  }, [workflow, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('Creative');
    setFolder('General');
    setTags('');
    setTriggerType('manual');
    setInputSource('');
    setSkillIds([]);
    setOutputDeliverable('');
    setHumanReviewStep(false);
    setExecutionNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    const workflowData: Workflow = {
      id: workflow?.id || generateId(),
      name: name.trim(),
      description: description.trim(),
      category,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      triggerType,
      inputSource: inputSource.trim() || undefined,
      skillIds,
      outputDeliverable: outputDeliverable.trim() || undefined,
      humanReviewStep,
      executionNotes: executionNotes.trim() || undefined,
      createdAt: workflow?.createdAt || now,
      updatedAt: now,
      usageCount: workflow?.usageCount || 0,
      isPinned: workflow?.isPinned || false
    };
    
    onSave(workflowData);
    onClose();
  };

  const handleAddSkill = (skillId: string) => {
    if (!skillIds.includes(skillId)) {
      setSkillIds([...skillIds, skillId]);
    }
  };

  const handleRemoveSkill = (skillId: string) => {
    setSkillIds(skillIds.filter(id => id !== skillId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSkillIds = [...skillIds];
    const draggedItem = newSkillIds[draggedIndex];
    newSkillIds.splice(draggedIndex, 1);
    newSkillIds.splice(index, 0, draggedItem);
    setSkillIds(newSkillIds);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getSkillById = (id: string) => availableSkills.find(s => s.id === id);
  const unselectedSkills = availableSkills.filter(s => !skillIds.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch size={20} className="text-accent" />
            {workflow ? 'Edit Workflow' : 'New Workflow'}
          </DialogTitle>
          <DialogDescription>
            Chain skills into an automated sequence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name & Description */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Workflow Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Content Production Pipeline"
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
                placeholder="What does this workflow accomplish?"
              />
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
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Sequence */}
          <div>
            <label className="text-sm font-semibold text-foreground/80 block mb-2">
              Skills Sequence ({skillIds.length} selected)
            </label>
            
            {/* Selected Skills - Drag to reorder */}
            {skillIds.length > 0 && (
              <div className="space-y-2 mb-4">
                {skillIds.map((skillId, index) => {
                  const skill = getSkillById(skillId);
                  if (!skill) return null;
                  return (
                    <div
                      key={skillId}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-accent/10 border border-accent/30 rounded-xl cursor-move ${
                        draggedIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <GripVertical size={16} className="text-muted-foreground" />
                      <span className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{skill.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skillId)}
                        className="p-1.5 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Skills Dropdown */}
            {unselectedSkills.length > 0 && (
              <select
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value=""
                onChange={(e) => handleAddSkill(e.target.value)}
              >
                <option value="">+ Add a skill...</option>
                {unselectedSkills.map(skill => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </select>
            )}

            {skillIds.length === 0 && unselectedSkills.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No skills available. Create skills first.</p>
            )}
          </div>

          {/* Human Review */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="humanReview"
              checked={humanReviewStep}
              onChange={(e) => setHumanReviewStep(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
            />
            <label htmlFor="humanReview" className="text-sm font-medium text-foreground">
              Require human review before completing
            </label>
          </div>

          {/* Input/Output */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Input Source</label>
              <Input
                value={inputSource}
                onChange={(e) => setInputSource(e.target.value)}
                placeholder="e.g., User form, API call"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/80 block mb-2">Output Deliverable</label>
              <Input
                value={outputDeliverable}
                onChange={(e) => setOutputDeliverable(e.target.value)}
                placeholder="e.g., PDF report, Email"
              />
            </div>
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

          {/* Execution Notes */}
          <div>
            <label className="text-sm font-semibold text-foreground/80 block mb-2">Execution Notes</label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
              rows={2}
              value={executionNotes}
              onChange={(e) => setExecutionNotes(e.target.value)}
              placeholder="Any notes about running this workflow"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              CANCEL
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1">
              {workflow ? 'SAVE CHANGES' : 'CREATE WORKFLOW'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
