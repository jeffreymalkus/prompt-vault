import React, { useState } from 'react';
import { ExecutionRun, ObjectType } from '../types/index';
import { History, Zap, GitBranch, Bot, FileText, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface ExecutionHistoryProps {
  runs: ExecutionRun[];
  onClearHistory: () => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
  runs,
  onClearHistory
}) => {
  const [filterType, setFilterType] = useState<ObjectType | 'all'>('all');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredRuns = filterType === 'all' 
    ? runs 
    : runs.filter(r => r.objectType === filterType);

  const getIcon = (type: ObjectType) => {
    switch (type) {
      case 'prompt': return <FileText size={14} className="text-primary" />;
      case 'skill': return <Zap size={14} className="text-secondary" />;
      case 'workflow': return <GitBranch size={14} className="text-accent" />;
      case 'agent': return <Bot size={14} className="text-primary" />;
    }
  };

  const getStatusIcon = (status: ExecutionRun['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-green-500" />;
      case 'failed': return <XCircle size={14} className="text-destructive" />;
      case 'running': return <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />;
    }
  };

  const handleCopy = (run: ExecutionRun) => {
    navigator.clipboard.writeText(run.outputs);
    setCopiedId(run.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <History size={24} className="text-primary" />
            Execution History
          </h2>
          <p className="text-foreground/60 text-sm mt-1">
            Track all skill, workflow, and agent runs
          </p>
        </div>
        {runs.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-destructive bg-muted hover:bg-destructive/10 rounded-lg transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'skill', 'workflow', 'agent'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterType === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Runs List */}
      {filteredRuns.length > 0 ? (
        <div className="space-y-3">
          {filteredRuns.map(run => (
            <div
              key={run.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getIcon(run.objectType)}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{run.objectName}</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-muted text-muted-foreground rounded">
                        {run.objectType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Clock size={12} />
                      {formatTime(run.startedAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(run.status)}
                  {expandedRun === run.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              {expandedRun === run.id && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-in slide-in-from-top-1">
                  {/* Inputs */}
                  {Object.keys(run.inputs).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide mb-2">Inputs</h4>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        {Object.entries(run.inputs).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-foreground">{key}:</span>
                            <span className="text-muted-foreground ml-2">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Output */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Output</h4>
                      <button
                        onClick={() => handleCopy(run)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
                          copiedId === run.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {copiedId === run.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === run.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-3 bg-background border border-border rounded-lg text-xs text-foreground/80 overflow-x-auto whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                      {run.outputs}
                    </pre>
                  </div>

                  {/* Error */}
                  {run.error && (
                    <div>
                      <h4 className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">Error</h4>
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                        {run.error}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-card border border-border border-dashed rounded-2xl">
          <History size={48} className="text-foreground/20 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">No execution history</h3>
          <p className="text-foreground/60 text-sm">Run a skill, workflow, or agent to see history here.</p>
        </div>
      )}
    </div>
  );
};
