import React from 'react';
import { Skill } from '../types/index';
import { Zap, Play, Edit3, Trash2, Star, Folder as FolderIcon, Clock, Layers } from 'lucide-react';

interface SkillCardProps {
  skill: Skill;
  promptCount: number;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  onRun: (skill: Skill) => void;
  onTogglePin: () => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  promptCount,
  onEdit,
  onDelete,
  onRun,
  onTogglePin
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    onEdit(skill);
  };

  return (
    <div 
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-soft flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md bg-secondary text-secondary-foreground">
              SKILL
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-muted text-foreground/80 rounded-md overflow-hidden">
              <FolderIcon size={11} className="shrink-0 opacity-70" />
              <span className="truncate max-w-[80px]">{skill.folder}</span>
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
              className={`p-1.5 rounded-lg transition-all ${skill.isPinned ? 'text-amber bg-amber/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title={skill.isPinned ? 'Unpin' : 'Pin for quick access'}
            >
              <Star size={16} fill={skill.isPinned ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(skill); }}
              className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
              title="Edit"
            >
              <Edit3 size={16} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(skill.id); }}
              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-secondary" />
          <h3 className="text-xl font-bold text-foreground leading-snug truncate">
            {skill.name}
          </h3>
        </div>

        <p className="text-foreground/70 text-sm mb-5 line-clamp-2 leading-relaxed">
          {skill.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide bg-primary/15 text-primary rounded-md">
            {skill.category}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-muted text-foreground/70 rounded-md">
            <Layers size={11} />
            {promptCount} prompts
          </span>
          {skill.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2.5 py-1 text-[11px] font-medium bg-muted text-foreground/70 rounded-md truncate max-w-[80px]">
              #{tag}
            </span>
          ))}
        </div>

        {skill.inputsRequired.length > 0 && (
          <div className="text-xs text-foreground/60 mb-3">
            <span className="font-semibold">Inputs: </span>
            {skill.inputsRequired.join(', ')}
          </div>
        )}

        {skill.outputFormat && (
          <div className="text-xs text-foreground/60">
            <span className="font-semibold">Output: </span>
            {skill.outputFormat}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-muted/50 border-t border-border flex items-center justify-between">
        <div className="flex items-center text-foreground/60 text-xs font-medium">
          <Clock size={14} className="mr-1.5" />
          {new Date(skill.createdAt).toLocaleDateString()}
          {skill.usageCount > 0 && (
            <span className="ml-3">Used {skill.usageCount}x</span>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRun(skill); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground active:scale-95"
        >
          <Play size={16} />
          RUN
        </button>
      </div>
    </div>
  );
};
