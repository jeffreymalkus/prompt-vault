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
  onClick?: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ 
  prompt, 
  onEdit, 
  onDelete, 
  onCopy, 
  onTogglePin,
  isCopied, 
  versionCount = 1,
  onClick
}) => {
  const [expandedContent, setExpandedContent] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Internal flag preserved but not rendered

  // Clicking the card opens the prompt
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (onClick) {
      onClick();
    } else {
      onEdit(prompt);
    }
  };

  return (
    <div 
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-soft flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-muted text-foreground/80 rounded-md overflow-hidden">
              <FolderIcon size={11} className="shrink-0 opacity-70" />
              <span className="truncate max-w-[80px]">{prompt.folder}</span>
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
              className={`p-1.5 rounded-lg transition-all ${prompt.isPinned ? 'text-warning bg-warning/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title={prompt.isPinned ? 'Unpin' : 'Pin for quick access'}
            >
              <Star size={16} fill={prompt.isPinned ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
              title="Edit/Version"
            >
              <Edit3 size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xl font-bold text-foreground leading-snug truncate">
            {prompt.title}
          </h3>
          {versionCount > 1 && (
            <span className="px-2 py-0.5 text-[11px] bg-primary/20 text-primary rounded font-mono flex-shrink-0">
              v{prompt.version}
            </span>
          )}
        </div>

        <p className="text-foreground/70 text-sm mb-5 line-clamp-2 leading-relaxed">
          {prompt.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide bg-primary/15 text-primary rounded-md">
            {prompt.category}
          </span>
          {prompt.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2.5 py-1 text-[11px] font-medium bg-muted text-foreground/70 rounded-md truncate max-w-[80px]">
              #{tag}
            </span>
          ))}
          {prompt.usageCount > 0 && (
            <span className="px-2 py-1 text-[11px] font-medium text-foreground/50">
              Used {prompt.usageCount}x
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <div className={`text-xs font-mono p-4 bg-background/80 rounded-lg text-foreground/80 leading-relaxed overflow-hidden ${expandedContent ? '' : 'max-h-28'}`}>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-foreground/60 uppercase tracking-wide border-b border-border/30 pb-2">
                <span>Prompt Content</span>
              </div>
              {prompt.content}
            </div>
            {prompt.content.length > 120 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setExpandedContent(!expandedContent); }}
                className="mt-2 text-xs text-primary hover:text-primary/80 font-semibold"
              >
                {expandedContent ? '▲ Show Less' : '▼ Show More'}
              </button>
            )}
          </div>

          {prompt.notes && (
            <div className="mt-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
                className="flex items-center gap-2 text-xs font-semibold text-foreground/60 hover:text-primary transition-colors"
              >
                <BookOpen size={14} />
                Implementation Notes
                {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showNotes && (
                <div className="mt-3 p-4 bg-primary/5 rounded-lg text-sm text-foreground/70 leading-relaxed animate-in slide-in-from-top-1">
                  {prompt.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-muted/50 border-t border-border flex items-center justify-between">
        <div className="flex items-center text-foreground/60 text-xs font-medium">
          <Clock size={14} className="mr-1.5" />
          {new Date(prompt.createdAt).toLocaleDateString()}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onCopy(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            isCopied 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95'
          }`}
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
          {isCopied ? 'COPIED' : 'COPY'}
        </button>
      </div>
    </div>
  );
};
