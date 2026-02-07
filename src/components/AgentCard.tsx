import React from 'react';
import { Agent } from '../types';
import { Bot, Play, Edit3, Trash2, Star, Zap, Clock, Pause, AlertCircle, CheckCircle } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  workflowName?: string;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (agent: Agent) => void;
  onTogglePin: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  workflowName,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePin
}) => {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'active': return 'bg-primary/20 text-primary';
      case 'paused': return 'bg-amber-500/20 text-amber-500';
      case 'error': return 'bg-destructive/20 text-destructive';
    }
  };

  const getStatusIcon = () => {
    switch (agent.status) {
      case 'active': return <CheckCircle size={12} />;
      case 'paused': return <Pause size={12} />;
      case 'error': return <AlertCircle size={12} />;
    }
  };

  const formatLastRun = () => {
    if (!agent.lastRunAt) return 'Never run';
    const diff = Date.now() - agent.lastRunAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
      {/* Pin Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className={`absolute top-4 right-4 p-2 rounded-lg transition-all ${
          agent.isPinned 
            ? 'text-amber bg-amber/10' 
            : 'text-foreground/30 hover:text-foreground/60 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star size={16} fill={agent.isPinned ? 'currentColor' : 'none'} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          agent.status === 'active' ? 'bg-primary/20' : 'bg-muted'
        }`}>
          <Bot className={agent.status === 'active' ? 'text-primary' : 'text-muted-foreground'} size={22} />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-lg font-bold text-foreground truncate">{agent.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{agent.description}</p>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          {agent.status}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
          <Zap size={12} />
          {agent.triggerType}
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
          <Clock size={12} />
          {formatLastRun()}
        </span>
      </div>

      {/* Linked Workflow */}
      {workflowName && (
        <div className="p-3 bg-accent/10 rounded-lg mb-4">
          <span className="text-xs text-muted-foreground">Linked Workflow:</span>
          <p className="text-sm font-medium text-foreground truncate">{workflowName}</p>
        </div>
      )}

      {/* Memory & Notifications */}
      <div className="flex items-center gap-3 mb-4">
        {agent.memoryEnabled && (
          <span className="px-2.5 py-1 bg-primary/10 rounded-lg text-xs font-medium text-primary">
            Memory Enabled
          </span>
        )}
        {agent.notificationMethod && (
          <span className="px-2.5 py-1 bg-muted rounded-lg text-xs font-medium text-muted-foreground">
            {agent.notificationMethod}
          </span>
        )}
      </div>

      {/* Tags */}
      {agent.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
              {tag}
            </span>
          ))}
          {agent.tags.length > 3 && (
            <span className="px-2 py-0.5 text-muted-foreground text-xs">
              +{agent.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <button
          onClick={() => onToggleStatus(agent)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            agent.status === 'active'
              ? 'bg-amber-500 hover:bg-amber-500/90 text-white'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {agent.status === 'active' ? (
            <>
              <Pause size={14} />
              PAUSE
            </>
          ) : (
            <>
              <Play size={14} />
              ACTIVATE
            </>
          )}
        </button>
        <button
          onClick={() => onEdit(agent)}
          className="p-2.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl transition-all"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onDelete(agent.id)}
          className="p-2.5 bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-xl transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
