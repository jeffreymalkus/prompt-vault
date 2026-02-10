import React, { useState, useEffect } from 'react';
import { Skill, AIPrompt, DEFAULT_CATEGORIES, generateId, scanSkillInputs } from '../types/index';
import { X, Zap, Plus, ChevronDown, Trash2, GripVertical, Search, RefreshCw, Copy, Check } from 'lucide-react';
import { assembleSkillForLLM } from '../types/index';

interface SkillModalProps {
  skill?: Skill;
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: Skill) => void;
  availableFolders: string[];
  availablePrompts: AIPrompt[];
  prefill?: Partial<Skill>;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  skill,
  isOpen,
  onClose,
  onSave,
  availableFolders,
  availablePrompts,
  prefill
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creative');
  const [folder, setFolder] = useState('General');
  const [tags, setTags] = useState('');
  const [inputsRequired, setInputsRequired] = useState('');
  const [inputsManuallyEdited, setInputsManuallyEdited] = useState(false);
  const [outputFormat, setOutputFormat] = useState('');
  const [embeddedPromptIds, setEmbeddedPromptIds] = useState<string[]>([]);
  const [toolsUsed, setToolsUsed] = useState('');
  const [exampleRun, setExampleRun] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');
  const [expertPersona, setExpertPersona] = useState('');
  const [rulesGuardrails, setRulesGuardrails] = useState('');
  const [procedure, setProcedure] = useState('');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (skill) {
        setName(skill.name);
        setDescription(skill.description);
        setCategory(skill.category);
        setFolder(skill.folder);
        setTags(skill.tags.join(', '));
        setInputsRequired(skill.inputsRequired.join(', '));
        setInputsManuallyEdited(true);
        setOutputFormat(skill.outputFormat);
        setEmbeddedPromptIds(skill.embeddedPromptIds);
        setToolsUsed(skill.toolsUsed.join(', '));
        setExampleRun(skill.exampleRun || '');
        setExecutionNotes(skill.executionNotes || '');
        setExpertPersona(skill.expertPersona || '');
        setRulesGuardrails(skill.rulesGuardrails || '');
        setProcedure(skill.procedure || '');
      } else if (prefill) {
        setName(prefill.name || '');
        setDescription(prefill.description || '');
        setCategory(prefill.category || 'Creative');
        setFolder(prefill.folder || 'General');
        setTags(prefill.tags?.join(', ') || '');
        setInputsRequired(prefill.inputsRequired?.join(', ') || '');
        setInputsManuallyEdited(false);
        setOutputFormat(prefill.outputFormat || '');
        setEmbeddedPromptIds(prefill.embeddedPromptIds || []);
        setToolsUsed(prefill.toolsUsed?.join(', ') || '');
        setExampleRun(prefill.exampleRun || '');
        setExecutionNotes(prefill.executionNotes || '');
        setExpertPersona(prefill.expertPersona || '');
        setRulesGuardrails(prefill.rulesGuardrails || '');
        setProcedure(prefill.procedure || '');
      } else {
        resetForm();
      }
    }
  }, [skill, isOpen, prefill]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('Creative');
    setFolder('General');
    setTags('');
    setInputsRequired('');
    setInputsManuallyEdited(false);
    setOutputFormat('');
    setEmbeddedPromptIds([]);
    setToolsUsed('');
    setExampleRun('');
    setExecutionNotes('');
    setExpertPersona('');
    setRulesGuardrails('');
    setProcedure('');
    setIsCreatingNewFolder(false);
    setPromptSearchQuery('');
    setShowPromptSelector(false);
  };

  const handleRescanInputs = () => {
    const scanned = scanSkillInputs(procedure);
    setInputsRequired(scanned.join(', '));
    setInputsManuallyEdited(true);
  };

  const handleProcedureChange = (text: string) => {
    setProcedure(text);
    // Auto-populate only if user hasn't manually edited
    if (!inputsManuallyEdited && text.trim()) {
      const scanned = scanSkillInputs(text);
      if (scanned.length > 0) {
        setInputsRequired(scanned.join(', '));
      }
    }
  };

  const handleCopyForLLM = () => {
    const tempSkill: Skill = {
      id: skill?.id || '',
      name: name || 'Untitled Skill',
      description,
      category,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      inputsRequired: inputsRequired.split(',').map(t => t.trim()).filter(Boolean),
      outputFormat,
      embeddedPromptIds,
      toolsUsed: toolsUsed.split(',').map(t => t.trim()).filter(Boolean),
      expertPersona,
      rulesGuardrails,
      procedure,
      createdAt: skill?.createdAt || Date.now(),
      updatedAt: Date.now(),
      usageCount: skill?.usageCount || 0,
    };
    const text = assembleSkillForLLM(tempSkill);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const exportText = assembleSkillForLLM({
      id: skill?.id || generateId(),
      name: name || 'Untitled Skill',
      description,
      category,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      inputsRequired: inputsRequired.split(',').map(t => t.trim()).filter(Boolean),
      outputFormat,
      embeddedPromptIds,
      toolsUsed: toolsUsed.split(',').map(t => t.trim()).filter(Boolean),
      expertPersona,
      rulesGuardrails,
      procedure,
      createdAt: skill?.createdAt || now,
      updatedAt: now,
      usageCount: skill?.usageCount || 0,
    });

    const savedSkill: Skill = {
      id: skill?.id || generateId(),
      name: name || 'Untitled Skill',
      description,
      category,
      folder,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      inputsRequired: inputsRequired.split(',').map(t => t.trim()).filter(Boolean),
      outputFormat,
      embeddedPromptIds,
      toolsUsed: toolsUsed.split(',').map(t => t.trim()).filter(Boolean),
      exampleRun: exampleRun || undefined,
      executionNotes: executionNotes || undefined,
      expertPersona: expertPersona || undefined,
      rulesGuardrails: rulesGuardrails || undefined,
      procedure: procedure || undefined,
      status: skill?.status || 'draft',
      lastExportedText: exportText,
      createdAt: skill?.createdAt || now,
      updatedAt: now,
      usageCount: skill?.usageCount || 0,
      isPinned: skill?.isPinned || false
    };
    onSave(savedSkill);
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

  const addPrompt = (promptId: string) => {
    if (!embeddedPromptIds.includes(promptId)) {
      setEmbeddedPromptIds([...embeddedPromptIds, promptId]);
    }
    setShowPromptSelector(false);
    setPromptSearchQuery('');
  };

  const removePrompt = (promptId: string) => {
    setEmbeddedPromptIds(embeddedPromptIds.filter(id => id !== promptId));
  };

  const movePrompt = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...embeddedPromptIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setEmbeddedPromptIds(newOrder);
  };

  const filteredPrompts = availablePrompts.filter(p => 
    p.title.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(promptSearchQuery.toLowerCase())
  );

  const selectedPrompts = embeddedPromptIds
    .map(id => availablePrompts.find(p => p.id === id))
    .filter(Boolean) as AIPrompt[];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Zap size={20} className="text-secondary" />
              {skill ? `Edit: ${skill.name}` : 'Create Skill'}
            </h2>
            <p className="text-xs text-muted-foreground">Bundle prompts into a reusable AI capability.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyForLLM}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                copied
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent/15 text-accent hover:bg-accent/25'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'COPIED!' : 'COPY FOR LLM'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name & Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Skill Name *</label>
              <input
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="Ex: Content Brief Generator"
                value={name}
                onChange={(e) => setName(e.target.value)}
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

          {/* Folder */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Folder</label>
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Description</label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
              placeholder="What does this skill do? What problem does it solve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Expert Persona */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Expert Persona</label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
              placeholder="Act as an expert [ROLE] with deep experience in..."
              value={expertPersona}
              onChange={(e) => setExpertPersona(e.target.value)}
            />
          </div>

          {/* Rules / Guardrails */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Rules / Guardrails</label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
              placeholder="Do not generate... Always ensure... Constraints..."
              value={rulesGuardrails}
              onChange={(e) => setRulesGuardrails(e.target.value)}
            />
          </div>

          {/* Procedure (main prompt text) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Procedure (Embedded Prompts Text)</label>
            <textarea
              className="w-full h-32 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm font-mono"
              placeholder="Write your step-by-step procedure here. Use [VARIABLE_NAME] for inputs..."
              value={procedure}
              onChange={(e) => handleProcedureChange(e.target.value)}
            />
          </div>

          {/* Embedded Prompts (relational) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Linked Prompts</label>
              <button
                type="button"
                onClick={() => setShowPromptSelector(!showPromptSelector)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus size={14} /> Add Prompt
              </button>
            </div>

            {showPromptSelector && (
              <div className="border border-border rounded-xl p-4 bg-background animate-in slide-in-from-top-1">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input
                    className="w-full bg-muted border-none rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="Search prompts..."
                    value={promptSearchQuery}
                    onChange={(e) => setPromptSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredPrompts.length > 0 ? (
                    filteredPrompts.slice(0, 10).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addPrompt(p.id)}
                        disabled={embeddedPromptIds.includes(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          embeddedPromptIds.includes(p.id)
                            ? 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No prompts found</p>
                  )}
                </div>
              </div>
            )}

            {selectedPrompts.length > 0 && (
              <div className="space-y-2">
                {selectedPrompts.map((prompt, index) => (
                  <div key={prompt.id} className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg group">
                    <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded mr-2 ${
                        prompt.type === 'system' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                      }`}>
                        {prompt.type}
                      </span>
                      <span className="text-sm font-medium text-foreground">{prompt.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => movePrompt(index, 'up')} disabled={index === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => movePrompt(index, 'down')} disabled={index === selectedPrompts.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => removePrompt(prompt.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPrompts.length === 0 && !showPromptSelector && (
              <p className="text-sm text-muted-foreground italic">No prompts linked yet. Click "Add Prompt" to link prompts to this skill.</p>
            )}
          </div>

          {/* Inputs Required with Rescan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Inputs Required (comma separated)</label>
              <button
                type="button"
                onClick={handleRescanInputs}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
                title="Re-scan procedure text for [VARIABLE] patterns"
              >
                <RefreshCw size={12} /> Rescan Inputs
              </button>
            </div>
            <input
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm"
              placeholder="[TOPIC], [AUDIENCE], [TONE]"
              value={inputsRequired}
              onChange={(e) => { setInputsRequired(e.target.value); setInputsManuallyEdited(true); }}
            />
          </div>

          {/* Output Format */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Output Format</label>
            <input
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm"
              placeholder="Markdown document, JSON, etc."
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            />
          </div>

          {/* Tags & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Tags (comma separated)</label>
              <input
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                placeholder="marketing, seo, content"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Tools Used (comma separated)</label>
              <input
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                placeholder="GPT-4, Claude, Perplexity"
                value={toolsUsed}
                onChange={(e) => setToolsUsed(e.target.value)}
              />
            </div>
          </div>

          {/* Example Run */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Example Run (optional)</label>
            <textarea
              className="w-full h-24 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm font-mono"
              placeholder="Paste an example of this skill in action..."
              value={exampleRun}
              onChange={(e) => setExampleRun(e.target.value)}
            />
          </div>

          {/* Execution Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Execution Notes (optional)</label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none text-sm"
              placeholder="Tips for running this skill effectively..."
              value={executionNotes}
              onChange={(e) => setExecutionNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-border flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm transition-colors text-muted-foreground"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-secondary hover:bg-secondary/90 rounded-xl font-bold text-sm text-secondary-foreground transition-all active:scale-95"
            >
              {skill ? 'UPDATE SKILL' : 'CREATE SKILL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
