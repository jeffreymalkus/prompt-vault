import React, { useState } from 'react';
import { AIPrompt } from '../types';
import { Copy, Edit3, Trash2, Clock, Check, Folder as FolderIcon, BookOpen, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface PromptCardProps {
  prompt: AIPrompt;
  onEdit: (prompt: AIPrompt) => void;
  onDelete: (id: string) => void;
  onCopy: () => void;
  onTogglePin: () => void;
  isCopied: boolean;
  versionCount?: number;
}

export const PromptCard: React.FC<PromptCardProps> = ({ 
  prompt, 
  onEdit, 
  onDelete, 
  onCopy, 
  onTogglePin,
  isCopied, 
  versionCount = 1 
}) => {
  const [expandedContent, setExpandedContent] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const isSystem = prompt.type === 'system';

  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-indigo-sm flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-md border ${
              isSystem 
                ? 'bg-type-system/10 text-type-system border-type-system/20' 
                : 'bg-type-user/10 text-type-user border-type-user/20'
            }`}>
              {prompt.type}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-muted/30 text-muted-foreground rounded-md border border-muted overflow-hidden">
              <FolderIcon size={10} className="shrink-0" />
              <span className="truncate max-w-[80px]">{prompt.folder}</span>
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition-all ${prompt.isPinned ? 'text-warning bg-warning/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title={prompt.isPinned ? 'Unpin' : 'Pin for quick access'}
            >
              <Star size={16} fill={prompt.isPinned ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => onEdit(prompt)}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
              title="Edit/Version"
            >
              <Edit3 size={16} />
            </button>
            <button 
              onClick={() => onDelete(prompt.id)}
              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-foreground leading-tight truncate">
            {prompt.title}
          </h3>
          {versionCount > 1 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded border border-primary/30 font-mono flex-shrink-0">
              v{prompt.version}
            </span>
          )}
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 italic">
          {prompt.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-md border border-primary/20">
            {prompt.category}
          </span>
          {prompt.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[11px] bg-secondary text-muted-foreground rounded-full border border-border truncate max-w-[80px]">
              #{tag}
            </span>
          ))}
          {prompt.usageCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60">
              Used {prompt.usageCount}x
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <div className={`text-[11px] font-mono p-3 bg-background/60 rounded-lg border border-border text-foreground/80 leading-relaxed overflow-hidden ${expandedContent ? '' : 'max-h-24'}`}>
              <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1">
                <span>{prompt.type === 'system' ? 'System Instruction' : 'User Input'}</span>
              </div>
              {prompt.content}
            </div>
            {prompt.content.length > 120 && (
              <button 
                onClick={() => setExpandedContent(!expandedContent)}
                className="mt-1 text-[9px] text-primary hover:text-primary/80 uppercase tracking-widest font-bold"
              >
                {expandedContent ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          {prompt.notes && (
            <div className="mt-2">
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                <BookOpen size={12} />
                Implementation Notes
                {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showNotes && (
                <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-lg text-xs text-primary/70 leading-relaxed animate-in slide-in-from-top-1">
                  {prompt.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-secondary border-t border-border flex items-center justify-between">
        <div className="flex items-center text-muted-foreground text-[10px]">
          <Clock size={12} className="mr-1" />
          {new Date(prompt.createdAt).toLocaleDateString()}
        </div>
        <button 
          onClick={onCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            isCopied 
            ? 'bg-success text-primary-foreground' 
            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-indigo-sm active:scale-95'
          }`}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'COPIED' : 'COPY'}
        </button>
      </div>
    </div>
  );
};
