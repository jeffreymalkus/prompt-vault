import React, { useState, useMemo } from 'react';
import { AIPrompt, PromptVersionSnapshot } from '../types';
import { X, RotateCcw, Clock, GitCommit, ChevronRight } from 'lucide-react';
import { diffWords } from 'diff';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';

interface VersionHistoryDrawerProps {
  prompt: AIPrompt;
  versions: PromptVersionSnapshot[];
  isOpen: boolean;
  onClose: () => void;
  onRestore: (snapshot: PromptVersionSnapshot) => void;
  onDeleteVersion?: (snapshotId: string) => void;
  onSelectVersion?: (snapshot: PromptVersionSnapshot) => void;
}

function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = useMemo(() => diffWords(oldText, newText), [oldText, newText]);

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed p-4 bg-background rounded-xl border border-border">
      {parts.map((part, i) => {
        if (part.added) {
          return (
            <span key={i} className="bg-green-500/20 text-green-400 rounded px-0.5">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span key={i} className="bg-red-500/20 text-red-400 line-through rounded px-0.5">
              {part.value}
            </span>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </pre>
  );
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  prompt,
  versions,
  isOpen,
  onClose,
  onRestore,
  onDeleteVersion,
  onSelectVersion,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<PromptVersionSnapshot | null>(null);

  const sortedVersions = useMemo(
    () => [...versions].sort((a, b) => b.createdAt - a.createdAt),
    [versions]
  );

  const handleSelectVersion = (v: PromptVersionSnapshot) => {
    setSelectedVersion(v);
    // Notify parent to hydrate variable values — does NOT create a new version
    onSelectVersion?.(v);
  };

  const handleDelete = (e: React.MouseEvent, snapshotId: string) => {
    e.stopPropagation();
    if (confirm('Delete this version permanently?')) {
      onDeleteVersion?.(snapshotId);
      if (selectedVersion?.id === snapshotId) {
        setSelectedVersion(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-background/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-popover border-l border-border shadow-2xl animate-in slide-in-from-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Version History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {prompt.title} · {sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Version List */}
          <div className="w-64 border-r border-border shrink-0 flex flex-col">
            <div className="p-3 border-b border-border">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Versions</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sortedVersions.map((v, idx) => {
                  const isSelected = selectedVersion?.id === v.id;
                  const isCurrent = idx === 0;
                  const isBaseline = v.version === 1;
                  const canDelete = !isBaseline;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVersion(v)}
                      role="button"
                      tabIndex={0}
                      className={`relative w-full text-left p-3 rounded-lg transition-all text-sm cursor-pointer ${
                        isSelected
                          ? 'bg-primary/15 border border-primary/30'
                          : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                          <GitCommit size={12} className="text-primary shrink-0" />
                          <span className="font-bold text-foreground text-xs truncate">
                            {v.versionName || `v${v.version}`}
                            {isCurrent && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] rounded-full font-bold">
                                LATEST
                              </span>
                            )}
                          </span>
                      </div>
                      {v.commitMessage && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 ml-5 mb-1">
                          {v.commitMessage}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 ml-5 truncate">
                        {v.content.slice(0, 50)}…
                      </p>
                      <span className="text-[10px] text-muted-foreground/50 ml-5 mt-1 block">
                        {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {onDeleteVersion && canDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(e, v.id); }}
                          className="ml-5 mt-2 px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-destructive/20 rounded transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  );
                })}
                {sortedVersions.length === 0 && (
                  <p className="text-xs text-muted-foreground p-4 text-center">No version history yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Diff & Detail Pane */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedVersion ? (
              <>
                <div className="p-4 border-b border-border shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        {selectedVersion.versionName || `Version ${selectedVersion.version}`}
                        <ChevronRight size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground font-normal">Current</span>
                      </h3>
                      {selectedVersion.commitMessage && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{selectedVersion.commitMessage}"
                        </p>
                      )}
                    </div>
                    {selectedVersion.content !== prompt.content && (
                      <button
                        onClick={() => onRestore(selectedVersion)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold transition-all active:scale-95"
                      >
                        <RotateCcw size={14} />
                        RESTORE THIS VERSION
                      </button>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500" />
                          <span className="text-[10px] font-bold text-muted-foreground">ADDED</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500" />
                          <span className="text-[10px] font-bold text-muted-foreground">REMOVED</span>
                        </div>
                      </div>
                      <DiffView
                        oldText={selectedVersion.content}
                        newText={prompt.content}
                      />
                    </CardContent>
                  </Card>

                  {/* Saved Variable Values */}
                  {selectedVersion.variableValues && Object.keys(selectedVersion.variableValues).length > 0 && (
                    <Card className="border-border mt-3">
                      <CardContent className="p-4 space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saved Variable Values</span>
                        {Object.entries(selectedVersion.variableValues).map(([key, val]) => (
                          <p key={key} className="text-xs">
                            <span className="font-mono text-primary/80">{key}:</span>{' '}
                            <span className="text-foreground">{val || <span className="text-muted-foreground italic">empty</span>}</span>
                          </p>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Meta changes */}
                  {(selectedVersion.title !== prompt.title ||
                    selectedVersion.category !== prompt.category ||
                    selectedVersion.folder !== prompt.folder) && (
                    <Card className="border-border mt-3">
                      <CardContent className="p-4 space-y-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metadata Changes</span>
                        {selectedVersion.title !== prompt.title && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Title:</span>{' '}
                            <span className="line-through text-red-400">{selectedVersion.title}</span>{' '}
                            <span className="text-green-400">{prompt.title}</span>
                          </p>
                        )}
                        {selectedVersion.category !== prompt.category && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Category:</span>{' '}
                            <span className="line-through text-red-400">{selectedVersion.category}</span>{' '}
                            <span className="text-green-400">{prompt.category}</span>
                          </p>
                        )}
                        {selectedVersion.folder !== prompt.folder && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">Folder:</span>{' '}
                            <span className="line-through text-red-400">{selectedVersion.folder}</span>{' '}
                            <span className="text-green-400">{prompt.folder}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-2">
                  <Clock size={32} className="text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">Select a version to compare</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
