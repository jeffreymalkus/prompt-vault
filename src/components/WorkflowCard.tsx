import React from 'react';
import { Workflow } from '../types';
import { GitBranch, Play, Edit3, Trash2, Star, Zap, Clock, CheckCircle } from 'lucide-react';

interface WorkflowCardProps {
  workflow: Workflow;
  skillCount: number;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onRun: (workflow: Workflow) => void;
  onTogglePin: () => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  skillCount,
  onEdit,
  onDelete,
  onRun,
  onTogglePin
}) => {
  const getTriggerIcon = () => {
    switch (workflow.triggerType) {
      case 'scheduled': return <Clock size={12} />;
      case 'event-based': return <Zap size={12} />;
      default: return <Play size={12} />;
    }
  };

  return (
    <div className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      {/* Pin Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
          workflow.isPinned 
            ? 'text-amber bg-amber/10' 
            : 'text-foreground/30 hover:text-foreground/60 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star size={16} fill={workflow.isPinned ? 'currentColor' : 'none'} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
          <GitBranch className="text-accent" size={22} />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-lg font-bold text-foreground truncate">{workflow.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{workflow.description}</p>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
          {getTriggerIcon()}
          {workflow.triggerType}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 rounded-lg text-xs font-medium text-accent">
          <Zap size={12} />
          {skillCount} skill{skillCount !== 1 ? 's' : ''}
        </span>
        {workflow.humanReviewStep && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg text-xs font-medium text-primary">
            <CheckCircle size={12} />
            Review
          </span>
        )}
      </div>

      {/* Tags */}
      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {workflow.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
              {tag}
            </span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="px-2 py-0.5 text-muted-foreground text-xs">
              +{workflow.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <button
          onClick={() => onRun(workflow)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl text-sm font-bold transition-all"
        >
          <Play size={14} />
          RUN
        </button>
        <button
          onClick={() => onEdit(workflow)}
          className="p-2.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl transition-all"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onDelete(workflow.id)}
          className="p-2.5 bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-xl transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
