import React, { useState, useEffect } from 'react';
import { AIPrompt, DEFAULT_CATEGORIES, PromptType, detectVariables } from '../types';
import { X, Layers, User, Cpu, BookOpen, ChevronDown } from 'lucide-react';

interface PromptModalProps {
  prompt?: AIPrompt;
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Partial<AIPrompt>, saveAsNewVersion: boolean) => void;
  availableFolders?: string[];
}

export const PromptModal: React.FC<PromptModalProps> = ({ 
  prompt, 
  isOpen, 
  onClose, 
  onSave, 
  availableFolders = []
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Creative');
  const [folder, setFolder] = useState('General');
  const [type, setType] = useState<PromptType>('user');
  const [tags, setTags] = useState('');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (prompt) {
        setContent(prompt.content);
        setTitle(prompt.title);
        setDescription(prompt.description);
        setNotes(prompt.notes || '');
        setCategory(prompt.category);
        setFolder(prompt.folder || 'General');
        setType(prompt.type || 'user');
        setTags(prompt.tags.join(', '));
        setIsCreatingNewFolder(false);
      } else {
        setContent('');
        setTitle('');
        setDescription('');
        setNotes('');
        setCategory('Creative');
        setFolder('General');
        setType('user');
        setTags('');
        setIsCreatingNewFolder(false);
      }
    }
  }, [prompt, isOpen]);

  const handleSubmit = (e: React.FormEvent, saveAsNewVersion: boolean = false) => {
    e.preventDefault();
    const variables = detectVariables(content);
    onSave({
      content,
      title: title || 'New Prompt',
      description,
      notes,
      category,
      folder: folder || 'General',
      type,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      variables,
      parentId: prompt?.parentId || prompt?.id,
      version: saveAsNewVersion ? (prompt?.version || 1) + 1 : (prompt?.version || 1)
    }, saveAsNewVersion);
    onClose();
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new__") {
      setIsCreatingNewFolder(true);
      setFolder("");
    } else {
      setIsCreatingNewFolder(false);
      setFolder(val);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              {prompt ? `Edit: ${prompt.title}` : 'Create Vault Entry'}
              {prompt && <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full">v{prompt.version}</span>}
            </h2>
            <p className="text-xs text-muted-foreground">Fill out the fields to organize your prompt.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Prompt Type</label>
              <div className="flex gap-2 p-1 bg-background border border-border rounded-xl">
                <button 
                  type="button"
                  onClick={() => setType('user')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${type === 'user' ? 'bg-type-user text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <User size={14} /> USER
                </button>
                <button 
                  type="button"
                  onClick={() => setType('system')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${type === 'system' ? 'bg-type-system text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Cpu size={14} /> SYSTEM
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Folder / Client</label>
              <div className="space-y-2">
                <div className="relative">
                  <select
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                    value={isCreatingNewFolder ? "__new__" : folder}
                    onChange={handleFolderChange}
                  >
                    <option value="" disabled>Select a folder...</option>
                    {availableFolders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    <option value="__new__" className="text-primary font-bold">+ Create new folder...</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                </div>
                {isCreatingNewFolder && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-top-1">
                    <input
                      autoFocus
                      className="flex-1 bg-background border border-primary/30 rounded-xl px-4 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                      placeholder="Enter new folder name..."
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setIsCreatingNewFolder(false)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground/80">Prompt Content</label>
            </div>
            <textarea
              required
              placeholder="Paste your prompt here... use [VARIABLE] for dynamic inputs."
              className="w-full h-40 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono text-sm leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={14} className="text-primary" />
              <label className="text-sm font-semibold text-foreground/80">Engineering Notes / Reasoning</label>
            </div>
            <textarea
              placeholder="Why was this prompt written this way? What tricks did you use (e.g. CoT, few-shot)?"
              className="w-full h-24 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-xs leading-relaxed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Title</label>
              <input
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="Ex: Marketing Content Strategist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Category</label>
              <div className="relative">
                <select
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Short Description</label>
            <input
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="What scenario is this optimized for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Tags (comma separated)</label>
            <input
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder="critique, iterative, logic"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="pt-6 border-t border-border flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm transition-colors text-muted-foreground"
            >
              CANCEL
            </button>
            <div className="flex-1 flex gap-2">
              {prompt && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="flex-1 py-3 px-4 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Layers size={16} /> SAVE AS V{(prompt.version || 1) + 1}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="flex-[2] py-3 px-4 bg-primary hover:bg-primary/90 rounded-xl font-bold text-sm text-primary-foreground shadow-indigo-glow transition-all active:scale-95"
              >
                {prompt ? 'UPDATE CURRENT' : 'SAVE TO VAULT'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
